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

const GenerarReporte = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sucursal, setSucursal] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platosPorFecha, setPlatosPorFecha] = useState({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [semana, setSemana] = useState("");

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

  const handleSemanaChange = (e) => {
    const selectedWeek = e.target.value;
    setSemana(selectedWeek);

    // Calcular las fechas de la semana (lunes y domingo)
    const startOfWeek = moment().isoWeek(selectedWeek).startOf('isoWeek'); // Lunes
    const endOfWeek = moment().isoWeek(selectedWeek).endOf('isoWeek'); // Domingo

    setFechaInicio(startOfWeek.format("YYYY-MM-DD"));
    setFechaFin(endOfWeek.format("YYYY-MM-DD"));
  };

  const handleFechaChange = async () => {
    if (fechaInicio && fechaFin ) {
      setLoading(true);
      try {
        

        const response = await axios.get('http://localhost:3000/api/v1/menudiario/reporte/obtener-platos', {
          params: {
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        // Agrupar platos por fecha
        console.log(response.data)
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
                cantidad: 0
              });
            }
          });
        });
        setPlatosPorFecha(platosAgrupados);

      } catch (error) {
        console.error("Error al obtener platos:", error);
        setPlatosPorFecha({});
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePlatoChange = (fecha, platoId, value) => {
    setPlatosPorFecha(prevPlatos => {
      const nuevosPlatos = { ...prevPlatos };
      const platoIndex = nuevosPlatos[fecha].findIndex(p => p.id === platoId);
      if (platoIndex !== -1) {
        nuevosPlatos[fecha][platoIndex].cantidad = value;
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
  
    const sucursalObj = sucursales.find(s => s._id === sucursal);
    if (!sucursalObj) {
      alert("Es obligatorio seleccionar una sucursal antes de continuar.");
      return;
    }
  
    const reportData = {
      fechaInicio,
      fechaFin,
      sucursal: sucursalObj.nombresucursal,
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
    console.log(reportData);
  
    const proyeccionData = {
      fecha: new Date(), // Fecha principal de la proyección
      nombreSucursal: sucursalObj.nombresucursal,
      lista: Object.entries(platosPorFecha).flatMap(([fecha, platos]) =>
        platos
          .filter(plato => plato.cantidad > 0)
          .map(plato => ({
            platoid : plato.id,
            fecha, // Fecha del plato
            Nombreplato: plato.nombre, // Nombre del plato
            cantidad: plato.cantidad.toString(), // Cantidad convertida a string
          }))
      ),
    };
    console.log(proyeccionData);
  
    try {
      const reportResponse = await axios.post(
        'http://localhost:3000/api/v1/menudiario/reporte/calcular-ingredientes',
        reportData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      alert(`Reporte para ${sucursalObj.nombresucursal} generado correctamente en la ruta 'Downloads/archivos'`);
  
      // Crear la proyección
      const proyeccionResponse = await axios.post(
        'http://localhost:3000/api/v1/proyeccion',
        proyeccionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      alert('Proyección creada correctamente.');
      navigate("/home");
    } catch (error) {
      console.error("Error al generar el reporte o crear la proyección:", error);
    }
  };

  const handleSucursalChange = (event) => {
    setSucursal(event.target.value);
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
                <InputLabel>Sucursal</InputLabel>
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Select
                    value={sucursal.nombresucursal}
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
                                value={plato.cantidad || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value >= 0) {
                                    handlePlatoChange(fecha, plato.id, value || 0);
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
