import React, { useState, useEffect, useMemo } from 'react';
import { TextField, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, Button, InputLabel, CircularProgress, Select, MenuItem, FormControl } from '@mui/material';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import weekday from 'dayjs/plugin/weekday';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/es';

import './styles/CrearMinuta.css';
import Header from '../components/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Formato de fechas y semanas
dayjs.extend(isLeapYear);
dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(localizedFormat);
dayjs.locale('es');

const encabezados = [
    "",
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
];

const filas = [
    "PROTEINA 1",
    "PROTEINA 2",
    "PROTEINA 3",
    "VEGETARIANA",
    "VEGANA",
    "GUARNICION 1",
    "GUARNICION 2",
    "HIPOCALÓRICO",
    "ENSALADA 1",
    "ENSALADA 2",
    "ENSALADA 3",
    "SOPA DEL DÍA",
    "POSTRE",
];

const tipoPlatoPorFila = {
    "PROTEINA 1": "PLATO DE FONDO",
    "PROTEINA 2": "PLATO DE FONDO",
    "PROTEINA 3": "PLATO DE FONDO",
    "VEGETARIANA": "VEGETARIANO",
    "VEGANA": "VEGANA",
    "GUARNICION 1": "GUARNICIÓN",
    "GUARNICION 2": "GUARNICIÓN",
    "HIPOCALÓRICO": "HIPOCALORICO",
    "ENSALADA 1": "ENSALADA",
    "ENSALADA 2": "ENSALADA",
    "ENSALADA 3": "ENSALADA",
    "SOPA DEL DÍA": "SOPA",
    "POSTRE": "POSTRES",
};

const generateWeekDays = (year, week) => {
  const firstDayOfYear = dayjs().year(year).startOf('year').isoWeekday(1);
  const firstDayOfWeek = firstDayOfYear.add(week - 1, 'week');

  const weekDays = [];
  for (let i = 0; i < 5; i++) {
      weekDays.push(firstDayOfWeek.add(i, 'day'));
  }
  return weekDays;
};

