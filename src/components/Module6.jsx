// Importa React y los hooks useState y useRef desde la librería 'react'
import React, { useState, useRef } from "react";

// Importa los estilos desde un módulo CSS local y los asigna al objeto `styles`
import styles from "./Module6.module.css";

// Declara el componente funcional Respaldo que recibe una prop `onBack`
const Respaldo = ({ onBack }) => {
  // Estado para almacenar la opción seleccionada: "exportar" o "importar"
  const [selectedOption, setSelectedOption] = useState("");
  // Estado para almacenar el tipo de archivo: ".zip" o ".rar"
  const [fileType, setFileType] = useState("");
  // Estado para almacenar la ruta completa del archivo seleccionado
  const [filePath, setFilePath] = useState("");

  // Referencia al input file oculto, para poder activarlo programáticamente
  const fileInputRef = useRef(null);

  // Función para cambiar entre Exportar e Importar
  const handleOptionChange = (option) => setSelectedOption(option);

  // Función para abrir el explorador de archivos
  const handleBrowse = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Función para capturar el archivo seleccionado y mostrar la ruta completa
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      // Se obtiene la ruta completa si está disponible, si no, solo el nombre
      setFilePath(e.target.files[0].path || e.target.files[0].name);
    }
  };

  // Función para manejar el botón Aceptar
  const handleAccept = () => {
    // Valida que se haya seleccionado Exportar o Importar
    if (!selectedOption) return alert("Debes seleccionar Exportar o Importar.");
    // Valida que se haya seleccionado un tipo de archivo
    if (!fileType) return alert("Debes seleccionar un tipo de archivo (.ZIP o .RAR).");
    // Muestra un alert simulando la acción de exportar o importar
    alert(
      `Acción: ${
        selectedOption === "exportar" ? "Exportando" : "Importando"
      } respaldo (${fileType}) en la ruta: ${filePath}`
    );
  };

  // Renderiza la interfaz del componente
  return (
    // Contenedor principal de la página
    <div className={styles.pageContainer}>
      {/* Botón volver, situado fuera de la tarjeta */}
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      {/* Título principal */}
      <h1 className={styles.mainTitle}>Respaldo</h1>

      {/* Tarjeta principal que contiene las opciones e input */}
      <div className={styles.card}>
        {/* Grupo de opciones: Exportar o Importar */}
        <div className={styles.optionGroup}>
          <label>
            {/* Radio button para Exportar */}
            <input
              type="radio"
              name="respaldo"
              value="exportar"
              checked={selectedOption === "exportar"}
              onChange={() => handleOptionChange("exportar")}
            />
            Exportar
          </label>
          <label>
            {/* Radio button para Importar */}
            <input
              type="radio"
              name="respaldo"
              value="importar"
              checked={selectedOption === "importar"}
              onChange={() => handleOptionChange("importar")}
            />
            Importar
          </label>
        </div>

        {/* Sección para seleccionar la ubicación del archivo */}
        <div className={styles.fileSection}>
          {/* Label de la sección */}
          <label className={styles.label}>Ubicación del archivo:</label>
          {/* Input de texto que muestra la ruta seleccionada */}
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Selecciona la ruta del archivo"
            className={styles.inputField}
            readOnly // Se establece readOnly para que solo se modifique mediante Examinar
          />
          {/* Input file oculto */}
          <input
            type="file"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {/* Botón que abre el explorador de archivos */}
          <button className={styles.browseBtn} onClick={handleBrowse}>Examinar</button>
        </div>

        {/* Sección para seleccionar el tipo de archivo (.ZIP o .RAR) */}
        <div className={styles.fileTypeSection}>
          <label>
            {/* Radio button para .ZIP */}
            <input
              type="radio"
              name="fileType"
              value=".zip"
              checked={fileType === ".zip"}
              onChange={() => setFileType(".zip")}
            />
            .ZIP
          </label>
          <label>
            {/* Radio button para .RAR */}
            <input
              type="radio"
              name="fileType"
              value=".rar"
              checked={fileType === ".rar"}
              onChange={() => setFileType(".rar")}
            />
            .RAR
          </label>
        </div>
      </div>

      {/* Botón Aceptar, situado fuera de la tarjeta */}
      <button className={styles.acceptBtn} onClick={handleAccept}>Aceptar</button>
    </div>
  );
};

// Exporta el componente para usarlo en otras partes de la aplicación
export default Respaldo;