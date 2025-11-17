import db from './db.js';

function runTests() {
  console.log('🚀 Iniciando pruebas de la Base de Datos...\n');

  // --- PRUEBA 1: Configuración del Sistema ---
  console.log('--- 1. Datos del Sistema (Singleton) ---');
  const sistema = db.prepare('SELECT * FROM sistema').get();
  console.table(sistema);

  // --- PRUEBA 2: Departamentos ---
  console.log('\n--- 2. Listado de Departamentos ---');
  const deptos = db.prepare('SELECT * FROM departamentos').all();
  console.table(deptos);

  // --- PRUEBA 3: Cursos Disponibles ---
  console.log('\n--- 3. Catálogo de Cursos ---');
  // Seleccionamos solo columnas clave para que la tabla en consola se vea bien
  const cursos = db.prepare('SELECT clave_curso, nombre, horas FROM cursos').all();
  console.table(cursos);

  // --- PRUEBA 4: Docentes y sus Departamentos (JOIN) ---
  console.log('\n--- 4. Docentes con su Departamento (Primeros 5) ---');
  const docentes = db.prepare(`
    SELECT 
      d.id_docente, 
      d.nombres || ' ' || d.ap AS nombre_completo, 
      d.puesto, 
      dep.nombre AS departamento
    FROM docentes d
    JOIN departamentos dep ON d.departamento_id = dep.clave_depto
    LIMIT 5
  `).all();
  console.table(docentes);

  // --- PRUEBA 5: LA PRUEBA DE FUEGO (Módulo 3) ---
  // Esta consulta simula exactamente lo que necesita tu tabla del Módulo 3.
  // Une Capacitaciones + Docentes + Cursos + Departamentos
  console.log('\n--- 5. Historial de Capacitaciones (Vista Completa) ---');
  const capacitaciones = db.prepare(`
    SELECT 
      d.ap || ' ' || d.am AS apellidos,
      d.nombres,
      dep.nombre AS depto_corto,
      c.nombre AS curso_tomado,
      cap.tipo_capacitacion AS tipo,
      cap.periodo,
      cap.acreditado
    FROM capacitaciones cap
    JOIN docentes d ON cap.docente_id = d.id_docente
    JOIN cursos c ON cap.curso_id = c.clave_curso
    JOIN departamentos dep ON d.departamento_id = dep.clave_depto
    LIMIT 10
  `).all();
  console.table(capacitaciones);

  // --- PRUEBA 6: Conteo Total ---
  console.log('\n--- 6. Estadísticas Rápidas ---');
  const totalDocentes = db.prepare('SELECT count(*) as total FROM docentes').get().total;
  const totalCursos = db.prepare('SELECT count(*) as total FROM cursos').get().total;
  const totalCapacitaciones = db.prepare('SELECT count(*) as total FROM capacitaciones').get().total;
  
  console.log(`Total Docentes: ${totalDocentes}`);
  console.log(`Total Cursos: ${totalCursos}`);
  console.log(`Total Registros de Capacitación: ${totalCapacitaciones}`);
}

try {
  runTests();
} catch (err) {
  console.error('❌ Error durante las pruebas:', err.message);
} finally {
  db.close(); // Cerramos la conexión al terminar
  console.log('\nConexión cerrada.');
}