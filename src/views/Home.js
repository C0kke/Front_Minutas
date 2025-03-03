import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './styles/Home.css'; // Asegúrate de importar el CSS
import Header from "../components/Header";

const BACKEND_URL = process.env.REACT_APP_BACK_URL;

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token')?.trim();// Cambia según cómo guardes el token
  const userId = localStorage.getItem("id_user");

  if (localStorage.getItem('session')) {
    localStorage.removeItem('session');
    setTimeout(function() {
      alert('Inicio de sesión exitoso');
    }, 500); 
  }

  // Función para obtener los datos del usuario
  const fetchUser = async () => {// Asegúrate de que el userId esté disponible
    if (!userId) {
      console.error("User ID is missing");
      return;
    }
  
    try {
      const response = await axios.get(`${BACKEND_URL}user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  // Lógica para mostrar las vistas según el rol del usuario
  const renderButtonsBasedOnRole = (role) => {
    if (role === "admin") {
      return (
        <>
          <button className="home-button" onClick={() => navigate("/usuarios")}>
            Crear / Editar Usuarios
          </button>
          <button className="home-button" onClick={() => navigate("/aprobarmenu")}>
            Aprobar Minuta
          </button>
          <button className="home-button" onClick={() => navigate("/proyecciones")}>
            Ver Proyecciones
          </button>
          <button className="home-button" onClick={() => navigate("/calculoingrediente")}>
            Generar Reporte
          </button>
          <button className="home-button" onClick={() => navigate("/menuhistorico")}>
            Ver Historial de Minutas
          </button>
          <button className="home-button" onClick={() => navigate("/estructura")}>
            Ver Estructra Alimentaria
          </button>
          <button className="home-button" onClick={() => navigate("/crear-minuta")}>
            Crear Minuta Semanal
          </button>
          <button className="home-button" onClick={() => navigate("/editarmenu")}> 
            Editar Minutas 
          </button>    
          <button className="home-button" onClick={() => navigate("/listaingredientes")}>
            Ver Ingredientes
          </button>
          <button className="home-button" onClick={() => navigate("/platos")}>
            Ver Platos
          </button>
          <button className="home-button" onClick={() => navigate("/sucursales")}>
            Ver Sucursales
          </button>
        </>
      );
    } else if ( role === "logistica") {
      return (
        <>
          <button className="home-button" onClick={() => navigate("/menuhistorico")}>
            Ver Historial de Minutas
          </button>
        
          <button className="home-button" onClick={() => navigate("/proyecciones")}>
            Ver Proyecciones
          </button>

        </>
      );
    } else if (role === "nutricionista") {
      return (
        <>
          <button className="home-button" onClick={() => navigate("/crear-minuta")}>
            Crear Minuta Semanal
          </button>
          <button className="home-button" onClick={() => navigate("/editarmenu")}> 
            Editar Minutas 
          </button> 
          <button className="home-button" onClick={() => navigate("/menuhistorico")}>
            Ver Historial de Minutas
          </button>
          <button className="home-button" onClick={() => navigate("/listaingredientes")}>
            Ver Ingredientes
          </button>
          <button className="home-button" onClick={() => navigate("/platos")}>
            Ver Platos
          </button>
          <button className="home-button" onClick={() => navigate("/calculoingrediente")}>
            Generar Reporte
          </button>
          <button className="home-button" onClick={() => navigate("/proyecciones")}>
            Ver Proyecciones
          </button>
        </>
      );
    }
    return null;
  };

  return (
    <div>
      <Header />
      <div className="home-container">
        <h1>Bienvenido a la Gestión de Minutas</h1>
        <p>Selecciona una opción:</p>
        <div className="buttons-container">
          {user && renderButtonsBasedOnRole(user.role)} {/* Pasamos el role directamente a la función */}
        </div>
      </div>
    </div>
  );
};

export default Home;