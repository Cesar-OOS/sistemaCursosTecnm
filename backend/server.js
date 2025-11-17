import express from "express";
import cors from "cors";
import multer from "multer";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const app = express();

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Aumenta límite
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ======================
// Paths
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const dbDir = path.join(__dirname, "database");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
const dbPath = path.join(dbDir, "database.db");

// ======================
// Base de datos SQLite
// ======================
const db = new Database(dbPath);
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

// ======================
// Multer para subir archivos
// ======================
const upload = multer({ dest: uploadDir });

// ======================
// Endpoint: subir Excel y guardar en DB
// ======================
app.post("/api/upload-to-db", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.worksheets[0];

    const rows = [];
    let headers = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = row.values.slice(1);
      if (rowNumber === 1) {
        headers = values.map(v => v?.toString().trim());
      } else {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] ?? null;
        });
        rows.push(obj);
      }
    });

    const mappedRows = rows.map(r => ({
      ap: r.ap || r.ApellidoPaterno || "",
      am: r.am || r.ApellidoMaterno || "",
      nombres: r.nombres || r.Nombres || "",
      rfc: r.rfc || r.RFC || "",
      sexo: r.sexo || r.Sexo || "",
      departamento_id: r.departamento_id || r.Depto || "",
      puesto: r.puesto || r.Puesto || "",
      curso: r.curso || r.Curso || "",
      capacitacion: r.capacitacion || r.Capacitacion || "",
      facilitador: r.facilitador || r.Facilitador || "",
      periodo: r.periodo || r.Periodo || "",
      acreditacion: r.acreditacion ? 1 : 0
    }));

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO docentes 
      (ap, am, nombres, rfc, sexo, departamento_id, puesto, curso, capacitacion, facilitador, periodo, acreditacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction(data => {
      for (const r of data) {
        insertStmt.run(
          r.ap, r.am, r.nombres, r.rfc, r.sexo,
          r.departamento_id, r.puesto, r.curso, r.capacitacion,
          r.facilitador, r.periodo, r.acreditacion
        );
      }
    });

    insertMany(mappedRows);
    fs.unlinkSync(req.file.path);

    res.json({ totalFilas: mappedRows.length, message: "✅ Datos importados correctamente" });
  } catch (error) {
    console.error("Error al procesar Excel:", error);
    res.status(500).json({ error: "Error al procesar el archivo" });
  }
});

// ======================
// Endpoint: obtener docentes
// ======================
app.get("/api/module3/data", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM docentes").all();
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener docentes:", error);
    res.status(500).json({ error: "Error al obtener docentes" });
  }
});

// ======================
// Endpoint: departamentos únicos
// ======================
app.get("/api/module3/departments", (req, res) => {
  try {
    const rows = db.prepare("SELECT DISTINCT departamento_id FROM docentes").all();
    const departamentos = rows.map(r => r.departamento_id).filter(Boolean);
    res.json(departamentos);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({ error: "Error al obtener departamentos" });
  }
});

// ======================
// Endpoint: guardar acreditación
// ======================
app.post("/api/module3/save", (req, res) => {
  try {
    const teachers = req.body;
    if (!Array.isArray(teachers)) return res.status(400).json({ success: false, message: "Datos inválidos" });

    const updateStmt = db.prepare(`UPDATE docentes SET acreditacion = ? WHERE id = ?`);
    const transaction = db.transaction(data => {
      for (const t of data) {
        updateStmt.run(t.acreditacion ? 1 : 0, t.id);
      }
    });

    transaction(teachers);
    res.json({ success: true, message: "Cambios de acreditación guardados correctamente" });
  } catch (error) {
    console.error("Error al guardar acreditación:", error);
    res.status(500).json({ success: false, message: "Error al guardar los cambios" });
  }
});

// ======================
// Iniciar servidor
// ======================
const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
