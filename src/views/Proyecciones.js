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

  // Función para agrupar platos por fecha
  const agruparPorFecha = (lista) => {
    const agrupado = {};
    lista.forEach((item) => {
      if (!agrupado[item.fecha]) {
        agrupado[item.fecha] = [];
      }
      agrupado[item.fecha].push(item);
    });
    return agrupado;
  };

  const handleToggleProyeccion = (proyeccionId) => {
    setOpenProyecciones((prev) => ({
      ...prev,
      [proyeccionId]: !prev[proyeccionId]
    }));
    if (!openProyecciones[proyeccionId]) {
      setOpenFechas({}); // Reiniciar fechas abiertas al abrir otra proyección
    }
  };

  const handleToggleFecha = (proyeccionId, fecha) => {
    setOpenFechas((prev) => ({
      ...prev,
      [`${proyeccionId}-${fecha}`]: !prev[`${proyeccionId}-${fecha}`]
    }));
  };

  return (
    <div>
      <Header />
      <h1 className="title">Proyecciones</h1>
      <div className="proyeccion-container">
        {data.length ? (
          data.map((proyeccion) => {
            const platosPorFecha = agruparPorFecha(proyeccion.lista);
            return (
              <div key={proyeccion._id} className="proyeccion-item">
                <p
                  className="proyeccion-titulo"
                  onClick={() => handleToggleProyeccion(proyeccion._id)}
                >
                  Proyección: {proyeccion.nombreSucursal || "N/A"}{" "}
                  {openProyecciones[proyeccion._id] ? "▲" : "▼"}
                </p>
                {openProyecciones[proyeccion._id] && (
                  <div className="fechas-container">
                    {Object.keys(platosPorFecha).map((fecha) => (
                      <div key={`${proyeccion._id}-${fecha}`} className="fecha-item">
                        <p
                          className="fecha"
                          onClick={() => handleToggleFecha(proyeccion._id, fecha)}
                        >
                          Fecha: {fecha}{" "}
                          {openFechas[`${proyeccion._id}-${fecha}`] ? "▲" : "▼"}
                        </p>
                        {openFechas[`${proyeccion._id}-${fecha}`] && (
                          <ul className="lista">
                            {platosPorFecha[fecha].map((plato) => (
                              <li key={plato._id} className="lista-item">
                                <p><strong>Nombre del Plato:</strong> {plato.Nombreplato || "No disponible"}</p>
                                <p><strong>Cantidad:</strong> {plato.cantidad || "N/A"}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty">No hay proyecciones disponibles.</div>
        )}
      </div>
    </div>
  );
};

export default Proyeccion;
