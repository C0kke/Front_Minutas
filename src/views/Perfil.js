import React, { useEffect, useState } from "react";
import axios from "axios";
import './styles/perfil.css'; // Importa el CSS aquí
import Header from "../components/Header";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("id_user");
    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setError(new Error("No autorizado. Inicie sesión."));
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        setError("Error al cargar los datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    } else {
      setError("ID de usuario no encontrado");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div>
      <Header/>
      <div className="profile-container">
      <img
        src={
          user.profilePicture || 
          user.role === "admin" ? 
          "/logo_admin.png" :
          "/logo_user.png"
        }
        alt="Perfil"
        className="profile-image"
      />
      <h2 className="profile-name">{user.name}</h2>
      <p className="profile-email">{user.email}</p>
      <p className="profile-role">{user.role}</p>
      <div className="profile-buttons">
        <button
          className="profile-button logout"
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
    </div>
  );
};

export default UserProfile;