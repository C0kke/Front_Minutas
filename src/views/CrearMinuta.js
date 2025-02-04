import React, { useState, useEffect, useMemo } from 'react';
import { TextField, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, Button,Grid2, Checkbox } from '@mui/material';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import weekday from 'dayjs/plugin/weekday';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/es';

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
  "FONDO 1",
  "GUARNICIÓN 1",
  "FONDO 2",
  "GUARNICIÓN 2",
  "HIPOCALÓRICO",
  "VEGETARIANO",
  "VEGANO",
  "SALAD BAR 1",
  "SALAD BAR 2",
  "SALAD BAR 3",
  "SOPA",
  "POSTRE",
];

const tipoPlatoPorFila = {
  "FONDO 1": "PLATO DE FONDO",
  "GUARNICIÓN 1": "GUARNICIÓN",
  "FONDO 2": "PLATO DE FONDO",
  "GUARNICIÓN 2": "GUARNICIÓN",
  "HIPOCALÓRICO": "HIPOCALORICO",
  "VEGETARIANO": "VEGANA/VEGETARIANA",
  "VEGANO": "VEGANA/VEGETARIANA",
  "SALAD BAR 1": "ENSALADA",
  "SALAD BAR 2": "ENSALADA",
  "SALAD BAR 3": "ENSALADA",
  "SOPA": "SOPA",
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
  const [platos, setPlatos] = useState([]);
  const [platosDisponibles, setPlatosDisponibles] = useState({}); 
  const currentYear = dayjs().year();

  const [year, setYear] = useState(currentYear);
  const [week, setWeek] = useState(dayjs().week());
  const [semanaEstructura, setSemanaEstructura] = useState(dayjs().week());
  const [filtrandoPorEstructura, setFiltrandoPorEstructura] = useState(true);

  const [weekDays, setWeekDays] = useState(generateWeekDays(currentYear, dayjs().week()));  
  const [loading ,setLoading] = useState(true);
  const [error ,setError] = useState(null);
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
        newPlatosDisponibles[nombreDiaNormalizado] = response.data.filter(plato => plato.descontinuado === false);
      } catch (error) {
        console.error("Error al obtener platos disponibles:", error);
      }
    }
    console.log("newPlatosDisponibles:", newPlatosDisponibles); // Añade esta línea
    setPlatosDisponibles(newPlatosDisponibles);
  };

  obtenerPlatosDisponibles();
}, [year, week, token, platosDisponibles]);

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

  const handleStructureWeekChange = (event) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek > 0 && newWeek < 6) {
      setSemanaEstructura(newWeek);
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

    // Verificar que los datos estén completos
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
          estado: "Activo",
          listaplatos: listaplatos,
          aprobado: false,
        };
        minutasAEnviar.push(minutaDia);
      }

      // Validacion de errores
      let hayErrores = false;
      const ensaladas = {};
      for (const minuta of minutasAEnviar) {
        // Error: Minuta vacia
        if (minuta.listaplatos.length === 0) {
          hayErrores = true;
          alert(`Error : La minuta para ${minuta.nombre} no tiene platos.`);
        }

        const fechaISO = dayjs(minuta.fecha).format('YYYY-MM-DD');
        ensaladas[fechaISO] = [];

        minuta.listaplatos.forEach(plato => {
          if (plato.fila.startsWith("SALAD BAR")) {
            ensaladas[fechaISO].push(plato.platoId);
          }
        });
      }

      // Verificar combinaciones de ensaladas repetidas en otros dias
      for (const fecha of Object.keys(ensaladas)) {
          const combinacionActual = ensaladas[fecha];
          if (combinacionActual && combinacionActual.length > 0) { 
              for (const otraFecha of Object.keys(ensaladas)) {
                  if (fecha !== otraFecha) {
                      const otraCombinacion = ensaladas[otraFecha];
                      const sonIguales = combinacionActual.length === otraCombinacion.length &&
                          combinacionActual.every(ensaladaId => otraCombinacion.includes(ensaladaId));
          
                      if (sonIguales) {
                          hayErrores = true;
                          const fechaActual = dayjs(fecha).format('dddd DD [de] MMMM');
                          const otraFechaFormateada = dayjs(otraFecha).format('dddd DD [de] MMMM');
                          alert(`Error: La combinación de ensaladas del ${fechaActual} ya existe en la fecha ${otraFechaFormateada}.`);
                          break; 
                      }
                  }
              }
          }
          if (hayErrores) break; 
      }

      if (!hayErrores) {
        try {
          const token = localStorage.getItem('token')?.trim();
          const response = await axios.post('http://localhost:3000/api/v1/menudiario/validate-menus', minutasAEnviar, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          if (response.data.valid === true){
            for (const minuta of minutasAEnviar) {
              await axios.post('http://localhost:3000/api/v1/menudiario', minuta, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              }); 
            }
            alert(`MINUTA PARA SEMANA ${week} - ${year} CREADA CON ÉXITO Y ESPERA APROBACIÓN`);
            navigate('/home');
          } else {
            console.log(response.data)
            response.data.errors.forEach(e => alert(e.error))
          }
        } catch (error) {
          console.error("Error al enviar las minutas:", error);

          if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.setItem('error', 'error de sesion');
            navigate("/login");
          } else if (error.response) {
            alert(`Error del servidor: ${error.response.status} - ${error.response.data.message || 'Detalles no disponibles'}`);
          } else if (error.request) {
            alert("No se recibió respuesta del servidor.");
          } else {
            alert("Se produjo un error al crear la minuta. Por favor, inténtalo de nuevo.");
          }
        }
      } else {
        if(hayErrores){
          alert("Se encontraron errores en algunas minutas. No se creará ninguna minuta.");
        } else {
          alert("Faltan datos para completar la minuta de la semana. Por favor, rellene todos los campos.");
        }
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

          // HIPOCALORICO, VEGETARIANA y VEGANA: no repetir en la misma semana
          if (["HIPOCALORICO", "VEGANA/VEGETARIANA"].includes(tipoPlatoFiltrado)) {
            opcionesFiltradas = opcionesFiltradas.filter((plato) => {
              const yaSeleccionadoEnSemana = encabezados.slice(1).some((otroEncabezado) => {
                const otroEncabezadoNormalizado = otroEncabezado
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");
    
                if (otroEncabezadoNormalizado !== encabezadoNormalizado) {
                  return (
                    !data[otroEncabezadoNormalizado]?.["VEGETARIANO"] === plato._id ||
                    !data[otroEncabezadoNormalizado]?.["VEGANO"] === plato._id ||
                    Object.values(data[otroEncabezadoNormalizado] || {}).includes(plato._id)
                  );
                }
                return false;
              });
              return !yaSeleccionadoEnSemana;
            });
          }

          if (fila === "SOPA") {
            opcionesFiltradas = opcionesFiltradas.concat(
              platosDisponibles[encabezadoNormalizado].filter(
                (plato) => plato.categoria === "CREMAS"
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
  }, [platosDisponibles, data, week, year]);
  
  const getValueForAutocomplete = (row, col) => {
    const dia = col.toUpperCase();
    const platoId = data[dia]?.[row];
    return (
      opcionesFiltradasPorFila[row]?.[dia]?.find(p => p._id === platoId) || null
    );
  };
  
  return (
    <Grid2 container direction="column" style={{ minHeight: '100vh' }}>
      <Grid2 item>
        <Header />
      </Grid2>
      <Grid2 item container justifyContent="center" style={{ flexGrow: 1 }}>
        <Grid2 item xs={12} md={11}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'white',
            padding: 2,
            borderRadius: '25px',
            my: '2rem',
            width: '100%',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  height: '5rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  mb: 2,
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '100rem',
                }}
              >
                <Box>
                  <Checkbox label = "Usando filtro de estructura" defaultChecked value={filtrandoPorEstructura}></Checkbox>
                  <TextField label="Estructura N° (1-5)" type="number" value={semanaEstructura} onChange={handleStructureWeekChange} sx={{ width: '9rem' }} />
                </Box>
                <Box>
                  <TextField label="Nombre" type="text" value={`Minuta Semana ${week} - ${year}`} sx={{ width: '15rem' }} />
                  <TextField label="Año" type="number" value={year} onChange={handleYearChange} sx={{ width: '7rem' }} />
                  <TextField label="Semana (1-52)" type="number" value={week} onChange={handleWeekChange} sx={{ width: '9rem' }} />
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
              </Box>
            </LocalizationProvider>

            <TableContainer component={Paper} sx={{ width: '100%', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
              <Table sx={{ width: '100%', fontFamily: 'Roboto, sans-serif', margin: '0 auto', border: '1px solid rgb(4, 109, 0)', minWidth: '1000px' }} aria-label="simple table">
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
        </Grid2>
      </Grid2>
    </Grid2>
  );
}
  
export default Minutas;