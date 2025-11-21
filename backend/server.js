import express from 'express';
import cors from 'cors';
import multer from 'multer'; 
import path from 'path';

// --- IMPORTACIÓN DE CONTROLADORES ---
import Module1Controller from '../src/database/Module1controller.js';
import Module2Controller from '../src/database/Module2controller.js';
import { getModule3Data, getDepartmentsList, updateAccreditations } from '../src/database/Module3controller.js';
// NUEVO: Importar controlador del Módulo 4
import { getModule4TableData, getModule4Stats, exportData } from '../src/database/Module4controller.js';

// --- CONFIGURACIÓN DEL SERVIDOR ---
const app = express();
const PORT = 4000;
const upload = multer({ dest: 'uploads/' }); 

app.use(cors());
app.use(express.json());

// ==========================================
//           RUTAS MÓDULO 1 (IMPORTACIÓN)
// ==========================================
app.post('/api/module1/catalogo', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({error: "Falta archivo"});
  res.json(Module1Controller.importarCatalogoCursos(req.file.path));
});

app.post('/api/module1/adscritos', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({error: "Falta archivo"});
  res.json(Module1Controller.importarDocentesAdscritos(req.file.path));
});

app.post('/api/module1/preregistro', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({error: "Falta archivo"});
  res.json(Module1Controller.importarPreRegistro(req.file.path));
});

app.post('/api/module1/resultados', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({error: "Falta archivo"});
  res.json(Module1Controller.importarResultados(req.file.path));
});

// ==========================================
//           RUTAS MÓDULO 2 (CONFIGURACIÓN)
// ==========================================
app.get('/api/module2/settings', (req, res) => {
  res.json(Module2Controller.getSettings());
});

app.post('/api/module2/settings', (req, res) => {
  res.json(Module2Controller.saveSettings(req.body));
});

// ==========================================
//           RUTAS MÓDULO 3 (GESTIÓN)
// ==========================================
app.get('/api/module3/data', (req, res) => {
  res.json(getModule3Data());
});

app.get('/api/module3/departments', (req, res) => {
  res.json(getDepartmentsList());
});

app.post('/api/module3/update-accreditations', (req, res) => {
  res.json(updateAccreditations(req.body));
});

// ==========================================
//           RUTAS MÓDULO 4 (ESTADÍSTICAS) - NUEVO
// ==========================================

// Ruta para obtener la tabla filtrada
app.post('/api/module4/table', (req, res) => {
  try {
    const data = getModule4TableData(req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Ruta para las Estadísticas (Globales) - ESTA ES LA QUE FALTABA
app.get('/api/module4/stats', (req, res) => {
  try {
    const data = getModule4Stats(); // Sin filtros, trae totales globales
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// NUEVA RUTA: EXPORTAR
app.post('/api/module4/export', async (req, res) => {
  try {
    // Esperamos { format: 'excel'|'pdf', filters: {...} }
    const result = await exportData(req.body.format, req.body.filters);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});