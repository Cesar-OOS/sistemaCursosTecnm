import React, { useState } from "react";
import styles from "./Module3.module.css";

const mockTeachers = [
  { id: 'TNM001', ap: 'Perez', am: 'Gomez', nombres: 'Juan', rfc: 'PEGJ800101ABC', sexo: 'M', depto: 'Sistemas Computacionales', puesto: 'Profesor', curso: 'IA', capacitacion: 'AP', facilitador: 'Dr. Cartujano', periodo: 'Del 11 al 23 de Noviembre', acreditacion: false },
  { id: 'TNM002', ap: 'Lopez', am: 'Fernandez', nombres: 'Ana', rfc: 'LOFA900202DEF', sexo: 'F', depto: 'Química y Bioquímica', puesto: 'Investigador', curso: 'Quimica Organica', capacitacion: 'FD', facilitador: 'Dra. Nogeron', periodo: 'Del 01 al 15 de Octubre', acreditacion: true },
  { id: 'TNM003', ap: 'Garcia', am: 'Martinez', nombres: 'Luis', rfc: 'GAML850303GHI', sexo: 'M', depto: 'Metal Mecánica', puesto: 'Jefe de Depto', curso: 'Creación y modificación de PCBs', capacitacion: 'AP', facilitador: 'Dra. Claudia', periodo: 'Del 11 al 23 de Noviembre', acreditacion: false },
];

//Obtenemos la lista de departamentos únicos de los datos ---
// Usamos Set para asegurar que no haya duplicados
const allDepartments = [...new Set(mockTeachers.map(teacher => teacher.depto))];

export default function Module3({ onBack }) {
  // --- Estados ---
  const [teachers, setTeachers] = useState(mockTeachers);
  const [filter, setFilter] = useState("");
  // --- NUEVO: Estado para el filtro de departamento ---
  const [departmentFilter, setDepartmentFilter] = useState(""); // "" significa "Todos"
  const [unsaved, setUnsaved] = useState(false);
  const [message, setMessage] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  // --- MODIFICADO: Lógica de Filtro Encadenado ---
  const filtered = teachers
    .filter((t) => {
      // 1. Primer filtro: Departamento
      // Si el filtro de depto está vacío (""), devolvemos 'true' (no filtrar)
      // Si no, solo devolvemos 'true' si el depto del profe coincide
      return departmentFilter === "" || t.depto === departmentFilter;
    })
    .filter((t) => {
      // 2. Segundo filtro: Texto
      const term = filter.toLowerCase();
      if (term === "") return true; // Si no hay texto, no filtrar
      return (
        t.ap.toLowerCase().includes(term) ||
        t.am.toLowerCase().includes(term) ||
        t.nombres.toLowerCase().includes(term) ||
        t.rfc.toLowerCase().includes(term) ||
        t.curso.toLowerCase().includes(term)
      );
    });

  function handleAccreditationChange(id, checked) {
    const updated = teachers.map((t) =>
      t.id === id ? { ...t, acreditacion: checked } : t
    );
    setTeachers(updated);
    setUnsaved(true);
  }

  // --- Funciones Simuladas ---
  function handleSave() {
    setUnsaved(false);
    setMessage("✅ Cambios guardados (simulado)");
    setTimeout(() => setMessage(""), 3000);
  }
  function handleExportCourse() {
    setMessage("✅ Exportación de curso (simulada)");
    setShowExport(false);
    setTimeout(() => setMessage(""), 3000);
  }
  function handleExportAll() {
    setMessage("✅ Exportación completa (simulada)");
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

        {/* --- Barra de búsqueda ahora tiene el select --- */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar por Apellido, Nombre, RFC o Curso"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {/* --- Lista desplegable de departamentos --- */}
          <select 
            className={styles.departmentSelect}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Todos los departamentos</option>
            {allDepartments.map(depto => (
              <option key={depto} value={depto}>{depto}</option>
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
                  {/* --- colSpan de 12 a 11 --- */}
                  <td colSpan="11" className={styles.emptyTable}>
                    No hay coincidencias
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
                        checked={t.acreditacion || false}
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
        </div> {/* Fin de .tableWrap */}

        <div className={styles.buttonGroup}>
          <button onClick={handleSave} disabled={!unsaved}>
            Guardar
          </button>
          <button onClick={() => setShowExport(true)}>
            Exportar Listas de Asistencia
          </button>
        </div>
        
      </div> {/* Fin de .mainContentBox */}

      {/* --- Modal --- */}
      {showExport && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Exportar Listas de Asistencia</h3>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Selecciona un curso --</option>
              {allCourses.map((c) => (
                <option key={c} value={c}>
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