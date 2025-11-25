import db from './db.js';
import XLSX from 'xlsx';

// --- UTILIDADES DE LIMPIEZA ---

// Limpia texto: quita espacios extra, convierte a mayúsculas y arregla caracteres rotos
// PARAMETRO NUEVO: quitarNumeros (default: true). Si es false, respeta números al inicio.
const cleanString = (txt, quitarNumeros = true) => {
  if (!txt) return "";
  let str = txt.toString().trim().toUpperCase();
  
  // 1. Corregir caracteres rotos (Ñ) y espacios dobles
  str = str.replace(/\uFFFD/g, "Ñ").replace(/\s+/g, " ");

  // 2. Eliminar numeración o guiones al inicio (ej: "13.- HUGO" -> "HUGO")
  // Solo se ejecuta si quitarNumeros es TRUE
  if (quitarNumeros) {
    str = str.replace(/^[\d\s.-]+/, "");
  }

  return str.trim();
};

// Normaliza para comparaciones internas
const norm = (txt) => {
  if (!txt) return "";
  return txt.toString().trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/Ñ/g, "N"); 
};

// Buscador flexible de columnas
const obtenerValorFuzzy = (row, palabraClave) => {
  const keys = Object.keys(row);
  const keyEncontrada = keys.find(k => k.toString().toLowerCase().includes(palabraClave.toLowerCase()));
  return keyEncontrada ? row[keyEncontrada] : undefined;
};

