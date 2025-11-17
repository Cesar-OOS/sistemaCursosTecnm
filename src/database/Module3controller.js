// --- CAMBIO: Usar 'import' y añadir .js ---
import db from './db.js';

// (El resto de tus funciones getModule3Data, getDepartmentsList, etc.
// se quedan EXACTAMENTE IGUAL por dentro)

function getModule3Data() {
  try {
    const sql = `
      SELECT 
        cap.id, d.ap, d.am, d.nombres, d.rfc, d.sexo, 
        dep.nombre AS depto, d.puesto, c.nombre AS curso, 
        cap.tipo_capacitacion AS capacitacion, cap.facilitador, 
        cap.periodo, cap.acreditado
      FROM capacitaciones cap
      JOIN docentes d ON cap.docente_id = d.id_docente
      JOIN departamentos dep ON d.departamento_id = dep.clave_depto
      JOIN cursos c ON cap.curso_id = c.clave_curso
    `;
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    return rows.map(row => ({
      ...row,
      acreditacion: row.acreditado === 'True' 
    }));
  } catch (error) {
    console.error("Error al obtener datos del Módulo 3:", error);
    return [];
  }
}

function getDepartmentsList() {
  try {
    const stmt = db.prepare('SELECT nombre FROM departamentos');
    return stmt.pluck().all();
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    return [];
  }
}

function updateAccreditations(teachersData) {
  const updateStmt = db.prepare(`
    UPDATE capacitaciones 
    SET acreditado = ? 
    WHERE id = ?
  `);
  const transaction = db.transaction((teachers) => {
    for (const teacher of teachers) {
      const valorDb = teacher.acreditacion ? 'True' : 'False';
      updateStmt.run(valorDb, teacher.id);
    }
  });

  try {
    transaction(teachersData);
    return { success: true, message: "Datos actualizados correctamente." };
  } catch (error) {
    console.error("Error al guardar actualización:", error);
    return { success: false, message: "Error al actualizar la base de datos." };
  }
}

// --- CAMBIO: Usar 'export' ---
export {
  getModule3Data,
  getDepartmentsList,
  updateAccreditations
};