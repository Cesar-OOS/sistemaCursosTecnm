import React, { useState } from 'react';
import styles from './Module5.module.css';

function Module5({ onBack }) {
  // --- Estado ---
  // Guardamos el tipo de búsqueda ('codigo' o 'nombre')
  const [searchType, setSearchType] = useState('codigo');

  // --- Datos Sintéticos ---
  const courseCodes = ["TNM_125_31_2025_AP", "TNM_125_32_2025_AP", "TNM_125_33_2025_AP"];
  const courseNames = ["Inglés Básico", "Gestión Ágil de Proyectos de Software", "Taller de Sueldos y Salarios"];
  // Genera un array de números [1, 2, ..., 100]
  const hourOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    // Contenedor principal de toda la página
    <div className={styles.pageContainer}>

      {/* Botón para volver al menú principal */}
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      {/* --- Div 1: Tipo de Búsqueda (Radio Buttons) --- */}
      <div className={styles.div1}>
        <p>Selecciona una opcion para realizar la busqueda</p>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="searchType"
              value="codigo"
              checked={searchType === 'codigo'}
              onChange={() => setSearchType('codigo')}
            />
            Codigo
          </label>
          <label>
            <input
              type="radio"
              name="searchType"
              value="nombre"
              checked={searchType === 'nombre'}
              onChange={() => setSearchType('nombre')}
            />
            Nombre
          </label>
        </div>
      </div>

      {/* --- Div 2: Código del Curso / Horas --- */}
      <div className={styles.row}>
        {/* Columna Izquierda */}
        <div className={styles.codeGroup}>
          <label>Codigo del curso:</label>
          <div className={styles.inputWithButton}>
            <select
              className={styles.flexSelect}
              disabled={searchType === 'nombre'} // Lógica de desactivación
            >
              {courseCodes.map(code => <option key={code} value={code}>{code}</option>)}
            </select>
            <button className={styles.btnSearch}>Buscar</button>
          </div>
        </div>
        {/* Columna Derecha */}
        <div className={styles.hoursGroup}>
          <label>Horas:</label>
          <select>
            {hourOptions.map(hour => <option key={hour} value={hour}>{hour}</option>)}
          </select>
        </div>
      </div>

      {/* --- Div 3: Nombre del Curso / Instructor --- */}
      <div className={styles.row}>
        {/* Columna Izquierda */}
        <div className={styles.formGroup}>
          <label>Nombre del curso:</label>
          <select
            disabled={searchType === 'codigo'} // Lógica de desactivación
          >
            {courseNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        {/* Columna Derecha */}
        <div className={styles.formGroup}>
          <label>Nombre del instructor:</label>
          <input type="text" className={styles.textArea}/>
        </div>
      </div>

      {/* --- Div 4: Fecha / Competencias --- */}
      <div className={styles.row}>
        {/* Columna Izquierda */}
        <div className={styles.formGroup}>
          <label>Fecha del curso:</label>
          <textarea rows="4" className={styles.textArea}></textarea>
        </div>
        {/* Columna Derecha */}
        <div className={styles.formGroup}>
          <label>Competencias desarrolladas:</label>
          <textarea rows="4" className={styles.textArea}></textarea>
        </div>
      </div>

      {/* --- Div 5: Formato de Archivo --- */}
      <div className={styles.rowAlignRight}>
        <div className={styles.formGroup}>
          <label>Formato de archivo:</label>
          <select>
            <option value="pdf">PDF</option>
            <option value="word">Word</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
      </div>

      {/* --- Div 6: Botones de Acción --- */}
      <div className={styles.buttonRow}>
        <button className={styles.btnModify}>Modificar</button>
        <button className={styles.btnClean}>Limpiar</button>
        <button className={styles.btnPrimary}>Guardar</button>
        <button className={styles.btnPrimary}>Exportar</button>
      </div>

    </div>
  );
}

export default Module5;