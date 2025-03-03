import React, { useState, useEffect, useMemo } from 'react';
import { 
  TextField, 
  Box, 
  Table, 
  TableBody,
  TableCell,
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Autocomplete, 
  Button,
  Grid2, 
  Checkbox, 
  Typography, 
  Modal, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

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
import WeekStructureModal from '../components/ModalEstructura';

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
  const firstDayOfYear = dayjs().locale('es').year(year).startOf('year').isoWeekday(1);
  const firstDayOfWeek = firstDayOfYear.add(week - 1, 'week');
  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const day = firstDayOfWeek.add(i, 'day');
    const nombreDia = encabezados[i + 1];
    weekDays.push({ date: day, nombreDia });
  }
  return weekDays;
};

const Minutas = () => {
  const [platos, setPlatos] = useState([]);
  const [platosDisponibles, setPlatosDisponibles] = useState({}); 
  const currentYear = dayjs().year();
  const [openStructureModal, setOpenStructureModal] = useState(false); 
  const [selectedWeekStructure, setSelectedWeekStructure] = useState(null);
  const [estructuraSemana, setEstructuraSemana] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [sucursal, setSucursal] = useState(null);

  const [year, setYear] = useState(currentYear);
  const [week, setWeek] = useState(dayjs().week());
  const semEstructuraPrimary = (dayjs().week() % 5);
  const [semanaEstructura, setSemanaEstructura] = useState((semEstructuraPrimary != 0) ? semEstructuraPrimary : 5);
  const [filtrandoPorEstructura, setFiltrandoPorEstructura] = useState(true);
  const BACKEND_URL = process.env.REACT_APP_BACK_URL;

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
        const response = await axios.get(`${BACKEND_URL}plato`, {
          headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
  const fetchSucursales = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}sucursal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sucursalesData = response.data;

      // "Central" como sucursal por defecto
      const sucursalCentral = sucursalesData.find(
        (s) => s.nombresucursal.toLowerCase() === 'central'
      );
      setSucursales(sucursalesData);
      setSucursal(sucursalCentral || null);
    } catch (error) {
      console.error("Error al obtener sucursales:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.setItem('error', 'error de sesion');
        navigate("/login");
      } else {
        setError(new Error("Error al configurar la solicitud."));
      }
    } finally {
      setLoading(false);
    }
  };
  fetchSucursales();
}, [navigate]);
  
  useEffect(() => {
    const loadInitialWeekStructure = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}estructura`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
  
        const groupedData = groupDataByWeekAndDay(response.data);
        const initialWeek = semanaEstructura;
        setSelectedWeekStructure(groupedData[initialWeek] || {});
      } catch (error) {
        console.error("Error al cargar la estructura inicial:", error);
        if (error.response && error.response.status === 404) {
          alert(`No se encontraron estructuras para la semana "${semanaEstructura}".`);
        }
      }
    };
    loadInitialWeekStructure();
  }, [navigate]);

  // Obtener platos disponibles por fecha
  useEffect(() => {
    const obtenerPlatosDisponibles = async () => {
      const days = generateWeekDays(year, week);
      const newPlatosDisponibles = {};
      for (const { date, nombreDia } of days) {
        const fechaFormateada = date.format('YYYY-MM-DD');
        try {
          const response = await axios.get(
            `${BACKEND_URL}menudiario/Verificar/platos-disponibles`,
            { 
              params: {
                fecha: fechaFormateada,
                filtrar: filtrandoPorEstructura,
                semana: semanaEstructura,
                dia: nombreDia,
                sucursal: sucursal?._id,
              },
              headers: { 
                Authorization: `Bearer ${token}` 
              } 
            }
          );
          newPlatosDisponibles[nombreDia] = response.data.filter(plato => plato.descontinuado === false);
        } catch (error) {
          console.error("Error al obtener platos disponibles:", error);
        }
      }
      setPlatosDisponibles(newPlatosDisponibles);
    };
    obtenerPlatosDisponibles();
  }, [year, week, filtrandoPorEstructura, semanaEstructura, sucursal]);

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

  const handleCheckChange = (event) => {
    setFiltrandoPorEstructura(event.target.checked);
  };

  const handleSucursalChange = (event, value) => {
    setSucursal(value); // Almacena el objeto completo de la sucursal
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

  useEffect(() => {
    const loadWeekStructure = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}estructura`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const groupedData = groupDataByWeekAndDay(response.data);
        const structureForWeek = groupedData[semanaEstructura] || {};
        setSelectedWeekStructure(structureForWeek);
      } catch (error) {
        console.error("Error al cargar la estructura:", error);
        if (error.response && error.response.status === 404) {
          alert(`No se encontraron estructuras para la semana "${semanaEstructura}".`);
        }
      }
    };

    if (semanaEstructura) {
      loadWeekStructure();
    }
  }, [semanaEstructura]);

  const handleCrearMinuta = async () => {
    setLoading(true);

    if (!sucursal) {
      alert("Debe seleccionar una sucursal");
      return;
    }

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
        const nombreMinuta = `Minuta ${dia} Semana ${week} - ${sucursal?.nombresucursal || ''} - ${year}`;

        const minutaDia = {
          nombre: nombreMinuta,
          fecha: fechaDia,
          semana: week,
          year: year,
          id_sucursal: sucursal?._id,
          listaplatos: listaplatos,
          aprobado: false,
        };
        minutasAEnviar.push(minutaDia);
      }
  
      // Validación de errores y envío de datos...
      try {
        const token = localStorage.getItem('token')?.trim();
        const response = await axios.post(`${BACKEND_URL}menudiario/validate-menus`, minutasAEnviar, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (response.data.valid === true) {
          for (const minuta of minutasAEnviar) {
            await axios.post(`${BACKEND_URL}menudiario`, minuta, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
          alert(`MINUTA PARA SEMANA ${week} - ${sucursal?.nombresucursal || ''} - ${year} CREADA CON ÉXITO Y ESPERA APROBACIÓN`);
          setLoading(false);
          navigate('/home');
        } else {
          alert(response.data.errors[0].error);
          setLoading(false);
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
          setLoading(false);
        } else {
          alert("Se produjo un error al crear la minuta. Por favor, inténtalo de nuevo.");
          setLoading(false);
        }
      } finally {
        setLoading(false);
      }
    } else {
      alert("Faltan datos para completar la minuta de la semana. Por favor, rellene todos los campos.");
      setLoading(false);
    }
  };


  const groupDataByWeekAndDay = (data) => {
    return data.reduce((acc, item) => {
      if (!acc[item.semana]) acc[item.semana] = {};
      if (!acc[item.semana][item.dia]) acc[item.semana][item.dia] = {};
      if (!acc[item.semana][item.dia][item.categoria]) acc[item.semana][item.dia][item.categoria] = [];
      acc[item.semana][item.dia][item.categoria].push({
        familia: item.familia || "",
        corteqlo: item.corteqlo || "",
      });
      return acc;
    }, {});
  };

  const opcionesFiltradasPorFila = useMemo(() => {
    const opciones = {};
  
    // Función para aplicar restricciones adicionales
    const aplicarRestricciones = (opcionesIniciales, fila, encabezadoNormalizado, tipoPlatoFiltrado) => {
      return opcionesIniciales.filter((plato) => {
        // No repetir platos de fondo en la misma semana
        if (tipoPlatoFiltrado === "PLATO DE FONDO") {
          const yaSeleccionado = encabezados.slice(1).some((otroEncabezado) => {
            const otroEncabezadoNormalizado = otroEncabezado.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
        }
  
        // No repetir guarniciones en el mismo día ni en la misma semana
        if (tipoPlatoFiltrado === "GUARNICIÓN") {
          const yaSeleccionado = encabezados.slice(1).some((otroEncabezado) => {
            const otroEncabezadoNormalizado = otroEncabezado.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
        }
  
        // Restricción: No repetir ensaladas en el mismo día
        if (tipoPlatoFiltrado === "ENSALADA") {
          const yaSeleccionadoEnDia = filas.some((otraFila) => {
            return (
              otraFila !== fila &&
              tipoPlatoPorFila[otraFila] === "ENSALADA" &&
              data[encabezadoNormalizado]?.[otraFila] === plato._id
            );
          });
          return !yaSeleccionadoEnDia;
        }
  
        // HIPOCALORICO, VEGETARIANA y VEGANA: no repetir en la misma semana
        if (["HIPOCALORICO", "VEGANA/VEGETARIANA"].includes(tipoPlatoFiltrado)) {
          const yaSeleccionadoEnSemana = encabezados.slice(1).some((otroEncabezado) => {
            const otroEncabezadoNormalizado = otroEncabezado.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (otroEncabezadoNormalizado !== encabezadoNormalizado) {
              return Object.values(data[otroEncabezadoNormalizado] || {}).includes(plato._id);
            }
            return false;
          });
          return !yaSeleccionadoEnSemana;
        }
  
        return true;
      });
    };
  
    // Función para filtrar por estructura (solo para PLATO DE FONDO y GUARNICIÓN)
    const filtrarPorEstructura = (opcionesFiltradas, fila, encabezadoNormalizado, tipoPlatoFiltrado) => {
      if (!["PLATO DE FONDO", "GUARNICIÓN"].includes(tipoPlatoFiltrado)) {
        return opcionesFiltradas; // No aplicar estructura a otros tipos
      }
  
      if (filtrandoPorEstructura && selectedWeekStructure) {
        const reglasEstructura = selectedWeekStructure[encabezadoNormalizado]?.[fila];
        if (reglasEstructura && reglasEstructura.length > 0) {
          return opcionesFiltradas.filter((plato) =>
            reglasEstructura.some((regla) => {
              const cumpleFamilia = !regla.familia || plato.familia === regla.familia;
              const cumpleCorte = !regla.corteqlo || plato.tipo_corte === regla.corteqlo;
              return cumpleFamilia && cumpleCorte;
            })
          );
        } else {
          return []; 
        }
      }
  
      return opcionesFiltradas;
    };
  
    // Construcción de las opciones finales
    filas.forEach((fila) => {
      const tipoPlatoFiltrado = tipoPlatoPorFila[fila];
      encabezados.slice(1).forEach((encabezado) => {
        const encabezadoNormalizado = encabezado.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
        if (!opciones[fila]) {
          opciones[fila] = {};
        }
  
        // Paso 1: Filtrar por categoría
        let opcionesFiltradas = platosDisponibles[encabezadoNormalizado]?.filter(
          (plato) => plato.categoria === tipoPlatoFiltrado
        ) || [];
  
        // Paso 2: Aplicar restricciones adicionales
        opcionesFiltradas = aplicarRestricciones(opcionesFiltradas, fila, encabezadoNormalizado, tipoPlatoFiltrado);
  
        // Paso 3: Aplicar filtrado por estructura (solo para PLATO DE FONDO y GUARNICIÓN)
        opcionesFiltradas = filtrarPorEstructura(opcionesFiltradas, fila, encabezadoNormalizado, tipoPlatoFiltrado);
  
        opciones[fila][encabezadoNormalizado] = opcionesFiltradas;
      });
    });
  
    return opciones;
  }, [platosDisponibles, filtrandoPorEstructura, selectedWeekStructure, data]);
  
    const handleViewStructureByWeek = () => {
    if (!selectedWeekStructure) {
      alert("No hay estructura disponible para esta semana.");
      return;
    }
    setOpenStructureModal(true);
  };

  const handleCloseStructureModal = () => {
    setOpenStructureModal(false);
  };

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
                  justifyContent: 'space-around',
                  p: 2,
                  mb: 2,
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '100rem',
                }}
              >
                <Box display={'flex'} gap={1} justifyContent={'initial'}>
                  <Typography color='#2E8B57' mt={2} width={'10em'}>{filtrandoPorEstructura ? "Filtrando activado" : "Filtrando desactivado"}</Typography>
                  <TextField label="Sem. Estructura" type="number" value={semanaEstructura} onChange={handleStructureWeekChange} sx={{ width: '7rem' }} disabled={!filtrandoPorEstructura} />
                  <Button 
                    variant='contained'
                    sx={{
                      height: '3.5rem',
                      borderRadius: '4px', 
                      fontSize: '12px',
                      width: '100px'
                    }}
                    onClick={() => handleViewStructureByWeek(semanaEstructura)}
                  >
                    Ver Estructura
                  </Button>
                  <Checkbox checked={filtrandoPorEstructura} onChange={handleCheckChange}></Checkbox>
                </Box>
                <Typography label="Nombre" type="text" sx={{ width: '20rem', color: "#1C2D58", fontSize: "20px", ml: 2 }}> {`Minuta Semana ${week} - ${sucursal?.nombresucursal || ''} - ${year}`} </Typography>
                <Box display={'flex'} gap={2}>
                  <TextField label="Año" type="number" value={year} onChange={handleYearChange} sx={{ width: '5rem'}} />
                  <TextField label="Semana (1-52)" type="number" value={week} onChange={handleWeekChange} sx={{ width: '7rem' }} />
                  <FormControl sx={{ width: '12rem', mt: 0.4 }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Autocomplete
                        options={sucursales}
                        getOptionLabel={(option) => option.nombresucursal} 
                        value={sucursal}
                        onChange={handleSucursalChange} 
                        renderInput={(params) => (
                          <TextField {...params} label="Seleccionar Sucursal" />
                        )}
                      />
                    )}
                  </FormControl>
                  <Button
                    variant="contained"
                    sx={{
                      height: '3.5rem',
                      borderRadius: '4px', 
                      fontSize: '12px',
                      width: '100px'
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
                <TableCell key="empty-cell" sx={{backgroundColor: '#009b15', width: '15%'}}></TableCell>
                {weekDays.map((day, index) => (
                  <TableCell
                    key={index}
                    align="center"
                    sx={{
                      width: '17%',
                      backgroundColor: '#009b15',
                      color: 'white',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      letterSpacing: '1.5px',
                      padding: '20px 15px',
                    }}
                  >
                    {day.nombreDia} {day.date.format('DD [de] MMMM')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((fila, index) => (
                <TableRow 
                  key={index} 
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
                    {encabezados.slice(1).map((encabezado) => (
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
      <WeekStructureModal
        open={openStructureModal}
        onClose={handleCloseStructureModal}
        weekStructure={selectedWeekStructure}
      />
    </Grid2>
  );
}
  
export default Minutas;