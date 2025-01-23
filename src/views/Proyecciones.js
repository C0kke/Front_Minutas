import React, { useEffect, useState } from "react";
import axios from "axios";
import './styles/Proyeccion.css';
import Header from "../components/Header";

const Proyeccion = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openProyecciones, setOpenProyecciones] = useState({});
  const [openFechas, setOpenFechas] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/v1/proyeccion", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Response Data:", response.data);
        setData(response.data);
      } catch (err) {
        setError("Error al cargar los datos. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  // Agrupar por proyecciones
const groupedData = data.reduce((acc, proyeccion) => {
    // Genera un nombre único para cada proyección basado en su _id
    const nombreProyeccion = proyeccion._id;
    if (!acc[nombreProyeccion]) {
      acc[nombreProyeccion] = [];
    }
    acc[nombreProyeccion].push(proyeccion);
    return acc;
  }, {});

  const handleToggleProyeccion = (nombreProyeccion) => {
    setOpenProyecciones(prev => ({
      ...prev,
      [nombreProyeccion]: !prev[nombreProyeccion]
    }));
    // Cerrar todas las fechas al cerrar la proyección
    if (openProyecciones[nombreProyeccion]) {
        setOpenFechas({});
    }
  };

  const handleToggleFecha = (fecha) => {
    setOpenFechas(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  return (
    <div>
        <Header />
        <h1 className="title">Proyecciones</h1>
        <div className="proyeccion-container">
        {Object.keys(groupedData)? (
          Object.keys(groupedData).map((nombreProyeccion) => (
            <div key={nombreProyeccion} className="proyeccion-item">
              <p className="proyeccion-titulo" onClick={() => handleToggleProyeccion(nombreProyeccion)}>
                {/* Usa el nombre de la proyección o un texto alternativo */}
                Proyección {openProyecciones[nombreProyeccion] ? '▲' : '▼'}
              </p>
              {openProyecciones[nombreProyeccion] && (
                <div className="fechas-container">
                  {groupedData[nombreProyeccion].map((proyeccion) => (
                    <div key={proyeccion._id} className="fecha-item">
                      <p className="fecha" onClick={() => handleToggleFecha(proyeccion.fecha)}>
                        {new Date(proyeccion.fecha).toLocaleDateString()} {openFechas[proyeccion.fecha] ? '▲' : '▼'}
                      </p>
                      <ul className={`lista ${openFechas[proyeccion.fecha] ? 'open' : ''}`}>
                        <div className="lista-content">
                          {openFechas[proyeccion.fecha] && proyeccion.lista ? (
                            proyeccion.lista.map((item) => (
                              <li key={item.m} className="lista-item">
                                {/* Asegúrate de que los campos sean correctos */}
                                <p><strong>Nombre del Plato:</strong> {item.nombre || "No disponible"}</p>
                                <p><strong>Cantidad:</strong> {item.cantidad || "N/A"}</p>
                              </li>
                            ))
                          ) : openFechas[proyeccion.fecha] ? (
                            <li className="lista-item">No hay elementos para mostrar.</li>
                          ) : null}
                        </div>
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty">No hay proyecciones disponibles.</div>
        )}
      </div>
    </div>
  );
};

export default Proyeccion;