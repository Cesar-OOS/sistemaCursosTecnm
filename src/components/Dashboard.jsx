import React, { useState } from "react";
import UploadExcel from "./UploadExcel";
import Module3 from "./Module3";

export default function Principal({ onLogout }) {
  const [screen, setScreen] = useState("upload"); // "upload" o "module3"

  const handleUploadSuccess = () => {
    setScreen("module3");
  };

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "10px" }}>
        <h1>Sistema de Cursos TECNM</h1>
        <button onClick={onLogout}>Cerrar sesión</button>
      </header>

      <main>
        {screen === "upload" && (
          <UploadExcel onUploadSuccess={handleUploadSuccess} />
        )}
        {screen === "module3" && (
          <Module3 onBack={() => setScreen("upload")} />
        )}
      </main>
    </div>
  );
}
