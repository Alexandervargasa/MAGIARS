import React, { useEffect, useState } from "react";

function Home() {
  const [mensaje, setMensaje] = useState("Cargando...");

  useEffect(() => {
    // Llamada al backend
    fetch("http://localhost:4000/")
      .then((res) => res.json())
      .then((data) => setMensaje(data.message))
      .catch(() => setMensaje("Error al conectar con el backend"));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🏠 Página de inicio</h1>
      <p>Respuesta del backend:</p>
      <h3>{mensaje}</h3>
    </div>
  );
}

export default Home;
