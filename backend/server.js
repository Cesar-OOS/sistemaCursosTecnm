import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa tus funciones de base de datos
// La ruta sube de 'backend' y baja a 'src/database'
import { getModule3Data, getDepartmentsList, updateAccreditations } from '../src/database/Module3controller.js';

// --- Configuración del Servidor ---
const app = express();
const PORT = 4000; // Usaremos un puerto diferente al de React (que usa ~5173)

// --- Middlewares ---
app.use(cors()); // Permite que React (en otro puerto) haga peticiones
app.use(express.json()); // Permite al servidor entender el JSON que envía React

// --- RUTAS (Endpoints) ---

// 1. Ruta para obtener los datos de la tabla del Módulo 3
app.get('/api/module3/data', (req, res) => {
  try {
    const data = getModule3Data();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Ruta para obtener la lista de departamentos
app.get('/api/module3/departments', (req, res) => {
  try {
    const data = getDepartmentsList();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Ruta para guardar los cambios de acreditación
app.post('/api/module3/save', (req, res) => {
  try {
    // req.body contiene el array 'teachers' que envió React
    const result = updateAccreditations(req.body); 
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend escuchando en http://localhost:${PORT}`);
});