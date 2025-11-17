import React, { useState, useEffect } from "react";
import styles from "./Module3.module.css";

const API_URL = "http://localhost:4000/api";

export default function Module3({ onBack, refreshTrigger }) {
  const [teachers, setTeachers] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [filter, setFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [message, setMessage] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  // Recargar datos cada vez que refreshTrigger cambie
  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      const deptRes = await fetch(`${API_URL}/module3/departments`);
      const deptos = await deptRes.json();
      setAllDepartments(deptos);

      const dataRes = await fetch(`${API_URL}/module3/data`);
      const data = await dataRes.json();

      const dataWithAccred = data.map(t => ({
        ...t,
        acreditacion: t.acreditacion === 1
      }));

      setTeachers(dataWithAccred);
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    }
  };

  // Guardar cambios de acreditación
  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/module3/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teachers)
      });

      if (!response.ok) throw new Error("No se pudieron guardar los cambios");

      const result = await response.json();
      if (result.success) {
        setUnsaved(false);
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error al guardar: ${err.message}`);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleBackClick = () => {
    if (unsaved && !window.confirm("Tiene cambios sin guardar. ¿Desea salir?")) return;
    onBack();
  };

  // Manejar cambio de acreditación
  const handleAccreditationChange = (id, value) => {
    setTeachers(prev =>
      prev.map(t => t.id === id ? { ...t, acreditacion: value } : t)
    );
    setUnsaved(true);
  };

  const allCourses = Array.from(new Set(teachers.map(t => t.curso).filter(Boolean)));

  // Filtrado de búsqueda y departamento
  const filtered = teachers.filter(t => {
    const matchesText = 
      t.ap.toLowerCase().includes(filter.toLowerCase()) ||
      t.am.toLowerCase().includes(filter.toLowerCase()) ||
      t.nombres.toLowerCase().includes(filter.toLowerCase()) ||
      t.rfc.toLowerCase().includes(filter.toLowerCase()) ||
      (t.curso || "").toLowerCase().includes(filter.toLowerCase());

    const matchesDept = departmentFilter ? t.departamento_id === departmentFilter : true;

    return matchesText && matchesDept;
  });

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={handleBackClick}>← Volver</button>
      <h2 className={styles.title}>Módulo de Visualización y Acreditación Docente</h2>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar por Apellido, Nombre, RFC o Curso"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select
          className={styles.departmentSelect}
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
        >
          <option value="">Todos los departamentos</option>
          {allDepartments.map((d, idx) => (
            <option key={idx} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Apellido P</th>
              <th>Apellido M</th>
              <th>Nombres</th>
              <th>RFC</th>
              <th>Sexo</th>
              <th>Puesto</th>
              <th>Curso</th>
              <th>Capacitación</th>
              <th>Facilitador</th>
              <th>Periodo</th>
              <th>Acreditación</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="11" className={styles.emptyTable}>Cargando datos o no hay coincidencias...</td>
              </tr>
            ) : (
              filtered.map(t => (
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
                      onChange={e => handleAccreditationChange(t.id, e.target.checked)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={handleSave} disabled={!unsaved}>Guardar</button>
        <button onClick={() => setShowExport(true)}>Exportar Listas de Asistencia</button>
      </div>

      {showExport && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Exportar Listas de Asistencia</h3>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Selecciona un curso --</option>
              {allCourses.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>

            <div className={styles.modalButtons}>
              <button onClick={() => setShowExport(false)} disabled={!selectedCourse}>Exportar Curso</button>
              <button onClick={() => setShowExport(false)}>Exportar Todo</button>
              <button onClick={() => setShowExport(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
