import React from "react";
import styles from "./Module4.module.css";

function Module4({ onBack }) {
  // Datos de para los menús desplegables
  const deptoOptions = ["Ciencias Básicas", "Ciencias Económico Administrativas", "Ciencias de la Tierra", "Ingeniería Industrial",
                        "Metal Mecánica", "Química y Bioquímica", "Sistemas Computacionales", "Posgrado"];
  const typeOptions = ["Actualización Profesional","Formación Docente"];
  const acrediptions = ["Si","No","Ambos"];
  const departmentacrediptions = ["Si","No","Ambos"];
  const yearOptions = Array.from({ length: 100 }, (_, i) => (2000 + i).toString());
  const periodOptions = ["Agosto - Diciembre", "Enero - Junio"];

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Volver
      </button>

      {/* --- DIV SUPERIOR (Filtros) --- */}
      <div className={styles.topDiv}>
        {/* Columna 1: Filtros principales */}
        <div className={styles.topCol1}>
          <div className={styles.field}>
            <label>Tipo de capacitación:</label>
            <select>
              <option value="">Selecciona una opción</option>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Departamento:</label>
            <select>
              <option value="">Selecciona una opción</option>
              {deptoOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Año y Periodo en la misma línea */}
          <div className={styles.rowInline}>
            <div className={`${styles.field} ${styles.inlineItem}`}>
              <label>Año:</label>
              <select>
                {yearOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${styles.field} ${styles.inlineItem}`}>
              <label>Periodo:</label>
              <select>
                {periodOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Columna 2: Acreditación */}
        <div className={styles.topCol2}>
          <div className={styles.field}>
            <label>Acreditación:</label>
            <select>
              <option value="">Selecciona una opción</option>
              {acrediptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Columna 3: Botones */}
        <div className={styles.topCol3}>
          <button className={styles.btnPrimary}>Buscar</button>
          <button className={styles.btnSecondary}>Limpiar</button>
        </div>
      </div>

      {/* --- DIV DEL MEDIO (Tabla) --- */}
      <div className={styles.midDiv}>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Año</th>
                <th>Periodo</th>
                <th>Nombre</th>
                <th>AP</th>
                <th>AM</th>
                <th>Licenciatura</th>
                <th>Posgrado</th>
                <th>Acreditado</th>
                <th>Capacitación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="9" className={styles.emptyRow}>
                  No hay datos para mostrar
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DIV INFERIOR (Estadísticas y Exportar) --- */}
      <div className={styles.botDiv}>
        {/* Columna 1: Estadísticas */}
        <div className={styles.botCol1}>
          <p>
            Número total de docentes: <strong>...</strong>
          </p>
          <p>
            Número total de docentes que tomaron curso de capacitación: <strong>...</strong>
          </p>
          <p>
            (%) de docentes que tomaron algún curso de capacitación: <strong>...%</strong>
          </p>
          <p>
            Número total de participantes de nivel posgrado (AP): <strong>...</strong>
          </p>
        </div>

        {/* Columna 2: Exportar */}
        <div className={styles.botCol2}>
          <label>Formato de archivo:</label>
          <select>
            <option value="excel">Excel (.xlsx)</option>
            <option value="pdf">PDF (.pdf)</option>
          </select>
          <button className={styles.btnPrimary}>Exportar</button>
        </div>
      </div>
    </div>
  );
}

export default Module4;
