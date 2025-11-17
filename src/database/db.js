import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url'; // Necesario para __dirname

// --- Recrear __dirname en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ---

const dbName = 'sistema_cursos.db';
const dbPath = path.join(__dirname, '../../', dbName); 

const db = new Database(dbPath, { verbose: console.log });
db.pragma('foreign_keys = ON');

console.log(`Base de datos conectada en: ${dbPath}`);

// --- CAMBIO: Usar 'export default' ---
export default db;