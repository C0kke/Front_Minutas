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
  const [platosDisponibles, setPlatosDisponibles] = useState({});

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

  // Obtener platos disponibles por fecha
  useEffect(() => {
    const obtenerPlatosDisponibles = async () => {
      const days = generateWeekDays(year, week);
      const newPlatosDisponibles = {};

      for (const day of days) {
        const fechaFormateada = day.format('YYYY-MM-DD');
        try {
          const response = await axios.get(
            `http://localhost:3000/api/v1/menudiario/Verificar/platos-disponibles?fecha=${fechaFormateada}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          newPlatosDisponibles[day.format('dddd').toUpperCase()] = response.data;
        } catch (error) {
          console.error("Error al obtener platos disponibles:", error);
          // Manejar el error, posiblemente mostrando un mensaje al usuario
        }
      }

      setPlatosDisponibles(newPlatosDisponibles);
    };

    obtenerPlatosDisponibles();
  }, [year, week]);

  const handleSucursalChange = (event) => {
    setSucursal(event.target.value);
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
          console.log(`Minuta para <span class="math-inline">\{dia\} \(</span>{fechaDia}) creada:`, response.data);
        } catch (error) {
          console.error(`Error al crear minuta para <span class="math-inline">\{dia\} \(</span>{fechaDia}):`, error);
        }
      }
    }
  };

  const opcionesFiltradasPorFila = useMemo(() => {
      const opciones = {};
      filas.forEach(fila => {
        let tipoPlatoFiltrado = tipoPlatoPorFila[fila];
        encabezados.slice(1).forEach(encabezado => {
          if (!opciones[fila]) {
            opciones[fila] = {};
          }
          if (
            platosDisponibles[encabezado] &&
            platosDisponibles[encabezado].length > 0
          ) {
            let opcionesFiltradas = platosDisponibles[encabezado].filter(
              plato => plato.categoria === tipoPlatoFiltrado
            );
  
            if (fila === "SOPA DEL DÍA") {
              opcionesFiltradas = opcionesFiltradas.concat(
                platosDisponibles[encabezado].filter(plato => plato.categoria === "CREMAS")
              );
            }
            opciones[fila][encabezado] = opcionesFiltradas;
          } else {
            opciones[fila][encabezado] = [];
          }
        });
      });
      return opciones;
    }, [platosDisponibles, year, week]);
  
  const getValueForAutocomplete = (row, col) => {
    const dia = col.toUpperCase();
    const platoId = data[dia]?.[row];
    return (
      opcionesFiltradasPorFila[row]?.[dia]?.find(p => p._id === platoId) || null
    );
  };
  
  return (
    <div>
      <Header />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'white', padding: 2, borderRadius: '25px', margin: '0 auto', width: '100%', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              height: '5rem',
              alignItems: 'center',
              p: 2, // Añadimos padding al contenedor
              mb: 2, // Añadimos margin-bottom para separar de la tabla
              backgroundColor: '#f5f5f5', // Fondo gris claro
              border: '1px solid #ddd', // Borde sutil
              borderRadius: '4px', // Bordes redondeados
            }}
          >
            <TextField label="Nombre" type="text" value={`Minuta Semana ${week}`} sx={{ width: '15rem' }} />
            <TextField label="Año" type="number" value={year} onChange={handleYearChange} sx={{ width: '7rem' }} />
            <TextField label="Semana (1-52)" type="number" value={week} onChange={handleWeekChange} sx={{ width: '9rem' }} />
            <FormControl sx={{ width: '15rem' }}>
              <InputLabel>Sucursal</InputLabel>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Select
                  value={sucursal}
                  onChange={handleSucursalChange}
                  label="Sucursal"
                  sx={{
                    '& .MuiSelect-select': {
                      paddingTop: '10.5px', // Ajuste para centrar el texto
                    },
                  }}
                >
                  {sucursales.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.nombresucursal}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </FormControl>
            <Button
              variant="contained"
              sx={{
                height: '3rem',
                borderRadius: '4px', // Bordes redondeados consistentes
                px: 3, // Aumentamos el padding horizontal
                fontSize: '1rem', // Aumentamos el tamaño de la fuente
              }}
              onClick={handleCrearMinuta}
            >
              Crear Minuta
            </Button>
          </Box>
        </LocalizationProvider>


        <TableContainer component={Paper} sx={{ width: '100%', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <Table sx={{ width: '90%', fontFamily: 'Roboto, sans-serif', margin: '0 auto', border: '1px solid rgb(4, 109, 0)' }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell key="empty-cell" sx={{backgroundColor: '#2E8B57'}}></TableCell>
                {weekDays.map((day) => (
                  <TableCell
                    key={day.toString()}
                    align="center"
                    sx={{
                      width: '100%',
                      backgroundColor: '#2E8B57',
                      color: 'white',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      letterSpacing: '1.5px',
                      padding: '20px 15px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {day.format('dddd DD [de] MMMM')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((fila) => (
                <TableRow 
                  key={fila} 
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 }, 
                    width: '100%', 
                    '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.04)'},                
                  }}>
                  <TableCell 
                    component="th" 
                    scope="row" 
                    align="center" 
                    sx={{ 
                      width: '100%', 
                      p: 1.5, 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      backgroundColor: '#2E8B57',
                      color: 'rgb(8, 7, 66)' 
                      }}
                    >
                      {fila}
                    </TableCell>
                    {encabezados.slice(1).map((encabezado, index) => (
                      <TableCell key={`${encabezado}-${fila}`} align="center" sx={{width:'100%', p: 1.5, fontSize: '12px' }}>
                        <Autocomplete
                          disablePortal
                          id={`${encabezado}-${fila}`}
                          options={opcionesFiltradasPorFila[fila]?.[encabezado] || []}
                          getOptionLabel={(option) => option.nombre}
                          value={getValueForAutocomplete(fila, encabezado)}
                          onChange={(event, newValue) => handleAutocompleteChange(event, newValue, fila, encabezado)}
                          isOptionEqualToValue={(option, value) => option?._id === value?._id}
                          sx={{ width: '100%' }}
                          renderInput={(params) => (
                            <TextField
                            {...params}
                            label={`Seleccionar ${tipoPlatoPorFila[fila]}`}
                            size="small"
                            sx={{ width: '100%' }}
                            />
                        )}/>
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