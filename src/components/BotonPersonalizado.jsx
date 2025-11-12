function BotonPersonalizado(props){
    function manejarClick(){
        alert('Botón presionado')
    }

    return(
        <button onClick = {manejarClick}>
            {props.texto}
        </button>
    );
}

// Esta línea permite que otros archivos importen el componente
export default BotonPersonalizado;