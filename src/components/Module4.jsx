import React, { useState, useEffect } from "react";
import styles from "./Module4.module.css";
import { toast } from 'react-toastify';

const API_URL = "http://localhost:4000/api";

function Module4({ onBack }) {
  const [filters, setFilters] = useState({
    tipo: "",
    departamento: "",
    anio: "2025",
    periodo: "Enero - Junio",
    acreditado: ""
  });

  const [deptosOptions, setDeptosOptions] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [stats, setStats] = useState({
    totalDocentes: 0, capacitados: 0, porcentaje: 0, totalPosgrado: 0
  });

  const [exportFormat, setExportFormat] = useState("excel");
  const [isExporting, setIsExporting] = useState(false);

  const typeOptions = ["Actualización Profesional", "Formación Docente"];
  const acrediptions = ["Si", "No", "Ambos"];
  const yearOptions = Array.from({ length: 10 }, (_, i) => (2024 + i).toString());
  const periodOptions = ["Agosto - Diciembre", "Enero - Junio"];

  // Carga Inicial
  useEffect(() => {
    // Departamentos
    fetch(`${API_URL}/module3/departments`)
      .then(res => res.json())
      .then(data => setDeptosOptions(data))
      .catch(() => toast.error("Error cargando departamentos"));

    // Estadísticas Globales Iniciales (Filtros vacíos)
    fetchStats({});
  }, []);

  // Función auxiliar para pedir estadísticas
  const fetchStats = (currentFilters) => {
    fetch(`${API_URL}/module4/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFilters)
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => console.error("Error actualizando estadísticas"));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // BUSCAR: Actualiza Tabla Y Estadísticas
  const handleSearch = async () => {
    try {
      // 1. Tabla
      const response = await fetch(`${API_URL}/module4/table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await response.json();
      setTableData(data);
      
      if (data.length > 0) toast.success(`Se encontraron ${data.length} registros`);
      else toast.info("No se encontraron resultados");

      // 2. Actualizar Estadísticas con los filtros actuales
      fetchStats(filters);

    } catch (error) {
      toast.error("Error al buscar datos");
    }
  };

  // --- Limpiar ---
  const handleClean = () => {
    // 1. Restablecer los inputs visuales a sus valores por defecto
    setFilters({
      tipo: "",
      departamento: "",
      anio: "2025",           // Visualmente vuelve a 2025
      periodo: "Enero - Junio", // Visualmente vuelve al periodo 1
      acreditado: ""
    });
    
    setTableData([]); // Limpiar la tabla
    
    // 2. Pedir estadísticas GLOBALES (Truco: Enviar objeto vacío)
    // Al enviar {}, el backend ignora el año y periodo por defecto, calculando todo el historial.
    fetchStats({}); 
    
    toast.info("Filtros limpiados. Mostrando estadísticas globales.");
  };

  const handleExport = async () => {

    setIsExporting(true);
    const toastId = toast.loading("Generando reporte de métricas...");

    try {
      const response = await fetch(`${API_URL}/module4/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: filters // Enviamos los filtros (especialmente 'departamento')
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.update(toastId, { render: `✅ ${result.message}`, type: "success", isLoading: false, autoClose: 5000 });
      } else {
        toast.update(toastId, { render: `❌ Error: ${result.message}`, type: "error", isLoading: false, autoClose: 5000 });
      }

    } catch (error) {
      toast.update(toastId, { render: "❌ Error de conexión", type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={onBack}>← Volver</button>

      <div className={styles.topDiv}>
        <div className={styles.topCol1}>
          <div className={styles.field}>
            <label>Tipo de capacitación:</label>
            <select name="tipo" value={filters.tipo} onChange={handleInputChange}>
              <option value="">Selecciona una opción</option>
              {typeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Departamento:</label>
            <select name="departamento" value={filters.departamento} onChange={handleInputChange}>
              <option value="">Selecciona una opción</option>
              {deptosOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className={styles.rowInline}>
             <div className={`${styles.field} ${styles.inlineItem}`}>
              <label>Año:</label>
              <select name="anio" value={filters.anio} onChange={handleInputChange}>
                <option value="">Todos</option>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
             <div className={`${styles.field} ${styles.inlineItem}`}>
              <label>Periodo:</label>
              <select name="periodo" value={filters.periodo} onChange={handleInputChange}>
                <option value="">Todos</option>
                {periodOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.topCol2}>
          <div className={styles.field}>
            <label>Acreditado:</label>
            <select name="acreditado" value={filters.acreditado} onChange={handleInputChange}>
              <option value="">Selecciona una opción</option>
              {acrediptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.topCol3}>
          <button className={styles.btnSearch} onClick={handleSearch}>Buscar</button>
          <button className={styles.btnClean} onClick={handleClean}>Limpiar</button>
        </div>
      </div>

      <div className={styles.midDiv}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {/* CAMBIO: Columnas actualizadas */}
                <th>Nombre Completo</th>
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
                <tr><td colSpan="7" className={styles.emptyRow}>No hay datos para mostrar</td></tr>
              ) : (
                tableData.map((row, idx) => (
                  <tr key={idx}>
                    {/* CAMBIO: Datos actualizados */}
                    <td>{row.nombre_completo}</td>
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

      <div className={styles.botDiv}>
        <div className={styles.botCol1}>
          {/* Estadísticas Dinámicas */}
          <p>Número total de docentes (en selección): <strong>{stats.totalDocentes}</strong></p>
          <p>Número total de docentes que tomaron curso de capacitación: <strong>{stats.capacitados}</strong></p>
          <p>(%) de docentes que tomaron algún curso de capacitación: <strong>{stats.porcentaje}%</strong></p>
          <p>Número total de participantes de nivel posgrado (AP): <strong>{stats.totalPosgrado}</strong></p>
        </div>

        <div className={styles.botCol2}>
          <label>Exportar información a un archivo Excel</label>
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