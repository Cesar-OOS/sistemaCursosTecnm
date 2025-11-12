// Importa React y los hooks useState y useEffect desde la librería 'react'
import React, { useState, useEffect } from "react";

// Importa los estilos desde un módulo CSS local y los asigna al objeto `styles`
import styles from './Module2.module.css';

// Declara el componente funcional ModificacionDatos que recibe una prop `onBack`
const ModificacionDatos = ({ onBack }) => {

  // Declara el estado `year` con valor inicial 2025 y su setter `setYear`
  const [year, setYear] = useState(2025);
  // Declara el estado `period` (periodo) y su setter `setPeriod`
  const [period, setPeriod] = useState("");
  // Declara el estado `department` y su setter `setDepartment`
  const [department, setDepartment] = useState("");
  // Declara el estado `totalDocentes` y su setter `setTotalDocentes`
  const [totalDocentes, setTotalDocentes] = useState("");
  // Declara el estado `director` y su setter `setDirector`
  const [director, setDirector] = useState("");
  // Declara el estado `jefa` y su setter `setJefa`
  const [jefa, setJefa] = useState("");
  // Declara el estado `coordinador` y su setter `setCoordinador`
  const [coordinador, setCoordinador] = useState("");

  // Array con los nombres de los departamentos disponibles en el select
  const departamentos = [
    "Ciencias Básicas",
    "Ciencias Económico Administrativas",
    "Ciencias de la Tierra",
    "Ingeniería Industrial",
    "Metal Mecánica",
    "Química y Bioquímica",
    "Sistemas Computacionales",
    "Posgrado"
  ];

  // Array con las opciones de periodo disponibles
  const periodos = ["Enero-julio", "Agosto-Diciembre"];

  // Función que valida y actualiza el año desde el input (solo números 2000-2099)
  const handleYearChange = (e) => {
    // Elimina cualquier carácter que no sea dígito
    const value = e.target.value.replace(/\D/, "");
    // Si el campo queda vacío, actualiza a cadena vacía
    if (value === "") setYear("");
    else {
      // Convierte el valor a número entero
      const num = parseInt(value);
      // Si el número está en el rango válido, actualiza el estado `year`
      if (num >= 2000 && num <= 2099) setYear(num);
    }
  };
  // Incrementa el año en 1 si no supera 2099
  const incrementYear = () => { if (year < 2099) setYear(year + 1); };
  // Decrementa el año en 1 si no baja de 2000
  const decrementYear = () => { if (year > 2000) setYear(year - 1); };

  // Crea una función generadora para validar nombres (permite letras acentuadas y espacios)
  const handleNameChange = (setter) => (e) => {
    // Elimina cualquier carácter que no sea letra ni espacio
    const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g,"");
    // Usa la función setter pasada para actualizar el estado correspondiente
    setter(value);
  };

  // Valida el campo de total de docentes: solo permite números, sin bloquear escritura
  const handleTotalDocentes = (e) => {
    // Eliminamos cualquier carácter que no sea dígito y actualizamos el estado
    const value = e.target.value.replace(/\D/g,""); // g para reemplazar todos los no dígitos
    setTotalDocentes(value); // actualiza el estado con los dígitos escritos
  };

  // Restablece todos los campos a sus valores por defecto / vacíos
  const handleClear = () => {
    setYear(2026);         // restablece año a 2023
    setPeriod("");         // limpia periodo
    setDepartment("");     // limpia departamento
    setTotalDocentes("");  // limpia total docentes
    setDirector("");       // limpia director
    setJefa("");           // limpia jefa
    setCoordinador("");    // limpia coordinador
  };

  // Simula el guardado de datos; valida campos obligatorios antes
  const handleSave = () => {
    // Comprueba que campos obligatorios no estén vacíos
    if (!year || !period || !department || !totalDocentes) {
      alert("Debes llenar todos los campos obligatorios"); // alerta si faltan datos
      return; // detiene la función
    }
    // Construye un objeto con los datos a guardar
    const data = { year, period, department, totalDocentes, director, jefa, coordinador };
    // Muestra en consola los datos (simula guardado)
    console.log("Guardando datos:", data);
    // Alerta de éxito (simulado)
    alert("Datos guardados correctamente. Archivo Excel generado (simulado).");
  };

  // useEffect que se ejecuta cuando cambian `year` o `period` para simular precarga
  useEffect(() => {
    // Mensaje en consola indicando que se podría consultar datos existentes
    console.log("Consultar datos existentes para año y periodo:", year, period);
  }, [year, period]); // dependencias: se ejecuta al cambiar year o period

  // Renderiza la estructura del formulario
  return (
    // Contenedor principal de la página con clase modularizada
    <div className={styles.pageContainer}>
      {/* Botón 'Volver' situado fuera de la tarjeta principal */}
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      {/* Tarjeta principal que contiene el formulario */}
      <div className={styles.card}>
        {/* Título principal de la tarjeta */}
        <h1 className={styles.mainTitle}>Modificación de Datos</h1>

        {/* Contenedor de dos columnas para organizar los campos */}
        <div className={styles.twoColumns}>

          {/* Columna izquierda: año, periodo, departamento, total docentes */}
          <div className={styles.leftColumn}>
            {/* Label para el campo Año con los botones +/- integrados */}
            <label className={styles.label}>
              Año (2000-2099)*
              {/* Contenedor para botones y campo numérico */}
              <div className={styles.numberInput}>
                {/* Botón para decrementar el año */}
                <button type="button" onClick={decrementYear}>-</button>
                {/* Input de texto que muestra y permite editar el año */}
                <input type="text" value={year} onChange={handleYearChange} required maxLength={4}/>
                {/* Botón para incrementar el año */}
                <button type="button" onClick={incrementYear}>+</button>
              </div>
            </label>

            {/* Label y select para elegir el periodo */}
            <label className={styles.label}>
              Periodo*
              <select value={period} onChange={e => setPeriod(e.target.value)} required>
                <option value="">Selecciona un periodo</option>
                {periodos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            {/* Label y select para elegir el departamento */}
            <label className={styles.label}>
              Departamento*
              <select value={department} onChange={e => setDepartment(e.target.value)} required>
                <option value="">Selecciona un departamento</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>

            {/* Label y input para total de docentes */}
            <label className={styles.label}>
              Total de Docentes*
              <input type="text" value={totalDocentes} onChange={handleTotalDocentes} required/>
            </label>
          </div>

          {/* Columna derecha: campos de texto para nombres */}
          <div className={styles.rightColumn}>
            <label className={styles.label}>
              Director
              <input type="text" value={director} onChange={handleNameChange(setDirector)}/>
            </label>
            <label className={styles.label}>
              Jefa del Departamento de Desarrollo Académico
              <input type="text" value={jefa} onChange={handleNameChange(setJefa)}/>
            </label>
            <label className={styles.label}>
              Coordinador
              <input type="text" value={coordinador} onChange={handleNameChange(setCoordinador)}/>
            </label>
          </div>
        </div>

        {/* Fila de botones al final de la tarjeta: Limpiar y Guardar */}
        <div className={styles.buttonRow}>
          <button onClick={handleClear}>Limpiar</button>
          <button onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

// Exporta el componente para usarlo en otras partes de la aplicación
export default ModificacionDatos;