import express from 'express';
import cors from 'cors';
import multer from 'multer'; 
import path from 'path';
// fs ya no es necesario aquí si delegamos al controlador

// --- IMPORTACIÓN DE CONTROLADORES ---
import Module1Controller from '../src/database/Module1controller.js';
import Module2Controller from '../src/database/Module2controller.js';
import { getModule3Data, getDepartmentsList, updateAccreditations, generateAttendanceLists } from '../src/database/Module3controller.js';
import { getModule4TableData, getModule4Stats, exportMetricsExcel } from '../src/database/Module4controller.js';
import Module5Controller from '../src/database/Module5controller.js';
import Module6Controller from '../src/database/Module6controller.js';

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
//        RUTAS MÓDULO 2 (CONFIGURACIÓN)
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

app.post('/api/module3/export-lists', async (req, res) => {
  try {
    const result = await generateAttendanceLists(req.body.mode, req.body.courseName);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
//        RUTAS MÓDULO 4 (ESTADÍSTICAS)
// ==========================================
app.post('/api/module4/table', (req, res) => {
  try {
    const data = getModule4TableData(req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CAMBIO: Ahora es POST para recibir filtros
app.post('/api/module4/stats', (req, res) => {
  try {
    const data = getModule4Stats(req.body); // req.body tiene los filtros
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CAMBIO: Ruta de exportación actualizada
app.post('/api/module4/export', async (req, res) => {
  try {
    // Solo necesitamos los filtros para esta exportación
    const result = await exportMetricsExcel(req.body.filters);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
//        RUTAS MÓDULO 5 (CONSTANCIAS)
// ==========================================
app.get('/api/module5/courses', (req, res) => {
  res.json(Module5Controller.getActiveCourses());
});

app.post('/api/module5/update', (req, res) => {
  res.json(Module5Controller.updateCourseDetails(req.body));
});

app.get('/api/module5/templates', (req, res) => {
    res.json(Module5Controller.getTemplates());
});

// CORREGIDO: Delegar la lógica de guardar plantilla al controlador
app.post('/api/module5/upload-template', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No se envió archivo" });
    
    // Llamamos a la función saveTemplate del controlador
    const result = Module5Controller.saveTemplate(req.file.path, req.file.originalname);
    res.json(result);
});

app.post('/api/module5/generate', async (req, res) => {
    const result = await Module5Controller.generateConstancias(
        req.body.courseId, 
        req.body.fechaExpedicion, 
        req.body.plantillaName
    );
    res.json(result);
});

// ==========================================
//        RUTAS MÓDULO 6 (RESPALDO)
// ==========================================
app.get('/api/module6/config', (req, res) => {
  res.json(Module6Controller.getBackupConfig());
});

app.post('/api/module6/export', async (req, res) => {
  try {
    const { path, fileType } = req.body;
    const result = await Module6Controller.exportDatabase(path, fileType);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/module6/import', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({ success: false, message: "No se subió ningún archivo." });
  const result = Module6Controller.importDatabase(req.file.path);
  res.json(result);
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});