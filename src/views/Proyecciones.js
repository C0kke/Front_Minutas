import React, { useEffect, useState } from "react";
import axios from "axios";
import './styles/Proyeccion.css';

const Proyeccion = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/v1/proyeccion", {
            headers: { Authorization: `Bearer ${token}` }
          });
        setData(response.data);
      } catch (err) {
        setError("Error al cargar los datos. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="proyeccion-container">
      <h1 className="title">Proyecciones</h1>
      {data.length > 0 ? (
        data.map((proyeccion, index) => (
          <div key={index} className="proyeccion-item">
            <p className="fecha">Fecha: {proyeccion.fecha ? new Date(proyeccion.fecha).toLocaleString() : "N/A"}</p>
            <ul className="lista">
              {proyeccion.lista?.length > 0 ? (
                proyeccion.lista.map((item) => (
                  <li key={item._id} className="lista-item">
                    <p><strong>Nombre del Plato:</strong> {item.Nombreplato}</p>
                    <p><strong>Cantidad:</strong> {item.cantidad}</p>
                  </li>
                ))
              ) : (
                <li className="lista-item">No hay elementos para mostrar.</li>
              )}
            </ul>
          </div>
        ))
      ) : (
        <div className="empty">No hay proyecciones disponibles.</div>
      )}
    </div>
  );
};

export default Proyeccion;
