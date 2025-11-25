// Importa React y los hooks useState y useEffect
import React, { useState, useEffect } from "react";

// Importa los estilos
import styles from './Module2.module.css';

// --- 1. IMPORTAR TOASTIFY ---
import { toast } from 'react-toastify';

const ModificacionDatos = ({ onBack }) => {

  // --- ESTADOS (Lógica del Backend) ---
  const [year, setYear] = useState(2025);
  const [period, setPeriod] = useState("");
  const [department, setDepartment] = useState("");
  const [totalDocentes, setTotalDocentes] = useState("");
  const [director, setDirector] = useState("");
  const [jefa, setJefa] = useState("");
  const [coordinador, setCoordinador] = useState("");
  
  // Estado para la lista dinámica de departamentos
  const [deptosList, setDeptosList] = useState([]);

  const [loading, setLoading] = useState(false);

  // Array de periodos (Ajustado para coincidir con backend)
  const periodos = ["Enero - Junio", "Agosto - Diciembre"];

  // --- 1. CARGAR DATOS AL INICIAR ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // A. Cargar Configuración Actual
        const resSettings = await fetch('http://localhost:4000/api/module2/settings');
        const dataSettings = await resSettings.json();
        
        if (dataSettings.success && dataSettings.data) {
          const d = dataSettings.data;
          setYear(d.anio || 2025);
          setPeriod(d.periodo || "Enero - Junio");
          setDepartment(d.departamento_nombre || "");
          setTotalDocentes(d.total_docentes || "");
          setDirector(d.director_nombre || "");
          setJefa(d.jefa_nombre || "");
          setCoordinador(d.coordinador_nombre || "");
        }

        // B. Cargar Lista de Departamentos (Reutilizando endpoint del Módulo 3)
        const resDeptos = await fetch('http://localhost:4000/api/module3/departments');
        const dataDeptos = await resDeptos.json();
        
        if (Array.isArray(dataDeptos)) {
          setDeptosList(dataDeptos);
        }

      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al conectar con el servidor");
      }
    };
    fetchData();
  }, []);

  // --- MANEJADORES DE ESTILO ---

  const incrementYear = () => setYear(prev => parseInt(prev || 0) + 1);
  const decrementYear = () => setYear(prev => (parseInt(prev || 0) - 1 > 0 ? parseInt(prev) - 1 : 2000));

  const handleYearChange = (e) => {
    const value = e.target.value.replace(/\D/, "");
    if (value === "") setYear("");
    else setYear(parseInt(value));
  };

  const handleNameChange = (setter) => (e) => {
    const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s.]/g,"");
    setter(value);
  };

  const handleTotalDocentes = (e) => {
    const value = e.target.value.replace(/\D/g,"");
    setTotalDocentes(value);
  };

  const handleClear = () => {
    setDirector("");
    setJefa("");
    setCoordinador("");
    setTotalDocentes("");
    setDepartment("");
    toast.info("Formulario limpiado");
  };

  // --- 2. GUARDAR DATOS CON TOASTIFY ---
  const handleSave = async () => {
    if (!year || !period || !department || !totalDocentes) {
      // --- TOAST DE ADVERTENCIA ---
      toast.warn("Debes llenar todos los campos obligatorios (*)");
      return;
    }

    setLoading(true);
    const payload = {
      anio: parseInt(year),
      periodo: period,
      departamento_nombre: department,
      total_docentes: parseInt(totalDocentes),
      director_nombre: director,
      jefa_nombre: jefa,
      coordinador_nombre: coordinador
    };

    try {
      const res = await fetch('http://localhost:4000/api/module2/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (result.success) {
        // --- TOAST DE ÉXITO ---
        toast.success("Configuración guardada exitosamente");
      } else {
        // --- TOAST DE ERROR DEL BACKEND ---
        toast.error("Error al guardar: " + (result.error || result.message));
      }
    } catch (error) {
      console.error(error);
      // --- TOAST DE ERROR DE RED ---
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---
  return (
    <div className={styles.Pagecontainer}>
      
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      <div className={styles.card}>
        <h1 className={styles.mainTitle}>Modificación de Datos</h1>

        {/* Estructura de dos columnas */}
        <div className={styles.twoColumns}>

          {/* --- Columna Izquierda --- */}
          <div className={styles.leftColumn}>
            
            <label className={styles.label}>
              Año (2000-2099)*
              <div className={styles.numberInput}>
                <button type="button" onClick={decrementYear}>-</button>
                <input type="text" value={year} onChange={handleYearChange} required maxLength={4}/>
                <button type="button" onClick={incrementYear}>+</button>
              </div>
            </label>

            <label className={styles.label}>
              Periodo*
              <select value={period} onChange={e => setPeriod(e.target.value)} required>
                <option value="">Selecciona un periodo</option>
                {periodos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <label className={styles.label}>
              Departamento*
              <select value={department} onChange={e => setDepartment(e.target.value)} required>
                <option value="">Selecciona un departamento</option>
                {/* MAPEO DINÁMICO DESDE LA BD */}
                {deptosList.map((d, idx) => (
                  <option key={idx} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Total de Docentes*
              <input type="text" value={totalDocentes} onChange={handleTotalDocentes} required/>
            </label>
          </div>

          {/* --- Columna Derecha --- */}
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

        {/* Botones de Acción */}
        <div className={styles.buttonRow}>
          <button onClick={handleClear}>Limpiar</button>
          <button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModificacionDatos;