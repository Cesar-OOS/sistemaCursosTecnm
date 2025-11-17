// Archivo: src/components/LoginForm.jsx

import React, { useState } from 'react';
import styles from './LoginForm.module.css';

// --- 1. IMPORTAR TOAST ---
import { toast } from 'react-toastify';

// Importamos Firebase Auth y Firestore (como los tenías)
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

function LoginForm() {
  // Estados para los inputs (sin cambios)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  
  // Estados para el modal de recuperación (sin cambios)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  const findEmailByUsername = async (userToFind) => {
    try {
      const q = query(collection(db, "usuarios"), where("username", "==", userToFind));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      return querySnapshot.docs[0].data().email;
    } catch (err) {
      console.error("Error buscando usuario:", err);
      return null;
    }
  };

  // --- 3. MODIFICAR HANDLELOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    // Ya no necesitamos limpiar mensajes

    try {
      const emailFound = await findEmailByUsername(username);

      if (!emailFound) {
        // --- USAR TOAST EN LUGAR DE SETERROR ---
        toast.error("Usuario no encontrado.");
        return;
      }

      await signInWithEmailAndPassword(auth, emailFound, password);
      // (App.jsx detectará el login)

    } catch (err) {
      // --- USAR TOAST EN LUGAR DE SETERROR ---
      toast.error("Usuario o contraseña incorrectos.");
    }
  };

  // --- 4. MODIFICAR PREPARERESET ---
  const handlePrepareReset = async (e) => {
    e.preventDefault();

    if (!username) {
      // --- USAR TOAST DE ADVERTENCIA ---
      toast.warn("Por favor, escribe tu NOMBRE DE USUARIO para recuperar la contraseña.");
      return;
    }

    setIsSearchingEmail(true);
    const emailFound = await findEmailByUsername(username);
    setIsSearchingEmail(false);

    if (emailFound) {
      setResetEmail(emailFound);
      setShowResetModal(true);
    } else {
      // --- USAR TOAST DE ERROR ---
      toast.error("No se encontró un correo asociado a ese nombre de usuario.");
    }
  };

  // --- 5. MODIFICAR CONFIRMRESET ---
  const confirmReset = () => {
    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        // --- USAR TOAST DE ÉXITO ---
        toast.success(`Se ha enviado la nueva contraseña a: ${resetEmail}`, { autoClose: 7000 });
        setShowResetModal(false);
      })
      .catch((err) => {
        // --- USAR TOAST DE ERROR ---
        toast.error("Error al enviar el correo. Intente más tarde.");
        setShowResetModal(false);
      });
  };

  return (
    <div className={styles.wrapper}>
      
      <form className={styles.container} onSubmit={handleLogin}>
        <h1 className={styles.title}>Inicio de Sesión</h1>

        <label htmlFor="username" className={styles.label}>Nombre de Usuario:</label>
        <input
          type="text"
          id="username"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ej. profesora123"
          required
        />

        <label htmlFor="contrasenia" className={styles.label}>Contraseña:</label>
        <input
          type="password"
          id="contrasenia"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className={styles.button}>
          Iniciar Sesion
        </button>
        
        <a href="#" className={styles.forgotPassword} onClick={handlePrepareReset}>
          {isSearchingEmail ? "Buscando..." : "Recuperar la contraseña"}
        </a>
      </form>

      {/* --- El Modal de Confirmación (sin cambios) --- */}
      {showResetModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Recuperación</h3>
            <p>¿Deseas enviar un enlace para restablecer la contraseña a la siguiente dirección?</p>
            <p className={styles.emailHighlight}>{resetEmail}</p>
            
            <div className={styles.modalButtons}>
              <button onClick={confirmReset} className={styles.btnConfirm}>
                Aceptar
              </button>
              <button onClick={() => setShowResetModal(false)} className={styles.btnCancel}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default LoginForm;