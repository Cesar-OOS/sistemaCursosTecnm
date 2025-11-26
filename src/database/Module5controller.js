import db from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { exec } from 'child_process'; 

// --- RUTAS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const PLANTILLAS_DIR = path.join(PROJECT_ROOT, 'src', 'plantillas');
const TEMP_WORK_DIR = path.join(PROJECT_ROOT, 'src', 'temp_work'); // Solo para el script .ps1

// Asegurar carpetas internas
if (!fs.existsSync(PLANTILLAS_DIR)) fs.mkdirSync(PLANTILLAS_DIR, { recursive: true });
if (!fs.existsSync(TEMP_WORK_DIR)) fs.mkdirSync(TEMP_WORK_DIR, { recursive: true });

const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ \-_]/g, "").trim();

// --- FUNCIÓN DE CONVERSIÓN (POWERSHELL) ---
const convertToPdf = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const absInput = path.resolve(inputPath);
        const absOutput = path.resolve(outputPath);
        
        // Script temporal
        const scriptPath = path.join(TEMP_WORK_DIR, `convert_${Date.now()}_${Math.floor(Math.random()*1000)}.ps1`);

        const psScriptContent = `
            param([string]$docPath, [string]$pdfPath)
            $ErrorActionPreference = "Stop"
            $word = $null
            try {
                $word = New-Object -ComObject Word.Application
                $word.Visible = $false
                $word.DisplayAlerts = "wdAlertsNone"
                
                if (-not (Test-Path $docPath)) { throw "Archivo no encontrado: $docPath" }

                $doc = $word.Documents.Open($docPath)
                # 17 = wdExportFormatPDF
                $doc.ExportAsFixedFormat($pdfPath, 17, $false, 0, 0, 1, 1, 0, $true, $true, 0, $true, $true, $false)
                $doc.Close($false)
            } catch {
                Write-Error $_.Exception.Message
                exit 1
            } finally {
                if ($word) { 
                    $word.Quit() 
                    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
                }
            }
        `;

        fs.writeFileSync(scriptPath, psScriptContent);

        const command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" "${absInput}" "${absOutput}"`;

        exec(command, (error, stdout, stderr) => {
            // Borrar el script .ps1 (ya no se necesita)
            try { if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath); } catch(e){}

            if (error) {
                console.error(`[Error PDF]: ${stderr || stdout}`);
                reject(error);
            } else {
                if (fs.existsSync(absOutput)) resolve(true);
                else reject(new Error("Word no reportó error, pero el PDF no se creó."));
            }
        });
    });
};

