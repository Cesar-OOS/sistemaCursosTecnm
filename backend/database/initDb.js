import sqlite3 from "sqlite3";
import fs from "fs";
import XLSX from "xlsx";

const DB_FILE = "./database.db";
const EXCEL_FILE = "./datos.xlsx"; // Tu archivo Excel

// 1. Eliminar base de datos si existe (opcional)
if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
  console.log("Base de datos anterior eliminada.");
}

// 2. Crear base de datos
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err.message);
  console.log("Conectado a la base de datos SQLite.");
});

// 3. Leer Excel
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

db.serialize(() => {
  // 4. Crear tablas normalizadas
  db.run(`CREATE TABLE docentes (
    id TEXT PRIMARY KEY,
    ap TEXT,
    am TEXT,
    nombres TEXT,
    rfc TEXT,
    sexo TEXT,
    puesto TEXT,
    depto_adscrito TEXT
  )`);

  db.run(`CREATE TABLE participaciones (
    participacion_id INTEGER PRIMARY KEY AUTOINCREMENT,
    docente_id TEXT,
    curso TEXT,
    tipo_capacitacion TEXT,
    facilitador TEXT,
    periodo TEXT,
    acreditacion BOOLEAN,
    FOREIGN KEY(docente_id) REFERENCES docentes(id)
  )`);

  db.run(`CREATE TABLE adscripciones (
    docente_id TEXT,
    departamento TEXT,
    FOREIGN KEY(docente_id) REFERENCES docentes(id)
  )`);

  console.log("Tablas creadas correctamente.");

  // 5. Preparar sentencias
  const stmtDocentes = db.prepare(`INSERT INTO docentes
    (id, ap, am, nombres, rfc, sexo, puesto, depto_adscrito)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const stmtParticipaciones = db.prepare(`INSERT INTO participaciones
    (docente_id, curso, tipo_capacitacion, facilitador, periodo, acreditacion)
    VALUES (?, ?, ?, ?, ?, ?)`);

  const stmtAdscripciones = db.prepare(`INSERT INTO adscripciones
    (docente_id, departamento)
    VALUES (?, ?)`);

  // 6. Insertar datos desde Excel
  data.forEach(row => {
    // Insertar en docentes
    stmtDocentes.run(
      row.id,
      row.ap,
      row.am,
      row.nombres,
      row.rfc,
      row.sexo,
      row.puesto,
      row.depto
    );

    // Insertar en participaciones (si existe curso)
    if (row.curso) {
      stmtParticipaciones.run(
        row.id,
        row.curso,
        row.capacitacion,
        row.facilitador,
        row.periodo,
        row.acreditacion ? 1 : 0
      );
    }

    // Insertar en adscripciones
    stmtAdscripciones.run(
      row.id,
      row.depto
    );
  });

  stmtDocentes.finalize();
  stmtParticipaciones.finalize();
  stmtAdscripciones.finalize();

  console.log("Datos importados correctamente desde Excel.");
});

// 7. Cerrar conexión
db.close((err) => {
  if (err) console.error(err.message);
  else console.log("Conexión cerrada.");
});
