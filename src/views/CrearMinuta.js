import React, { useState, useEffect, useMemo } from 'react';
import { TextField, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, Button, InputLabel, CircularProgress, Select, MenuItem, FormControl } from '@mui/material';

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
  "HIPOCALORICO",
  "ENSALADA 1",
  "ENSALADA 2",
  "ENSALADA 3",
  "SOPA DIA",
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
  "HIPOCALORICO": "HIPOCALORICO",
  "ENSALADA 1": "ENSALADA",
  "ENSALADA 2": "ENSALADA",
  "ENSALADA 3": "ENSALADA",
  "SOPA DIA": "SOPA",
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
        const platosFiltrados = response.data.filter(plato => plato.descontinuado === false);
        setPlatos(platosFiltrados);
      } catch (error) {
        console.error("Error al obtener platos:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.setItem('error', 'error de sesion');
          navigate("/login");
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
          localStorage.setItem('error', 'error en la sesion');
        navigate("/login");
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
        const nombreDia = day.format('dddd').toUpperCase();
        const nombreDiaNormalizado = nombreDia
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        newPlatosDisponibles[nombreDiaNormalizado] = response.data;
      } catch (error) {
        console.error("Error al obtener platos disponibles:", error);
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
  const colNormalizado = col.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  setData((prevData) => {
    const newData = { ...prevData };
    if (!newData[colNormalizado]) {
      newData[colNormalizado] = {};
    }
    newData[colNormalizado][row] = value ? value._id : null;
    return newData;
  });
};

  const handleCrearMinuta = async () => {
    const firstDayOfWeek = dayjs().year(year).isoWeek(week).startOf('isoWeek');
    let datosCompletos = true;
    const minutasAEnviar = []; 

    // Verificar si existen datos en los 5 encabezados
    for (let i = 1; i < encabezados.length; i++) {
      const dia = encabezados[i];
      if (!data || !data[dia] || Object.keys(data[dia]).length === 0) {
        datosCompletos = false;
        break;
      }
    }

    if (datosCompletos) {
      for (let i = 1; i < encabezados.length; i++) {
        const dia = encabezados[i];
        const listaplatos = [];

        if (data && data[dia]) {
          Object.entries(data[dia]).forEach(([fila, platoId]) => {
            if (platoId) {
              listaplatos.push({
                platoId: platoId,
                fila: fila,
              });
            }
          });
        }

        const fechaDia = firstDayOfWeek.add(i - 1, 'day').toISOString();

        const minutaDia = {
          nombre: `Minuta ${dia} Semana ${week}`,
          fecha: fechaDia,
          semana: week,
          year: year,
          id_sucursal: sucursal,
          estado: "Activo",
          listaplatos: listaplatos,
          aprobado: false,
        };
          minutasAEnviar.push(minutaDia); 
      }

      // Verificar si hay errores potenciales (en este caso, si la lista de platos está vacía)
      let hayErrores = false;
      const ensaladas = [];
      for (const minuta of minutasAEnviar) {
        if (minuta.listaplatos.length === 0) {
          hayErrores = true;
          alert(`Error : La minuta para ${minuta.nombre} no tiene platos.`);
          break;
        }
        minuta.listaplatos.map(plato => {
          if (plato.categoria === "ENSALADA") {
            ensaladas.push(plato);
          }
        })
      }

      if (!hayErrores) {
        try {
          const token = localStorage.getItem('token')?.trim();
          for (const minuta of minutasAEnviar) {
            const response = await axios.post('http://localhost:3000/api/v1/menudiario', minuta, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            });
          }
          alert(`MINUTA PARA SEMANA ${week} - ${year} CREADA CON ÉXITO Y ESPERA APROBACIÓN`)
          navigate('/home');
        } catch (error) {
          console.error("Error al enviar las minutas:", error);
          if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.setItem('error', 'error de sesion');
            navigate("/login");
          } else if (error.response) {
            alert(`Error del servidor: ${error.response.status} - ${error.response.data.error.message || 'Detalles no disponibles'}`);
          } else if (error.request) {
            alert("No se recibió respuesta del servidor.");
          }
        }
      } else {
        alert("Se encontraron errores en algunas minutas. No se creará ninguna minuta.");
      }
    } else {
      alert("Faltan datos para completar la minuta de la semana. Por favor, rellene todos los campos.");
    }
  };

  const opcionesFiltradasPorFila = useMemo(() => {
    const opciones = {};

    filas.forEach((fila) => {
      let tipoPlatoFiltrado = tipoPlatoPorFila[fila];
      encabezados.slice(1).forEach((encabezado) => {
        const encabezadoNormalizado = encabezado
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (!opciones[fila]) {
          opciones[fila] = {};
        }

        if (
          platosDisponibles[encabezadoNormalizado] &&
          platosDisponibles[encabezadoNormalizado].length > 0
        ) {
          let opcionesFiltradas = platosDisponibles[encabezadoNormalizado].filter(
            (plato) => plato.categoria === tipoPlatoFiltrado
          );

          // Restricción: No repetir platos de fondo en el mismo día ni en la misma semana
          if (tipoPlatoFiltrado === "PLATO DE FONDO") {
            opcionesFiltradas = opcionesFiltradas.filter((plato) => {
              const yaSeleccionado = encabezados.slice(1).some((otroEncabezado) => {
                const otroEncabezadoNormalizado = otroEncabezado
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");

                if (otroEncabezadoNormalizado === encabezadoNormalizado) {
                  return filas.some((otraFila) => {
                    return (
                      otraFila !== fila &&
                      tipoPlatoPorFila[otraFila] === "PLATO DE FONDO" &&
                      data[encabezadoNormalizado]?.[otraFila] === plato._id
                    );
                  });
                }

                return (
                  otroEncabezadoNormalizado !== encabezadoNormalizado &&
                  Object.values(data[otroEncabezadoNormalizado] || {}).includes(plato._id)
                );
              });

              return !yaSeleccionado;
            });
          }

          // Restricción: No repetir ensaladas en el mismo día
          if (tipoPlatoFiltrado === "ENSALADA") {
            opcionesFiltradas = opcionesFiltradas.filter((plato) => {
              const yaSeleccionadoEnDia = filas.some((otraFila) => {
                return (
                  otraFila !== fila &&
                  tipoPlatoPorFila[otraFila] === "ENSALADA" &&
                  data[encabezadoNormalizado]?.[otraFila] === plato._id
                );
              });
              return !yaSeleccionadoEnDia;
            });
          }

          // Restricción: No repetir guarniciones en el mismo día ni en la misma semana
          if (tipoPlatoFiltrado === "GUARNICIÓN") {
            opcionesFiltradas = opcionesFiltradas.filter((plato) => {
              const yaSeleccionado = encabezados.slice(1).some((otroEncabezado) => {
                const otroEncabezadoNormalizado = otroEncabezado
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");

                if (otroEncabezadoNormalizado === encabezadoNormalizado) {
                  return filas.some((otraFila) => {
                    return (
                      otraFila !== fila &&
                      tipoPlatoPorFila[otraFila] === "GUARNICIÓN" &&
                      data[encabezadoNormalizado]?.[otraFila] === plato._id
                    );
                  });
                }

                return (
                  otroEncabezadoNormalizado !== encabezadoNormalizado &&
                  Object.values(data[otroEncabezadoNormalizado] || {}).includes(plato._id)
                );
              });

              return !yaSeleccionado;
            });
          }

          if (fila === "SOPA DIA") {
            opcionesFiltradas = opcionesFiltradas.concat(
              platosDisponibles[encabezadoNormalizado].filter(
                (plato) => plato.categoria === "CREMAS"
              )
            );
          }

          if (fila === "VEGANA") {
            opcionesFiltradas = opcionesFiltradas.concat(
              platosDisponibles[encabezadoNormalizado].filter(
                (plato) => plato.categoria === "VEGETARIANO"
              )
            );
          }

          opciones[fila][encabezadoNormalizado] = opcionesFiltradas;
        } else {
          opciones[fila][encabezadoNormalizado] = [];
        }
      });
    }); 
    return opciones;
  }, [platosDisponibles, year, week, data]);
  
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        bgcolor: 'white', 
        padding: 2, 
        borderRadius: '25px', 
        margin: '2rem auto',
        width: 'calc(100% - 4rem)', // Ancho dinámico con margen
        maxWidth: '2200px', // Ancho máximo
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto',
      }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
            sx={{
              display: 'flex',
              gap: 3,
              height: '5rem',
              alignItems: 'center',
              p: 2, 
              mb: 2, 
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <TextField label="Nombre" type="text" value={`Minuta Semana ${week} - ${year}`} sx={{ width: '15rem' }} />
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
                borderRadius: '4px', 
                px: 3, 
                fontSize: '1rem',
              }}
              onClick={handleCrearMinuta}
            >
              Crear Minuta
            </Button>
          </Box>
        </LocalizationProvider>

        <TableContainer component={Paper} sx={{ width: '100%', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
          <Table sx={{ width: '150%', fontFamily: 'Roboto, sans-serif', margin: '0 auto', border: '1px solid rgb(4, 109, 0)', minWidth: '1000px' }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell key="empty-cell" sx={{backgroundColor: '#2E8B57', width: '15%'}}></TableCell>
                {weekDays.map((day) => (
                  <TableCell
                    key={day.toString()}
                    align="center"
                    sx={{
                      width: '17%',
                      backgroundColor: '#2E8B57',
                      color: 'white',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      letterSpacing: '1.5px',
                      padding: '20px 15px',
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
                    '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.04)'},
                  }}
                >
                  <TableCell 
                    component="th" 
                    scope="row" 
                    align="center" 
                    sx={{ 
                      width: '15%',
                      minWidth: '150px',
                      p: 1.5, 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      backgroundColor: '#2E8B57',
                      color: 'white' 
                    }}
                  >
                      {fila}
                    </TableCell>
                    {encabezados.slice(1).map((encabezado, index) => (
                      <TableCell key={`${encabezado}-${fila}`} align="center" sx={{ p: 1.5, fontSize: '12px', wordBreak: 'break-word'}}>
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
                              multiline
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