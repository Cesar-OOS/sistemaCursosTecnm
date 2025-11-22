import React, { useState, useRef, useEffect } from "react";
import styles from "./Module6.module.css";
import { toast } from 'react-toastify';

const API_URL = "http://localhost:4000/api";

const Respaldo = ({ onBack }) => {
  const [selectedOption, setSelectedOption] = useState("exportar");
  const [fileType, setFileType] = useState(".zip");
  const [filePath, setFilePath] = useState("");
  const [serverDefaultPath, setServerDefaultPath] = useState("");
  
  const [fileToImport, setFileToImport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  // 1. CARGA INICIAL
  useEffect(() => {
    fetch(`${API_URL}/module6/config`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServerDefaultPath(data.defaultPath);
          // Por defecto mostramos la ruta del sistema
          if (selectedOption === "exportar") setFilePath(data.defaultPath);
        }
      })
      .catch(() => toast.error("Error de conexión con el servidor"));
  }, []);

  // 2. CAMBIO DE OPCIÓN
  const handleOptionChange = (option) => {
    setSelectedOption(option);
    if (option === "exportar") {
      setFilePath(serverDefaultPath);
      setFileToImport(null);
    } else {
      setFilePath("");
      setFileToImport(null);
    }
  };

  // 3. EXAMINAR
  const handleBrowse = async () => {
    if (selectedOption === "exportar") {
      // --- EXPORTAR ---
      try {
        const dirHandle = await window.showDirectoryPicker();
        // NOTA: En web solo obtenemos el nombre, no la ruta completa (C:\...).
        // Para pruebas locales manuales, el usuario deberá escribir la ruta.
        setFilePath(`Carpeta seleccionada: ${dirHandle.name} (Ruta oculta por navegador)`);
        toast.info(`Carpeta elegida: ${dirHandle.name}. Nota: El navegador oculta la ruta completa.`);
      } catch (err) {
        if (err.name !== 'AbortError') toast.warn("No se pudo seleccionar la carpeta automáticamente.");
      }
    } else {
      // --- IMPORTAR ---
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFilePath(file.name);
      setFileToImport(file); 
    }
  };

  // 4. ACEPTAR
  const handleAccept = async () => {
    if (!selectedOption) return toast.warn("Selecciona Exportar o Importar.");
    if (!fileType) return toast.warn("Selecciona el tipo de archivo.");

    setLoading(true);

    try {
      // --- FLUJO EXPORTAR ---
      if (selectedOption === "exportar") {
        
        // LÓGICA CORREGIDA: 
        // 1. Si el input tiene el texto placeholder del selector web ("Carpeta seleccionada..."), usamos la ruta por defecto.
        // 2. Si el usuario ESCRIBIÓ O PEGÓ una ruta manual (Ej: "C:\Respaldos"), usamos esa.
        let pathToSend = filePath;
        
        if (pathToSend.includes("Carpeta seleccionada") || pathToSend.trim() === "") {
           pathToSend = serverDefaultPath;
           toast.info("Usando ruta por defecto del sistema (debido a restricciones del navegador).");
        }

        const toastId = toast.loading("Generando respaldo...");
        
        const res = await fetch(`${API_URL}/module6/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathToSend, fileType })
        });
        
        const result = await res.json();
        
        if (result.success) {
          toast.update(toastId, { render: `✅ ${result.message}`, type: "success", isLoading: false, autoClose: 5000 });
        } else {
          toast.update(toastId, { render: `❌ Error: ${result.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }

      } else {
        // --- FLUJO IMPORTAR ---
        if (!fileToImport) {
          setLoading(false);
          return toast.warn("Por favor selecciona un archivo para importar.");
        }

        const toastId = toast.loading("Restaurando base de datos...");
        const formData = new FormData();
        formData.append('file', fileToImport);

        const res = await fetch(`${API_URL}/module6/import`, {
          method: 'POST',
          body: formData
        });

        const result = await res.json();

        if (result.success) {
          toast.update(toastId, { render: `✅ ${result.message}`, type: "success", isLoading: false, autoClose: 8000 });
        } else {
          toast.update(toastId, { render: `❌ Error: ${result.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
      }

    } catch (error) {
      console.error(error);
      toast.error("Error de conexión crítico.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      <h1 className={styles.mainTitle}>Respaldo</h1>

      <div className={styles.card}>
        
        <div className={styles.optionGroup}>
          <label>
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

        <div className={styles.fileSection}>
          <label className={styles.label}>
            {selectedOption === "exportar" ? "Ubicación de la ruta:" : "Ubicación del archivo:"}
          </label>
          
          {/* INPUT: Ahora permite escritura manual en modo exportar */}
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)} // Permitir edición manual
            readOnly={selectedOption === "importar"} // Solo lectura si es importar (debe usar examinar)
            placeholder={selectedOption === "exportar" ? "Pega aquí tu ruta (Ej: C:\\Respaldos)" : `Selecciona un archivo ${fileType}`}
            className={styles.inputField}
          />
          
          <input
            type="file"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={fileType} 
          />

          <button className={styles.browseBtn} onClick={handleBrowse}>
            Examinar
          </button>
        </div>

        <div className={styles.fileTypeSection}>
          <label>
            <input
              type="radio"
              name="fileType"
              value=".zip"
              checked={fileType === ".zip"}
              onChange={() => {
                setFileType(".zip");
                if(selectedOption === "importar") { setFilePath(""); setFileToImport(null); }
              }}
            />
            .ZIP
          </label>
          <label>
            <input
              type="radio"
              name="fileType"
              value=".rar"
              checked={fileType === ".rar"}
              onChange={() => {
                setFileType(".rar");
                if(selectedOption === "importar") { setFilePath(""); setFileToImport(null); }
              }}
            />
            .RAR
          </label>
        </div>
      </div>

      <button 
        className={styles.acceptBtn} 
        onClick={handleAccept}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
      >
        {loading ? "Procesando..." : "Aceptar"}
      </button>
    </div>
  );
};

export default Respaldo;