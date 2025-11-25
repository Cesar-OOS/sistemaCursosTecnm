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
const PATH_PLANTILLA_EXCEL = path.join(PROJECT_ROOT, 'Lista Asistencia.xlsx');

// --- 1. OBTENER DATOS ---
function getModule3Data() {
  try {
    const sql = `
      SELECT 
        cap.id, d.nombre_completo, d.rfc, d.sexo, dep.nombre AS depto, d.puesto, 
        c.nombre AS curso, c.tipo AS capacitacion, c.facilitador AS facilitador, 
        cap.fecha_realizacion AS periodo, cap.acreditado
      FROM capacitaciones cap
      JOIN docentes d ON cap.docente_id = d.id_docente
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      JOIN cursos c ON cap.curso_id = c.clave_curso
    `;
    const rows = db.prepare(sql).all();
    return rows.map(row => ({ ...row, acreditacion: row.acreditado === 'True' }));
  } catch (error) {
    console.error("Error Módulo 3:", error);
    return [];
  }
}

// --- 2. OBTENER DEPARTAMENTOS ---
function getDepartmentsList() {
  try {
    return db.prepare('SELECT nombre FROM departamentos').pluck().all();
  } catch (error) {
    console.error("Error deptos:", error);
    return [];
  }
}

// --- 3. ACTUALIZAR ACREDITACIONES ---
function updateAccreditations(teachersData) {
  if (!Array.isArray(teachersData)) return { success: false, message: "Formato incorrecto." };
  const updateStmt = db.prepare(`UPDATE capacitaciones SET acreditado = ? WHERE id = ?`);
  const transaction = db.transaction((teachers) => {
    for (const teacher of teachers) {
      if (!teacher.id) continue;
      updateStmt.run(teacher.acreditacion ? 'True' : 'False', teacher.id);
    }
  });
  try {
    transaction(teachersData);
    return { success: true, message: "Datos guardados." };
  } catch (error) {
    return { success: false, message: `Error SQL: ${error.message}` };
  }
}

// --- FUNCIÓN AUXILIAR: LLENAR HOJA ---
function fillSheetData(worksheet, curso, participantesChunk, sistema, startCounter) {
  
  // A. ENCABEZADOS
  worksheet.getCell('D8').value = curso.nombre;
  worksheet.getCell('D9').value = curso.facilitador;
  worksheet.getCell('J9').value = `${curso.horas} Horas`;
  
  // --- CAMBIO: Insertar Horario en Q9:T9 ---
  // Como el horario viene de capacitaciones, tomamos el del primer participante (asumimos que todos tienen el mismo horario para ese curso)
  const horarioReal = participantesChunk.length > 0 && participantesChunk[0].horario 
    ? participantesChunk[0].horario 
    : "Por definir";
  
  // Aseguramos que la celda combinada Q9 tenga el valor
  worksheet.getCell('Q9').value = horarioReal;

  // Fecha (Del primer participante)
  const fechaReal = participantesChunk.length > 0 ? participantesChunk[0].fecha_realizacion : "Por definir";
  worksheet.getCell('D10').value = fechaReal;

  const nombreTipo = curso.tipo === 'AP' ? "Actualización Profesional" : "Formación Docente";
  worksheet.getCell('L10').value = nombreTipo;
  worksheet.getCell('D11').value = "Instituto Tecnológico de Zacatepec";

  // B. PARTICIPANTES
  let currentRow = 16;
  let counter = startCounter;

  for (const p of participantesChunk) {
    // No.
    worksheet.getCell(`A${currentRow}`).value = counter++;
    // Nombre
    worksheet.getCell(`B${currentRow}`).value = p.nombre_completo;
    // RFC
    worksheet.getCell(`E${currentRow}`).value = p.rfc;
    // Puesto, Depto
    worksheet.getCell(`F${currentRow}`).value = `${p.puesto}, ${p.depto}`;

    // Sexo
    if (p.sexo === 'H') worksheet.getCell(`J${currentRow}`).value = "X";
    else if (p.sexo === 'M' || p.sexo === 'F') worksheet.getCell(`K${currentRow}`).value = "X";

    // Puesto Tipo
    const puestoNorm = p.puesto ? p.puesto.toUpperCase() : "";
    if (puestoNorm.includes("BASE")) worksheet.getCell(`L${currentRow}`).value = "X";
    else if (puestoNorm.includes("INTERIN")) worksheet.getCell(`M${currentRow}`).value = "X";

    currentRow++;
  }

  // C. FIRMAS
  worksheet.getCell('D38').value = curso.facilitador;
  worksheet.getCell('I38').value = sistema.coordinador_nombre;
}

