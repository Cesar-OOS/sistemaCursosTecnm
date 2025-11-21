import React, { useState, useEffect } from 'react';
import styles from './Module5.module.css';
import { toast } from 'react-toastify';

const API_URL = "http://localhost:4000/api";

function Module5({ onBack }) {
  const [searchType, setSearchType] = useState('codigo');
  const [coursesList, setCoursesList] = useState([]); 
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false); // Estado para el loading de exportación

  const [formData, setFormData] = useState({
    horas: 30, 
    facilitador: "",
    fechaExpedicion: "",
    competencias: ""
  });

  const hourOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  useEffect(() => {
    fetch(`${API_URL}/module5/courses`)
      .then(res => res.json())
      .then(response => {
        if (response.success) setCoursesList(response.data);
        else toast.error("Error al cargar cursos: " + response.error);
      })
      .catch(err => toast.error("Error de conexión"));
  }, []);

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setSelectedCode(code);
    const course = coursesList.find(c => c.clave_curso === code);
    if (course) setSelectedName(course.nombre);
    else setSelectedName("");
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setSelectedName(name);
    const course = coursesList.find(c => c.nombre === name);
    if (course) setSelectedCode(course.clave_curso);
    else setSelectedCode("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (!selectedCode) {
      toast.warn("Por favor selecciona un curso.");
      return;
    }
    const course = coursesList.find(c => c.clave_curso === selectedCode);
    if (course) {
      setFormData(prev => ({
        ...prev,
        horas: course.horas || 30, 
        facilitador: course.facilitador || "",
        competencias: course.competencias_desarrolladas || "" 
      }));
      toast.info("Datos del curso cargados.");
    }
  };

  const handleClean = () => {
    setSelectedCode("");
    setSelectedName("");
    setFormData({ horas: 30, facilitador: "", fechaExpedicion: "", competencias: "" });
    toast.info("Formulario limpiado.");
  };

  const handleSave = async () => {
    if (!selectedCode) {
      toast.warn("Selecciona un curso para guardar los cambios.");
      return;
    }
    try {
      const payload = {
        clave_curso: selectedCode,
        horas: formData.horas,
        facilitador: formData.facilitador,
        competencias: formData.competencias
      };
      const res = await fetch(`${API_URL}/module5/update`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if(result.success) {
        toast.success("✅ Datos del curso actualizados correctamente.");
        setCoursesList(prev => prev.map(c => c.clave_curso === selectedCode ? {...c, ...payload} : c));
      } else {
        toast.error("Error al guardar: " + result.error);
      }
    } catch (e) {
      toast.error("Error de conexión.");
    }
  };

  // --- EXPORTACIÓN MASIVA ---
  const handleExport = async () => {
    // 1. Validaciones
    if (!formData.fechaExpedicion.trim()) {
      toast.error("⚠️ El campo 'Fecha de expedición' es obligatorio.");
      return;
    }
    if (!selectedCode) {
      toast.error("Selecciona un curso.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generando constancias (esto puede tardar)...");

    try {
      const response = await fetch(`${API_URL}/module5/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCode,
          fechaExpedicion: formData.fechaExpedicion
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.update(toastId, { 
          render: `✅ ${result.message}`, 
          type: "success", 
          isLoading: false, 
          autoClose: 8000 
        });
      } else {
        toast.update(toastId, { 
          render: `❌ Error: ${result.message || result.error}`, 
          type: "error", 
          isLoading: false, 
          autoClose: 5000 
        });
      }

    } catch (error) {
      console.error(error);
      toast.update(toastId, { 
        render: "❌ Error de conexión con el servidor", 
        type: "error", 
        isLoading: false, 
        autoClose: 5000 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      {/* Div 1: Tipo de Búsqueda */}
      <div className={styles.div1}>
        <p>Selecciona una opcion para realizar la busqueda</p>
        <div className={styles.radioGroup}>
          <label>
            <input type="radio" name="searchType" value="codigo" checked={searchType === 'codigo'} onChange={() => setSearchType('codigo')} />
            Codigo
          </label>
          <label>
            <input type="radio" name="searchType" value="nombre" checked={searchType === 'nombre'} onChange={() => setSearchType('nombre')} />
            Nombre
          </label>
        </div>
      </div>

      {/* Div 2: Código / Horas */}
      <div className={styles.row}>
        <div className={styles.codeGroup}>
          <label>Codigo del curso:</label>
          <div className={styles.inputWithButton}>
            <select className={styles.flexSelect} disabled={searchType === 'nombre'} value={selectedCode} onChange={handleCodeChange}>
              <option value="">-- Seleccionar Código --</option>
              {coursesList.map(c => <option key={c.clave_curso} value={c.clave_curso}>{c.clave_curso}</option>)}
            </select>
            <button className={styles.btnSearch} onClick={handleSearch}>Buscar</button>
          </div>
        </div>
        <div className={styles.hoursGroup}>
          <label>Horas:</label>
          <select name="horas" value={formData.horas} onChange={handleInputChange}>
            {hourOptions.map(hour => <option key={hour} value={hour}>{hour}</option>)}
          </select>
        </div>
      </div>

      {/* Div 3: Nombre / Instructor */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label>Nombre del curso:</label>
          <select disabled={searchType === 'codigo'} value={selectedName} onChange={handleNameChange}>
            <option value="">-- Seleccionar Nombre --</option>
            {coursesList.map(c => <option key={c.clave_curso} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Nombre del instructor:</label>
          <input type="text" className={styles.textArea} name="facilitador" value={formData.facilitador} onChange={handleInputChange} />
        </div>
      </div>

      {/* Div 4: Fecha / Competencias */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label>Fecha de expedición:</label>
          <textarea rows="4" className={styles.textArea} name="fechaExpedicion" value={formData.fechaExpedicion} onChange={handleInputChange} placeholder="Ej: a 15 de Diciembre de 2025"></textarea>
        </div>
        <div className={styles.formGroup}>
          <label>Competencias desarrolladas:</label>
          <textarea rows="4" className={styles.textArea} name="competencias" value={formData.competencias} onChange={handleInputChange}></textarea>
        </div>
      </div>

      {/* Div 6: Botones */}
      <div className={styles.buttonRow}>
        <button className={styles.btnClean} onClick={handleClean}>Limpiar</button>
        <button className={styles.btnPrimary} onClick={handleSave}>Guardar</button>
        <button 
          className={styles.btnPrimary} 
          onClick={handleExport}
          disabled={isGenerating}
          style={{ cursor: isGenerating ? 'wait' : 'pointer', opacity: isGenerating ? 0.7 : 1 }}
        >
          {isGenerating ? "Generando..." : "Exportar"}
        </button>
      </div>
    </div>
  );
}

export default Module5;