const Minutas = () => {
  const [sucursal, setSucursal] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [platos, setPlatos] = useState([]);

  const currentYear = dayjs().year();
  const [year, setYear] = useState(currentYear);
  const [week, setWeek] = useState(dayjs().week());
  const [weekDays, setWeekDays] = useState(generateWeekDays(currentYear, dayjs().week()));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const navigate = useNavigate(); 

  const token = localStorage.getItem('token')?.trim();
  
  // Obtención de Platos
  useEffect(() => {
    const fetchPlatos = async () => {
      try {
          const response = await axios.get('http://localhost:3000/api/v1/plato', {
              headers: { Authorization: `Bearer ${token}` }
          });
          const platosFiltrados = response.data.filter(plato => !plato.descontinuado);
          setPlatos(platosFiltrados);
      } catch (error) {
        console.error("Error al obtener platos:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          navigate("/"); 
        } else if (error.response) {
          setError(new Error(`Error del servidor: ${error.response.status} - ${error.response.data.message || 'Detalles no disponibles'}`));
        } else if (error.request) {
          setError(new Error("No se recibió respuesta del servidor."));
        } else {
          setError(new Error("Error al configurar la solicitud."));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlatos();
  }, [navigate]);

  // Obtención de Sucursales
  useEffect(() => {
    const fetchSucursales = async () => {    
      try {
        const response = await axios.get('http://localhost:3000/api/v1/sucursal', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSucursales(response.data); 
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          navigate("/");
        } else if (error.response) {
          setError(new Error(`Error del servidor: ${error.response.status} - ${error.response.data.message || 'Detalles no disponibles'}`));
        } else if (error.request) {
          setError(new Error("No se recibió respuesta del servidor."));
        } else {
          setError(new Error("Error al configurar la solicitud."));
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchSucursales();
  }, [navigate]);

  const handleSucursalChange = (event) => {
    setSucursal(event.target.value );
  };

  const handleYearChange = (event) => {
    const newYear = parseInt(event.target.value, 10) || currentYear;
    setYear(newYear);
    setWeekDays(generateWeekDays(newYear, week));
  };

  const handleWeekChange = (event) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek > 0 && newWeek < 53) {
        setWeek(newWeek);
        setWeekDays(generateWeekDays(year, newWeek));
    }
  };

  const handleAutocompleteChange = (event, value, row, col) => {
    setData(prevData => {
        const newData = { ...prevData };
        if (!newData[col]) { 
            newData[col] = {};
        }
        newData[col][row] = value ? value._id : null;
        return newData;
    });
  };

  const handleCrearMinuta = async () => {

    const firstDayOfWeek = dayjs().year(year).isoWeek(week).startOf('isoWeek');

    console.log(`primer dia: ${firstDayOfWeek}`);
    for (let i = 1; i < encabezados.length; i++) { 
      const dia = encabezados[i];
      const platosSeleccionados = [];

      if (data && data[dia]) {
        Object.values(data[dia]).forEach(platoId => {
            if (platoId) {
                platosSeleccionados.push(platoId);
            }
        });

        const fechaDia = firstDayOfWeek.add(i - 1, 'day').toISOString();

        const minutaDia = {
            nombre: `Minuta ${dia} Semana ${week}`,
            fecha: fechaDia,
            semana: week,
            id_sucursal: sucursal,
            estado: "Activo",
            listaplatos: platosSeleccionados,
            aprobado: false,
        };

        try {
          const token = localStorage.getItem('token')?.trim();
          const response = await axios.post('http://localhost:3000/api/v1/menudiario', minutaDia, {
              headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
              }
          });
          console.log(`Minuta para ${dia} (${fechaDia}) creada:`, response.data);
        } catch (error) {
          console.error(`Error al crear minuta para ${dia} (${fechaDia}):`, error);
        }
      }
    };
  };

  const opcionesFiltradasPorFila = useMemo(() => {
    const opciones = {};
    filas.forEach(fila => {
        let tipoPlatoFiltrado = tipoPlatoPorFila[fila];
        let opcionesFiltradas = platos.filter(plato => plato.categoria === tipoPlatoFiltrado);

        if (fila === "SOPA DEL DÍA") {
          opcionesFiltradas = [
              ...opcionesFiltradas,
              ...platos.filter(plato => plato.categoria === "CREMAS") 
          ];
        }
        
        if (tipoPlatoFiltrado === "ENSALADA") {
          opcionesFiltradas = encabezados.slice(1).reduce((accumulator, encabezado) => {
            const platosSeleccionadosEnEsteDia = new Set();
            filas.filter(f => tipoPlatoPorFila[f] === tipoPlatoFiltrado).forEach(filaInterna => {
              if (data[encabezado] && data[encabezado][filaInterna]) {
                platosSeleccionadosEnEsteDia.add(data[encabezado][filaInterna]);
              }
            });
            if(encabezado === encabezados[weekDays.indexOf(dayjs(dayjs().year(year).isoWeek(week).startOf('isoWeek').add(encabezados.indexOf(encabezado)-1, 'day')))+1]){
              return accumulator.filter(plato => !platosSeleccionadosEnEsteDia.has(plato._id));
            }
            return accumulator;
          }, opcionesFiltradas);
        } else if (tipoPlatoFiltrado === "PLATO DE FONDO") {
          const platosDeFondoSeleccionados = new Set();
          encabezados.slice(1).forEach(encabezado => {
            filas.filter(f => tipoPlatoPorFila[f] === "PLATO DE FONDO").forEach(filaInterna =>{
              if(data[encabezado] && data[encabezado][filaInterna]){
                platosDeFondoSeleccionados.add(data[encabezado][filaInterna])
              }
            })
          });
          opcionesFiltradas = opcionesFiltradas.filter(plato => !platosDeFondoSeleccionados.has(plato._id));
        }

        opciones[fila] = opcionesFiltradas;
    });
    return opciones;
  }, [platos, data]);

  const getValueForAutocomplete = (row, col) => {
      const platoId = data[col]?.[row];
      return platos.find(p => p._id === platoId) || null;
  };

  const isOptionDisabled = (option, row, col) => {
    const tipoPlato = tipoPlatoPorFila[row];
    if (tipoPlato === "ENSALADA") { 
      const platosSeleccionadosEnEsteDia = new Set();
      filas.filter(f => tipoPlatoPorFila[f] === "ENSALADA").forEach(filaInterna =>{
        if(data[col] && data[col][filaInterna]){
            platosSeleccionadosEnEsteDia.add(data[col][filaInterna])
        }
      })
      return platosSeleccionadosEnEsteDia.has(option._id);
    } else if (tipoPlato === "PLATO DE FONDO") { 
      const platosDeFondoSeleccionados = new Set();
      encabezados.slice(1).forEach(encabezado => {
        filas.filter(f => tipoPlatoPorFila[f] === "PLATO DE FONDO").forEach(filaInterna =>{
          if(data[encabezado] && data[encabezado][filaInterna]){
            platosDeFondoSeleccionados.add(data[encabezado][filaInterna])
          }
        })
      });
      return platosDeFondoSeleccionados.has(option._id);
    }
    return false;
  };


  return (
    <div>
        <Header />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'white', padding: 2, borderRadius: 1, margin: '20px auto', width: '80%', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Typography variant="h6" gutterBottom>Generador de Encabezados de Semana</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
        label="Nombre" 
        type="text" 
        value={`Minuta Semana ${week}`} 
        sx={{ width: 160 }} 
        
    />
      <TextField label="Año" type="number" value={year} onChange={handleYearChange} inputProps={{ min: 1900, max: 2100 }} sx={{ width: 100 }} />
      <TextField label="Semana (1-52)" type="number" value={week} onChange={handleWeekChange} inputProps={{ min: 1, max: 52 }} sx={{ width: 150 }} />
      <FormControl sx={{ width: 200 }}>
      <InputLabel>Sucursal</InputLabel>
      {loading ? (
        <CircularProgress size={24} /> // Indicador de carga mientras se obtienen los datos
      ) : (
        <Select
          value={sucursal}
          onChange={handleSucursalChange}
          label="Sucursal"
        >
          {sucursales.map((s) => (
            <MenuItem key={s._id} value={s._id}>
              {s.nombresucursal} {/* Cambia "nombre" por el campo correspondiente */}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
      <Button 
                    variant="contained" 
                    sx={{ marginTop: 2 }} 
                    onClick={handleCrearMinuta}
                >
                    Crear Minuta
                </Button>
                </Box>

            </LocalizationProvider>
            

            <TableContainer component={Paper} sx={{width: '100%'}} className='Minuta'>
                <Table sx={{ width: '100%', borderCollapse: 'collapse' }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell key="empty-cell"></TableCell>
                            {weekDays.map((day) => (
                                <TableCell key={day.toString()} align="center" className="Minuta th">
                                    {day.format('dddd DD [de] MMMM')}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filas.map((fila) => (
                            <TableRow key={fila} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row" align="center">{fila}</TableCell>
                                {encabezados.slice(1).map((encabezado, index) => (
                                    <TableCell key={`${encabezado}-${fila}`} align="center">
                                        <Autocomplete
                                            disablePortal
                                            id={`${encabezado}-${fila}`}
                                            options={opcionesFiltradasPorFila[fila]}
                                            getOptionLabel={(option) => option.nombre}
                                            value={getValueForAutocomplete(fila, encabezado)}
                                            onChange={(event, newValue) => handleAutocompleteChange(event, newValue, fila, encabezado)}
                                            isOptionEqualToValue={(option, value) => option?._id === value?._id}
                                            getOptionDisabled={(option) => isOptionDisabled(option, fila, encabezado)}                                            
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField {...params} label={`Seleccionar ${tipoPlatoPorFila[fila]}`} size="small" />}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    </div>
);
}

export default Minutas;