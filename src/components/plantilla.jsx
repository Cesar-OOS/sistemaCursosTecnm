import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BotonPersonalizado from './components/BotonPersonalizado'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Mi primera app con React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>

      <hr/> {/* Una línea para separar */}
      
      {/* Usar el componente personalizado varias veces*/}

      <BotonPersonalizado texto = "Enviar"/>
      <BotonPersonalizado texto = "borrar"/>
    </>
  )
}

export default App
