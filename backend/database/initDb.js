import sqlite3 from "sqlite3";
import fs from "fs";
import XLSX from "xlsx";

const DB_FILE = "./database.db";
const EXCEL_FILE = "./datos.xlsx"; // Cambia esto si tu Excel se llama diferente

// 1. Crear base de datos
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err.message);
  console.log("Conectado a la base de datos SQLite.");
});

// 2. Crear tabla teachers
db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS teachers`);
  
  db.run(`CREATE TABLE teachers (
    id TEXT PRIMARY KEY,
    ap TEXT,
    am TEXT,
    nombres TEXT,
    rfc TEXT,
    sexo TEXT,
    depto TEXT,
    puesto TEXT,
    curso TEXT,
    capacitacion TEXT,
    facilitador TEXT,
    periodo TEXT,
    acreditacion BOOLEAN
  )`, (err) => {
    if (err) console.error(err.message);
    else console.log("Tabla teachers creada correctamente.");
  });

  // 3. Leer Excel
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  // 4. Insertar datos
  const stmt = db.prepare(`INSERT INTO teachers 
    (id, ap, am, nombres, rfc, sexo, depto, puesto, curso, capacitacion, facilitador, periodo, acreditacion) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  data.forEach(row => {
    stmt.run(
      row.id,
      row.ap,
      row.am,
      row.nombres,
      row.rfc,
      row.sexo,
      row.depto,
      row.puesto,
      row.curso,
      row.capacitacion,
      row.facilitador,
      row.periodo,
      row.acreditacion ? 1 : 0
    );
  });

  stmt.finalize(() => {
    console.log("Datos importados correctamente desde Excel.");
  });
});

// 5. Cerrar conexión
db.close((err) => {
  if (err) console.error(err.message);
  else console.log("Conexión cerrada.");
});
