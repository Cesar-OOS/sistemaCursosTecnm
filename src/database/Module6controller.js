import db from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import archiver from 'archiver';
import AdmZip from 'adm-zip';

// --- CONFIGURACIÓN DE RUTAS POR DEFECTO ---
const getBackupConfig = () => {
  try {
    const sys = db.prepare("SELECT anio, periodo FROM sistema WHERE id=1").get();
    const anio = sys ? sys.anio : new Date().getFullYear();
    const periodo = sys ? sys.periodo.replace(/[^a-zA-Z0-9 -]/g, "").trim() : "General";
    
    const defaultPath = path.join(os.homedir(), 'Documents', 'sistemaCursosITZ', 'Archivos_Exportados', String(anio), periodo, 'Respaldo');
    
    if (!fs.existsSync(defaultPath)) {
      fs.mkdirSync(defaultPath, { recursive: true });
    }

    return { success: true, defaultPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const Module6Controller = {
  getBackupConfig,

  // --- 1. EXPORTAR BASE DE DATOS (BACKUP) ---
  exportDatabase: async (targetFolder, fileType) => {
    try {
      // A. Consultar TODA la información
      const fullData = {
        sistema: db.prepare('SELECT * FROM sistema').all(),
        departamentos: db.prepare('SELECT * FROM departamentos').all(),
        cursos: db.prepare('SELECT * FROM cursos').all(),
        docentes: db.prepare('SELECT * FROM docentes').all(),
        capacitaciones: db.prepare('SELECT * FROM capacitaciones').all()
      };

      const jsonData = JSON.stringify(fullData, null, 2);

      // B. Definir nombre del archivo INCREMENTAL
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '_'); // 2025_11_21
      const ext = fileType === '.rar' ? '.rar' : '.zip';
      
      let counter = 1;
      let counterStr = String(counter).padStart(3, '0');
      let fileName = `Respaldo_BD_${date}_${counterStr}${ext}`;
      
      // Verificar si existe e incrementar
      while (fs.existsSync(path.join(targetFolder, fileName))) {
        counter++;
        counterStr = String(counter).padStart(3, '0');
        fileName = `Respaldo_BD_${date}_${counterStr}${ext}`;
      }

      const filePath = path.join(targetFolder, fileName);

      // C. Crear el archivo ZIP
      const output = fs.createWriteStream(filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          resolve({ success: true, message: `Respaldo creado: ${fileName}` });
        });

        archive.on('error', (err) => {
          reject({ success: false, message: err.message });
        });

        archive.pipe(output);
        archive.append(jsonData, { name: 'data.json' });
        archive.finalize();
      });

    } catch (error) {
      console.error("Error exportando BD:", error);
      return { success: false, message: error.message };
    }
  },

  // --- 2. IMPORTAR BASE DE DATOS (RESTORE) ---
  importDatabase: (zipFilePath) => {
    try {
      const zip = new AdmZip(zipFilePath);
      const zipEntries = zip.getEntries();
      const dataEntry = zipEntries.find(entry => entry.entryName === 'data.json');
      
      if (!dataEntry) {
        return { success: false, message: "ZIP inválido (falta data.json)." };
      }

      const dataContent = dataEntry.getData().toString('utf8');
      const data = JSON.parse(dataContent);

      let stats = { deptos: 0, cursos: 0, docentes: 0, caps: 0, sistema: 0 };

      const transaction = db.transaction(() => {
        
        // 1. Departamentos
        const insertDepto = db.prepare("INSERT OR IGNORE INTO departamentos (clave_depto, nombre) VALUES (@clave_depto, @nombre)");
        if (data.departamentos) {
          for (const row of data.departamentos) {
            const info = insertDepto.run(row);
            if (info.changes > 0) stats.deptos++;
          }
        }

        // 2. Cursos
        const insertCurso = db.prepare(`
          INSERT OR IGNORE INTO cursos (clave_curso, nombre, tipo, horas, competencias_desarrolladas, facilitador, periodo, anio_registro) 
          VALUES (@clave_curso, @nombre, @tipo, @horas, @competencias_desarrolladas, @facilitador, @periodo, @anio_registro)
        `);
        if (data.cursos) {
          for (const row of data.cursos) {
            const info = insertCurso.run(row);
            if (info.changes > 0) stats.cursos++;
          }
        }

        // 3. Docentes (ACTUALIZADO: usa 'nombre_completo')
        const insertDocente = db.prepare(`
          INSERT OR IGNORE INTO docentes (id_docente, rfc, nombre_completo, sexo, departamento_id, puesto) 
          VALUES (@id_docente, @rfc, @nombre_completo, @sexo, @departamento_id, @puesto)
        `);
        if (data.docentes) {
          for (const row of data.docentes) {
            const info = insertDocente.run(row);
            if (info.changes > 0) stats.docentes++;
          }
        }

        // 4. Capacitaciones (ACTUALIZADO: usa 'fecha_realizacion' y 'horario')
        const insertCap = db.prepare(`
          INSERT OR IGNORE INTO capacitaciones (docente_id, curso_id, calificacion, acreditado, fecha_realizacion, necesidad_detectada, horario) 
          VALUES (@docente_id, @curso_id, @calificacion, @acreditado, @fecha_realizacion, @necesidad_detectada, @horario)
        `);
        if (data.capacitaciones) {
          for (const row of data.capacitaciones) {
            // Aseguramos que el objeto row tenga los campos nuevos, si vienen undefined se pasan como null
            const info = insertCap.run({
              docente_id: row.docente_id,
              curso_id: row.curso_id,
              calificacion: row.calificacion,
              acreditado: row.acreditado,
              fecha_realizacion: row.fecha_realizacion, // Nuevo nombre
              necesidad_detectada: row.necesidad_detectada,
              horario: row.horario // Nuevo campo
            });
            if (info.changes > 0) stats.caps++;
          }
        }

        // 5. Sistema (ACTUALIZACIÓN CRÍTICA)
        const updateSistema = db.prepare(`
          UPDATE sistema SET 
            anio = @anio, 
            periodo = @periodo, 
            departamento_nombre = @departamento_nombre, 
            total_docentes = @total_docentes, 
            director_nombre = @director_nombre, 
            jefa_nombre = @jefa_nombre, 
            coordinador_nombre = @coordinador_nombre
          WHERE id = 1
        `);
        
        if (data.sistema && data.sistema.length > 0) {
          const sysData = data.sistema[0];
          updateSistema.run({
            anio: sysData.anio,
            periodo: sysData.periodo,
            departamento_nombre: sysData.departamento_nombre,
            total_docentes: sysData.total_docentes,
            director_nombre: sysData.director_nombre,
            jefa_nombre: sysData.jefa_nombre,
            coordinador_nombre: sysData.coordinador_nombre
          });
          stats.sistema = 1;
        }
      });

      transaction();

      return { 
        success: true, 
        message: `Restauración completada.\nConfiguración actualizada: ${stats.sistema === 1 ? 'SÍ' : 'NO'}\nNuevos registros agregados:\n- Cursos: ${stats.cursos}\n- Docentes: ${stats.docentes}\n- Capacitaciones: ${stats.caps}` 
      };

    } catch (error) {
      console.error("Error importando BD:", error);
      return { success: false, message: "Error al importar: " + error.message };
    }
  }
};

export default Module6Controller;