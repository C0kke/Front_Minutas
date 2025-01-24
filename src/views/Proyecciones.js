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
  const [proyeccionesConFechas, setProyeccionesConFechas] = useState({}); // Nuevo estado
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

  // useEffect para actualizar proyeccionesConFechas cuando cambie data
  useEffect(() => {
  
    const actualizarProyeccionesConFechas = () => {
      const nuevasProyeccionesConFechas = {};
      data.forEach((proyeccion) => {
        nuevasProyeccionesConFechas[proyeccion._id] = agruparPorFecha(proyeccion.lista);
      });
      setProyeccionesConFechas(nuevasProyeccionesConFechas);
    };

    if (data.length > 0) {
      actualizarProyeccionesConFechas();
    }
  }, [data]);

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
      [proyeccionId]: !prev[proyeccionId]
    }));
    if (!openProyecciones[proyeccionId]) {
      setOpenFechas({});
    }
  };

  const handleToggleFecha = (proyeccionId, fecha) => {
    setOpenFechas((prev) => ({
      [`${proyeccionId}-${fecha}`]: !prev[`${proyeccionId}-${fecha}`]
    }));
  };

  const handleExportExcel = () => {
    
  }

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <Header />
      <div className="proyeccion-container">
        <h1 className="title" style={{color:'#009b15'}}>Proyecciones</h1>
        {Object.keys(proyeccionesConFechas).length > 0 ? (
          Object.keys(proyeccionesConFechas).map((proyeccionId) => {
            const proyeccion = data.find((p) => p._id === proyeccionId);
            return (
              <div key={proyeccionId} className="proyeccion-item">
                <p
                  className="proyeccion-titulo"
                  onClick={() => handleToggleProyeccion(proyeccionId)}
                >
                  Proyección: {proyeccion.nombreSucursal || "N/A"}
                  {openProyecciones[proyeccionId] ? " ▲" : " ▼"}
                </p>
                <button onClick={handleExportExcel}>
                  Exportar a excel
                </button>
                {openProyecciones[proyeccionId] && (
                  <div className={`fechas-container ${openProyecciones[proyeccion._id] ? "open" : ""}`}>
                    {Object.keys(proyeccionesConFechas[proyeccionId]).map((fecha) => (
                      <div key={`${proyeccionId}-${fecha}`} className="fecha-item">
                        <p
                          className="fecha"
                          onClick={() => handleToggleFecha(proyeccionId, fecha)}
                        >
                          Fecha: {fecha}
                          {openFechas[`${proyeccionId}-${fecha}`] ? " ▲" : " ▼"}
                        </p>
                        {openFechas[`${proyeccionId}-${fecha}`] && (
                          <ul className={`lista ${openFechas[`${proyeccion._id}-${fecha}`] ? "open" : ""}`}>
                            {proyeccionesConFechas[proyeccionId][fecha].map((plato) => (
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
          <div className="empty">No hay proyecciones disponibles en este momento.</div>
        )}
      </div>
    </div>
  );
};

export default Proyeccion;