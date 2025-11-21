import db from './db.js';

// 1. OBTENER DATOS
function getModule3Data() {
  try {
    const sql = `
      SELECT 
        cap.id, 
        d.ap, d.am, d.nombres, d.rfc, d.sexo, 
        dep.nombre AS depto, 
        d.puesto, 
        c.nombre AS curso, 
        c.tipo AS capacitacion, 
        c.facilitador AS facilitador, 
        cap.fecha_realizacion AS periodo, -- CAMBIO: Ahora leemos fecha_realizacion
        cap.acreditado
      FROM capacitaciones cap
      JOIN docentes d ON cap.docente_id = d.id_docente
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      JOIN cursos c ON cap.curso_id = c.clave_curso
    `;
    
    const stmt = db.prepare(sql);
    const rows = stmt.all();

    return rows.map(row => ({
      ...row,
      acreditacion: row.acreditado === 'True' // Convertimos a booleano para React
    }));

  } catch (error) {
    console.error("Error en Módulo 3 (GET):", error);
    return [];
  }
}

// 2. OBTENER DEPARTAMENTOS
function getDepartmentsList() {
  try {
    const stmt = db.prepare('SELECT nombre FROM departamentos');
    return stmt.pluck().all();
  } catch (error) {
    console.error("Error departamentos:", error);
    return [];
  }
}

// 3. ACTUALIZAR ACREDITACIONES (CORREGIDO Y ROBUSTO)
function updateAccreditations(teachersData) {
  // Validación inicial: Debe ser un array
  if (!Array.isArray(teachersData)) {
    console.error("Error: teachersData no es un array", teachersData);
    return { success: false, message: "Formato de datos incorrecto (se esperaba una lista)." };
  }

  const updateStmt = db.prepare(`
    UPDATE capacitaciones 
    SET acreditado = ? 
    WHERE id = ?
  `);

  const transaction = db.transaction((teachers) => {
    let updates = 0;
    for (const teacher of teachers) {
      // Validamos que el ID exista para no romper la query
      if (!teacher.id) {
        console.warn("Fila sin ID omitida:", teacher);
        continue;
      }

      // Convertimos el booleano de React al texto 'True'/'False' de SQLite
      const valorDb = teacher.acreditacion ? 'True' : 'False';
      
      updateStmt.run(valorDb, teacher.id);
      updates++;
    }
    return updates;
  });

  try {
    const count = transaction(teachersData);
    console.log(`Se actualizaron ${count} registros de acreditación.`);
    return { success: true, message: "Datos guardados correctamente." };
  } catch (error) {
    console.error("Error DETALLADO al guardar:", error);
    // AQUÍ ESTÁ LA CLAVE: Devolvemos el error real al frontend para poder leerlo
    return { success: false, message: `Error SQL: ${error.message}` };
  }
}

export {
  getModule3Data,
  getDepartmentsList,
  updateAccreditations
};