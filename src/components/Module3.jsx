import React, { useState, useEffect } from "react"; 
import styles from "./Module3.module.css";
import { toast } from 'react-toastify';

const API_URL = "http://localhost:4000/api";

export default function Module3({ onBack }) {
  const [teachers, setTeachers] = useState([]); 
  const [allDepartments, setAllDepartments] = useState([]); 
  const [filter, setFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      const deptosResponse = await fetch(`${API_URL}/module3/departments`);
      if (!deptosResponse.ok) throw new Error('Error al cargar departamentos');
      const deptos = await deptosResponse.json();
      setAllDepartments(deptos);

      const dataResponse = await fetch(`${API_URL}/module3/data`);
      if (!dataResponse.ok) throw new Error('Error al cargar datos de la tabla');
      const data = await dataResponse.json();
      setTeachers(data);
      
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error(`Error al conectar con el servidor: ${error.message}`);
    }
  };

  // --- Lógica de Filtro Actualizada ---
  const filtered = teachers
    .filter((t) => {
      return departmentFilter === "" || t.depto === departmentFilter;
    })
    .filter((t) => {
      const term = filter.toLowerCase();
      if (term === "") return true;
      // CAMBIO: Búsqueda sobre nombre_completo
      return (
        (t.nombre_completo || "").toLowerCase().includes(term) ||
        (t.rfc || "").toLowerCase().includes(term) ||
        (t.curso || "").toLowerCase().includes(term)
      );
    });

  function handleAccreditationChange(id, checked) {
    const updated = teachers.map((t) =>
      t.id === id ? { ...t, acreditacion: checked } : t
    );
    setTeachers(updated);
    setUnsaved(true); 
  }

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

  function handleExportCourse() {
    toast.success("Exportación de curso iniciada...");
    setShowExport(false);
  }

  function handleExportAll() {
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
                {/* CAMBIO: Columnas unificadas */}
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
                    {/* CAMBIO: Campo unificado */}
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