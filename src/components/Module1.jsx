import React, { useState } from "react";
import styles from "./Module1.module.css";

const ExcelFiles = ({ onBack, onUploadComplete }) => {
  const initialLists = [
    { id: 1, name: "Elige un Programa Institucional:", options: ["Programa Institucional"], uploaded: {} },
    {
      id: 2,
      name: "Elige un listado a importar:",
      options: [
        "Listado de pre-registro a Cursos de Capacitación",
        "Listado de Etiquetas de Cursos de Capacitación",
        "Listado de Detección de Necesidades",
        "Listado de Docentes Adscritos",
      ],
      uploaded: {},
    },
    {
      id: 3,
      name: "Elige un formato a importar:",
      options: [
        "Formato de Hojas Membretadas para Reconocimientos",
        "Formato de Lista de Asistencia",
        "Formato de Reporte para Docentes Capacitados",
      ],
      uploaded: {},
    },
  ];

  const [lists, setLists] = useState(initialLists);
  const [selectedFiles, setSelectedFiles] = useState({});

  const handleFileChange = (e, listId, option) => {
    const file = e.target.files[0];
    if (!file || !option) return;

    setSelectedFiles((prev) => ({
      ...prev,
      [`${listId}-${option}`]: file,
    }));

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, uploaded: { ...list.uploaded, [option]: true } }
          : list
      )
    );
  };

  const handleUpload = async () => {
    try {
      const entries = Object.entries(selectedFiles);
      if (entries.length === 0) {
        alert("Por favor selecciona al menos un archivo antes de importar.");
        return;
      }

      for (const [key, file] of entries) {
        const separatorIndex = key.indexOf("-");
        const listId = key.slice(0, separatorIndex);
        const option = key.slice(separatorIndex + 1);

        if (!option) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("option", option);

        const response = await fetch("http://localhost:4000/api/upload-to-db", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Error al subir archivo");
        }

        const result = await response.json();
        alert(`✅ ${option} importado correctamente.\nFilas detectadas: ${result.totalFilas}`);
      }

      // Limpiar archivos seleccionados
      setSelectedFiles({});
      onUploadComplete?.(); // Llamar a Module3 para actualizar la lista automáticamente
    } catch (error) {
      console.error("Error al subir archivo:", error);
      alert(`❌ Error al subir los archivos: ${error.message}`);
    }
  };

  return (
    <div className={styles.uploaderScreen}>
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>
      <h1 className={styles.mainTitle}>Importar archivos</h1>

      <div className={styles.cardsContainer}>
        {lists.map((list) => (
          <div key={list.id} className={styles.listCard}>
            <h2>{list.name}</h2>
            <div className={styles.selectRow}>
              <select
                defaultValue=""
                onChange={(e) => {
                  const option = e.target.value;
                  const input = document.getElementById(`file-input-${list.id}`);
                  input.dataset.option = option;
                  input.click();
                  e.target.value = "";
                }}
              >
                <option value="" disabled>Selecciona una opción</option>
                {list.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} {list.uploaded[opt] ? "✔️" : ""}
                  </option>
                ))}
              </select>

              <ul className={styles.fileList}>
                {Object.entries(list.uploaded).map(([opt, uploaded]) =>
                  uploaded ? (
                    <li key={opt}>
                      {opt}: {selectedFiles[`${list.id}-${opt}`]?.name ?? "Subido"}
                    </li>
                  ) : null
                )}
              </ul>

              <input
                type="file"
                id={`file-input-${list.id}`}
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, list.id, e.target.dataset.option)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.buttonContainer}>
        <button className={styles.importBtn} onClick={handleUpload}>Importar Archivos</button>
      </div>
    </div>
  );
};

export default ExcelFiles;