// --- GENERADORES ID ---
function generarIdDocente() {
  const ids = db.prepare("SELECT id_docente FROM docentes WHERE id_docente LIKE 'TNM%'").all();
  let max = 0;
  ids.forEach(row => {
    const n = parseInt(row.id_docente.replace('TNM', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return `TNM${String(max + 1).padStart(3, '0')}`;
}

function generarIdCurso(tipo, anio, totalCursos) {
  const BLOQUE = 125 + Math.floor((totalCursos) / 99);
  const CONSECUTIVO = (totalCursos) % 99 + 1;
  return `TNM_${BLOQUE}_${String(CONSECUTIVO).padStart(2, '0')}_${anio}_${tipo}`;
}

// --- BUSCADOR INTELIGENTE DE DEPARTAMENTOS ---
function obtenerIdDepartamento(nombreExcel, listaDepartamentosDb) {
  if (!nombreExcel) return 'DP_GEN';
  
  const excelNorm = norm(nombreExcel);

  // 1. Búsqueda Exacta
  const deptoExacto = listaDepartamentosDb.find(d => norm(d.nombre) === excelNorm);
  if (deptoExacto) return deptoExacto.clave_depto;

  // 2. Búsqueda por Palabras Clave
  if (excelNorm.includes("SISTEMAS")) return listaDepartamentosDb.find(d => d.nombre.includes("SISTEMAS"))?.clave_depto;
  if (excelNorm.includes("TIERRA") || excelNorm.includes("CIVIL")) return listaDepartamentosDb.find(d => d.nombre.includes("TIERRA"))?.clave_depto;
  if (excelNorm.includes("BASICAS")) return listaDepartamentosDb.find(d => d.nombre.includes("BASICAS"))?.clave_depto;
  if (excelNorm.includes("INDUSTRIAL")) return listaDepartamentosDb.find(d => d.nombre.includes("INDUSTRIAL"))?.clave_depto;
  if (excelNorm.includes("POSGRADO")) return listaDepartamentosDb.find(d => d.nombre.includes("POSGRADO"))?.clave_depto;
  if (excelNorm.includes("METAL") || excelNorm.includes("MECANICA")) return listaDepartamentosDb.find(d => d.nombre.includes("METAL"))?.clave_depto;
  if (excelNorm.includes("QUIMICA") || excelNorm.includes("BIOQUIMICA")) return listaDepartamentosDb.find(d => d.nombre.includes("QUIMICA"))?.clave_depto;
  
  if (excelNorm.includes("ADMINISTRATIVO") || excelNorm.includes("ECONOMICO") || excelNorm.includes("ADMINISTRACION")) 
    return listaDepartamentosDb.find(d => d.nombre.includes("ECONOMICO"))?.clave_depto;

  return 'DP_GEN'; 
}

export const Module1Controller = {

  // --- 1. IMPORTAR CATÁLOGO ---
  importarCatalogoCursos: (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRowIndex = rawData.findIndex(row => row && row.some(cell => cell && cell.toString().includes("Nombre de los evento")));

      if (headerRowIndex === -1) return { success: false, error: "No se encontró la fila de encabezados." };

      const data = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
      const sys = db.prepare("SELECT anio, periodo FROM sistema WHERE id=1").get();
      const anioSistema = sys ? sys.anio : new Date().getFullYear();
      const periodoSistema = sys ? sys.periodo : 'Periodo Desconocido';

      let totalCursos = db.prepare("SELECT COUNT(*) as c FROM cursos WHERE anio_registro = ?").get(anioSistema).c;
      
      const insert = db.prepare(`
        INSERT OR IGNORE INTO cursos (clave_curso, nombre, tipo, horas, competencias_desarrolladas, facilitador, periodo, anio_registro)
        VALUES (@clave, @nombre, @tipo, @horas, @comp, @facil, @per, @anio)
      `);

      let insertados = 0;
      
      const transaction = db.transaction(() => {
        for (const row of data) {
          const nombre = cleanString(row['Nombre de los evento']); 
          if (!nombre) continue; 
          
          if (nombre.includes("REPROGRAMADO")) continue;

          const tipoRaw = row['Tipo'];
          const tipo = (tipoRaw && tipoRaw.toString().toUpperCase().includes('FD')) ? 'FD' : 'AP';
          
          const existe = db.prepare("SELECT clave_curso FROM cursos WHERE nombre = ? AND anio_registro = ?").get(nombre, anioSistema);
          
          if (!existe) {
             const clave = generarIdCurso(tipo, anioSistema, totalCursos);
             insert.run({ 
               clave, nombre, tipo, 
               horas: parseInt(row['No. de horas x Curso']) || 30, 
               comp: row['Competencias a desarrollar'] || 'Sin registro', 
               facil: cleanString(row['Facilitador(a)']) || 'Por asignar', 
               per: periodoSistema, 
               anio: anioSistema
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
        INSERT INTO docentes (id_docente, rfc, nombre_completo, sexo, departamento_id)
        VALUES (@id, @rfcTemp, @nombre, NULL, @deptoId)
      `);

      let totalAgregados = 0;
      let detalles = [];

      const transaction = db.transaction(() => {
        for (const sheetName of sheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const deptoId = obtenerIdDepartamento(sheetName, departamentosDb);
          
          const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const headerIndex = rawData.findIndex(row => 
            row && row.some(c => c && (c.toString().toLowerCase().includes("apellido") || c.toString().toLowerCase().includes("nombre")))
          );
          
          if (headerIndex === -1) continue; 
          const data = XLSX.utils.sheet_to_json(sheet, { range: headerIndex });
          let countHoja = 0;

          for (const row of data) {
            const ap = cleanString(obtenerValorFuzzy(row, "Apellido Paterno"));
            const am = cleanString(obtenerValorFuzzy(row, "Apellido Materno"));
            const nom = cleanString(obtenerValorFuzzy(row, "Nombres"));
            
            let nombreCompleto = "";
            if (ap && nom) {
              nombreCompleto = `${ap} ${am} ${nom}`.trim();
            } else {
              nombreCompleto = cleanString(obtenerValorFuzzy(row, "Nombre") || obtenerValorFuzzy(row, "Docente"));
            }

            if (!nombreCompleto) continue;

            const rfcTemp = `TEMP_${norm(nombreCompleto).replace(/\s/g, '').substring(0, 10)}_${Math.floor(Math.random() * 10000)}`;
            
            const existe = db.prepare(`SELECT id_docente FROM docentes WHERE nombre_completo = ?`).get(nombreCompleto);
            
            if (!existe) {
              const id = generarIdDocente();
              insert.run({ id, rfcTemp, nombre: nombreCompleto, deptoId });
              countHoja++; totalAgregados++;
            }
          }
          if (countHoja > 0) detalles.push(`${sheetName}: ${countHoja}`);
        }
      });
      transaction();
      if (totalAgregados === 0) return { success: true, message: "No se encontraron nuevos docentes." };
      return { success: true, message: `Se agregaron ${totalAgregados} docentes.` };
    } catch (e) { return { success: false, error: e.message }; }
  },

  // --- 3. IMPORTAR PRE-REGISTRO ---
  importarPreRegistro: (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]]; 

      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRowIndex = rawData.findIndex(row => 
        row && row.some(cell => cell && /nombre|apellido|rfc/i.test(cell.toString()))
      );

      if (headerRowIndex === -1) return { success: false, error: "No se encontraron los encabezados." };

      const data = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
      const departamentosDb = db.prepare("SELECT clave_depto, nombre FROM departamentos").all();
      
      const sys = db.prepare("SELECT anio, periodo FROM sistema WHERE id=1").get();
      const anioSistema = sys ? sys.anio : new Date().getFullYear();
      const periodoSistema = sys ? sys.periodo : 'Periodo Desconocido';

      let totalCursos = db.prepare("SELECT COUNT(*) as c FROM cursos WHERE anio_registro = ?").get(anioSistema).c;

      const insertDocente = db.prepare(`
        INSERT INTO docentes (id_docente, nombre_completo, rfc, sexo, departamento_id, puesto)
        VALUES (@id, @nombre, @rfc, @sexo, @depto, @puesto)
      `);
      const updateDocente = db.prepare(`
        UPDATE docentes SET rfc = @rfc, sexo = @sexo, departamento_id = @depto, puesto = @puesto WHERE id_docente = @id
      `);
      const insertCurso = db.prepare(`
        INSERT INTO cursos (clave_curso, nombre, tipo, facilitador, periodo, anio_registro)
        VALUES (@clave, @nombre, 'AP', @facilitador, @periodo, @anio)
      `);
      const updateCursoPeriodo = db.prepare(`
        UPDATE cursos SET periodo = @periodo WHERE clave_curso = @clave AND (periodo IS NULL OR periodo = '')
      `);
      
      const insertCapacitacion = db.prepare(`
        INSERT OR IGNORE INTO capacitaciones (docente_id, curso_id, fecha_realizacion, horario)
        VALUES (@docId, @cursoId, @fechas, @horario)
      `);

      let stats = { docentesNuevos: 0, docentesAct: 0, cursosNuevos: 0, inscripciones: 0 };

      const transaction = db.transaction(() => {
        for (const row of data) {
          // --- LECTURA DATOS ---
          let nombreCompleto = cleanString(obtenerValorFuzzy(row, 'Nombre'));
          
          if (!nombreCompleto || nombreCompleto.length < 5) {
             const ap = cleanString(obtenerValorFuzzy(row, 'Apellido Paterno'));
             const am = cleanString(obtenerValorFuzzy(row, 'Apellido Materno'));
             const nom = cleanString(obtenerValorFuzzy(row, 'Nombres') || obtenerValorFuzzy(row, 'Nombre(s)'));
             if (ap && nom) nombreCompleto = `${ap} ${am} ${nom}`.trim();
          }

          if (!nombreCompleto) continue; 

          const rfc = cleanString(obtenerValorFuzzy(row, 'RFC')) || `RFC_PEND_${Date.now()}_${Math.floor(Math.random()*100)}`;
          const sexoRaw = cleanString(obtenerValorFuzzy(row, 'Sexo'));
          const sexo = (sexoRaw.startsWith('H')) ? 'H' : (sexoRaw.startsWith('M') ? 'M' : 'X');
          
          const deptoNombreRaw = cleanString(obtenerValorFuzzy(row, 'Departamento') || obtenerValorFuzzy(row, 'adscripción'));
          const deptoIdExcel = obtenerIdDepartamento(deptoNombreRaw, departamentosDb);
          
          const puesto = cleanString(obtenerValorFuzzy(row, 'Puesto')) || 'Base';

          const nombreCursoRaw = cleanString(obtenerValorFuzzy(row, 'Nombre del evento') || obtenerValorFuzzy(row, 'Nombre del curso'));
          const facilitador = cleanString(obtenerValorFuzzy(row, 'facilitador') || 'Por definir');

          // --- CAMBIO AQUÍ: Para horario pasamos 'false' al cleanString para NO borrar números iniciales ---
          const horario = cleanString(obtenerValorFuzzy(row, 'Horario'), false) || '';

          const esReprogramado = nombreCursoRaw.includes("REPROGRAMADO") || facilitador.includes("REPROGRAMADO");

          // --- 1. DOCENTE ---
          let docId = null;
          let docenteEncontrado = db.prepare("SELECT id_docente, departamento_id FROM docentes WHERE rfc = ?").get(rfc);
          
          if (!docenteEncontrado) {
             docenteEncontrado = db.prepare("SELECT id_docente, departamento_id FROM docentes WHERE nombre_completo = ?").get(nombreCompleto);
          }

          if (docenteEncontrado) {
            docId = docenteEncontrado.id_docente;
            const deptoFinal = (docenteEncontrado.departamento_id === 'DP_GEN') ? deptoIdExcel : docenteEncontrado.departamento_id;
            updateDocente.run({ id: docId, rfc, sexo, depto: deptoFinal, puesto });
            stats.docentesAct++;
          } else {
            docId = generarIdDocente();
            insertDocente.run({ id: docId, nombre: nombreCompleto, rfc, sexo, depto: deptoIdExcel, puesto });
            stats.docentesNuevos++;
          }

          if (esReprogramado || !nombreCursoRaw) continue;

          // --- 2. CURSO ---
          const nombreCurso = nombreCursoRaw; 
          const fechasEspecificas = cleanString(obtenerValorFuzzy(row, 'Periodo'));

          const cursoExistente = db.prepare("SELECT clave_curso FROM cursos WHERE nombre = ? AND anio_registro = ?").get(nombreCurso, anioSistema);
          let cursoId;
          
          if (cursoExistente) {
            cursoId = cursoExistente.clave_curso;
            updateCursoPeriodo.run({ periodo: periodoSistema, clave: cursoId });
          } else {
            cursoId = generarIdCurso('AP', anioSistema, totalCursos);
            insertCurso.run({ 
              clave: cursoId, 
              nombre: nombreCurso, 
              facilitador, 
              periodo: periodoSistema, 
              anio: anioSistema 
            });
            totalCursos++;
            stats.cursosNuevos++;
          }

          // --- 3. INSCRIPCIÓN ---
          insertCapacitacion.run({ docId, cursoId, fechas: fechasEspecificas, horario });
          stats.inscripciones++;
        }
      });

      transaction();
      return { 
        success: true, 
        message: `Importación Exitosa:\nDocentes Nuevos: ${stats.docentesNuevos}\nActualizados: ${stats.docentesAct}\nCursos Nuevos: ${stats.cursosNuevos}\nInscripciones: ${stats.inscripciones}` 
      };

    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  },

  importarResultados: (filePath) => { return {success: true}; } 
};

export default Module1Controller;