import React, { useState } from "react";
import styles from "./UploadExcel.module.css"; // Crea este CSS según tu diseño

const API_URL = "http://localhost:4000/api";

export default function UploadExcel({ onBack, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Selecciona un archivo primero");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload-to-db`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al subir el archivo");
      }

      const result = await res.json();
      setMessage(`✅ Archivo importado correctamente. Filas detectadas: ${result.totalFilas}`);

      // Limpiar el input y archivo seleccionado
      setFile(null);
      onUploadSuccess?.(); // opcional: recargar Module3
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>
      <h2>Importar Archivo Excel</h2>

      {message && <div className={styles.message}>{message}</div>}

      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      {file && <p>Archivo seleccionado: {file.name}</p>}

      <div className={styles.buttonGroup}>
        <button onClick={handleUpload}>Importar</button>
      </div>
    </div>
  );
}
