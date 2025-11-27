import db from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';

// --- RUTAS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const PATH_PLANTILLA_EXCEL = path.join(PROJECT_ROOT, 'Cursos Profesores.xlsx');

// --- HELPER: CONVERTIR A CAMELCASE ---
// Ej: "SISTEMAS Y COMPUTACIÓN" -> "sistemasYComputacion"
const toCamelCase = (str) => {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos (á -> a)
    .replace(/[^a-zA-Z0-9 ]/g, "") // Quitar caracteres raros (menos espacios)
    .trim()
    .toLowerCase()
    .split(/\s+/) // Separar por espacios
    .map((word, index) => {
      // La primera palabra en minúscula, las siguientes Capitalizadas
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
};

// --- HELPER: CONSTRUCTOR DE WHERE (Para la tabla visual) ---
// Este SÍ usa todos los filtros, incluido el tipo.
function buildWhereClause(filters) {
  let conditions = [];
  let params = [];

  if (filters.tipo && filters.tipo !== "Ambos" && filters.tipo !== "") {
    conditions.push("c.tipo = ?");
    if (filters.tipo === "Formación Docente") params.push("FD");
    else if (filters.tipo === "Actualización Profesional") params.push("AP");
    else params.push(filters.tipo);
  }

  if (filters.departamento && filters.departamento !== "") {
    conditions.push("dep.nombre LIKE ?");
    params.push(filters.departamento); 
  }

  if (filters.anio && filters.anio !== "") {
    conditions.push("c.anio_registro = ?");
    params.push(parseInt(filters.anio));
  }

  if (filters.periodo && filters.periodo !== "") {
    conditions.push("c.periodo = ?");
    params.push(filters.periodo);
  }

  if (filters.acreditado && filters.acreditado !== "Ambos" && filters.acreditado !== "") {
    conditions.push("cap.acreditado = ?");
    params.push(filters.acreditado === "Si" ? "True" : "False");
  }

  return {
    where: conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "",
    params: params
  };
}

// --- 1. OBTENER DATOS TABLA VISUAL (Mantiene filtros visuales) ---
export const getModule4TableData = (filters) => {
  try {
    const { where, params } = buildWhereClause(filters);

    const sql = `
      SELECT 
        d.nombre_completo, 
        d.sexo, 
        d.rfc, 
        d.puesto, 
        dep.nombre as depto_nombre, 
        c.nombre as curso_nombre, 
        c.anio_registro as anio, 
        c.periodo as periodo, 
        cap.acreditado
      FROM capacitaciones cap
      JOIN docentes d ON cap.docente_id = d.id_docente
      JOIN cursos c ON cap.curso_id = c.clave_curso
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      ${where}
    `;

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map(row => {
      const esPosgrado = row.depto_nombre && row.depto_nombre.toUpperCase().includes("POSGRADO");
      return {
        nombre_completo: row.nombre_completo,
        rfc: row.rfc, 
        sexo: row.sexo, 
        puesto: row.puesto,
        departamento: row.depto_nombre,
        licenciatura: esPosgrado ? "No" : "Si",
        posgrado: esPosgrado ? "Si" : "No",
        acreditado: row.acreditado === 'True' ? 'Si' : 'No',
        capacitacion_nombre: row.curso_nombre,
        anio: row.anio,
        periodo: row.periodo
      };
    });

  } catch (error) {
    console.error("Error en getModule4TableData:", error);
    throw error;
  }
};

// --- 2. OBTENER ESTADÍSTICAS ---
export const getModule4Stats = (filters = {}) => {
  try {
    // 1. Total Docentes
    let whereDocentes = "";
    let paramsDocentes = [];
    
    if (filters.departamento && filters.departamento !== "") {
      whereDocentes = "WHERE dep.nombre LIKE ?";
      paramsDocentes.push(filters.departamento);
    }

    const sqlTotalDocentes = `
      SELECT COUNT(*) as total 
      FROM docentes d
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      ${whereDocentes}
    `;
    const totalDocentes = db.prepare(sqlTotalDocentes).get(...paramsDocentes).total;

    // 2. Docentes Capacitados
    const { where, params } = buildWhereClause(filters);
    const sqlCapacitados = `
      SELECT COUNT(DISTINCT d.id_docente) as total
      FROM capacitaciones cap
      JOIN docentes d ON cap.docente_id = d.id_docente
      JOIN cursos c ON cap.curso_id = c.clave_curso
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      ${where}
    `;
    const capacitados = db.prepare(sqlCapacitados).get(...params).total;

    // 3. Porcentaje
    const porcentaje = totalDocentes > 0 
      ? ((capacitados / totalDocentes) * 100).toFixed(2) 
      : "0.00";

    // 4. Estadísticas Posgrado
    let wherePos = ["dep.nombre LIKE '%POSGRADO%'", "c.tipo = 'AP'"];
    let paramsPos = [];

    if (filters.anio) {
        wherePos.push("c.anio_registro = ?");
        paramsPos.push(parseInt(filters.anio));
    }
    if (filters.periodo) {
        wherePos.push("c.periodo = ?");
        paramsPos.push(filters.periodo);
    }

    const sqlPos = `
      SELECT COUNT(DISTINCT cap.docente_id) as total
      FROM capacitaciones cap
      JOIN docentes d ON cap.docente_id = d.id_docente
      JOIN cursos c ON cap.curso_id = c.clave_curso
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      WHERE ${wherePos.join(" AND ")}
    `;
    
    const totalPosgrado = db.prepare(sqlPos).get(...paramsPos).total;

    return { totalDocentes, capacitados, porcentaje, totalPosgrado };

  } catch (error) {
    console.error("Error en getModule4Stats:", error);
    throw error;
  }
};

// --- 3. EXPORTAR MÉTRICAS (MODIFICADO) ---
export const exportMetricsExcel = async (filters) => {
  try {
    // A. Validaciones
    if (!fs.existsSync(PATH_PLANTILLA_EXCEL)) {
      return { success: false, message: "No se encuentra la plantilla 'Cursos Profesores.xlsx' en la raíz." };
    }

    // B. Obtener Datos del Sistema
    const sistema = db.prepare("SELECT anio, periodo FROM sistema WHERE id=1").get();
    const anioDir = sistema.anio.toString();
    const periodoDir = sistema.periodo.replace(/[^a-zA-Z0-9 -]/g, "").trim(); 

    // C. CONSTRUCCIÓN DE SQL ESPECÍFICO PARA EXPORTACIÓN
    // NOTA: Aquí ignoramos explícitamente el filtro 'tipo' para contar AP y FD juntos.
    let whereConditions = [];
    let params = [];

    // Filtro por Departamento
    if (filters.departamento && filters.departamento !== "") {
      whereConditions.push("dep.nombre LIKE ?");
      params.push(filters.departamento);
    }

    // Filtro por Año
    if (filters.anio && filters.anio !== "") {
      whereConditions.push("c.anio_registro = ?");
      params.push(parseInt(filters.anio));
    }

    // Filtro por Periodo
    if (filters.periodo && filters.periodo !== "") {
      whereConditions.push("c.periodo = ?");
      params.push(filters.periodo);
    }

    // Filtro por Acreditado
    if (filters.acreditado && filters.acreditado !== "Ambos" && filters.acreditado !== "") {
      whereConditions.push("cap.acreditado = ?");
      params.push(filters.acreditado === "Si" ? "True" : "False");
    }

    let sqlBase = `
      SELECT 
        d.id_docente,
        d.nombre_completo,
        dep.nombre as depto_nombre,
        COUNT(cap.id) as total_cursos,
        SUM(CASE WHEN c.tipo = 'FD' THEN 1 ELSE 0 END) as total_fd,
        SUM(CASE WHEN c.tipo = 'AP' THEN 1 ELSE 0 END) as total_ap
      FROM docentes d
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      LEFT JOIN capacitaciones cap ON d.id_docente = cap.docente_id
      LEFT JOIN cursos c ON cap.curso_id = c.clave_curso
    `;

    if (whereConditions.length > 0) {
      sqlBase += " WHERE " + whereConditions.join(" AND ");
    }

    sqlBase += " GROUP BY d.id_docente, d.nombre_completo, dep.nombre ORDER BY d.nombre_completo ASC";

    const docentesMetricas = db.prepare(sqlBase).all(...params);

    // D. Configurar Rutas y Nombres
    const documentsPath = path.join(os.homedir(), 'Documents');
    // CAMBIO: Subcarpeta '/Estadisticas'
    const outputFolder = path.join(documentsPath, 'sistemaCursosITZ', 'Archivos_Exportados', anioDir, periodoDir, 'Estadisticas');
    
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Determinar nombre base
    let baseName = "";
    if (filters.departamento && filters.departamento !== "") {
      // CAMBIO: Usar CamelCase para el nombre del departamento
      const camelDepto = toCamelCase(filters.departamento);
      baseName = `Metricas_${periodoDir}_${anioDir}_${camelDepto}`;
    } else {
      baseName = `Metricas_${periodoDir}_${anioDir}`;
    }

    // Versionado incremental
    let counter = 1;
    let fileName = `${baseName}_${String(counter).padStart(3, '0')}.xlsx`;
    while (fs.existsSync(path.join(outputFolder, fileName))) {
      counter++;
      fileName = `${baseName}_${String(counter).padStart(3, '0')}.xlsx`;
    }
    const fullPath = path.join(outputFolder, fileName);

    // E. Manipulación del Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(PATH_PLANTILLA_EXCEL);
    const worksheet = workbook.getWorksheet(1);

    // 1. Llenar Encabezados
    const nombreDeptoHeader = (filters.departamento && filters.departamento !== "") 
        ? filters.departamento.toUpperCase() 
        : "TODOS LOS DEPARTAMENTOS";
    worksheet.getCell('G5').value = nombreDeptoHeader;
    worksheet.getCell('G7').value = sistema.anio;
    worksheet.getCell('G9').value = sistema.periodo;

    // 2. Llenar Tabla
    let currentRow = 11;
    let contador = 1;

    for (const doc of docentesMetricas) {
      worksheet.getCell(`B${currentRow}`).value = contador++;
      worksheet.getCell(`C${currentRow}`).value = doc.id_docente;
      worksheet.getCell(`D${currentRow}`).value = doc.nombre_completo;
      worksheet.getCell(`E${currentRow}`).value = doc.depto_nombre;
      worksheet.getCell(`F${currentRow}`).value = doc.total_cursos;
      worksheet.getCell(`G${currentRow}`).value = doc.total_fd;
      worksheet.getCell(`H${currentRow}`).value = doc.total_ap;
      
      ['B','C','D','E','F','G','H'].forEach(col => {
          worksheet.getCell(`${col}${currentRow}`).border = {
            top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
          };
      });

      currentRow++;
    }

    await workbook.xlsx.writeFile(fullPath);

    return { success: true, message: `Métricas exportadas: ${fileName}`, path: fullPath };

  } catch (error) {
    console.error("Error exportando métricas:", error);
    return { success: false, message: error.message };
  }
};