import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/ingredientes.css"; // Asegúrate de que los estilos estén en este archivo
import Header from "../components/Header";

const IngredienteList = () => {
  const [ingredientes, setIngredientes] = useState([]);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token")?.trim(); // Obtener el token desde localStorage

  // Función para obtener los ingredientes desde el API
  useEffect(() => {
    // Si no hay token, mostrar un error
    if (!token) {
      setError("No autorizado. Inicie sesión.");
      return;
    }

    const fetchIngredientes = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/v1/ingrediente", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIngredientes(response.data); // Asigna los datos obtenidos
      } catch (error) {
        setError("Error al cargar los ingredientes");
      }
    };

    fetchIngredientes();
  }, [token]); // Se asegura de ejecutar la función si el token cambia

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div>
      <Header/>
      <div className="ingrediente-list-container">
        <div className="ingrediente-details">
          <table className="Ingrediente">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Unidad de Medida</th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.length > 0 ? (
                ingredientes.map((ingrediente, index) => (
                  <tr key={index}>
                    <td>{ingrediente.nombreIngrediente}</td>
                    <td>{ingrediente.unidadmedida}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center" }}>
                    No se encontraron ingredientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IngredienteList;