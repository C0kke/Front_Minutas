import React, { useEffect, useState } from "react";
import axios from "axios";
import './styles/Proyeccion.css';
import Header from "../components/Header";
import { CircularProgress } from '@mui/material';
import dayjs from 'dayjs';

const Proyeccion = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [error, setError] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [sucursal, setSucursal] = useState(null);
  const [proyeccionesConFechas, setProyeccionesConFechas] = useState({});
  const [cantidadesEditadas, setCantidadesEditadas] = useState({});
  const [editados, setEditados] = useState(false);
  const token = localStorage.getItem('token');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACK_URL;

  // Estados para la búsqueda/filtro
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");

  const [ingredientesExpandidos, setIngredientesExpandidos] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}proyeccion`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const sortedProyecciones = response.data.sort((a, b) => {
          const fechaA = new Date(a.fecha);
          const fechaB = new Date(b.fecha);
          return fechaB - fechaA; // Orden descendente
        });

        setData(sortedProyecciones);

        // Inicializar cantidades
        const initialCantidades = {};
        sortedProyecciones.forEach(proyeccion => {
          proyeccion.lista.forEach(item => {
            initialCantidades[item._id] = item.cantidad;
          });
        });
        setCantidadesEditadas(initialCantidades);

        const responseSucursales = await axios.get(`${BACKEND_URL}sucursal`, {
          headers: {Authorization: `Bearer ${token}`}
        });
        setSucursales(responseSucursales.data);
      } catch (err) {
        setError("Error al cargar los datos. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    const actualizarProyeccionesConFechas = () => {
      const nuevasProyecciones = {};

      // Ordenar las proyecciones por fecha más reciente
      const dataOrdenada = [...data].sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaB - fechaA;
      });

      dataOrdenada.forEach((proyeccion) => {
        nuevasProyecciones[proyeccion._id] = agruparPorFecha(proyeccion.lista);
      });

      setProyeccionesConFechas(nuevasProyecciones);
    };

    if (data.length > 0) actualizarProyeccionesConFechas();
  }, [data]);

  const fetchIngredientes = async (platoid) => {
    try {
      const response = await axios.get(`${BACKEND_URL}ingredientexplato/plato/${platoid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("Error al cargar los ingredientes:", error);
      return [];
    }
  };
  const agruparPorFecha = (lista) => {
    const agrupado = {};
    lista.forEach((item) => {
      if (!agrupado[item.fecha]) agrupado[item.fecha] = [];
      agrupado[item.fecha].push(item);
    });
    return agrupado;
  };

  // Función para filtrar las proyecciones
  const filtrarProyecciones = () => {
    let filtradas = [...data];
  
    // Filtrar por fecha
    if (filtroFecha) {
      const fechaFiltrada = dayjs(filtroFecha, 'YYYY-MM-DD').format('DD-MM-YYYY');
      filtradas = filtradas.filter(proyeccion =>
        proyeccion.lista.some(item => item.fecha === fechaFiltrada)
      );
    }
  
    // Filtrar por sucursal
    if (filtroSucursal) {
      filtradas = filtradas.filter(proyeccion =>
        proyeccion.nombreSucursal.toLowerCase().includes(filtroSucursal.toLowerCase())
      );
    }
  
    return filtradas;
  };

  const handleCantidadChange = (itemId, event) => {
    const inputValue = event.target.value;
    setEditados(true);
    setCantidadesEditadas(prev => {
      let newValue;
      if (inputValue === "") {
        newValue = "";
      } else {
        newValue = parseInt(inputValue);
        if (isNaN(newValue)) {
          newValue = 0;
        }
      }
      return { ...prev, [itemId]: newValue };
    });
  };

  const handlePlatoClick = async (platoId, platoid) => {
    if (ingredientesExpandidos[platoId]) {
      setIngredientesExpandidos(prev => ({ ...prev, [platoId]: null }));
    } else {
      setLoadingBtn(true);
      const ingredientes = await fetchIngredientes(platoid);
      const plato = fechaSeleccionada?.platos.find(p => p._id === platoId);
      const cantidadProyectada = cantidadesEditadas[platoId] || plato.cantidad;
  
      const ingredientesCalculados = ingredientes.map(ingrediente => ({
        ...ingrediente,
        cantidadCompra: ingrediente.peso_bruto * cantidadProyectada
      }));
  
      setIngredientesExpandidos(prev => ({ ...prev, [platoId]: ingredientesCalculados }));
      setLoadingBtn(false);
    }
  };
  
  const guardarProyeccion = async (proyeccionId) => {
    if (!editados) {
      alert("No hay cambios en los platos");
      return;
    }
    try {
      setLoadingBtn(true);
      const proyeccion = data.find(p => p._id === proyeccionId);
      const listaActualizada = proyeccion.lista.map(item => ({
        ...item,
        cantidad: cantidadesEditadas[item._id] || item.cantidad
      }));
      await axios.put(`${BACKEND_URL}proyeccion/${proyeccionId}`, {
        fecha: new Date().toISOString(),
        nombreSucursal: proyeccion.nombreSucursal,
        lista: listaActualizada.map(item => ({
          fecha: item.fecha,
          Nombreplato: item.Nombreplato,
          cantidad: item.cantidad.toString()
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cambios guardados exitosamente!');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar los cambios');
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleFechaClick = (proyeccionId, fecha) => {
    const proyeccion = data.find(p => p._id === proyeccionId);
    setFechaSeleccionada({
      fecha,
      platos: proyeccionesConFechas[proyeccionId][fecha],
      sucursal: proyeccion.nombreSucursal
    });
    setModalAbierto(true);
  };

  const handleExportExcel = async (proyeccionId) => {
    try {
      setLoadingBtn(true);
      const response = await axios.get(
        `${BACKEND_URL}proyeccion/${proyeccionId}/reporte-insumos`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-insumos-${proyeccionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Error al generar el reporte. Intenta nuevamente más tarde.');
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleExportExcelDia = async (proyeccionId, fecha) => {
    try {
      setLoadingBtn(true);
      const response = await axios.get(
        `${BACKEND_URL}proyeccion/${proyeccionId}/reporte-insumos?fecha=${fecha}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-insumos-${fecha}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Error al generar el reporte. Intenta nuevamente más tarde.');
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleSucursalChange = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      setSucursal(selectedValue);
      setFiltroSucursal(selectedValue);
    } else {
      setSucursal("");
      setFiltroSucursal("");
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  const proyeccionesFiltradas = filtrarProyecciones();

  return (
    <div>
      <Header />
      <div className="proyeccion-container">
        <h1 className="title" style={{ color: '#009b15' }}>Proyecciones</h1>
        {/* Header de Búsqueda */}
        <div className="search-header">
          <div className="search-container">
            <label htmlFor="filtro-fecha">Buscar por Fecha:</label>
            <input
              type="date"
              id="filtro-fecha"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>
          <div className="search-container">
            <label htmlFor="filtro-sucursal">Buscar por Sucursal:</label>
            <input
              type="text"
              id="filtro-sucursal"
              placeholder="Escribe el nombre de la sucursal..."
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
            />
          </div>
        </div>
        {/* Listado principal */}
        <div className="lista-proyecciones">
          {proyeccionesFiltradas.length > 0 ? (
            proyeccionesFiltradas.map((proyeccion) => {
              const fechas = Object.keys(agruparPorFecha(proyeccion.lista));
              return (
                <div className="proyeccion-card" key={proyeccion._id}>
                  <div className="proyeccion-header">
                    <h3>{proyeccion.nombreSucursal}</h3>
                    <span>{fechas.length} Fechas programadas</span>
                  </div>
                  <div className="fechas-list">
                    {fechas.map((fecha) => (
                      <div className="proyeccion-item">
                        <div
                          key={fecha}
                          className="fecha-item"
                          onClick={() => handleFechaClick(proyeccion._id, fecha)}
                        >
                          <span className="fecha-text">{fecha}</span>
                        </div>
                        <button className="exportar-dia-btn" onClick={() => handleExportExcelDia(proyeccion._id, fecha)} disabled={loadingBtn}>
                          {loadingBtn ? 'Cargando...' : 'Exportar día'}
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Contenedor de botones */}
                  <div className="botones-container" style={{ display: 'flex', gap: 20 }}>
                    <button
                      className="exportar-excel-btn"
                      onClick={() => handleExportExcel(proyeccion._id)}
                      disabled={loadingBtn}
                    >
                      {loadingBtn ? (
                        <CircularProgress size={14} sx={{ color: 'white' }} />
                      ) : (
                        'Exportar a Excel'
                      )}
                    </button>
                    <button
                      className="editar-btn"
                      onClick={() => guardarProyeccion(proyeccion._id)}
                      disabled={loadingBtn}
                    >
                      {loadingBtn ? (
                        <CircularProgress size={14} sx={{ color: 'white' }} />
                      ) : (
                        'Editar'
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">No hay proyecciones disponibles</div>
          )}
        </div>
  
        {/* Modal */}
        {modalAbierto && (
          <div className="modal-overlay">
            <div className="modal-contenido">
              <div className="modal-header">
                <h2>{fechaSeleccionada?.sucursal} - {dayjs(fechaSeleccionada?.fecha, 'DD-MM-YYYY').format('DD/MM/YYYY')}</h2>
                <button
                  className="cerrar-modal"
                  onClick={() => {
                    setModalAbierto(false);
                  }}
                >
                  ×
                </button>
              </div>
  
              <div className="modal-body">
                {fechaSeleccionada?.platos.map((plato) => (
                  <div key={plato._id} className="plato-item">
                    <div className="plato-info">
                      <span
                        className="plato-nombre"
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handlePlatoClick(plato._id, plato.platoid)}
                      >
                        {plato.Nombreplato}
                      </span>
                      <input
                        type="number"
                        className="cantidad-input"
                        value={cantidadesEditadas[plato._id] !== undefined ? cantidadesEditadas[plato._id] : plato.cantidad}
                        onChange={(e) => handleCantidadChange(plato._id, e)}
                        min="0"
                      />
                    </div>
                    {ingredientesExpandidos[plato._id] && (
                      <ul className="ingredientes-lista">
                        {ingredientesExpandidos[plato._id].map((ingrediente, index) => (
                          <li key={index}>
                            {ingrediente.peso_bruto ? `${ingrediente.id_ingrediente.nombreIngrediente} - CANTIDAD PROYECTADA: ${ingrediente.cantidadCompra} ${ingrediente.id_ingrediente.unidadmedida}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Proyeccion;