import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);

// Crear tablas si no existen
db.prepare(`
CREATE TABLE IF NOT EXISTS docentes (
  id TEXT PRIMARY KEY,
  ap TEXT,
  am TEXT,
  nombres TEXT,
  rfc TEXT,
  sexo TEXT,
  puesto TEXT,
  depto_adscrito TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS participaciones (
  participacion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  docente_id TEXT,
  curso TEXT,
  tipo_capacitacion TEXT,
  facilitador TEXT,
  periodo TEXT,
  acreditacion INTEGER,
  FOREIGN KEY(docente_id) REFERENCES docentes(id)
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS adscripciones (
  docente_id TEXT,
  departamento TEXT,
  FOREIGN KEY(docente_id) REFERENCES docentes(id)
)
`).run();

console.log("🟢 Tablas listas en la base de datos");

export default db;
