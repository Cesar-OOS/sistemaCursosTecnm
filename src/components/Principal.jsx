import { useState } from 'react';
import styles from './Principal.module.css';
import Module1 from './Module1'; // Importamos el componente del Módulo 1
import Module2 from './Module2'; // Importamos el componente del Módulo 2
import Module3 from './Module3'; // Importamos el componente del Módulo 3
import Module4 from './Module4'; // Importamos el componente del Módulo 4
import Module5 from './Module5'; // Importamos el componente del Módulo 5
import Module6 from './Module6'; // Importamos el componente del Módulo 6

import icono1 from './Icons/modulo1.png'; // Importamos el icono del Módulo 1
import icono2 from './Icons/modulo2.png'; // Importamos el icono del Módulo 2
import icono3 from './Icons/modulo3.png'; // Importamos el icono del Módulo 3
import icono4 from './Icons/modulo4.png'; // Importamos el icono del Módulo 4
import icono5 from './Icons/modulo5.png'; // Importamos el icono del Módulo 5
import icono6 from './Icons/modulo6.png'; // Importamos el icono del Módulo 6

function Principal(props) {
  const [selectedModule, setSelectedModule] = useState("none");

  // Función para volver al menú principal
  const handleBack = () => {
    setSelectedModule("none");
  };

  // Switch para decidir qué renderizar
  switch (selectedModule) {
    // Renderizamos el Módulo 1 si está seleccionado
    case "module1": return <Module1 onBack={handleBack} />;

    // Renderizamos el Módulo 2 si está seleccionado
    case "module2": return <Module2 onBack={handleBack} />;

    // Renderizamos el Módulo 3 si está seleccionado
    case "module3": return <Module3 onBack={handleBack} />;

    // Renderizamos el Módulo 4 si está seleccionado
    case "module4": return <Module4 onBack={handleBack} />;

    // Renderizamos el Módulo 5 si está seleccionado
    case "module5": return <Module5 onBack={handleBack} />;

    case "module6": return <Module6 onBack={handleBack} />;

    default:
      // Si no hay módulo seleccionado, mostramos la pantalla principal
      return (
        <div>
          <div className={styles.principalContainer}>
            {/* Primer Modulo */}
            <div className={styles.container} onClick={() => setSelectedModule("module1")}>
              <h1 className={styles.title}>Importación de archivos</h1>
              <img src={icono1} alt="Modulo 1" className={styles.icon}/>
              <p className={styles.description}>Importar información externa hacia el sistema</p>
            </div>

            {/* Segundo Modulo */}
            <div className={styles.container} onClick={() => setSelectedModule("module2")}>
              <h1 className={styles.title}>Modificación de datos</h1>
              <img src={icono2} alt="Modulo 2" className={styles.icon}/>
              <p className={styles.description}>Ajustar o modificar los datos del sistema</p>
            </div>

            {/* Tercer Modulo */}
            <div className={styles.container} onClick={() => setSelectedModule("module3")}>
              <h1 className={styles.title}>Acreditación Docente</h1>
              <img src={icono3} alt="Modulo 3" className={styles.icon}/>
              <p className={styles.description}>Visualizar datos de los docentes</p>
            </div>

            {/* Cuarto Modulo */}
            <div className={styles.container} onClick={() => setSelectedModule("module4")}>
              <h1 className={styles.title}>Busqueda y Estadísticas</h1>
              <img src={icono4} alt="Modulo 4" className={styles.icon}/>
              <p className={styles.description}>Realizar busqueda de estadísticas del sistema</p>
            </div>

            {/* Quinto Modulo */}
            <div className={styles.container} onClick={() => setSelectedModule("module5")}>
              <h1 className={styles.title}>Exportacion de Reconocimientos</h1>
              <img src={icono5} alt="Modulo 5" className={styles.icon}/>
              <p className={styles.description}>Generar documentos de reconocimiento</p>
            </div>
            
            {/* Sexto Modulo */}
            <div className={styles.container} onClick={() => setSelectedModule("module6")}>
              <h1 className={styles.title}>Copias de Seguridad</h1>
              <img src={icono6} alt="Modulo 6" className={styles.icon}/>
              <p className={styles.description}>Crear copias de seguridad de la información en el sistema</p>
            </div>
          </div>

          {/* Boton para Cerrar Sesion */}
          <button className={styles.logoutButton} onClick={props.onLogout}>
            Cerrar Sesion
          </button>
        </div>
      );
  }
}

export default Principal;

// Icono del modulo1 diseñado por: "https://www.flaticon.es/autores/Dreamstale" Dreamstale, from"https://www.flaticon.es/" www.flaticon.es
// Icono del modulo2 diseñado por: "https://www.flaticon.es/autores/Uniconlabs" Uniconlabs, from"https://www.flaticon.es/" www.flaticon.es
// Icono del modulo3 diseñado por: "https://www.flaticon.es/autores/freepik" freepik, from"https://www.flaticon.es/" www.flaticon.es
// Icono del modulo4 diseñado por: "https://www.flaticon.es/autores/freepik" freepik, from"https://www.flaticon.es/" www.flaticon.es
// Icono del modulo5 diseñado por: "https://www.flaticon.es/autores/freepik" freepik, from"https://www.flaticon.es/" www.flaticon.es
// Icono del modulo6 diseñado por: "https://www.flaticon.es/autores/juicy-fish" juicy_fish, from"https://www.flaticon.es/" www.flaticon.es