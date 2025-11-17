import React, { useState, useEffect } from "react"; // Asegúrate de importar useEffect
import styles from "./Module3.module.css";

// Constante para la URL del backend (el servidor que corre en el puerto 4000)
const API_URL = "http://localhost:4000/api";

export default function Module3({ onBack }) {
  // --- Estados ---
  const [teachers, setTeachers] = useState([]); // Inicia vacío, se llenará desde la BD
  const [allDepartments, setAllDepartments] = useState([]); // Inicia vacío
  const [filter, setFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [message, setMessage] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  // --- NUEVO: Cargar datos reales desde el backend al iniciar ---
  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      // 1. Pide los departamentos al backend
      const deptosResponse = await fetch(`${API_URL}/module3/departments`);
      if (!deptosResponse.ok) throw new Error('Error al cargar departamentos');
      const deptos = await deptosResponse.json();
      setAllDepartments(deptos);

      // 2. Pide los datos de la tabla al backend
      const dataResponse = await fetch(`${API_URL}/module3/data`);
      if (!dataResponse.ok) throw new Error('Error al cargar datos de la tabla');
      const data = await dataResponse.json();
      setTeachers(data);
      
    } catch (error) {
      console.error("Error cargando datos:", error);
      setMessage(`❌ Error al conectar con el servidor: ${error.message}`);
    }
  };

  // --- Lógica de Filtro (Sin cambios, pero ahora filtra datos reales) ---
  const filtered = teachers
    .filter((t) => {
      return departmentFilter === "" || t.depto === departmentFilter;
    })
    .filter((t) => {
      const term = filter.toLowerCase();
      if (term === "") return true;
      return (
        (t.ap || "").toLowerCase().includes(term) ||
        (t.am || "").toLowerCase().includes(term) ||
        (t.nombres || "").toLowerCase().includes(term) ||
        (t.rfc || "").toLowerCase().includes(term) ||
        (t.curso || "").toLowerCase().includes(term)
      );
    });

  // --- Manejador de Checkbox (Sin cambios, actualiza estado local) ---
  function handleAccreditationChange(id, checked) {
    const updated = teachers.map((t) =>
      t.id === id ? { ...t, acreditacion: checked } : t
    );
    setTeachers(updated);
    setUnsaved(true); // Activa el botón "Guardar"
  }

  // --- MODIFICADO: handleSave ahora llama al backend ---
  async function handleSave() {
    try {
      // Envía el array COMPLETO de 'teachers' al backend
      const response = await fetch(`${API_URL}/module3/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teachers), // Envía los datos actualizados
      });

      if (!response.ok) throw new Error('El servidor falló al guardar');

      const result = await response.json();
      
      if (result.success) {
        setUnsaved(false); // Desactiva el botón "Guardar"
        setMessage("✅ " + result.message);
      } else {
        setMessage("❌ " + result.message);
      }
    } catch (error) {
      console.error("Error en handleSave:", error);
      setMessage(`❌ Error crítico al guardar: ${error.message}`);
    }
    
    setTimeout(() => setMessage(""), 3000);
  }

  // --- Funciones de Exportación (Simuladas por ahora) ---
  function handleExportCourse() {
    setMessage("✅ Exportación de curso iniciada...");
    setShowExport(false);
    setTimeout(() => setMessage(""), 3000);
  }
  function handleExportAll() {
    setMessage("✅ Exportación completa iniciada...");
    setShowExport(false);
    setTimeout(() => setMessage(""), 3000);
  }
  
  function handleBackClick() {
    if (unsaved) {
      const confirmExit = window.confirm(
        "Tiene cambios sin guardar. ¿Está seguro de que desea salir? Se perderán los cambios."
      );
      if (!confirmExit) return;
    }
    onBack();
  }

  // Lógica para el modal de exportación (sin cambios)
  const allCourses = Array.from(
    new Set(teachers.flatMap((t) => t.curso || []))
  );

  return (
    <div className={styles.container}>
      
      <button className={styles.backBtn} onClick={handleBackClick}>
        ← Volver
      </button>

      <h2 className={styles.title}>
        Módulo de Visualización y Acreditación Docente
      </h2>

      <div className={styles.mainContentBox}>

        {message && <div className={styles.message}>{message}</div>}

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar por Apellido, Nombre, RFC o Curso"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select 
            className={styles.departmentSelect}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Todos los departamentos</option>
            {/* Ahora se llena con datos de la BD */}
            {allDepartments.map((depto, index) => (
              <option key={index} value={depto}>{depto}</option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Apellido Paterno</th>
                <th>Apellido Materno</th>
                <th>Nombres</th>
                <th>RFC</th>
                <th>Sexo</th>
                <th>Puesto</th>
                <th>Nombre del Curso</th>
                <th>Capacitación</th>
                <th>Nombre del Facilitador</th>
                <th>Periodo</th>
                <th>Acreditación</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" className={styles.emptyTable}>
                    Cargando datos o no hay coincidencias...
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{t.ap}</td>
                    <td>{t.am}</td>
                    <td>{t.nombres}</td>
                    <td>{t.rfc}</td>
                    <td>{t.sexo}</td>
                    <td>{t.puesto}</td>
                    <td>{t.curso}</td>
                    <td>{t.capacitacion}</td>
                    <td>{t.facilitador}</td>
                    <td>{t.periodo}</td>
                    <td>
                      <input
                        type="checkbox"
                        // 't.acreditacion' ahora es un booleano (true/false)
                        checked={t.acreditacion}
                        onChange={(e) =>
                          handleAccreditationChange(t.id, e.target.checked)
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={handleSave} disabled={!unsaved}>
            Guardar
          </button>
          <button onClick={() => setShowExport(true)}>
            Exportar Listas de Asistencia
          </button>
        </div>
        
      </div>

      {/* Modal de Exportación (sin cambios) */}
      {showExport && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Exportar Listas de Asistencia</h3>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Selecciona un curso --</option>
              {allCourses.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className={styles.modalButtons}>
              <button
                onClick={handleExportCourse}
                disabled={!selectedCourse}
              >
                Exportar Curso
              </button>
              <button onClick={handleExportAll}>Exportar Todo</button>
              <button onClick={() => setShowExport(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}