import styles from './LoginForm.module.css'; // 1. Importamos los estilos

function LoginForm(props){
    return(
        <div className={styles.container}>
            <h1 className={styles.title}>Inicio de Sesión</h1>

            <label htmlFor="usuario" className={styles.label}>Introduce tu Usuario:</label>
            <input type="text" id="usuario" className={styles.input}/>

            <label htmlFor="contrasenia" className={styles.label}>Introduce tu Contraseña:</label>
            <input type="password" id="contrasenia" className={styles.input}/>

            <button className={styles.button} onClick={props.onLogin}>
                Iniciar Sesion
            </button>
            
            <a href="#" className={styles.forgotPassword}>
                Recuperar la contraseña
            </a>
        </div>
    );
}

export default LoginForm;