export const Module5Controller = {

    // 1. OBTENER CURSOS
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

    // 2. ACTUALIZAR CURSO
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

    // 3. LISTAR PLANTILLAS
    getTemplates: () => {
        try {
            const files = fs.readdirSync(PLANTILLAS_DIR).filter(file => file.endsWith('.docx'));
            return { success: true, data: files };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // 4. GUARDAR PLANTILLA
    saveTemplate: (tempPath, originalName) => {
        try {
            const targetPath = path.join(PLANTILLAS_DIR, originalName);
            fs.copyFileSync(tempPath, targetPath);
            fs.unlinkSync(tempPath);
            return { success: true, message: "Plantilla guardada correctamente." };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // 5. GENERAR CONSTANCIAS (ORGANIZADAS)
    generateConstancias: async (courseId, fechaExpedicion, plantillaName) => {
        try {
            // A. VALIDACIONES
            if (!plantillaName) throw new Error("No se seleccionó ninguna plantilla.");
            const plantillaPath = path.join(PLANTILLAS_DIR, plantillaName);
            if (!fs.existsSync(plantillaPath)) throw new Error(`Plantilla no encontrada: ${plantillaName}`);

            // B. DATOS
            const curso = db.prepare("SELECT * FROM cursos WHERE clave_curso = ?").get(courseId);
            if (!curso) throw new Error("Curso no encontrado");
            const sistema = db.prepare("SELECT * FROM sistema WHERE id=1").get();
            
            const docentes = db.prepare(`
                SELECT d.nombre_completo, cap.fecha_realizacion
                FROM capacitaciones cap
                JOIN docentes d ON cap.docente_id = d.id_docente
                WHERE cap.curso_id = ? AND cap.acreditado = 'True'
            `).all(courseId);

            if (docentes.length === 0) return { success: false, message: "No hay docentes acreditados." };

            // C. CARPETAS BASE
            const documentsPath = path.join(os.homedir(), 'Documents');
            const anioDir = sistema.anio.toString();
            const periodoDir = sistema.periodo.replace(/[^a-zA-Z0-9 -]/g, "").trim();
            const baseExportDir = path.join(documentsPath, 'sistemaCursosITZ', 'Archivos_Exportados', anioDir, periodoDir, 'Constancias');
            
            if (!fs.existsSync(baseExportDir)) fs.mkdirSync(baseExportDir, { recursive: true });

            // --- C.1 CREAR CARPETA DEL CURSO ---
            const safeCourseId = courseId.replace(/[^a-zA-Z0-9 -]/g, "_");
            let counter = 1;
            let folderName = `Constancias_${String(counter).padStart(2,'0')} ${safeCourseId}`;
            
            while (fs.existsSync(path.join(baseExportDir, folderName))) {
                counter++;
                folderName = `Constancias_${String(counter).padStart(2,'0')} ${safeCourseId}`;
            }
            
            const courseFolder = path.join(baseExportDir, folderName);
            fs.mkdirSync(courseFolder, { recursive: true });

            // --- C.2 CREAR SUBCARPETAS (word, pdf) ---
            const wordFolder = path.join(courseFolder, 'word');
            const pdfFolder = path.join(courseFolder, 'pdf');
            fs.mkdirSync(wordFolder, { recursive: true });
            fs.mkdirSync(pdfFolder, { recursive: true });

            console.log(`---> Generando en: ${courseFolder}`);

            // D. PROCESAMIENTO
            const content = fs.readFileSync(plantillaPath, 'binary');
            let errors = [];

            for (const doc of docentes) {
                const zip = new PizZip(content);
                const docx = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

                const nombreCompleto = doc.nombre_completo.trim().toUpperCase();

                // 1. RELLENAR
                docx.render({
                    nombreProfesor: nombreCompleto,
                    nombreCurso: curso.nombre.toUpperCase(),
                    fechaCurso: (doc.fecha_realizacion || "FECHAS POR DEFINIR").toUpperCase(),
                    anioCurso: sistema.anio, 
                    horasCurso: `${curso.horas} HORAS`,
                    codigoCurso: curso.clave_curso,
                    directorTec: (sistema.director_nombre || "DIRECTOR").toUpperCase(),
                    fechaExpedicion: fechaExpedicion.toUpperCase()
                });

                // 2. PREPARAR NOMBRES
                const nameParts = nombreCompleto.split(' ');
                const shortName = nameParts.slice(0, 2).join('_'); 
                const baseFileName = `Constancia_${sanitizeName(shortName)}`;

                const finalDocxPath = path.join(wordFolder, `${baseFileName}.docx`);
                const finalPdfPath = path.join(pdfFolder, `${baseFileName}.pdf`);

                // 3. GUARDAR DOCX FINAL (Directamente en la carpeta 'word')
                const buf = docx.getZip().generate({ type: 'nodebuffer' });
                fs.writeFileSync(finalDocxPath, buf);

                // 4. CONVERTIR A PDF (Desde la carpeta 'word' a la carpeta 'pdf')
                try {
                    await convertToPdf(finalDocxPath, finalPdfPath);
                } catch (convError) {
                    console.error(`!!! Falló PDF para ${nombreCompleto}`);
                    errors.push(nombreCompleto);
                }
            }

            if (errors.length > 0) {
                return { success: true, message: `Proceso terminado con ${errors.length} errores de conversión (Word generados).` };
            }

            return { success: true, message: `Carpeta generada: ${folderName}` };

        } catch (error) {
            // Errores de plantilla
            if (error.properties && error.properties.errors) {
                const errorMessages = error.properties.errors.map(e => e.message).join('\n');
                return { success: false, error: "Plantilla corrupta: " + errorMessages };
            }
            console.error("Error generando constancias:", error);
            return { success: false, error: "Error crítico: " + error.message };
        }
    }
};

export default Module5Controller;