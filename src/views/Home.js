import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Bienvenido a la Gestión de Minutas</h1>
      <p>Selecciona una opción:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={() => navigate("/crear-minuta")}>
          Crear Minuta Semanal
        </button>
        <button onClick={() => navigate("/historial-minutas")}>
          Ver Historial de Minutas
        </button>
        <button onClick={() => navigate("/perfil")}>Ver Perfil</button>
        <button onClick={() => navigate("/ingredientes")}>Ver Ingredientes</button>
        <button onClick={() => navigate("/platos")}>Ver Platos</button>
      </div>
    </div>
  );
};

export default Home;