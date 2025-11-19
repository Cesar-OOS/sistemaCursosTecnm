import React, { useState } from "react";
import styles from './Module1.module.css';

// --- 1. IMPORTAR TOASTIFY ---
import { toast } from 'react-toastify';

const ExcelFiles = ({ onBack }) => {

  const initialLists = [
    { id: 1, name: "Paso 1: Configuración de Cursos", options: ["Programa Institucional"], uploaded: {} },
    { id: 2, name: "Paso 2: Importar Docentes", options: [
      "Listado de Docentes Adscritos", 
      "Listado de pre-registro a Cursos de Capacitación" 
    ], uploaded: {} },
    { id: 3, name: "Paso 3: Evaluaciones y Resultados", options: [
      "Listado de Detección de Necesidades", 
      "Formato de Lista de Asistencia" 
    ], uploaded: {} },
  ];

  const [lists, setLists] = useState(initialLists);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, listId, option) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFiles(prev => ({ ...prev, [`${listId}-${option}`]: file }));
    setLists(prev => prev.map(l => l.id === listId ? { ...l, uploaded: { ...l.uploaded, [option]: true } } : l));
  };

  const handleImport = async () => {
    // Validación inicial con Toast
    if (Object.keys(selectedFiles).length === 0) {
      toast.warn("No has seleccionado ningún archivo para importar.");
      return;
    }

    setLoading(true);
    
    // Eliminamos la variable 'results' y el alert final.
    // Ahora notificamos conforme avanza el proceso.

    try {
      for (const key in selectedFiles) {
        const file = selectedFiles[key];
        // Extraer nombre real de la opción
        const optionName = key.substring(key.indexOf('-') + 1);
        
        const formData = new FormData();
        formData.append('file', file);

        let url = '';
        // Normalizamos a minúsculas para comparación segura
        const nameLower = optionName.toLowerCase();

        // MAPEO DE RUTAS
        if (nameLower.includes("programa institucional")) {
            url = 'http://localhost:4000/api/module1/catalogo';
        } 
        else if (nameLower.includes("docentes adscritos")) {
            url = 'http://localhost:4000/api/module1/adscritos';
        } 
        else if (nameLower.includes("pre-registro")) {
            url = 'http://localhost:4000/api/module1/preregistro';
        } 
        else if (nameLower.includes("detección de necesidades") || nameLower.includes("asistencia")) {
            url = 'http://localhost:4000/api/module1/resultados';
        }
        
        if (url) {
          try {
            const res = await fetch(url, { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.success) {
                // --- ÉXITO (Verde) ---
                toast.success(` ${optionName}: ${data.message}`, { autoClose: 5000 });
            } else {
                // --- ERROR DEL BACKEND (Rojo) ---
                toast.error(` ${optionName}: ${data.error}`, { autoClose: 8000 });
            }

          } catch (e) {
            // --- ERROR DE RED (Rojo) ---
            console.error(e);
            toast.error(` ${optionName}: Error de conexión con el servidor`);
          }
        } else {
            // Caso raro: Archivo seleccionado sin ruta definida
            toast.info(` ${optionName}: No hay ruta configurada para este archivo.`);
        }
      }
      
    } catch (error) {
        console.error(error);
        toast.error("Ocurrió un error inesperado en el proceso.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={styles.uploaderScreen}>
       <button className={styles.backBtn} onClick={onBack} disabled={loading}>← Volver</button>
       <h1 className={styles.mainTitle}>Importación de Archivos</h1>
       <div className={styles.cardsContainer}>
        {lists.map(list => (
          <div key={list.id} className={styles.listCard}>
            <h2>{list.name}</h2>
            <div className={styles.selectRow}>
              <select defaultValue="" disabled={loading} onChange={(e) => {
                  const opt = e.target.value;
                  const input = document.getElementById(`file-${list.id}`);
                  input.dataset.opt = opt;
                  input.click();
                  e.target.value = "";
              }}>
                <option value="" disabled>Seleccionar...</option>
                {list.options.map(o => <option key={o} value={o}>{o} {list.uploaded[o]?"✔️":""}</option>)}
              </select>
              <ul className={styles.fileList}>
                 {Object.keys(list.uploaded).map(o => list.uploaded[o] && <li key={o}>{o}: {selectedFiles[`${list.id}-${o}`]?.name}</li>)}
              </ul>
              <input type="file" id={`file-${list.id}`} style={{display:'none'}} 
                onChange={(e) => handleFileChange(e, list.id, e.target.dataset.opt)} accept=".xlsx,.xls,.csv"/>
            </div>
          </div>
        ))}
       </div>
       <div className={styles.buttonContainer}>
          <button className={styles.importBtn} onClick={handleImport} disabled={loading}>
            {loading ? "Procesando..." : "Iniciar Importación"}
          </button>
       </div>
    </div>
  );
};

export default ExcelFiles;