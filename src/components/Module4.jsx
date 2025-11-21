import React, { useState, useEffect } from "react";
import styles from "./Module4.module.css";

// --- 1. IMPORTAR TOASTIFY ---
import { toast } from 'react-toastify';

// URL del backend
const API_URL = "http://localhost:4000/api";

function Module4({ onBack }) {
  // --- Estados de Filtros ---
  const [filters, setFilters] = useState({
    tipo: "",
    departamento: "",
    anio: "2025",
    periodo: "Enero - Junio",
    acreditado: "" 
  });

  // --- Estados de Datos ---
  const [deptosOptions, setDeptosOptions] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [stats, setStats] = useState({
    totalDocentes: 0,
    capacitados: 0,
    porcentaje: 0,
    totalPosgrado: 0
  });

  // Estado para el formato de exportación
  const [exportFormat, setExportFormat] = useState("excel");
  const [isExporting, setIsExporting] = useState(false);

  // Opciones estáticas
  const typeOptions = ["Actualización Profesional", "Formación Docente"];
  const acrediptions = ["Si", "No", "Ambos"];
  const yearOptions = Array.from({ length: 10 }, (_, i) => (2024 + i).toString());
  const periodOptions = ["Agosto - Diciembre", "Enero - Junio"];

  // --- Cargar Datos Iniciales ---
  useEffect(() => {
    fetch(`${API_URL}/module3/departments`)
      .then(res => res.json())
      .then(data => setDeptosOptions(data))
      .catch(err => console.error("Error cargando departamentos:", err));

    fetch(`${API_URL}/module4/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error cargando estadísticas:", err));
  }, []);

  // --- Manejo de Inputs ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // --- Buscar ---
  const handleSearch = async () => {
    try {
      const response = await fetch(`${API_URL}/module4/table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await response.json();
      setTableData(data);
      
      if (data.length > 0) {
        toast.success(`Se encontraron ${data.length} registros`);
      } else {
        toast.info("No se encontraron resultados con los filtros actuales");
      }

    } catch (error) {
      console.error("Error buscando datos:", error);
      toast.error("Error al buscar datos en el servidor");
    }
  };

  // --- Limpiar ---
  const handleClean = () => {
    setFilters({
      tipo: "",
      departamento: "",
      anio: "2025",
      periodo: "Enero - Junio",
      acreditado: ""
    });
    setTableData([]);
    toast.info("Filtros limpiados");
  };

  // --- EXPORTAR ---
  const handleExport = async () => {
    // Validación: Debe haber datos en la tabla
    if (tableData.length === 0) {
      toast.warn("Primero debes realizar una búsqueda con resultados para poder exportar.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Generando archivo...");

    try {
      const response = await fetch(`${API_URL}/module4/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: exportFormat,
          filters: filters // Enviamos los filtros para que el backend genere la misma data
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.update(toastId, { render: `✅ Archivo guardado en Documentos`, type: "success", isLoading: false, autoClose: 5000 });
      } else {
        toast.update(toastId, { render: `❌ Error: ${result.message}`, type: "error", isLoading: false, autoClose: 5000 });
      }

    } catch (error) {
      console.error(error);
      toast.update(toastId, { render: "❌ Error de conexión al exportar", type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Volver
      </button>

      {/* --- DIV SUPERIOR (Filtros) --- */}
      <div className={styles.topDiv}>
        <div className={styles.topCol1}>
          <div className={styles.field}>
            <label>Tipo de capacitación:</label>
            <select name="tipo" value={filters.tipo} onChange={handleInputChange}>
              <option value="">Selecciona una opción</option>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Departamento:</label>
            <select name="departamento" value={filters.departamento} onChange={handleInputChange}>
              <option value="">Selecciona una opción</option>
              {deptosOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className={styles.rowInline}>
             <div className={`${styles.field} ${styles.inlineItem}`}>
              <label>Año:</label>
              <select name="anio" value={filters.anio} onChange={handleInputChange}>
                <option value="">Todos</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

             <div className={`${styles.field} ${styles.inlineItem}`}>
              <label>Periodo:</label>
              <select name="periodo" value={filters.periodo} onChange={handleInputChange}>
                <option value="">Todos</option>
                {periodOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.topCol2}>
          <div className={styles.field}>
            <label>Acreditado:</label>
            <select name="acreditado" value={filters.acreditado} onChange={handleInputChange}>
              <option value="">Selecciona una opción</option>
              {acrediptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.topCol3}>
          <button className={styles.btnSearch} onClick={handleSearch}>
            Buscar
          </button>
          <button className={styles.btnClean} onClick={handleClean}>
            Limpiar
          </button>
        </div>
      </div>

      {/* --- DIV CENTRAL (Tabla) --- */}
      <div className={styles.midDiv}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>AP</th>
                <th>AM</th>
                <th>Año</th>
                <th>Periodo</th>
                <th>Licenciatura</th>
                <th>Posgrado</th>
                <th>Acreditado</th>
                <th>Capacitación</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.emptyRow}>
                    No hay datos para mostrar
                  </td>
                </tr>
              ) : (
                tableData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.nombres}</td>
                    <td>{row.ap}</td>
                    <td>{row.am}</td>
                    <td>{row.anio}</td>
                    <td>{row.periodo}</td>
                    <td>{row.licenciatura}</td>
                    <td>{row.posgrado}</td>
                    <td>{row.acreditado}</td>
                    <td>{row.capacitacion_nombre}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DIV INFERIOR (Estadísticas y Exportar) --- */}
      <div className={styles.botDiv}>
        <div className={styles.botCol1}>
          <p>
            Número total de docentes: <strong>{stats.totalDocentes}</strong>
          </p>
          <p>
            Número total de docentes que tomaron curso de capacitación: <strong>{stats.capacitados}</strong>
          </p>
          <p>
            (%) de docentes que tomaron algún curso de capacitación: <strong>{stats.porcentaje}%</strong>
          </p>
          <p>
            Número total de participantes de nivel posgrado (AP): <strong>{stats.totalPosgrado}</strong>
          </p>
        </div>

        <div className={styles.botCol2}>
          <label>Formato de archivo:</label>
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
            <option value="excel">Excel (.xlsx)</option>
            <option value="pdf">PDF (.pdf)</option>
          </select>
          <button 
            className={styles.btnPrimary} 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Guardando..." : "Exportar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Module4;