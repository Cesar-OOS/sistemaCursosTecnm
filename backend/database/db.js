import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);

// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ap TEXT,
    am TEXT,
    nombres TEXT,
    rfc TEXT,
    sexo TEXT,
    departamento_id TEXT,
    puesto TEXT,
    curso TEXT,
    capacitacion TEXT,
    facilitador TEXT,
    periodo TEXT,
    acreditacion INTEGER
  )
`).run();

console.log("🟢 Tabla 'docentes' lista en la base de datos");

export default db;
