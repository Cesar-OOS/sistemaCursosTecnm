import { useEffect, useState } from 'react';
import LoginPage from './components/LoginPage';
import Principal from './components/Principal';
import './App.css';

// --- 1. IMPORTAR TOASTIFY ---
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // <-- ¡Muy importante! Importa el CSS

// Importaciones de Firebase (como las tenías)
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// Pega tu configuración de Firebase aquí
const firebaseConfig = {
  apiKey: "AIzaSyC0IMY8nEoBfCXZyNQ1FC8AvySCKXj4r1w",
  authDomain: "sistema-cursos-tecnm.firebaseapp.com",
  projectId: "sistema-cursos-tecnm",
  storageBucket: "sistema-cursos-tecnm.firebasestorage.app",
  messagingSenderId: "613342436422",
  appId: "1:613342436422:web:b49c221d41cde8610e3e47"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Oyente de autenticación (sin cambios)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Efecto para cambiar el fondo (sin cambios)
  useEffect(() => {
    if (user) {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "#ffffff";
    } else {
      document.body.style.backgroundImage = 'linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.4)), url("/fondo.jpg")';
      document.body.style.backgroundColor = "";
    }
  }, [user]);

  // Logout (sin cambios)
  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  };

  if (loadingAuth) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="App">
      
      {/* --- 2. AÑADIR EL CONTENEDOR DE TOASTS --- */}
      {/* Puedes configurarlo (ej. position="top-center") */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      {/* La cabecera global (como la tenías) */}
      <div className="cabecera"></div>

      {/* Lógica condicional (sin cambios) */}
      {user ? <Principal onLogout={handleLogout} /> : <LoginPage />}
    
    </div>
  );
}

export default App;