import db from './db.js';

export const Module2Controller = {
  
  // Obtener configuración al cargar la página
  getSettings: () => {
    try {
      const data = db.prepare('SELECT * FROM sistema WHERE id = 1').get();
      if (!data) {
        return { success: false, message: 'No se encontró configuración inicial.' };
      }
      return { success: true, data };
    } catch (error) {
      console.error("Error obteniendo configuración:", error);
      return { success: false, error: error.message };
    }
  },

  // Guardar cambios del formulario
  saveSettings: (config) => {
    try {
      const { 
        anio, 
        periodo, 
        departamento_nombre, 
        total_docentes, 
        director_nombre, 
        jefa_nombre, 
        coordinador_nombre 
      } = config;

      const update = db.prepare(`
        UPDATE sistema 
        SET 
          anio = @anio,
          periodo = @periodo,
          departamento_nombre = @departamento_nombre,
          total_docentes = @total_docentes,
          director_nombre = @director_nombre,
          jefa_nombre = @jefa_nombre,
          coordinador_nombre = @coordinador_nombre
        WHERE id = 1
      `);

      update.run({
        anio, 
        periodo, 
        departamento_nombre, 
        total_docentes, 
        director_nombre, 
        jefa_nombre, 
        coordinador_nombre
      });

      return { success: true, message: 'Datos guardados correctamente.' };
    } catch (error) {
      console.error("Error guardando configuración:", error);
      return { success: false, error: error.message };
    }
  }
};

export default Module2Controller;