import db from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os'; // Necesario para encontrar la carpeta Documentos
import ExcelJS from 'exceljs'; // CAMBIO: Usamos ExcelJS para estilos avanzados
import PDFDocument from 'pdfkit-table';

// --- CONSTRUCTOR DE WHERE (Existente) ---
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

// --- OBTENER DATOS TABLA (Existente) ---
export const getModule4TableData = (filters) => {
  try {
    const { where, params } = buildWhereClause(filters);

    const sql = `
      SELECT 
        d.ap, d.am, d.nombres, d.sexo, d.rfc, d.puesto, 
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
        nombre_completo: `${row.ap} ${row.am} ${row.nombres}`.trim(),
        ap: row.ap, am: row.am, nombres: row.nombres, rfc: row.rfc, sexo: row.sexo, puesto: row.puesto,
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

// --- OBTENER ESTADÍSTICAS (Existente) ---
export const getModule4Stats = () => {
  try {
    const sqlTotalDocentes = `SELECT COUNT(*) as total FROM docentes`;
    const totalDocentes = db.prepare(sqlTotalDocentes).get().total;

    const sqlCapacitados = `SELECT COUNT(DISTINCT docente_id) as total FROM capacitaciones`;
    const capacitados = db.prepare(sqlCapacitados).get().total;

    const porcentaje = totalDocentes > 0 
      ? ((capacitados / totalDocentes) * 100).toFixed(2) 
      : "0.00";

    const sqlPos = `
      SELECT COUNT(DISTINCT cap.docente_id) as total
      FROM capacitaciones cap
      JOIN docentes d ON cap.docente_id = d.id_docente
      JOIN cursos c ON cap.curso_id = c.clave_curso
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      WHERE dep.nombre LIKE '%POSGRADO%' AND c.tipo = 'AP'
    `;
    
    const totalPosgrado = db.prepare(sqlPos).get().total;

    return { totalDocentes, capacitados, porcentaje, totalPosgrado };

  } catch (error) {
    console.error("Error en getModule4Stats:", error);
    throw error;
  }
};

// --- NUEVO: LÓGICA DE EXPORTACIÓN ---
export const exportData = async (format, filters) => {
  try {
    // 1. Obtener Ruta Base (Documentos del Usuario)
    const documentsPath = path.join(os.homedir(), 'Documents'); // C:\Users\Usuario\Documents
    
    // 2. Obtener datos del Sistema para carpetas
    const sys = db.prepare("SELECT anio, periodo FROM sistema WHERE id=1").get();
    const anioDir = sys ? sys.anio.toString() : "General";
    // Limpiar nombre del periodo para evitar caracteres inválidos en rutas
    const periodoDir = sys ? sys.periodo.replace(/[^a-zA-Z0-9 -]/g, "").trim() : "General";

    // 3. Construir ruta completa
    const exportFolder = path.join(documentsPath, 'sistemaCursosITZ', 'Archivos_Exportados', anioDir, periodoDir, 'Estadisticas');

    // 4. Crear carpetas si no existen (recursive: true crea toda la ruta)
    if (!fs.existsSync(exportFolder)) {
      fs.mkdirSync(exportFolder, { recursive: true });
    }

    // 5. Calcular Nombre de Archivo (MetricasXXX)
    const ext = format === 'excel' ? '.xlsx' : '.pdf';
    let counter = 1;
    let fileName = `Metricas${String(counter).padStart(3, '0')}${ext}`;
    
    while (fs.existsSync(path.join(exportFolder, fileName))) {
      counter++;
      fileName = `Metricas${String(counter).padStart(3, '0')}${ext}`;
    }

    const fullPath = path.join(exportFolder, fileName);

    // 6. Obtener Datos
    const tableData = getModule4TableData(filters);
    const statsData = getModule4Stats();

    // 7. Generar Archivo
    if (format === 'excel') {
      await generateExcel(fullPath, tableData, statsData);
    } else {
      await generatePDF(fullPath, tableData, statsData);
    }

    return { success: true, message: `Archivo guardado en: ${fullPath}` };

  } catch (error) {
    console.error("Error exportando:", error);
    return { success: false, message: error.message };
  }
};

// --- GENERADORES ---

async function generateExcel(filePath, tableData, stats) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Metricas');

  // 1. Definir Columnas y Anchos
  worksheet.columns = [
    { header: 'Nombre Completo', key: 'nombre', width: 24 }, // Ancho 24 solicitado
    { header: 'Apellido P.', key: 'ap', width: 15 },
    { header: 'Apellido M.', key: 'am', width: 15 },
    { header: 'Año', key: 'anio', width: 8 },
    { header: 'Periodo', key: 'periodo', width: 20 },
    { header: 'Licenciatura', key: 'lic', width: 12 },
    { header: 'Posgrado', key: 'pos', width: 10 },
    { header: 'Acreditado', key: 'acr', width: 12 },
    { header: 'Curso', key: 'curso', width: 35 },
  ];

  // 2. Estilo de Encabezados (Fila 1)
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF000000' } }; // Negrita
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF95B3D7' } // Color #95B3D7
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 3. Agregar Datos de la Tabla
  tableData.forEach(d => {
    const row = worksheet.addRow({
      nombre: d.nombre_completo,
      ap: d.ap,
      am: d.am,
      anio: d.anio,
      periodo: d.periodo,
      lic: d.licenciatura,
      pos: d.posgrado,
      acr: d.acreditado,
      curso: d.capacitacion_nombre
    });

    // Bordes para cada celda de datos
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // 4. Espacio en blanco
  worksheet.addRow([]);
  worksheet.addRow([]);

  // 5. Estadísticas Generales
  const titleRow = worksheet.addRow(['ESTADÍSTICAS GENERALES']);
  titleRow.font = { bold: true, size: 12 };
  
  const statsRows = [
    ['Número total de docentes:', stats.totalDocentes],
    ['Docentes Capacitados:', stats.capacitados],
    ['Porcentaje de capacitación:', `${stats.porcentaje}%`],
    ['Participantes Posgrado (AP):', stats.totalPosgrado]
  ];

  statsRows.forEach(stat => {
    worksheet.addRow(stat);
  });

  // Guardar archivo
  await workbook.xlsx.writeFile(filePath);
}

// --- GENERADOR PDF (Sin cambios mayores, solo formato) ---
async function generatePDF(filePath, tableData, stats) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(16).text('Reporte de Métricas y Estadísticas', { align: 'center' });
    doc.moveDown();

    const table = {
      title: "Listado de Docentes",
      headers: ["Nombre", "AP", "AM", "Año", "Periodo", "Lic.", "Pos.", "Acr.", "Curso"],
      rows: tableData.map(r => [
        r.nombres, r.ap, r.am, 
        r.anio?.toString() || '', 
        r.periodo || '', 
        r.licenciatura, r.posgrado, r.acreditado, 
        (r.capacitacion_nombre || '').substring(0, 25)
      ]),
    };

    doc.table(table, { 
      width: 780,
      prepareHeader: () => doc.fontSize(10).font("Helvetica-Bold"),
      prepareRow: () => doc.fontSize(9).font("Helvetica")
    });

    doc.moveDown(2);

    doc.fontSize(12).font("Helvetica-Bold").text('ESTADÍSTICAS GENERALES');
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Número total de docentes: ${stats.totalDocentes}`);
    doc.text(`Docentes Capacitados: ${stats.capacitados}`);
    doc.text(`(%) de docentes capacitados: ${stats.porcentaje}%`);
    doc.text(`Participantes de nivel posgrado (AP): ${stats.totalPosgrado}`);

    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}