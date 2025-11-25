import React, { useState, useEffect } from "react"; 
import styles from "./Module3.module.css";
import { toast } from 'react-toastify';

const API_URL = "http://localhost:4000/api";

export default function Module3({ onBack }) {
  // --- Estados ---
  const [teachers, setTeachers] = useState([]); 
  const [allDepartments, setAllDepartments] = useState([]); 
  const [filter, setFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  
  const [showExport, setShowExport] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isExporting, setIsExporting] = useState(false); // Estado para loading de exportación

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
      toast.error(`Error al conectar con el servidor: ${error.message}`);
    }
  };

  // --- Lógica de Filtro Actualizada (Nombre Completo) ---
  const filtered = teachers
    .filter((t) => {
      return departmentFilter === "" || t.depto === departmentFilter;
    })
    .filter((t) => {
      const term = filter.toLowerCase();
      if (term === "") return true;
      return (
        (t.nombre_completo || "").toLowerCase().includes(term) ||
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

  // --- GUARDAR CAMBIOS ---
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
        toast.success(result.message);
      } else {
        throw new Error(result.message || "El servidor rechazó la operación");
      }

    } catch (error) {
      console.error("Error en handleSave:", error);
      toast.error(error.message);
    }
  }

  // --- NUEVAS FUNCIONES DE EXPORTACIÓN (Conectadas al Backend) ---

  const handleExportRequest = async (mode) => {
    setIsExporting(true);
    const toastId = toast.loading("Generando listas de asistencia...");

    try {
      const response = await fetch(`${API_URL}/module3/export-lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: mode, // 'single' o 'all'
          courseName: selectedCourse // Solo importa si mode='single'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.update(toastId, { 
          render: `✅ ${result.message}`, 
          type: "success", 
          isLoading: false, 
          autoClose: 5000 
        });
        setShowExport(false); // Cierra el modal al terminar
      } else {
        toast.update(toastId, { 
          render: `❌ Error: ${result.message}`, 
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
      setIsExporting(false);
    }
  };

  function handleExportCourse() {
    if (!selectedCourse) {
      return toast.warn("Selecciona un curso primero.");
    }
    handleExportRequest('single');
  }

  function handleExportAll() {
    // Confirmación opcional para evitar clics accidentales
    if (window.confirm("Se generarán todas las listas de asistencia. Esto puede tardar unos segundos. ¿Continuar?")) {
      handleExportRequest('all');
    }
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

  // Obtener lista única de cursos para el selector del modal
  const allCourses = Array.from(
    new Set(teachers.flatMap((t) => t.curso || []))
  ).sort(); // Ordenamos alfabéticamente

  return (
    <div className={styles.container}>
      
      <button className={styles.backBtn} onClick={handleBackClick}>
        ← Volver
      </button>

      <h2 className={styles.title}>
        Módulo de Visualización y Acreditación Docente
      </h2>

      <div className={styles.mainContentBox}>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar por Nombre, RFC o Curso"
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
                {/* Columnas ajustadas a la nueva BD */}
                <th>Nombre del Docente</th>
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
                  <td colSpan="9" className={styles.emptyTable}>
                    Cargando datos o no hay coincidencias...
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nombre_completo}</td>
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

      {/* MODAL DE EXPORTACIÓN */}
      {showExport && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Exportar Listas de Asistencia</h3>
            
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={isExporting}
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
                disabled={!selectedCourse || isExporting}
                style={{ opacity: isExporting ? 0.5 : 1 }}
              >
                {isExporting ? "Generando..." : "Exportar Curso"}
              </button>
              
              <button 
                onClick={handleExportAll}
                disabled={isExporting}
                style={{ opacity: isExporting ? 0.5 : 1 }}
              >
                Exportar Todo
              </button>
              
              <button 
                onClick={() => setShowExport(false)}
                disabled={isExporting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}