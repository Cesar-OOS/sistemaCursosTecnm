const Database = require('better-sqlite3');
const path = require('path');

// Definimos el nombre del archivo de la base de datos
const dbName = 'sistema_escolar.db';

// Por ahora (Desarrollo con Node.js puro), la guardaremos en la raíz del proyecto.
// Cuando pasemos a Electron, cambiaremos esta ruta por app.getPath('userData')
const dbPath = path.join(__dirname, '../../', dbName); 

// Opciones de conexión (verbose imprime las consultas en consola, útil para depurar)
const db = new Database(dbPath, { verbose: console.log });

// Activamos las llaves foráneas (Foreign Keys) para mantener la integridad de los datos
db.pragma('foreign_keys = ON');

module.exports = db;