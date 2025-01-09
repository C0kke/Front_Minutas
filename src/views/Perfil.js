import React, { useEffect, useState } from "react";
import axios from "axios";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("id_user"); // Recupera el ID del almacenamiento local
        const token = localStorage.getItem('token')?.trim();     
        if (!token) {
            console.error("Token no encontrado en localStorage. Redirigiendo al login.");
            setError(new Error("No autorizado. Inicie sesión."));
            setLoading(false);
            return;
        }   
       
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/v1/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response)
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
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        border: "1px solid #ddd",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img
          src={user.profilePicture || "https://via.placeholder.com/150"}
          alt="Perfil"
          style={{
            borderRadius: "50%",
            width: "120px",
            height: "120px",
            marginBottom: "20px",
          }}
        />
        <h2 style={{ margin: "10px 0", color: "#333" }}>{user.name}</h2>
        <p style={{ margin: "5px 0", color: "#666" }}>{user.email}</p>
        <p
          style={{
            margin: "5px 0",
            padding: "5px 10px",
            display: "inline-block",
            backgroundColor: "#4caf50",
            color: "white",
            borderRadius: "5px",
          }}
        >
          {user.role}
        </p>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ color: "#333" }}>Acerca de mí</h3>
        <p style={{ color: "#555" }}>{user.bio || "Sin descripción"}</p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => alert("Editar Perfil")}
        >
          Editar Perfil
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
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
  );
};

export default UserProfile;