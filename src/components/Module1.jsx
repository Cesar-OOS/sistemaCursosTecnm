import React, { useState } from "react";
import styles from './Module1.module.css';

// --- 1. IMPORTAR TOASTIFY ---
import { toast } from 'react-toastify';

const ExcelFiles = ({ onBack }) => {

  // CAMBIO 1: Eliminado el Paso 3 (Evaluaciones)
  const initialLists = [
    { id: 1, name: "Paso 1: Configuración de Cursos", options: ["Programa Institucional"], uploaded: {} },
    { id: 2, name: "Paso 2: Importar Docentes", options: [
      "Listado de Docentes Adscritos", 
      "Listado de pre-registro a Cursos de Capacitación" 
    ], uploaded: {} }
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

  // CAMBIO 2: Función para Limpiar / Reiniciar el formulario
  const handleClean = () => {
    setSelectedFiles({}); // Vaciar archivos seleccionados
    setLists(initialLists); // Reiniciar visualmente los selectores (quitar palomitas)
    
    // Limpiar inputs de tipo file (hack para permitir seleccionar el mismo archivo de nuevo si se desea)
    document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
    
    toast.info("Formulario reiniciado. Puedes cargar nuevos archivos.");
  };

  const handleImport = async () => {
    if (Object.keys(selectedFiles).length === 0) {
      toast.warn("No has seleccionado ningún archivo para importar.");
      return;
    }

    setLoading(true);
    
    try {
      for (const key in selectedFiles) {
        const file = selectedFiles[key];
        const optionName = key.substring(key.indexOf('-') + 1);
        
        const formData = new FormData();
        formData.append('file', file);

        let url = '';
        const nameLower = optionName.toLowerCase();

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
                toast.success(`✅ ${optionName}: ${data.message}`, { autoClose: 5000 });
            } else {
                toast.error(`❌ ${optionName}: ${data.error}`, { autoClose: 8000 });
            }

          } catch (e) {
            console.error(e);
            toast.error(`❌ ${optionName}: Error de conexión con el servidor`);
          }
        } else {
            toast.info(`⚠️ ${optionName}: No hay ruta configurada para este archivo.`);
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
          {/* Botón Limpiar */}
          <button 
            className={styles.cleanBtn} // Asegúrate de tener estilos para este botón o usa una clase existente
            onClick={handleClean}
            disabled={loading}
            style={{ marginRight: '15px', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Limpiar
          </button>

          <button 
            className={styles.importBtn} 
            onClick={handleImport}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? "Procesando..." : "Iniciar Importación"}
          </button>
       </div>
    </div>
  );
};

export default ExcelFiles;