// --- 4. GENERAR LISTAS (ARCHIVOS SEPARADOS) ---
async function generateAttendanceLists(mode, courseName) {
  try {
    if (!fs.existsSync(PATH_PLANTILLA_EXCEL)) {
      return { success: false, message: "No se encuentra la plantilla 'Lista Asistencia.xlsx' en la raíz." };
    }

    // 1. Datos Sistema y Rutas
    const sistema = db.prepare("SELECT * FROM sistema WHERE id=1").get();
    const anioDir = sistema.anio.toString();
    const periodoDir = sistema.periodo.replace(/[^a-zA-Z0-9 -]/g, "").trim(); 

    const documentsPath = path.join(os.homedir(), 'Documents');
    const outputFolder = path.join(documentsPath, 'sistemaCursosITZ', 'Archivos_Exportados', anioDir, periodoDir, 'Listas');
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

    // 2. Buscar Cursos
    let cursosQuery = "SELECT * FROM cursos";
    let params = [];
    if (mode === 'single' && courseName) {
      cursosQuery += " WHERE nombre = ?";
      params.push(courseName);
    }
    
    const cursos = db.prepare(cursosQuery).all(...params);
    if (cursos.length === 0) return { success: false, message: "No hay cursos para exportar." };

    let generatedFilesCount = 0;

    // 3. Procesar cada curso
    for (const curso of cursos) {
      // --- CAMBIO: Agregar cap.horario a la consulta ---
      const participantes = db.prepare(`
        SELECT d.nombre_completo, d.rfc, d.puesto, d.sexo, dep.nombre as depto, cap.fecha_realizacion, cap.horario
        FROM capacitaciones cap
        JOIN docentes d ON cap.docente_id = d.id_docente
        JOIN departamentos dep ON d.departamento_id = dep.clave_depto
        WHERE cap.curso_id = ?
        ORDER BY d.nombre_completo ASC
      `).all(curso.clave_curso);

      // --- DIVIDIR EN GRUPOS DE 20 ---
      const CHUNK_SIZE = 20;
      const chunks = [];
      
      if (participantes.length === 0) {
        chunks.push([]); 
      } else {
        for (let i = 0; i < participantes.length; i += CHUNK_SIZE) {
          chunks.push(participantes.slice(i, i + CHUNK_SIZE));
        }
      }

      // --- NOMBRE Y VERSIÓN ---
      const safeCourseId = curso.clave_curso.replace(/[^a-zA-Z0-9 -_]/g, "");
      const baseFileName = `Lista_Asistencia_${safeCourseId}`;
      
      let version = 1;
      let versionStr = String(version).padStart(2, '0');
      
      while (
        fs.existsSync(path.join(outputFolder, `${baseFileName}_${versionStr}.xlsx`)) ||
        fs.existsSync(path.join(outputFolder, `${baseFileName}_${versionStr}_parte1.xlsx`))
      ) {
        version++;
        versionStr = String(version).padStart(2, '0');
      }

      // --- GENERAR ARCHIVOS ---
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const startCounter = (i * CHUNK_SIZE) + 1;

        let finalFileName;
        if (chunks.length === 1) {
          finalFileName = `${baseFileName}_${versionStr}.xlsx`;
        } else {
          finalFileName = `${baseFileName}_${versionStr}_parte${i + 1}.xlsx`;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(PATH_PLANTILLA_EXCEL);
        const worksheet = workbook.getWorksheet(1); 

        fillSheetData(worksheet, curso, chunk, sistema, startCounter);

        await workbook.xlsx.writeFile(path.join(outputFolder, finalFileName));
        generatedFilesCount++;
      }
    }

    return { success: true, message: `Se generaron ${generatedFilesCount} archivos en Documentos.` };

  } catch (error) {
    console.error("Error generando listas:", error);
    return { success: false, message: error.message };
  }
}

export {
  getModule3Data,
  getDepartmentsList,
  updateAccreditations,
  generateAttendanceLists
};