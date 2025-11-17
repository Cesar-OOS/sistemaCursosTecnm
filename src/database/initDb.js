import db from './db.js';

// La función initDatabase() que crea las tablas no cambia
function initDatabase() {
  console.log('--- Inicializando Base de Datos ---');
  // 1. Departamentos
  db.exec(`
    CREATE TABLE IF NOT EXISTS departamentos (
      clave_depto TEXT PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE
    );
  `);
  // 2. Docentes
  db.exec(`
    CREATE TABLE IF NOT EXISTS docentes (
      id_docente TEXT PRIMARY KEY,
      ap TEXT NOT NULL, am TEXT, nombres TEXT NOT NULL,
      rfc TEXT UNIQUE NOT NULL, sexo TEXT CHECK(sexo IN ('F', 'M')),
      departamento_id TEXT, puesto TEXT,
      FOREIGN KEY (departamento_id) REFERENCES departamentos(clave_depto)
    );
  `);
  // 3. Cursos
  db.exec(`
    CREATE TABLE IF NOT EXISTS cursos (
      clave_curso TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      horas INTEGER,
      competencias_desarrolladas TEXT
    );
  `);
  // 4. Capacitaciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS capacitaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      docente_id TEXT NOT NULL,
      curso_id TEXT NOT NULL,
      tipo_capacitacion TEXT, facilitador TEXT, periodo TEXT,
      acreditado TEXT DEFAULT 'False' CHECK(acreditado IN ('True', 'False')),
      FOREIGN KEY (docente_id) REFERENCES docentes(id_docente) ON DELETE CASCADE,
      FOREIGN KEY (curso_id) REFERENCES cursos(clave_curso) ON DELETE CASCADE
    );
  `);
  // 5. Sistema
  db.exec(`
    CREATE TABLE IF NOT EXISTS sistema (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      anio INTEGER NOT NULL, periodo TEXT NOT NULL,
      departamento_actual_id TEXT,
      total_docentes INTEGER DEFAULT 0,
      director_nombre TEXT,
      jefa_dev_academico_nombre TEXT,
      coordinador_nombre TEXT,
      FOREIGN KEY (departamento_actual_id) REFERENCES departamentos(clave_depto)
    );
  `);
  console.log('--- Tablas verificadas/creadas correctamente ---');
  seedData();
}

// --- FUNCIÓN SEEDDATA (MODIFICADA) ---
function seedData() {
  console.log('Iniciando inserción de datos (seed)...');

  // --- PASO 2: Insertar Departamentos ---
  console.log('Insertando nuevos departamentos...');
  const insertDepto = db.prepare('INSERT INTO departamentos (clave_depto, nombre) VALUES (?, ?)');
  const departamentos = [
    { id: 'DP01', nombre: 'Ciencias Básicas' },
    { id: 'DP02', nombre: 'Ciencias Económico Administrativas' },
    { id: 'DP03', nombre: 'Ciencias de la Tierra' },
    { id: 'DP04', nombre: 'Ingeniería Industrial' },
    { id: 'DP05', nombre: 'Metal Mecánica' },
    { id: 'DP06', nombre: 'Química y Bioquímica' },
    { id: 'DP07', nombre: 'Sistemas Computacionales' },
    { id: 'DP08', nombre: 'Posgrado' }
  ];
  const insertManyDeptos = db.transaction((deptos) => {
    for (const depto of deptos) insertDepto.run(depto.id, depto.nombre);
  });
  insertManyDeptos(departamentos);
  console.log(`-> ${departamentos.length} departamentos insertados.`);

  // --- PASO 3: Insertar Cursos ---
  console.log('Insertando nuevos cursos...');
  const insertCurso = db.prepare('INSERT INTO cursos (clave_curso, nombre, horas, competencias_desarrolladas) VALUES (?, ?, ?, ?)');
  const cursos = [
    { clave: 'TNM_125_31_2025_AP', nombre: 'Inglés Básico', horas: 40, comps: 'Comunicación en lengua extranjera, comprensión auditiva y lectora.' },
    { clave: 'TNM_125_32_2025_AP', nombre: 'Gestión Ágil de Proyectos de Software', horas: 30, comps: 'Metodologías ágiles (Scrum, Kanban), gestión de equipos.' },
    { clave: 'TNM_125_33_2025_AP', nombre: 'Taller de Sueldos y Salarios', horas: 25, comps: 'Cálculo de nómina, ISR, prestaciones, Ley Federal del Trabajo.' },
    { clave: 'TNM_125_34_2025_FD', nombre: 'Enseñanza basada en modalidad SCRUM', horas: 30, comps: 'SCRUM aplicado a la educación, gestión de proyectos de aula.' },
    { clave: 'TNM_125_35_2025_AP', nombre: 'Habilidades de Liderazgo y Coaching Docente', horas: 20, comps: 'Liderazgo situacional, retroalimentación efectiva.' },
    { clave: 'TNM_125_36_2025_FD', nombre: 'Taller de Redacción de Artículos Científicos', horas: 35, comps: 'Metodología de investigación, redacción científica (APA/IEEE).' },
    { clave: 'TNM_125_37_2025_AP', nombre: 'Uso de Herramientas IA en la Docencia', horas: 25, comps: 'Inteligencia artificial generativa, herramientas de IA para evaluación.' },
    { clave: 'TNM_125_38_2025_FD', nombre: 'Taller de Oratoria y Comunicación Efectiva', horas: 20, comps: 'Comunicación verbal, lenguaje corporal, diseño de presentaciones.' },
    { clave: 'TNM_125_39_2025_AP', nombre: 'Seguridad e Higiene Industrial (Actualización NOMs)', horas: 40, comps: 'Normatividad (NOM), prevención de riesgos.' },
    { clave: 'TNM_125_40_2025_FD', nombre: 'Estrategias de Innovación Educativa', horas: 30, comps: 'Design thinking, gamificación, aprendizaje basado en proyectos.' }
  ];
  const insertManyCursos = db.transaction((lista) => {
    for (const curso of lista) insertCurso.run(curso.clave, curso.nombre, curso.horas, curso.comps);
  });
  insertManyCursos(cursos);
  console.log(`-> ${cursos.length} cursos insertados.`);

  // --- PASO 4: Insertar los 80 Docentes ---
  console.log('Insertando 80 docentes...');
  const docentes = [
    { id_docente: 'TNM001', ap: 'Pérez', am: 'Gómez', nombres: 'Juan Antonio', rfc: 'PEGO800101JUA', sexo: 'M', departamento_id: 'DP01', puesto: 'Profesor Titular A' },
    { id_docente: 'TNM002', ap: 'López', am: 'Fernández', nombres: 'Ana Isabel', rfc: 'LOFA900202ANA', sexo: 'F', departamento_id: 'DP01', puesto: 'Investigador' },
    { id_docente: 'TNM003', ap: 'Sánchez', am: 'Ruiz', nombres: 'Ricardo', rfc: 'SARC750315RIC', sexo: 'M', departamento_id: 'DP01', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM004', ap: 'Flores', am: 'Castillo', nombres: 'Elena', rfc: 'FLCE880420ELE', sexo: 'F', departamento_id: 'DP01', puesto: 'Técnico Docente' },
    { id_docente: 'TNM005', ap: 'Torres', am: 'Vargas', nombres: 'Manuel', rfc: 'TOVA920510MAN', sexo: 'M', departamento_id: 'DP01', puesto: 'Profesor' },
    { id_docente: 'TNM006', ap: 'Rojas', am: 'Díaz', nombres: 'Sofía', rfc: 'RODI850625SOF', sexo: 'F', departamento_id: 'DP01', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM007', ap: 'Jiménez', am: 'Castro', nombres: 'David', rfc: 'JICD790707DAV', sexo: 'M', departamento_id: 'DP01', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM008', ap: 'Guzmán', am: 'Mendoza', nombres: 'Laura', rfc: 'GUML810818LAU', sexo: 'F', departamento_id: 'DP01', puesto: 'Investigador Asociado' },
    { id_docente: 'TNM009', ap: 'Salazar', am: 'Ortiz', nombres: 'Fernando', rfc: 'SAOF770929FER', sexo: 'M', departamento_id: 'DP01', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM010', ap: 'Castro', am: 'Herrera', nombres: 'Lucía', rfc: 'CAHL831005LUC', sexo: 'F', departamento_id: 'DP01', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM011', ap: 'Vidal', am: 'Moreno', nombres: 'Omar', rfc: 'VIMO861112OMA', sexo: 'M', departamento_id: 'DP02', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM012', ap: 'Herrera', am: 'Báez', nombres: 'Ximena', rfc: 'HEBX911224XIM', sexo: 'F', departamento_id: 'DP02', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM013', ap: 'Campos', am: 'Navarro', nombres: 'Jorge', rfc: 'CANJ840130JOR', sexo: 'M', departamento_id: 'DP02', puesto: 'Jefe de Departamento' },
    { id_docente: 'TNM014', ap: 'Aguilar', am: 'Soto', nombres: 'Mónica', rfc: 'AGSM870203MON', sexo: 'F', departamento_id: 'DP02', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM015', ap: 'Bravo', am: 'Lira', nombres: 'Arturo', rfc: 'BLIA760317ART', sexo: 'M', departamento_id: 'DP02', puesto: 'Profesor' },
    { id_docente: 'TNM016', ap: 'Canto', am: 'Díaz', nombres: 'Natalia', rfc: 'CADI930408NAT', sexo: 'F', departamento_id: 'DP02', puesto: 'Investigador' },
    { id_docente: 'TNM017', ap: 'Durán', am: 'Vargas', nombres: 'Gustavo', rfc: 'DUVG890521GUS', sexo: 'M', departamento_id: 'DP02', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM018', ap: 'Esparza', am: 'Salas', nombres: 'Irene', rfc: 'EASI800619IRE', sexo: 'F', departamento_id: 'DP02', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM019', ap: 'Guerrero', am: 'Ponce', nombres: 'Israel', rfc: 'GUPI780711ISR', sexo: 'M', departamento_id: 'DP02', puesto: 'Técnico Docente' },
    { id_docente: 'TNM020', ap: 'Íñiguez', am: 'Cruz', nombres: 'Rosa', rfc: 'INCR820804ROS', sexo: 'F', departamento_id: 'DP02', puesto: 'Profesor' },
    { id_docente: 'TNM021', ap: 'Juarez', am: 'Reyes', nombres: 'Miguel', rfc: 'JURE770902MIG', sexo: 'M', departamento_id: 'DP03', puesto: 'Profesor Titular A' },
    { id_docente: 'TNM022', ap: 'King', am: 'Montes', nombres: 'Berenice', rfc: 'KIMB841028BER', sexo: 'F', departamento_id: 'DP03', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM023', ap: 'Lara', am: 'Solís', nombres: 'Roberto', rfc: 'LASO851115ROB', sexo: 'M', departamento_id: 'DP03', puesto: 'Investigador' },
    { id_docente: 'TNM024', ap: 'Mora', am: 'Nuñez', nombres: 'Diana', rfc: 'MONN901201DIA', sexo: 'F', departamento_id: 'DP03', puesto: 'Profesor' },
    { id_docente: 'TNM025', ap: 'Navarro', am: 'Rico', nombres: 'Esteban', rfc: 'NARE810107EST', sexo: 'M', departamento_id: 'DP03', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM026', ap: 'Ochoa', am: 'Páez', nombres: 'Paola', rfc: 'OAPP920214PAO', sexo: 'F', departamento_id: 'DP03', puesto: 'Técnico Docente' },
    { id_docente: 'TNM027', ap: 'Padilla', am: 'Quintero', nombres: 'Raúl', rfc: 'PAQR790320RAU', sexo: 'M', departamento_id: 'DP03', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM028', ap: 'Quintana', am: 'Ramos', nombres: 'Sandra', rfc: 'QURS830425SAN', sexo: 'F', departamento_id: 'DP03', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM029', ap: 'Ríos', am: 'Sandoval', nombres: 'Tomás', rfc: 'RIST880530TOM', sexo: 'M', departamento_id: 'DP03', puesto: 'Investigador Asociado' },
    { id_docente: 'TNM030', ap: 'Silva', am: 'Trejo', nombres: 'Valeria', rfc: 'SITV860613VAL', sexo: 'F', departamento_id: 'DP03', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM031', ap: 'Uribe', am: 'Valdez', nombres: 'Ulises', rfc: 'URVU750719ULI', sexo: 'M', departamento_id: 'DP04', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM032', ap: 'Vaca', am: 'Zamora', nombres: 'Verónica', rfc: 'VAZV890810VER', sexo: 'F', departamento_id: 'DP04', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM033', ap: 'Zamora', am: 'Ayala', nombres: 'Walter', rfc: 'ZAAW820905WAL', sexo: 'M', departamento_id: 'DP04', puesto: 'Jefe de Departamento' },
    { id_docente: 'TNM034', ap: 'Yáñez', am: 'Becerra', nombres: 'Yolanda', rfc: 'YABY871016YOL', sexo: 'F', departamento_id: 'DP04', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM035', ap: 'Alarcón', am: 'Cabrera', nombres: 'Andrés', rfc: 'ALCA811128AND', sexo: 'M', departamento_id: 'DP04', puesto: 'Profesor' },
    { id_docente: 'TNM036', ap: 'Benítez', am: 'Domínguez', nombres: 'Brenda', rfc: 'BEDB901230BRE', sexo: 'F', departamento_id: 'DP04', puesto: 'Investigador' },
    { id_docente: 'TNM037', ap: 'Cervantes', am: 'Esquivel', nombres: 'Carlos', rfc: 'CEEC780114CAR', sexo: 'M', departamento_id: 'DP04', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM038', ap: 'Domínguez', am: 'Flores', nombres: 'Daniela', rfc: 'DOFD840226DAN', sexo: 'F', departamento_id: 'DP04', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM039', ap: 'Escobar', am: 'Gallegos', nombres: 'Ernesto', rfc: 'ESGE770310ERN', sexo: 'M', departamento_id: 'DP04', puesto: 'Técnico Docente' },
    { id_docente: 'TNM040', ap: 'Fernández', am: 'Hernández', nombres: 'Fátima', rfc: 'FEHF860402FAT', sexo: 'F', departamento_id: 'DP04', puesto: 'Profesor' },
    { id_docente: 'TNM041', ap: 'Galindo', am: 'Ibarra', nombres: 'Gerardo', rfc: 'GAIG800518GER', sexo: 'M', departamento_id: 'DP05', puesto: 'Profesor Titular A' },
    { id_docente: 'TNM042', ap: 'Horta', am: 'Jiménez', nombres: 'Hilda', rfc: 'HOJI830620HIL', sexo: 'F', departamento_id: 'DP05', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM043', ap: 'Ibarra', am: 'López', nombres: 'Iván', rfc: 'IBLI850712IVA', sexo: 'M', departamento_id: 'DP05', puesto: 'Investigador' },
    { id_docente: 'TNM044', ap: 'Juárez', am: 'Martínez', nombres: 'Jazmín', rfc: 'JUMJ880803JAZ', sexo: 'F', departamento_id: 'DP05', puesto: 'Profesor' },
    { id_docente: 'TNM045', ap: 'León', am: 'Navarro', nombres: 'Kevin', rfc: 'LENK910915KEV', sexo: 'M', departamento_id: 'DP05', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM046', ap: 'Montes', am: 'Ochoa', nombres: 'Lorena', rfc: 'MOOL841027LOR', sexo: 'F', departamento_id: 'DP05', puesto: 'Técnico Docente' },
    { id_docente: 'TNM047', ap: 'Núñez', am: 'Pérez', nombres: 'Marcos', rfc: 'NUPM791108MAR', sexo: 'M', departamento_id: 'DP05', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM048', ap: 'Ortiz', am: 'Quintana', nombres: 'Nadia', rfc: 'ORQN821210NAD', sexo: 'F', departamento_id: 'DP05', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM049', ap: 'Peralta', am: 'Ramírez', nombres: 'Óscar', rfc: 'PERO870122OSC', sexo: 'M', departamento_id: 'DP05', puesto: 'Investigador Asociado' },
    { id_docente: 'TNM050', ap: 'Ramírez', am: 'Suárez', nombres: 'Patricia', rfc: 'RASP800224PAT', sexo: 'F', departamento_id: 'DP05', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM051', ap: 'Salas', am: 'Torres', nombres: 'Quintín', rfc: 'SATQ760306QUI', sexo: 'M', departamento_id: 'DP06', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM052', ap: 'Trejo', am: 'Uribe', nombres: 'Rebeca', rfc: 'TRUR890418REB', sexo: 'F', departamento_id: 'DP06', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM053', ap: 'Ugalde', am: 'Vaca', nombres: 'Saúl', rfc: 'UGVS820520SAU', sexo: 'M', departamento_id: 'DP06', puesto: 'Jefe de Departamento' },
    { id_docente: 'TNM054', ap: 'Vargas', am: 'Zamora', nombres: 'Teresa', rfc: 'VAZT870601TER', sexo: 'F', departamento_id: 'DP06', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM055', ap: 'Zamudio', am: 'Yáñez', nombres: 'Víctor', rfc: 'ZAYV800713VIC', sexo: 'M', departamento_id: 'DP06', puesto: 'Profesor' },
    { id_docente: 'TNM056', ap: 'Ávila', am: 'Benítez', nombres: 'Wendy', rfc: 'AVBW910825WEN', sexo: 'F', departamento_id: 'DP06', puesto: 'Investigador' },
    { id_docente: 'TNM057', ap: 'Barajas', am: 'Cervantes', nombres: 'Xavier', rfc: 'BACX780907XAV', sexo: 'M', departamento_id: 'DP06', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM058', ap: 'Cabrera', am: 'Domínguez', nombres: 'Yuridia', rfc: 'CADY841019YUR', sexo: 'F', departamento_id: 'DP06', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM059', ap: 'Dávila', am: 'Escobar', nombres: 'Zacarías', rfc: 'DAEZ771130ZAC', sexo: 'M', departamento_id: 'DP06', puesto: 'Técnico Docente' },
    { id_docente: 'TNM060', ap: 'Echeverría', am: 'Fernández', nombres: 'Abril', rfc: 'ECFA861212ABR', sexo: 'F', departamento_id: 'DP06', puesto: 'Profesor' },
    { id_docente: 'TNM061', ap: 'Figueroa', am: 'Galindo', nombres: 'Benito', rfc: 'FIGB810124BEN', sexo: 'M', departamento_id: 'DP07', puesto: 'Profesor Titular A' },
    { id_docente: 'TNM062', ap: 'Galván', am: 'Horta', nombres: 'Clara', rfc: 'GAHC840205CLA', sexo: 'F', departamento_id: 'DP07', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM063', ap: 'Hernández', am: 'Ibarra', nombres: 'Darío', rfc: 'HEID860317DAR', sexo: 'M', departamento_id: 'DP07', puesto: 'Investigador' },
    { id_docente: 'TNM064', ap: 'Iglesias', am: 'Juárez', nombres: 'Elisa', rfc: 'IGJE890429ELI', sexo: 'F', departamento_id: 'DP07', puesto: 'Profesor' },
    { id_docente: 'TNM065', ap: 'Landa', am: 'León', nombres: 'Fabián', rfc: 'LALF920501FAB', sexo: 'M', departamento_id: 'DP07', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM066', ap: 'Medina', am: 'Montes', nombres: 'Gabriela', rfc: 'MEMG850613GAB', sexo: 'F', departamento_id: 'DP07', puesto: 'Técnico Docente' },
    { id_docente: 'TNM067', ap: 'Navarro', am: 'Núñez', nombres: 'Héctor', rfc: 'NANH800725HEC', sexo: 'M', departamento_id: 'DP07', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM068', ap: 'Ocampo', am: 'Ortiz', nombres: 'Isabel', rfc: 'OC OI830806ISA', sexo: 'F', departamento_id: 'DP07', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM069', ap: 'Paz', am: 'Peralta', nombres: 'Javier', rfc: 'PAPJ880918JAV', sexo: 'M', departamento_id: 'DP07', puesto: 'Investigador Asociado' },
    { id_docente: 'TNM070', ap: 'Quezada', am: 'Ramírez', nombres: 'Karla', rfc: 'QURK811030KAR', sexo: 'F', departamento_id: 'DP07', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM071', ap: 'Rangel', am: 'Salas', nombres: 'Leonardo', rfc: 'RASL791111LEO', sexo: 'M', departamento_id: 'DP08', puesto: 'Profesor Titular C' },
    { id_docente: 'TNM072', ap: 'Sosa', am: 'Trejo', nombres: 'Marisol', rfc: 'SOTM841223MAR', sexo: 'F', departamento_id: 'DP08', puesto: 'Profesor Asociado A' },
    { id_docente: 'TNM073', ap: 'Téllez', am: 'Ugalde', nombres: 'Miguel', rfc: 'TEUM870104MIG', sexo: 'M', departamento_id: 'DP08', puesto: 'Jefe de Departamento' },
    { id_docente: 'TNM074', ap: 'Valle', am: 'Vargas', nombres: 'Nancy', rfc: 'VAVN900216NAN', sexo: 'F', departamento_id: 'DP08', puesto: 'Profesor de Carrera' },
    { id_docente: 'TNM075', ap: 'Zavala', am: 'Zamudio', nombres: 'Óscar', rfc: 'ZAZO830328OSC', sexo: 'M', departamento_id: 'DP08', puesto: 'Profesor' },
    { id_docente: 'TNM076', ap: 'Acosta', am: 'Ávila', nombres: 'Pablo', rfc: 'AAPA850409PAB', sexo: 'M', departamento_id: 'DP08', puesto: 'Investigador' },
    { id_docente: 'TNM077', ap: 'Blanco', am: 'Barajas', nombres: 'Raquel', rfc: 'BABR880521RAQ', sexo: 'F', departamento_id: 'DP08', puesto: 'Profesor Asociado B' },
    { id_docente: 'TNM078', ap: 'Corona', am: 'Cabrera', nombres: 'Sergio', rfc: 'COCS810602SER', sexo: 'M', departamento_id: 'DP08', puesto: 'Profesor Titular B' },
    { id_docente: 'TNM079', ap: 'Delgado', am: 'Dávila', nombres: 'Tania', rfc: 'DEDT840714TAN', sexo: 'F', departamento_id: 'DP08', puesto: 'Técnico Docente' },
    { id_docente: 'TNM080', ap: 'Elizondo', am: 'Echeverría', nombres: 'Vicente', rfc: 'EIEV860826VIC', sexo: 'M', departamento_id: 'DP08', puesto: 'Profesor' }
  ];
  const insertDocente = db.prepare('INSERT INTO docentes (id_docente, ap, am, nombres, rfc, sexo, departamento_id, puesto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertManyDocentes = db.transaction((lista) => {
    for (const d of lista) insertDocente.run(d.id_docente, d.ap, d.am, d.nombres, d.rfc, d.sexo, d.departamento_id, d.puesto);
  });
  insertManyDocentes(docentes);
  console.log(`-> ${docentes.length} docentes insertados.`);

  // --- PASO 5: Insertar las 80 Capacitaciones ---
  console.log('Insertando 80 capacitaciones...');
  const capacitaciones = [
    { docente_id: 'TNM001', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Dr. Cartujano', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM002', curso_id: 'TNM_125_32_2025_AP', tipo: 'AP', facilitador: 'Dra. Noregon', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM003', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Dra. Noemi', periodo: 'Del 06 al 17 de Enero', acreditado: 'True' },
    { docente_id: 'TNM004', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Dra. Ana Delia', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM005', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Dr. Peralta', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM006', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dr. Vilchis', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM007', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Dr. Santana', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM008', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Dr. Hector', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM009', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Dr. Tomas Emmanuel', periodo: 'Del 19 al 30 de Enero', acreditado: 'False' },
    { docente_id: 'TNM010', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Dra. Estela', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM011', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Dr. Rene', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM012', curso_id: 'TNM_125_32_2025_AP', tipo: 'AP', facilitador: 'Dr. Gaytan', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM013', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Dra. Sofía Ramos', periodo: 'Del 06 al 17 de Enero', acreditado: 'False' },
    { docente_id: 'TNM014', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Mtro. Edgar Luna', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM015', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Ing. Daniela Ruiz', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM016', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dr. Javier Canto', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM017', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Mtra. Valeria Solís', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM018', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Dr. Cartujano', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM019', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Dra. Noregon', periodo: 'Del 19 al 30 de Enero', acreditado: 'True' },
    { docente_id: 'TNM020', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Dra. Noemi', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM021', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Dra. Ana Delia', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM022', curso_id: 'TNM_125_32_2025_AP', tipo: 'FD', facilitador: 'Dra. Ana Celia', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM023', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Dr. Peralta', periodo: 'Del 06 al 17 de Enero', acreditado: 'True' },
    { docente_id: 'TNM024', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Dr. Vilchis', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM025', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Dr. Santana', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM026', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dr. Hector', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM027', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Dr. Tomas Emmanuel', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM028', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Dra. Estela', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM029', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Dr. Rene', periodo: 'Del 19 al 30 de Enero', acreditado: 'False' },
    { docente_id: 'TNM030', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Dr. Gaytan', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM031', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Dra. Sofía Ramos', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM032', curso_id: 'TNM_125_32_2025_AP', tipo: 'FD', facilitador: 'Mtro. Edgar Luna', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM033', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Ing. Daniela Ruiz', periodo: 'Del 06 al 17 de Enero', acreditado: 'False' },
    { docente_id: 'TNM034', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Dr. Javier Canto', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM035', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Mtra. Valeria Solís', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM036', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dr. Cartujano', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM037', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Dra. Noregon', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM038', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Dra. Noemi', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM039', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Dra. Ana Delia', periodo: 'Del 19 al 30 de Enero', acreditado: 'True' },
    { docente_id: 'TNM040', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Dra. Ana Celia', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM041', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Dr. Peralta', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM042', curso_id: 'TNM_125_32_2025_AP', tipo: 'FD', facilitador: 'Dr. Vilchis', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM043', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Dr. Santana', periodo: 'Del 06 al 17 de Enero', acreditado: 'True' },
    { docente_id: 'TNM044', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Dr. Hector', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM045', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Dr. Tomas Emmanuel', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM046', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dra. Estela', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM047', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Dr. Rene', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM048', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Dr. Gaytan', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM049', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Dra. Sofía Ramos', periodo: 'Del 19 al 30 de Enero', acreditado: 'False' },
    { docente_id: 'TNM050', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Mtro. Edgar Luna', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM051', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Ing. Daniela Ruiz', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM052', curso_id: 'TNM_125_32_2025_AP', tipo: 'FD', facilitador: 'Dr. Javier Canto', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM053', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Mtra. Valeria Solís', periodo: 'Del 06 al 17 de Enero', acreditado: 'False' },
    { docente_id: 'TNM054', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Dr. Cartujano', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM055', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Dra. Noregon', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM056', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dra. Noemi', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM057', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Dra. Ana Delia', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM058', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Dra. Ana Celia', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM059', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Dr. Peralta', periodo: 'Del 19 al 30 de Enero', acreditado: 'True' },
    { docente_id: 'TNM060', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Dr. Vilchis', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM061', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Dr. Santana', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM062', curso_id: 'TNM_125_32_2025_AP', tipo: 'FD', facilitador: 'Dr. Hector', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM063', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Dr. Tomas Emmanuel', periodo: 'Del 06 al 17 de Enero', acreditado: 'True' },
    { docente_id: 'TNM064', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Dra. Estela', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM065', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Dr. Rene', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM066', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dr. Gaytan', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM067', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Dra. Sofía Ramos', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM068', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Mtro. Edgar Luna', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM069', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Ing. Daniela Ruiz', periodo: 'Del 19 al 30 de Enero', acreditado: 'False' },
    { docente_id: 'TNM070', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Dr. Javier Canto', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM071', curso_id: 'TNM_125_31_2025_AP', tipo: 'AP', facilitador: 'Mtra. Valeria Solís', periodo: 'Del 11 al 23 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM072', curso_id: 'TNM_125_32_2025_AP', tipo: 'FD', facilitador: 'Dr. Cartujano', periodo: 'Del 01 al 15 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM073', curso_id: 'TNM_125_33_2025_AP', tipo: 'AP', facilitador: 'Dra. Noregon', periodo: 'Del 06 al 17 de Enero', acreditado: 'False' },
    { docente_id: 'TNM074', curso_id: 'TNM_125_34_2025_FD', tipo: 'FD', facilitador: 'Dra. Noemi', periodo: 'Del 20 al 30 de Noviembre', acreditado: 'True' },
    { docente_id: 'TNM075', curso_id: 'TNM_125_35_2025_AP', tipo: 'AP', facilitador: 'Dra. Ana Delia', periodo: 'Del 10 al 21 de Diciembre', acreditado: 'False' },
    { docente_id: 'TNM076', curso_id: 'TNM_125_36_2025_FD', tipo: 'FD', facilitador: 'Dra. Ana Celia', periodo: 'Del 15 al 26 de Enero', acreditado: 'True' },
    { docente_id: 'TNM077', curso_id: 'TNM_125_37_2025_AP', tipo: 'AP', facilitador: 'Dr. Peralta', periodo: 'Del 25 al 05 de Diciembre', acreditado: 'True' },
    { docente_id: 'TNM078', curso_id: 'TNM_125_38_2025_FD', tipo: 'FD', facilitador: 'Dr. Vilchis', periodo: 'Del 02 al 13 de Noviembre', acreditado: 'False' },
    { docente_id: 'TNM079', curso_id: 'TNM_125_39_2025_AP', tipo: 'AP', facilitador: 'Dr. Santana', periodo: 'Del 19 al 30 de Enero', acreditado: 'True' },
    { docente_id: 'TNM080', curso_id: 'TNM_125_40_2025_FD', tipo: 'FD', facilitador: 'Dr. Hector', periodo: 'Del 05 al 16 de Diciembre', acreditado: 'True' }
  ];
  const insertCapacitacion = db.prepare('INSERT INTO capacitaciones (docente_id, curso_id, tipo_capacitacion, facilitador, periodo, acreditado) VALUES (?, ?, ?, ?, ?, ?)');
  const insertManyCapacitaciones = db.transaction((lista) => {
    for (const c of lista) insertCapacitacion.run(c.docente_id, c.curso_id, c.tipo, c.facilitador, c.periodo, c.acreditado);
  });
  insertManyCapacitaciones(capacitaciones);
  console.log(`-> ${capacitaciones.length} capacitaciones insertadas.`);

  // --- PASO 6: Insertar datos del Sistema ---
  console.log('Insertando fila de configuración del sistema...');
  db.prepare(`
    INSERT INTO sistema (
      id, anio, periodo, departamento_actual_id, total_docentes, 
      director_nombre, jefa_dev_academico_nombre, coordinador_nombre
    ) VALUES (
      1, 2025, 'Agosto-Diciembre', 'DP07', 80, /* Total de docentes = 80 */
      'Ing. Director Apellido Ejemplo', 
      'M.C. Jefa Apellido Ejemplo', 
      'Dr. Coordinador Apellido Ejemplo'
    )
  `).run();
  console.log('Datos del sistema insertados.');
  
  console.log('--- Inserción de datos (seed) completada ---');
}

// Ejecución
try {
  initDatabase();
} catch (err) {
  console.error('Error al inicializar la base de datos:', err.message);
} finally {
  db.close();
  console.log('Conexión cerrada.');
}