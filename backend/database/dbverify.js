import sqlite3 from "sqlite3";

const DB_FILE = "./database.db";
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error("Error al conectar:", err.message);
  console.log("Conectado a la base de datos SQLite.");
});

// Mostrar todas las tablas
db.all(`SELECT name FROM sqlite_master WHERE type='table';`, (err, tables) => {
  if (err) {
    console.error("Error al listar tablas:", err.message);
  } else {
    console.log("Tablas en la base de datos:");
    tables.forEach(t => console.log(" -", t.name));

    // Si existe la tabla teachers, mostrar los primeros 5 registros
    const tableNames = tables.map(t => t.name);
    if (tableNames.includes("teachers")) {
      db.all(`SELECT * FROM teachers LIMIT 5;`, (err, rows) => {
        if (err) console.error("Error al leer teachers:", err.message);
        else {
          console.log("\nPrimeros 5 registros de teachers:");
          console.table(rows);
        }
        db.close();
      });
    } else {
      console.log("\nLa tabla 'teachers' no existe en esta base de datos.");
      db.close();
    }
  }
});
