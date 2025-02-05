import React, { useEffect, useState } from "react";
import axios from "axios";
import './styles/Proyeccion.css';
import Header from "../components/Header";

const Proyeccion = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proyeccionesConFechas, setProyeccionesConFechas] = useState({});
  const [cantidadesEditadas, setCantidadesEditadas] = useState({});
  const [editados, setEditados] = useState(false);
  const token = localStorage.getItem('token');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/v1/proyeccion", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
        
        // Inicializar cantidades
        const initialCantidades = {};
        response.data.forEach(proyeccion => {
          proyeccion.lista.forEach(item => {
            initialCantidades[item._id] = item.cantidad;
          });
        });
        setCantidadesEditadas(initialCantidades);
        
      } catch (err) {
        setError("Error al cargar los datos. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Agrupar por fecha
  useEffect(() => {
    const actualizarProyeccionesConFechas = () => {
      const nuevasProyecciones = {};
      data.forEach((proyeccion) => {
        nuevasProyecciones[proyeccion._id] = agruparPorFecha(proyeccion.lista);
      });
      setProyeccionesConFechas(nuevasProyecciones);
    };

    if (data.length > 0) actualizarProyeccionesConFechas();
  }, [data]);

  const agruparPorFecha = (lista) => {
    const agrupado = {};
    lista.forEach((item) => {
      if (!agrupado[item.fecha]) agrupado[item.fecha] = [];
      agrupado[item.fecha].push(item);
    });
    return agrupado;
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

  // Guardar cambios para una proyección específica
  const guardarProyeccion = async (proyeccionId) => {
    if (!editados) {
      alert("No hay cambios en los platos");
      return;
    }
    try {
      const proyeccion = data.find(p => p._id === proyeccionId);
      const listaActualizada = proyeccion.lista.map(item => ({
        ...item,
        cantidad: cantidadesEditadas[item._id] || item.cantidad
      }));

      await axios.put(`http://localhost:3000/api/v1/proyeccion/${proyeccionId}`, {
        fecha: new Date().toISOString(), // Fecha actual en formato ISO
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
      const response = await axios.get(
        `http://localhost:3000/api/v1/proyeccion/${proyeccionId}/reporte-insumos`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob', // Importante para manejar archivos binarios
        }
      );
  
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
  
      // Establecer el nombre del archivo (puedes personalizarlo según el backend)
      link.setAttribute('download', `reporte-insumos-${proyeccionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
  
      // Limpiar el enlace temporal
      link.remove();
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Error al generar el reporte. Intenta nuevamente más tarde.');
    }
  };

 
  

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

 return (
    <div>
      <Header />
      <div className="proyeccion-container">
        <h1 className="title" style={{color: '#009b15'}}>Proyecciones</h1>
        
        {/* Listado principal */}
        <div className="lista-proyecciones">
          {Object.keys(proyeccionesConFechas).length > 0 ? (
            Object.keys(proyeccionesConFechas).map((proyeccionId) => {
              const proyeccion = data.find((p) => p._id === proyeccionId);
              const fechas = Object.keys(proyeccionesConFechas[proyeccionId]);

              return (
                <div className="proyeccion-card">
  <div className="proyeccion-header">
    <h3>{proyeccion.nombreSucursal}</h3>
    <span>{fechas.length} Fechas programadas</span>
  </div>

  <div className="fechas-list">
    {fechas.map((fecha) => (
      <div
        key={fecha}
        className="fecha-item"
        onClick={() => handleFechaClick(proyeccionId, fecha)}
      >
        <span className="fecha-text">{fecha}</span>
        <button className="ver-detalle-btn">Ver proyección</button>
      </div>
    ))}
  </div>

  {/* Contenedor de botones */}
  <div className="botones-container" style={{display: 'flex', gap: 20}}>
    <button
      className="exportar-excel-btn"
      onClick={() => handleExportExcel(proyeccionId)}
    >
      Exportar a Excel
    </button>
    <button 
      className="butoon-editar-modal-btn"
      onClick={() => guardarProyeccion(proyeccionId)}
    >
      Editar
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
                <h2>{fechaSeleccionada.sucursal} - {fechaSeleccionada.fecha}</h2>
                <button 
                  className="cerrar-modal"
                  onClick={() => setModalAbierto(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                {fechaSeleccionada.platos.map((plato) => (
                  <div key={plato._id} className="plato-item">
                    <div className="plato-info">
                      <span className="plato-nombre">{plato.Nombreplato}</span>
                      <input
                        type="number"
                        className="cantidad-input"
                        value={cantidadesEditadas[plato._id] !== undefined ? cantidadesEditadas[plato._id] : plato.cantidad}
                        onChange={(e) => handleCantidadChange(plato._id, e)}
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="modal-footer">
             
                <button
                  className="cerrar-modal-btn"
                  onClick={() => setModalAbierto(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Proyeccion;