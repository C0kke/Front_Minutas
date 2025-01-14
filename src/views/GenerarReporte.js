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
import './styles/GenerarReporte.css'; // Asegúrate de tener los estilos
import axios from "axios";
import Header from '../components/Header'

const GenerarReporte = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sucursal, setSucursal] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platos, setPlatos] = useState([]);
  const [platosConCantidad, setPlatosConCantidad] = useState([{ platoId: "", cantidad: 0 }]);
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
        const response = await axios.get('http://localhost:3000/api/v1/menudiario/generar-reporte/platos-entre-fechas',  {
          params: {
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
          },
          headers: {
              Authorization: `Bearer ${token}`,
          }
        });
        setPlatos(response.data); // Asume que la respuesta contiene un array de platos
      } catch (error) {
        console.error("Error al obtener platos:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePlatoChange = (index, field, value) => {
    const newPlatos = [...platosConCantidad];
    newPlatos[index][field] = value;
    setPlatosConCantidad(newPlatos);
  };

  const addPlato = () => {
    setPlatosConCantidad([...platosConCantidad, { platoId: "", cantidad: 0 }]);
  };

  const handleSubmit = () => {
    const reportData = {
      fechaInicio,
      fechaFin,
      sucursal,
      platosConCantidad,
    };

    console.log("Datos para generar reporte:", reportData);
    navigate("/reportes-generados");
  };

  const handleSucursalChange = (event) => {
    setSucursal(event.target.value );
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
                        <FormControl sx={{ width: '100%' }}> {/* Ancho al 100% */}
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
                        platos.length > 0 && (
                            <div className="form-group">
                                <Typography variant="h6" gutterBottom>Platos para el Reporte</Typography>
                                {platos.map((plato, index) => (
                                    <div key={index} className="plato-input">
                                        <TextField
                                            value={plato.nombre}
                                            InputProps={{ readOnly: true }}
                                            variant="outlined"
                                            label="Nombre del plato"
                                            sx={{ flexGrow: 1, marginRight: '1rem' }}
                                        />
                                        <TextField
                                            type="number"
                                            value={platosConCantidad[index]?.cantidad || 0}
                                            onChange={(e) => handlePlatoChange(index, "cantidad", e.target.value)}
                                            label="Cantidad"
                                            variant="outlined"
                                        />
                                    </div>
                                ))}
                                <Button variant="outlined" onClick={addPlato}>
                                    Agregar Plato
                                </Button>
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