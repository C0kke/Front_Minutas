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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './styles/GenerarReporte.css';
import axios from "axios";
import Header from '../components/Header'
import moment from 'moment';
import 'moment-timezone';
import CloseIcon from '@mui/icons-material/Close';
import mongoose from 'mongoose';

const GenerarReporte = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sucursal, setSucursal] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [platosPorFecha, setPlatosPorFecha] = useState({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [semana, setSemana] = useState("");
  const BACKEND_URL = process.env.REACT_APP_BACK_URL;

  const navigate = useNavigate();
  const token = localStorage.getItem('token')?.trim();

  useEffect(() => {
    const fetchSucursales = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}sucursal`, {
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
  }, [navigate]);

  const handleSemanaChange = (e) => {
    const selectedWeek = e.target.value;
    setSemana(selectedWeek);

    const startOfWeek = moment().isoWeek(selectedWeek).startOf('isoWeek'); 
    const endOfWeek = moment().isoWeek(selectedWeek).endOf('isoWeek'); 

    setFechaInicio(startOfWeek.format("YYYY-MM-DD"));
    setFechaFin(endOfWeek.format("YYYY-MM-DD"));
  };

  const handleFechaChange = async () => {
    if (!sucursal) {
      alert("Debe seleccionar una sucursal antes de continuar.");
      return;
    }
  
    if (fechaInicio && fechaFin) {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}menudiario/reporte/obtener-platos`, {
          params: {
            fechaInicio,
            fechaFin,
            sucursalId: sucursal?._id.toString(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        // Validar la respuesta
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error("La respuesta del servidor no contiene datos válidos.");
        }
  
        // Agrupar platos por fecha
        const platosAgrupados = {};
        response.data.forEach(menu => {
          const fecha = moment(menu.fecha).tz("America/New_York").add(1, 'days').format("DD-MM-YYYY");
          if (!platosAgrupados[fecha]) {
            platosAgrupados[fecha] = [];
          }
          menu.platos.forEach(plato => {
            const platoExistente = platosAgrupados[fecha].find(p => p.id === plato.id);
            if (!platoExistente) {
              platosAgrupados[fecha].push({
                id: plato.id,
                nombre: plato.nombre,
                cantidad: 0,
              });
            }
          });
        });
        setPlatosPorFecha(platosAgrupados);
      } catch (error) {
        console.error("Error al obtener platos:", error);
        alert("Ocurrió un error al cargar los platos. Por favor, inténtalo de nuevo.");
        setPlatosPorFecha({});
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePlatoChange = (fecha, platoId, value) => {
    let newValue;
    if (value === "") {
      newValue = "";
    } else {
      newValue = parseInt(value, 10);
      if (isNaN(newValue)) {
        newValue = 0;
      }
    }
    
    setPlatosPorFecha(prevPlatos => {
      const nuevosPlatos = { ...prevPlatos };
      const platoIndex = nuevosPlatos[fecha].findIndex(p => p.id === platoId);
      if (platoIndex !== -1) {
        nuevosPlatos[fecha][platoIndex].cantidad = newValue;
      }
      return nuevosPlatos;
    });
  };

  const handleSubmit = async () => {
    const platosInvalidos = Object.entries(platosPorFecha).flatMap(([_, platos]) =>
      platos.filter(plato => !plato.cantidad || plato.cantidad <= 0)
    );
  
    if (platosInvalidos.length > 0) {
      alert("Todos los platos deben tener una cantidad mayor a 0.");
      return;
    }
  
    const reportData = {
      fechaInicio,
      fechaFin,
      sucursal: sucursal.nombresucursal,
      platosConCantidad: Object.entries(platosPorFecha).flatMap(([fecha, platos]) =>
        platos
          .filter(plato => plato.cantidad > 0)
          .map(plato => ({
            fecha,
            platoId: plato.id,
            cantidad: plato.cantidad,
          }))
      ),
    };
  
    const proyeccionData = {
      fecha: new Date(), 
      nombreSucursal: sucursal.nombresucursal,
      lista: Object.entries(platosPorFecha).flatMap(([fecha, platos]) =>
        platos
          .filter(plato => plato.cantidad > 0)
          .map(plato => ({
            platoid : plato.id,
            fecha, 
            Nombreplato: plato.nombre, 
            cantidad: plato.cantidad.toString(), 
          }))
      ),
    };
  
    try {
      setLoadingBtn(true);
       await axios.post(
        `${BACKEND_URL}menudiario/reporte/calcular-ingredientes`,
        reportData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      alert(`Reporte para ${sucursal.nombresucursal} generado correctamente en la ruta 'Downloads/archivos'`);
  
      // Crear la proyección
      await axios.post(
        `${BACKEND_URL}proyeccion`,
        proyeccionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      alert('Proyección creada correctamente.');
      
      navigate("/proyecciones");
    } catch (error) {
      console.error("Error al generar el reporte o crear la proyección:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSucursalChange = (event) => {
    const selectedId = event.target.value;
    const selectedSucursal = sucursales.find(s => s._id === selectedId);
    setSucursal(selectedSucursal || null);
  };

  return (
    <Box>
      <Header />
      <div className="report-container">
        <Box className="report-content">
          <Typography variant="h4" gutterBottom>Generar Reporte</Typography>
          <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <FormControl sx={{ width: '100%' }}>
              <InputLabel>Semana</InputLabel>
              <Select
                value={semana}
                onChange={handleSemanaChange}
                label="Semana"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200, 
                      overflowY: 'auto', 
                    },
                  },
                }}
              >
                {Array.from({ length: 52 }, (_, index) => (
                  <MenuItem key={index + 1} value={index + 1}>
                    Semana {index + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

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
                <InputLabel>Elegir Sucursal</InputLabel>
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Select
                  value={sucursal ? sucursal._id : ""}
                  onChange={handleSucursalChange}
                  fullWidth
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
              Object.keys(platosPorFecha).length > 0 && (
                <div className="form-group">
                  <Typography variant="h6" gutterBottom>Platos por Fecha</Typography>
                  {Object.keys(platosPorFecha).map(fecha => (
                    <Accordion key={fecha} expanded={fechaSeleccionada === fecha} onChange={() => setFechaSeleccionada(fechaSeleccionada === fecha ? null : fecha)}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{fecha}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {platosPorFecha[fecha].map((plato) => (
                          <div key={plato.id} className="plato-input">
                            <TextField
                              value={plato.nombre || ''}
                              InputProps={{ readOnly: true }}
                              variant="outlined"
                              label="Nombre del plato"
                              sx={{ flexGrow: 1, marginRight: '1rem' }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TextField
                              type="number"
                              value={plato.cantidad}
                              onChange={(e) => {
                                const inputValue = e.target.value; 
                                if (inputValue === "") {
                                  handlePlatoChange(fecha, plato.id, "");
                                } else {
                                  const parsedValue = parseInt(inputValue, 10);
                                  if (!isNaN(parsedValue) && parsedValue >= 0) {
                                    handlePlatoChange(fecha, plato.id, parsedValue);
                                  }
                                }
                              }}
                              label="Cantidad"
                              variant="outlined"
                              sx={{ width: '100px' }}
                            />
                              <IconButton onClick={() => handlePlatoChange(fecha, plato.id, 0)} size="small">
                                <CloseIcon />
                              </IconButton>
                            </Box>
                          </div>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </div>
              )
            )}

            <div className="form-group">
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loadingBtn}>
                {loadingBtn ?(
                  <CircularProgress size={14}/>
                ) : (
                  'Generar Reporte'
                )}
              </Button>
            </div>
          </form>
        </Box>
      </div>
    </Box>
  );
};

export default GenerarReporte;
