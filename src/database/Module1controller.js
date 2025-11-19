import db from './db.js';
import XLSX from 'xlsx';

// --- UTILIDADES ---

// Normaliza texto: Quita acentos, pasa a mayúsculas y quita espacios extra
const norm = (txt) => txt ? txt.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

// BUSCADOR FLEXIBLE DE COLUMNAS
const obtenerValorFuzzy = (row, palabraClave) => {
  const keys = Object.keys(row);
  const keyEncontrada = keys.find(k => k.toString().toLowerCase().includes(palabraClave.toLowerCase()));
  return keyEncontrada ? row[keyEncontrada] : undefined;
};

// Generador de ID Docente
function generarIdDocente() {
  const ids = db.prepare("SELECT id_docente FROM docentes WHERE id_docente LIKE 'TNM%'").all();
  let max = 0;
  ids.forEach(row => {
    const n = parseInt(row.id_docente.replace('TNM', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return `TNM${String(max + 1).padStart(3, '0')}`;
}

// Generador de ID Curso
function generarIdCurso(tipo, anio, totalCursos) {
  const BLOQUE = 125 + Math.floor((totalCursos) / 99);
  const CONSECUTIVO = (totalCursos) % 99 + 1;
  return `TNM_${BLOQUE}_${String(CONSECUTIVO).padStart(2, '0')}_${anio}_${tipo}`;
}

// Helper para ID departamento
function obtenerIdDepartamento(nombreHoja, listaDepartamentosDb) {
  if (!nombreHoja) return 'DP_GEN';
  const nombreNormalizado = norm(nombreHoja);
  
  const depto = listaDepartamentosDb.find(d => norm(d.nombre) === nombreNormalizado);
  if (depto) return depto.clave_depto;

  if (nombreNormalizado.includes("SISTEMAS")) return listaDepartamentosDb.find(d => d.nombre.includes("SISTEMAS"))?.clave_depto;
  if (nombreNormalizado.includes("TIERRA") || nombreNormalizado.includes("CIVIL")) return listaDepartamentosDb.find(d => d.nombre.includes("TIERRA"))?.clave_depto;
  if (nombreNormalizado.includes("BASICAS")) return listaDepartamentosDb.find(d => d.nombre.includes("BASICAS"))?.clave_depto;
  if (nombreNormalizado.includes("INDUSTRIAL")) return listaDepartamentosDb.find(d => d.nombre.includes("INDUSTRIAL"))?.clave_depto;
  if (nombreNormalizado.includes("POSGRADO")) return listaDepartamentosDb.find(d => d.nombre.includes("POSGRADO"))?.clave_depto;
  if (nombreNormalizado.includes("ADMINISTRATIVO") || nombreNormalizado.includes("ECONOMICO")) return listaDepartamentosDb.find(d => d.nombre.includes("ADMINISTRATIVO"))?.clave_depto;

  return 'DP_GEN'; 
}

export const Module1Controller = {

  // --- 1. IMPORTAR CATÁLOGO ---
  importarCatalogoCursos: (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRowIndex = rawData.findIndex(row => 
        row && row.some(cell => cell && cell.toString().includes("Nombre de los evento"))
      );

      if (headerRowIndex === -1) return { success: false, error: "No se encontró la fila de encabezados en el archivo." };

      const data = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
      const sys = db.prepare("SELECT anio FROM sistema WHERE id=1").get();
      const anio = sys ? sys.anio : new Date().getFullYear();
      let totalCursos = db.prepare("SELECT COUNT(*) as c FROM cursos WHERE anio_registro = ?").get(anio).c;
      
      const insert = db.prepare(`
        INSERT OR IGNORE INTO cursos (clave_curso, nombre, tipo, horas, competencias_desarrolladas, facilitador, periodo, anio_registro)
        VALUES (@clave, @nombre, @tipo, @horas, @comp, @facil, @per, @anio)
      `);

      let insertados = 0;
      
      const transaction = db.transaction(() => {
        for (const row of data) {
          const nombre = row['Nombre de los evento']; 
          if (!nombre) continue; 

          const tipoRaw = row['Tipo'];
          const tipo = (tipoRaw && tipoRaw.toString().toUpperCase().includes('FD')) ? 'FD' : 'AP';
          
          const existe = db.prepare("SELECT clave_curso FROM cursos WHERE nombre = ? AND anio_registro = ?").get(nombre, anio);
          
          if (!existe) {
             const clave = generarIdCurso(tipo, anio, totalCursos);
             insert.run({ 
               clave, nombre, tipo, 
               horas: parseInt(row['No. de horas x Curso']) || 30, 
               comp: row['Competencias a desarrollar'] || 'Sin registro', 
               facil: row['Facilitador(a)'] || 'Por asignar', 
               per: '', anio 
             });
             totalCursos++;
             insertados++;
          }
        }
      });

      transaction();
      return { success: true, message: `Catálogo importado: ${insertados} cursos nuevos.` };

    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  },

  // --- 2. DOCENTES ADSCRITOS ---
  importarDocentesAdscritos: (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames; 
      const departamentosDb = db.prepare("SELECT clave_depto, nombre FROM departamentos").all();

      const insert = db.prepare(`
        INSERT INTO docentes (id_docente, rfc, ap, am, nombres, sexo, departamento_id)
        VALUES (@id, @rfcTemp, @ap, @am, @nombres, NULL, @deptoId)
      `);

      let totalAgregados = 0;
      let detalles = [];

      const transaction = db.transaction(() => {
        for (const sheetName of sheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const deptoId = obtenerIdDepartamento(sheetName, departamentosDb);

          const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const headerIndex = rawData.findIndex(row => 
            row && row.some(c => c && c.toString().toLowerCase().includes("apellido paterno"))
          );

          if (headerIndex === -1) continue; 

          const data = XLSX.utils.sheet_to_json(sheet, { range: headerIndex });
          let countHoja = 0;

          for (const row of data) {
            const ap = obtenerValorFuzzy(row, "Apellido Paterno");
            const am = obtenerValorFuzzy(row, "Apellido Materno");
            const nom = obtenerValorFuzzy(row, "Nombres");

            if (!ap && !nom) continue;

            // RFC Temporal
            const rfcTemp = `TEMP_${norm(ap).substring(0,3)}${norm(nom).substring(0,3)}_${Math.floor(Math.random() * 1000000)}`;

            const existe = db.prepare(`SELECT id_docente FROM docentes WHERE ap = ? AND am = ? AND nombres = ?`).get(ap, am, nom);

            if (!existe) {
              const id = generarIdDocente();
              insert.run({ id, rfcTemp, ap, am, nombres: nom, deptoId });
              countHoja++;
              totalAgregados++;
            }
          }
          if (countHoja > 0) detalles.push(`${sheetName}: ${countHoja}`);
        }
      });

      transaction();

      if (totalAgregados === 0) return { success: true, message: "No se encontraron nuevos docentes (todos ya existían)." };
      return { success: true, message: `Se agregaron ${totalAgregados} docentes.\nDetalle: ${detalles.join(', ')}` };

    } catch (e) { 
      console.error(e);
      return { success: false, error: e.message }; 
    }
  },

  // --- 3. IMPORTAR PRE-REGISTRO (Corrección UNIQUE RFC) ---
  importarPreRegistro: (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]]; 

      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRowIndex = rawData.findIndex(row => 
        row && row.some(cell => cell && cell.toString().toLowerCase().includes("apellido paterno"))
      );

      if (headerRowIndex === -1) return { success: false, error: "No se encontraron los encabezados en el archivo." };

      const data = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
      
      const departamentosDb = db.prepare("SELECT clave_depto, nombre FROM departamentos").all();
      const sys = db.prepare("SELECT anio FROM sistema WHERE id=1").get();
      const anio = sys ? sys.anio : new Date().getFullYear();
      let totalCursos = db.prepare("SELECT COUNT(*) as c FROM cursos WHERE anio_registro = ?").get(anio).c;

      // --- PREPARAR SENTENCIAS SQL ---
      const insertDocente = db.prepare(`
        INSERT INTO docentes (id_docente, ap, am, nombres, rfc, sexo, departamento_id, puesto)
        VALUES (@id, @ap, @am, @nom, @rfc, @sexo, @depto, @puesto)
      `);

      const updateDocente = db.prepare(`
        UPDATE docentes 
        SET rfc = @rfc, sexo = @sexo, departamento_id = @depto, puesto = @puesto
        WHERE id_docente = @id
      `);

      const insertCurso = db.prepare(`
        INSERT INTO cursos (clave_curso, nombre, tipo, facilitador, periodo, anio_registro)
        VALUES (@clave, @nombre, 'AP', @facilitador, @periodo, @anio)
      `);

      const updateCursoPeriodo = db.prepare(`
        UPDATE cursos SET periodo = @periodo WHERE clave_curso = @clave AND (periodo IS NULL OR periodo = '')
      `);

      const insertCapacitacion = db.prepare(`
        INSERT OR IGNORE INTO capacitaciones (docente_id, curso_id, periodo_realizacion)
        VALUES (@docId, @cursoId, @periodo)
      `);

      let stats = { docentesNuevos: 0, docentesAct: 0, cursosNuevos: 0, inscripciones: 0 };

      const transaction = db.transaction(() => {
        for (const row of data) {
          
          // 1. OBTENER DATOS
          const ap = obtenerValorFuzzy(row, 'Apellido Paterno') || '';
          const am = obtenerValorFuzzy(row, 'Apellido Materno') || '';
          const nom = (obtenerValorFuzzy(row, 'Nombres') || '').toString().trim();
          
          if (!ap || !nom) continue; 

          const rfc = obtenerValorFuzzy(row, 'RFC') ? obtenerValorFuzzy(row, 'RFC').toString().trim() : `RFC_PEND_${Date.now()}`;
          const sexoRaw = obtenerValorFuzzy(row, 'Sexo') || '';
          const sexo = (sexoRaw.toUpperCase() === 'HOMBRE') ? 'M' : (sexoRaw.toUpperCase() === 'MUJER' ? 'F' : 'X');
          const deptoNombre = obtenerValorFuzzy(row, 'Departamento') || obtenerValorFuzzy(row, 'adscripción');
          const deptoIdExcel = obtenerIdDepartamento(deptoNombre, departamentosDb);
          const puesto = obtenerValorFuzzy(row, 'Puesto') || 'Docente';

          // --- LOGICA DE BÚSQUEDA ROBUSTA (Corrección del error UNIQUE) ---
          let docId = null;
          let docenteEncontrado = null;

          // A. Prioridad 1: Buscar por RFC (Dato único real)
          docenteEncontrado = db.prepare("SELECT id_docente, departamento_id FROM docentes WHERE rfc = ?").get(rfc);

          // B. Prioridad 2: Buscar por Nombre Completo (Si no se encontró por RFC, busca para fusionar con 'Adscritos')
          if (!docenteEncontrado) {
             docenteEncontrado = db.prepare("SELECT id_docente, departamento_id FROM docentes WHERE ap = ? AND am = ? AND nombres = ?").get(ap.trim(), am.trim(), nom.trim());
          }

          if (docenteEncontrado) {
            // ACTUALIZAR
            docId = docenteEncontrado.id_docente;
            
            // Protección de departamento: Si ya tiene uno asignado (diferente a DP_GEN), no lo sobrescribimos
            const deptoFinal = (docenteEncontrado.departamento_id === 'DP_GEN') ? deptoIdExcel : docenteEncontrado.departamento_id;

            updateDocente.run({ id: docId, rfc, sexo, depto: deptoFinal, puesto });
            stats.docentesAct++;
          } else {
            // INSERTAR (Solo si no existe ni por RFC ni por Nombre)
            docId = generarIdDocente();
            insertDocente.run({ id: docId, ap, am, nom, rfc, sexo, depto: deptoIdExcel, puesto });
            stats.docentesNuevos++;
          }

          // --- CURSO ---
          const nombreCursoRaw = obtenerValorFuzzy(row, 'Nombre del evento') || obtenerValorFuzzy(row, 'Nombre del curso');
          
          if (nombreCursoRaw) {
            const nombreCurso = nombreCursoRaw.replace(/^\d+\.\s*/, '').trim();
            const facilitador = obtenerValorFuzzy(row, 'facilitador') || 'Por definir';
            const periodo = obtenerValorFuzzy(row, 'Periodo') || ''; 

            const cursoExistente = db.prepare("SELECT clave_curso FROM cursos WHERE nombre = ? AND anio_registro = ?").get(nombreCurso, anio);
            let cursoId;
            
            if (cursoExistente) {
              cursoId = cursoExistente.clave_curso;
              if (periodo) updateCursoPeriodo.run({ periodo, clave: cursoId });
            } else {
              cursoId = generarIdCurso('AP', anio, totalCursos);
              insertCurso.run({ clave: cursoId, nombre: nombreCurso, facilitador, periodo, anio });
              totalCursos++;
              stats.cursosNuevos++;
            }

            insertCapacitacion.run({ docId, cursoId, periodo });
            stats.inscripciones++;
          }
        }
      });

      transaction();

      return { 
        success: true, 
        message: `Importación Pre-Registro Exitosa:\n` +
                 `- Docentes Nuevos: ${stats.docentesNuevos}\n` +
                 `- Docentes Actualizados/Fusionados: ${stats.docentesAct}\n` +
                 `- Cursos Nuevos: ${stats.cursosNuevos}\n` +
                 `- Inscripciones: ${stats.inscripciones}` 
      };

    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  },

  importarResultados: (filePath) => { return {success: true}; } 
};

export default Module1Controller;