import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";
import './styles/GenerarReporte.css'; 
import axios from "axios";
import Header from '../components/Header'

const GenerarReporte = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sucursal, setSucursal] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platosConCantidad, setPlatosConCantidad] = useState([]);
  const [ingredientes, setIngredientes] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem('token')?.trim();

  useEffect(() => {
    const fetchSucursales = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/v1/sucursal', {
          headers: { Authorization: `Bearer ${token}` }
        });           
        setSucursales(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Error al obtener sucursales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  const handleFechaChange = async () => {
    if (fechaInicio && fechaFin && sucursal) {
      setLoading(true);
      try {
        const sucursalObj = sucursales.find(s => s._id === sucursal); 
  
        console.log(`Sucursal: ${sucursalObj.nombresucursal} id: ${sucursalObj._id}`); 
  
        const response = await axios.get('http://localhost:3000/api/v1/menudiario/reporte/obtener-platos', {
          params: {
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            sucursalId: sucursal,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        console.log(response.data[0].platos)
        setPlatosConCantidad(response.data[0].platos.map(plato => ({ 
          platoId: plato._id, 
          nombre: plato.nombre, 
          cantidad: 0 
        })));

      } catch (error) {
        console.error("Error al obtener platos:", error);
        setPlatosConCantidad([])
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePlatoChange = (index, value) => {
    const newPlatos = [...platosConCantidad];
    newPlatos[index].cantidad = value; 
    setPlatosConCantidad(newPlatos);
    console.log(platosConCantidad)
    if (value > 0) {
      obtenerIngredientes(platosConCantidad[index].platoId); 
    }
  };

  const handleSubmit = async () => {
    const reportData = {
      fechaInicio,
      fechaFin,
      sucursal,
      platosConCantidad,
    };

    try {
      const response = await axios.post('http://localhost:3000/api/v1/menudiario/reporte/calcular-ingredientes', reportData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Reporte generado:', response.data); 
      navigate("/reportes-generados"); 
    } catch (error) {
      console.error("Error al generar el reporte:", error);
    }
  };

  const handleSucursalChange = (event) => {
    setSucursal(event.target.value);
    console.log(event.target.value)
  };

  const obtenerIngredientes = async (platoId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/ingredientexplato/plato/${platoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngredientes(prevIngredientes => ({
        ...prevIngredientes,
        [platoId]: response.data // Guardar los ingredientes en el estado
      }));
    } catch (error) {
      console.error("Error al obtener ingredientes:", error);
    }
  };

  return (
    <Box>
      <Header />
        <div className="report-container">
          <Box className="report-content">
            <Typography variant="h4" gutterBottom>Generar Reporte</Typography>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <TextField
                  label="Fecha de Inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              <div className="form-group">
                <TextField
                  label="Fecha de Fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              <div className="form-group">
                <FormControl sx={{ width: '100%' }}> 
                  <InputLabel>Sucursal</InputLabel>
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                      <Select
                        value={sucursal}
                        onChange={handleSucursalChange}
                        label="Sucursal"
                      >
                        {sucursales.map((s) => (
                          <MenuItem key={s._id} value={s._id}>
                            {s.nombresucursal}
                          </MenuItem>
                        ))}
                      </Select>
                  )}
                </FormControl>
              </div>

              <div className="form-group">
                <Button variant="contained" onClick={handleFechaChange}>
                  Cargar Platos
                </Button>
              </div>

              {loading ? (
                <CircularProgress size={24} />
              ) : (
                platosConCantidad.length > 0 && (
                  <div className="form-group">
                    <Typography variant="h6" gutterBottom>Platos para el Reporte</Typography>
                    {platosConCantidad.map((plato, index) => (
                      <div key={index} className="plato-input">
                        <TextField
                          value={plato.nombre || ''}
                          InputProps={{ readOnly: true }}
                          variant="outlined"
                          label="Nombre del plato"
                          sx={{ flexGrow: 1, marginRight: '1rem' }}
                        />
                        <TextField
                          type="number"
                          value={plato.cantidad || 0}
                          onChange={(e) => handlePlatoChange(index, e.target.value)}
                          label="Cantidad"
                          variant="outlined"
                        />
                        {ingredientes[plato.platoId] && (
                          <div className="ingredientes-list">
                            <Typography variant="body2">Ingredientes:</Typography>
                            <ul>
                              {ingredientes[plato.platoId].map((ingrediente, i) => (
                                <li key={i}>
                                  {ingrediente.nombreingrediente} - {ingrediente.cantidad} {ingrediente.unidadmedida}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              <div className="form-group">
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                  Generar Reporte
                </Button>
              </div>
            </form>
          </Box>
        </div>
    </Box>
  );
};

export default GenerarReporte;