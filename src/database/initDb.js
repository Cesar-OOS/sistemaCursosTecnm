import db from './db.js';

function initDatabase() {
  console.log('--- Inicializando Base de Datos (Estructura Corregida) ---');

  // 1. SISTEMA
  db.exec(`
    CREATE TABLE IF NOT EXISTS sistema (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      anio INTEGER DEFAULT 2025,
      periodo TEXT DEFAULT 'Enero - Junio',
      departamento_nombre TEXT,
      total_docentes INTEGER DEFAULT 0,
      director_nombre TEXT,
      jefa_nombre TEXT,
      coordinador_nombre TEXT
    );
    INSERT OR IGNORE INTO sistema (id, anio) VALUES (1, 2025);
  `);

  // 2. DEPARTAMENTOS
  db.exec(`
    CREATE TABLE IF NOT EXISTS departamentos (
      clave_depto TEXT PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE
    );
  `);
  
  const deptoInsert = db.prepare("INSERT OR IGNORE INTO departamentos (clave_depto, nombre) VALUES (?, ?)");
  ['CIENCIAS BÁSICAS', 'SISTEMAS Y COMPUTACIÓN', 'CIENCIAS DE LA TIERRA', 'INGENIERÍA INDUSTRIAL', 'POSGRADO', 'CIENCIAS ECONÓMICO ADMINISTRATIVO', 'METAL MECÁNICA', 'QUÍMICA Y BIOQUÍMICA'].forEach((d, i) => {
    deptoInsert.run(`DP${String(i+1).padStart(2,'0')}`, d);
  });
  deptoInsert.run('DP_GEN', 'SIN ADSCRIPCIÓN');

  // 3. DOCENTES
  db.exec(`
    CREATE TABLE IF NOT EXISTS docentes (
      id_docente TEXT PRIMARY KEY,
      rfc TEXT UNIQUE NOT NULL,
      nombre_completo TEXT NOT NULL,
      sexo TEXT,
      departamento_id TEXT DEFAULT 'DP_GEN',
      puesto TEXT DEFAULT 'Base',
      FOREIGN KEY (departamento_id) REFERENCES departamentos(clave_depto)
    );
  `);

  // 4. CURSOS
  // 'periodo' ahora guardará "Enero - Junio" o "Agosto - Diciembre"
  db.exec(`
    CREATE TABLE IF NOT EXISTS cursos (
      clave_curso TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('AP', 'FD')) DEFAULT 'AP',
      horas INTEGER DEFAULT 30,
      competencias_desarrolladas TEXT,
      facilitador TEXT,
      periodo TEXT, 
      anio_registro INTEGER
    );
  `);

  // 5. CAPACITACIONES
  // CAMBIO: 'periodo_realizacion' ahora es 'fecha_realizacion' (Ej: "Del 15 al 20...")
  db.exec(`
    CREATE TABLE IF NOT EXISTS capacitaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      docente_id TEXT NOT NULL,
      curso_id TEXT NOT NULL,
      calificacion REAL DEFAULT 0, 
      acreditado TEXT DEFAULT 'False' CHECK(acreditado IN ('True', 'False')),
      fecha_realizacion TEXT, 
      necesidad_detectada TEXT,
      horario TEXT,
      FOREIGN KEY (docente_id) REFERENCES docentes(id_docente),
      FOREIGN KEY (curso_id) REFERENCES cursos(clave_curso),
      UNIQUE(docente_id, curso_id)
    );
  `);

  console.log('--- Base de Datos Lista (Estructura de Fechas Corregida) ---');
}

initDatabase();

export default initDatabase;