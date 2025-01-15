import React, { useEffect, useState } from 'react';
import './Header.css';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const Header = () => {
  
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleError = (error) => {
    console.error(`Error al cargar los datos del usuario: ${error}`);
    alert("Error en la sesión. Redirigiendo al inicio de sesión.");
    navigate('/login');
  };

  useEffect(() => {
    const userId = localStorage.getItem("id_user");
    const token = localStorage.getItem('token')?.trim();
    
    if (!token) {
      handleError(new Error('Token inválido'));
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        handleError(err);
      }
    };
    
    if (userId) {
      fetchUser();
    } else {
      handleError(new Error('Usuario no encontrado'));
    }
  }, []);

  return (
    <header className="app-header">
      <div className="header-content">
        {location.pathname !== '/home' ? (
          <Link to="/home"> 
              <img src='/LOGO_GM_EXPRESS.png' className="app-logo" alt="logo" />
          </Link>
        ) : (
          <span>
              <img src='/LOGO_GM_EXPRESS.png' className="app-logo" alt="logo" />
          </span>
        )}
        {user && (
          <div className="profile-container">
            <div>
              <img
                src={user.profilePicture || (user.role === "admin" ? "/logo_admin.png" : "/logo_user.png")}
                alt="Perfil"
                className="profile-image"
              />
            </div>
            <div className="info-container">  
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-email">{user.email}</p>
              <p className="profile-role">{user.role}</p>
              <button
                className="logout-button"
                onClick={() => {
                  localStorage.clear();
                  alert("Cerraste sesión");
                  window.location.replace("/login");
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )};
      </div>
    </header>
  );
};

export default Header;