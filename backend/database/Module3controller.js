import db from "./db.js";

// Obtener tabla completa
export function getModule3Data() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM module3", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Obtener departamentos
export function getDepartmentsList() {
  return new Promise((resolve, reject) => {
    db.all("SELECT nombre FROM departamentos", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.nombre));
    });
  });
}

// Actualizar acreditaciones
export function updateAccreditations(items) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare("UPDATE module3 SET acreditado = ? WHERE id = ?");

    items.forEach(item => {
      stmt.run(item.acreditado ? 1 : 0, item.id);
    });

    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve({ message: "Acreditaciones actualizadas" });
    });
  });
}
