import db from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import puppeteer from 'puppeteer';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// --- DEFINICIÓN DE RUTAS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Subimos 2 niveles desde 'src/database' para llegar a la RAÍZ 'sistemaCursosTecnm'
const PROJECT_ROOT = path.resolve(__dirname, '../../');

const PATH_PLANTILLA = path.join(PROJECT_ROOT, 'plantilla.html'); 
const PATH_RECURSOS = path.join(PROJECT_ROOT, 'recursos');        

// Función para limpiar nombres de archivo
const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g, "");

// Función auxiliar para convertir imagen a Base64
function getImageAsBase64(filename) {
  const filePath = path.join(PATH_RECURSOS, filename);
  if (fs.existsSync(filePath)) {
    const bitmap = fs.readFileSync(filePath);
    // Detectar extensión para el mime type correcto
    const ext = path.extname(filePath).substring(1).toLowerCase(); 
    const mimeType = ext === 'jpg' ? 'jpeg' : ext; 
    return `data:image/${mimeType};base64,${bitmap.toString('base64')}`;
  }
  return null;
}

export const Module5Controller = {

  // 1. OBTENER CURSOS ACTIVOS
  getActiveCourses: () => {
    try {
      const sql = `
        SELECT DISTINCT c.clave_curso, c.nombre, c.horas, c.facilitador, c.competencias_desarrolladas
        FROM cursos c
        JOIN capacitaciones cap ON c.clave_curso = cap.curso_id
        ORDER BY c.nombre ASC
      `;
      return { success: true, data: db.prepare(sql).all() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 2. ACTUALIZAR DATOS DEL CURSO
  updateCourseDetails: (data) => {
    try {
      const { clave_curso, horas, facilitador, competencias } = data;
      const update = db.prepare(`UPDATE cursos SET horas = ?, facilitador = ?, competencias_desarrolladas = ? WHERE clave_curso = ?`);
      update.run(horas, facilitador, competencias, clave_curso);
      return { success: true, message: "Curso actualizado." };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 3. GENERAR CONSTANCIAS
  generateConstancias: async (courseId, fechaExpedicion) => {
    let browser = null;
    try {
      // --- A. VALIDACIONES ---
      if (!fs.existsSync(PATH_PLANTILLA)) throw new Error(`No se encuentra la plantilla en: ${PATH_PLANTILLA}`);
      if (!fs.existsSync(PATH_RECURSOS)) throw new Error(`No se encuentra la carpeta de recursos en: ${PATH_RECURSOS}`);

      // --- B. DATOS BD ---
      const curso = db.prepare("SELECT * FROM cursos WHERE clave_curso = ?").get(courseId);
      if (!curso) throw new Error("Curso no encontrado");

      const sistema = db.prepare("SELECT * FROM sistema WHERE id=1").get();
      
      const docentes = db.prepare(`
        SELECT d.nombres, d.ap, d.am, cap.fecha_realizacion, cap.docente_id
        FROM capacitaciones cap
        JOIN docentes d ON cap.docente_id = d.id_docente
        WHERE cap.curso_id = ? AND cap.acreditado = 'True'
      `).all(courseId);

      if (docentes.length === 0) return { success: false, message: "No hay docentes acreditados en este curso." };

      // --- C. CARPETA DE SALIDA ---
      const documentsPath = path.join(os.homedir(), 'Documents');
      const anioDir = sistema.anio.toString();
      const periodoDir = sistema.periodo.replace(/[^a-zA-Z0-9 -]/g, "").trim();
      
      const outputFolder = path.join(documentsPath, 'sistemaCursosITZ', 'Archivos_Exportados', anioDir, periodoDir, 'Constancias');
      if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

      const safeCourseId = courseId.replace(/[^a-zA-Z0-9 -]/g, "_");
      let counter = 1;
      let counterStr = String(counter).padStart(2, '0');
      let zipName = `Constancias${counterStr} ${safeCourseId}.zip`;
      
      while (fs.existsSync(path.join(outputFolder, zipName))) {
        counter++;
        counterStr = String(counter).padStart(2, '0');
        zipName = `Constancias${counterStr} ${safeCourseId}.zip`;
      }
      const zipPath = path.join(outputFolder, zipName);

      // --- D. INYECTAR IMÁGENES (SOLUCIÓN DEFINITIVA) ---
      let htmlBase = fs.readFileSync(PATH_PLANTILLA, 'utf8');

      // 1. Leemos TODOS los archivos que hay en la carpeta 'recursos'
      const resourceFiles = fs.readdirSync(PATH_RECURSOS);

      // 2. Iteramos sobre cada archivo y lo reemplazamos en el HTML
      resourceFiles.forEach(file => {
        const b64 = getImageAsBase64(file);
        if (b64) {
          // Reemplazamos todas las ocurrencias de "recursos/nombrearchivo.ext"
          // Usamos una expresión regular global para asegurar que reemplace todo
          const regex = new RegExp(`recursos/${file}`, 'g');
          htmlBase = htmlBase.replace(regex, b64);
        }
      });

      // --- E. INICIAR PUPPETEER ---
      browser = await puppeteer.launch({ headless: true });
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      const streamFinished = new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
      });

      archive.pipe(output);

      // --- F. GENERAR PDFs ---
      for (const doc of docentes) {
        const nombreCompleto = `${doc.nombres} ${doc.ap} ${doc.am}`.trim().toUpperCase();
        
        let currentHtml = htmlBase
          .replace(/{nombreDocente}/g, nombreCompleto)
          .replace(/{nombreCurso}/g, curso.nombre)
          .replace(/{fechaCurso}/g, doc.fecha_realizacion || "Fecha no registrada")
          .replace(/{horasCurso}/g, `${curso.horas} horas`)
          .replace(/{codigoCurso}/g, curso.clave_curso)
          .replace(/{nombreDirector}/g, sistema.director_nombre || "Director")
          .replace(/{fecha}/g, fechaExpedicion);

        const page = await browser.newPage();
        // Ya no hace falta networkidle0 porque las imágenes son texto base64 instantáneo
        await page.setContent(currentHtml);

        const pdfUint8Array = await page.pdf({
          format: 'Letter',
          printBackground: true, 
          margin: 0
        });
        
        const pdfBuffer = Buffer.from(pdfUint8Array);
        const safePdfName = `Constancia_${sanitizeName(doc.nombres).split(' ')[0]}_${sanitizeName(doc.ap)}.pdf`;
        
        archive.append(pdfBuffer, { name: safePdfName });
        await page.close();
      }

      // --- G. FINALIZAR ---
      await archive.finalize();
      await browser.close();
      await streamFinished;

      return { success: true, message: `Generado exitosamente: ${zipName}` };

    } catch (error) {
      if (browser) await browser.close();
      console.error("Error generando constancias:", error);
      return { success: false, error: error.message };
    }
  }
};

export default Module5Controller;