import React, { useState, useEffect } from "react"; 
import styles from "./Module3.module.css";

// --- 1. IMPORTAR TOASTIFY ---
import { toast } from 'react-toastify';

// Constante para la URL del backend
const API_URL = "http://localhost:4000/api";

export default function Module3({ onBack }) {
  // --- Estados ---
  const [teachers, setTeachers] = useState([]); 
  const [allDepartments, setAllDepartments] = useState([]); 
  const [filter, setFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  
  // --- ELIMINADO: const [message, setMessage] ... (Ya no usamos mensajes en texto plano) ---
  
  const [showExport, setShowExport] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  // --- Cargar datos reales desde el backend al iniciar ---
  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      // 1. Pide los departamentos
      const deptosResponse = await fetch(`${API_URL}/module3/departments`);
      if (!deptosResponse.ok) throw new Error('Error al cargar departamentos');
      const deptos = await deptosResponse.json();
      setAllDepartments(deptos);

      // 2. Pide los datos de la tabla
      const dataResponse = await fetch(`${API_URL}/module3/data`);
      if (!dataResponse.ok) throw new Error('Error al cargar datos de la tabla');
      const data = await dataResponse.json();
      setTeachers(data);
      
    } catch (error) {
      console.error("Error cargando datos:", error);
      // --- TOAST DE ERROR ---
      toast.error(`Error al conectar con el servidor: ${error.message}`);
    }
  };

  // --- Lógica de Filtro ---
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

  // --- Manejador de Checkbox ---
  function handleAccreditationChange(id, checked) {
    const updated = teachers.map((t) =>
      t.id === id ? { ...t, acreditacion: checked } : t
    );
    setTeachers(updated);
    setUnsaved(true); 
  }

  // --- GUARDAR CON TOASTIFY ---
  async function handleSave() {
    try {
      const response = await fetch(`${API_URL}/module3/update-accreditations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teachers),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error HTTP: ${response.status}`);
      }
      
      if (result.success) {
        setUnsaved(false); 
        // --- TOAST DE ÉXITO (Verde) ---
        toast.success(result.message);
      } else {
        throw new Error(result.message || "El servidor rechazó la operación");
      }

    } catch (error) {
      console.error("Error en handleSave:", error);
      // --- TOAST DE ERROR (Rojo) ---
      toast.error(error.message);
    }
  }

  // --- Funciones de Exportación ---
  function handleExportCourse() {
    // --- TOAST DE ÉXITO ---
    toast.success("Exportación de curso iniciada...");
    setShowExport(false);
  }

  function handleExportAll() {
    // --- TOAST DE ÉXITO ---
    toast.success("Exportación completa iniciada...");
    setShowExport(false);
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

  // Lógica para el modal de exportación
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

        {/* --- ELIMINADO: El div de {message} ya no existe aquí --- */}

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
                <th>Fecha</th>
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

      {/* Modal de Exportación */}
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