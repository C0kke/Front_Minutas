import React from "react";
import { useNavigate } from "react-router-dom";
import './styles/Home.css'; // Asegúrate de importar el CSS

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Bienvenido a la Gestión de Minutas</h1>
      <p>Selecciona una opción:</p>
      <div className="buttons-container">
        <button className="home-button" onClick={() => navigate("/crear-minuta")}>
          Crear Minuta Semanal
        </button>
        <button className="home-button" onClick={() => navigate("/menuhistorico")}>
          Ver Historial de Minutas
        </button>
        <button className="home-button" onClick={() => navigate("/perfil")}>
          Ver Perfil
        </button>
        <button className="home-button" onClick={() => navigate("/listaingredientes")}>
          Ver Ingredientes
        </button>
        <button className="home-button" onClick={() => navigate("/platos")}>
          Ver Platos
        </button>
      </div>
    </div>
  );
};

export default Home;
