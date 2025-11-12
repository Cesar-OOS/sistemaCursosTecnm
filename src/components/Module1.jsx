// Importa React y el hook useState para manejar el estado dentro del componente
import React, { useState } from "react";

// Importa los estilos CSS específicos del componente
import styles from './Module1.module.css';

// Define el componente funcional ExcelFiles que recibe la función onBack como prop
const ExcelFiles = ({ onBack }) => {

  // Define una lista inicial con tres grupos (o secciones) de opciones
  // Cada grupo contiene un id, un nombre (que se muestra como título) y sus opciones
  // La propiedad 'uploaded' guarda los archivos subidos por cada opción
  const initialLists = [
    { id: 1, name: "Elige un Programa Institucional:", options: ["Programa Institucional"], uploaded: {} },
    { id: 2, name: "Elige un listado a importar:", options: [
      "Listado de pre-registro a Cursos de Capacitación",
      "Listado de Etiquetas de Cursos de Capacitación", 
      "Listado de Detección de Necesidades", 
      "Listado de Docentes Adscritos"
    ], uploaded: {} },
    { id: 3, name: "Elige un formato a importar:", options: [
      "Formato de Hojas Membretadas para Reconocimientos", 
      "Formato de Lista de Asistencia", 
      "Formato de Reporte para Docentes Capacitados"
    ], uploaded: {} },
  ];

  // Estado principal que almacena la lista completa (con sus opciones y archivos)
  const [lists, setLists] = useState(initialLists);

  // Estado que guarda los nombres de los archivos seleccionados por cada opción
  const [selectedFiles, setSelectedFiles] = useState({});

  // Función que se ejecuta cuando el usuario selecciona un archivo Excel
  const handleFileChange = (e, listId, option) => {
    const file = e.target.files[0]; // Obtiene el primer archivo seleccionado
    if (!file) return; // Si no se selecciona archivo, no hace nada

    // Actualiza el estado 'selectedFiles' agregando el nuevo archivo seleccionado
    setSelectedFiles(prev => ({
      ...prev, // Mantiene los archivos previos
      [`${listId}-${option}`]: file.name // Guarda el nombre con una clave única por lista y opción
    }));

    // Marca en la lista correspondiente que esa opción ya tiene un archivo cargado
    setLists(prev =>
      prev.map(list =>
        list.id === listId
          ? { ...list, uploaded: { ...list.uploaded, [option]: true } } // Marca como “subido”
          : list // Si no coincide, deja la lista igual
      )
    );
  };

  // Renderizado del componente
  return (
    <div className={styles.uploaderScreen}> {/* Contenedor general de la interfaz */}
      
      {/* Botón para volver a la pantalla anterior */}
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      {/* Título principal, ubicado fuera del recuadro blanco */}
      <h1 className={styles.mainTitle}>Importar archivos</h1>

      {/* Recuadro principal blanco que contiene todas las tarjetas */}
      <div className={styles.cardsContainer}>
        {/* Recorre la lista de secciones definidas en initialLists */}
        {lists.map(list => (
          // Cada grupo se representa como una tarjeta
          <div key={list.id} className={styles.listCard}>
            
            {/* Título de cada tarjeta (por ejemplo: “Elige un formato a importar”) */}
            <h2>{list.name}</h2>
            
            {/* Contenedor que organiza el select (izquierda) y la lista de archivos (derecha) */}
            <div className={styles.selectRow}>
              
              {/* Menú desplegable que muestra las opciones disponibles */}
              <select
                defaultValue="" // Valor inicial vacío
                onChange={(e) => { // Al cambiar el valor del select
                  const option = e.target.value; // Obtiene la opción seleccionada
                  const input = document.getElementById(`file-input-${list.id}`); // Busca el input oculto asociado
                  input.dataset.option = option; // Guarda la opción elegida dentro del input
                  input.click(); // Simula un clic para abrir el selector de archivos
                  e.target.value = ""; // Restablece el valor del select
                }}
              >
                {/* Opción inicial deshabilitada (mensaje guía) */}
                <option value="" disabled>Selecciona una opción</option>

                {/* Genera dinámicamente las opciones del select */}
                {list.options.map(opt => (
                  <option key={opt} value={opt}>
                    {/* Muestra el nombre y un ✔️ si ya se subió un archivo */}
                    {opt} {list.uploaded[opt] ? "✔️" : ""}
                  </option>
                ))}
              </select>

              {/* Lista vertical con los nombres de los archivos subidos */}
              <ul className={styles.fileList}>
                {/* Recorre las opciones que tienen archivos cargados */}
                {Object.entries(list.uploaded).map(([opt, uploaded]) =>
                  uploaded 
                    ? <li key={opt}>{opt}: {selectedFiles[`${list.id}-${opt}`]}</li> // Muestra el nombre del archivo
                    : null // Si no hay archivo subido, no muestra nada
                )}
              </ul>

              {/* Input oculto para cargar los archivos Excel */}
              <input
                type="file" // Tipo archivo
                id={`file-input-${list.id}`} // ID único para cada lista
                accept=".xlsx,.xls" // Solo permite archivos Excel
                style={{ display: "none" }} // Oculto al usuario
                onChange={(e) => handleFileChange(e, list.id, e.target.dataset.option)} // Ejecuta la función al cargar un archivo
              />
            </div>
          </div>
        ))}
      </div>
      {/* Contenedor para el botón de importación */}
        <div className={styles.buttonContainer}>
          {/* Botón que en el futuro puede ejecutar una acción para importar los archivos */}
          <button className={styles.importBtn}>Importar Archivos</button>
        </div>
    </div>
  );
};

// Exporta el componente para poder usarlo en otras partes del proyecto
export default ExcelFiles;