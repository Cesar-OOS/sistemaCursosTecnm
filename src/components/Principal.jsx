import { useState } from 'react';
import styles from './Principal.module.css';
import Module1 from './Module1'; 
import Module2 from './Module2'; 
import Module3 from './Module3'; 
import Module4 from './Module4'; 
import Module5 from './Module5'; 
import Module6 from './Module6'; 

import icono1 from './Icons/modulo1.png'; 
import icono2 from './Icons/modulo2.png'; 
import icono3 from './Icons/modulo3.png'; 
import icono4 from './Icons/modulo4.png'; 
import icono5 from './Icons/modulo5.png'; 
import icono6 from './Icons/modulo6.png'; 

function Principal(props) {
  const [selectedModule, setSelectedModule] = useState("none");
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger para refrescar Module3

  // Función para volver al menú principal
  const handleBack = () => setSelectedModule("none");

  // Función que incrementa refreshTrigger cuando Module1 termina de subir archivos
  const handleUploadComplete = () => setRefreshTrigger(prev => prev + 1);

  // Switch para decidir qué módulo renderizar
  switch (selectedModule) {
    case "module1": 
      return <Module1 onBack={handleBack} onUploadComplete={handleUploadComplete} />;

    case "module2": 
      return <Module2 onBack={handleBack} />;

    case "module3": 
      return <Module3 onBack={handleBack} refreshTrigger={refreshTrigger} />;

    case "module4": 
      return <Module4 onBack={handleBack} />;

    case "module5": 
      return <Module5 onBack={handleBack} />;

    case "module6": 
      return <Module6 onBack={handleBack} />;

    default:
      return (
        <div>
          <div className={styles.principalContainer}>
            <div className={styles.container} onClick={() => setSelectedModule("module1")}>
              <h1 className={styles.title}>Importación de archivos</h1>
              <img src={icono1} alt="Modulo 1" className={styles.icon}/>
              <p className={styles.description}>Importar información externa hacia el sistema</p>
            </div>

            <div className={styles.container} onClick={() => setSelectedModule("module2")}>
              <h1 className={styles.title}>Modificación de datos</h1>
              <img src={icono2} alt="Modulo 2" className={styles.icon}/>
              <p className={styles.description}>Ajustar o modificar los datos del sistema</p>
            </div>

            <div className={styles.container} onClick={() => setSelectedModule("module3")}>
              <h1 className={styles.title}>Acreditación Docente</h1>
              <img src={icono3} alt="Modulo 3" className={styles.icon}/>
              <p className={styles.description}>Visualizar datos de los docentes</p>
            </div>

            <div className={styles.container} onClick={() => setSelectedModule("module4")}>
              <h1 className={styles.title}>Busqueda y Estadísticas</h1>
              <img src={icono4} alt="Modulo 4" className={styles.icon}/>
              <p className={styles.description}>Realizar busqueda de estadísticas del sistema</p>
            </div>

            <div className={styles.container} onClick={() => setSelectedModule("module5")}>
              <h1 className={styles.title}>Exportacion de Reconocimientos</h1>
              <img src={icono5} alt="Modulo 5" className={styles.icon}/>
              <p className={styles.description}>Generar documentos de reconocimiento</p>
            </div>

            <div className={styles.container} onClick={() => setSelectedModule("module6")}>
              <h1 className={styles.title}>Copias de Seguridad</h1>
              <img src={icono6} alt="Modulo 6" className={styles.icon}/>
              <p className={styles.description}>Crear copias de seguridad de la información en el sistema</p>
            </div>
          </div>

          <button className={styles.logoutButton} onClick={props.onLogout}>
            Cerrar Sesion
          </button>
        </div>
      );
  }
}

export default Principal;
