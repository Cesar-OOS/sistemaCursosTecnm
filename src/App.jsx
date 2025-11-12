import { useEffect, useState } from 'react'; // Importamos useState para manejar el estado del login
import LoginPage from './components/LoginPage'; // Importamos la página de Login
import Principal from './components/Principal'; // Importamos la página Principal
import './App.css';

function App() {
  // Definicion del estado para manejar si el usuario está logueado o no
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Efecto para cambiar el fondo dependiendo del estado de login
  useEffect(() => {
    if (isLoggedIn) {
      document.body.style.backgroundImage = "none"; // Quitar la imagen de fondo al iniciar sesión
      document.body.style.backgroundColor = "#ffffff"; // Cambiar el color de fondo a blanco
    } else {
      document.body.style.backgroundImage = 'linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.4)), url("/fondo.jpg")';
      document.body.style.backgroundColor = ""; // Quitar el color de fondo
    }
  }, [isLoggedIn]); 

  // Función para actualizar el estado cuando el usuario inicia sesión
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Función para actualizar el estado cuando el usuario cierra sesión
  const handleLogout = () => {
    setIsLoggedIn(false);
  }

  // La logica muestra la página de login, o la página principal. Dependiendo del estado de "isLoggedIn"
  return (
    <div className="App">
      <div className="cabecera"></div>
      {isLoggedIn ? <Principal onLogout={handleLogout}/> : <LoginPage onLogin={handleLogin} />} 
    </div>
  );
}

export default App;