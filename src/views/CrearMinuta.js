import React, { useState, useEffect, useMemo } from 'react';
import { TextField, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, Button } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import weekday from 'dayjs/plugin/weekday';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isoWeek from 'dayjs/plugin/isoWeek'; // Importa el plugin isoWeek
import 'dayjs/locale/es';
import './styles/CrearMinuta.css';
import Header from '../components/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

dayjs.extend(isLeapYear);
dayjs.extend(isoWeek); // Extiende el plugin isoWeek
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
  // Calcula el primer día del año *en formato ISO*
  const firstDayOfYear = dayjs().year(year).startOf('year').isoWeekday(1); // Importante: isoWeekday(1)

  // Calcula el primer día de la semana
  const firstDayOfWeek = firstDayOfYear.add(week - 1, 'week');

  const weekDays = [];
  for (let i = 0; i < 5; i++) {
      weekDays.push(firstDayOfWeek.add(i, 'day'));
  }
  return weekDays;
};


const Minutas = () => {
const [sucursal, setSucursal] = useState('Centro'); 
  const navigate = useNavigate();
  const currentYear = dayjs().year();
  const [year, setYear] = useState(currentYear);
  const [week, setWeek] = useState(dayjs().week());
  const [weekDays, setWeekDays] = useState(generateWeekDays(currentYear, dayjs().week()));
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const handleSucursalChange = (e) => {
    setSucursal(e.target.value);  // Actualiza el estado con el valor del input
  };
  useEffect(() => {
      const fetchPlatos = async () => {
          const token = localStorage.getItem('token')?.trim();

          if (!token) {
              console.error("Token no encontrado en localStorage. Redirigiendo al login.");
              setError(new Error("No autorizado. Inicie sesión."));
              setLoading(false);
              navigate("/");
              return;
          }

          try {
              const response = await axios.get('http://localhost:3000/api/v1/plato', {
                  headers: { Authorization: `Bearer ${token}` }
              });
              const platosFiltrados = response.data.filter(plato => !plato.descontinuado);
              setPlatos(platosFiltrados);
              console.log("Platos recibidos:", platosFiltrados); 

          } catch (error) {
              console.error("Error al obtener platos:", error);
              if (error.response && error.response.status === 401) {
                  console.error("Token inválido. Redirigiendo al login.");
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
    setData(prevData => ({
        ...prevData,
        [col]: {
            ...prevData[col],
            [row]: value ? value._id : null,
        },
    }));
  };
  const generateMinutaData = () => {
    const platosSeleccionados = [];
    Object.values(data).forEach(rowData => {
        Object.values(rowData).forEach(platoId => {
            if (platoId) {
                platosSeleccionados.push(platoId);
            }
        });
    });

    return {
        nombre: `Minuta Semana ${week}`,
        fecha: dayjs().toISOString(),
        semana: week,
        id_sucursal: sucursal, // Puedes mapear esto si necesitas el id real de la sucursal
        estado: "Activo",
        listaplatos: platosSeleccionados,
    };
};

const handleCrearMinuta = async () => {
    const minutaData = generateMinutaData();
    try {
        const token = localStorage.getItem('token')?.trim();
        const response = await axios.post('http://localhost:3000/api/v1/menudiario', minutaData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        console.log('Minuta creada:', response.data);
        // Puedes hacer algo después de la creación exitosa, como redirigir o mostrar un mensaje
    } catch (error) {
        console.error('Error al crear minuta:', error);
        // Maneja el error, muestra un mensaje al usuario si es necesario
    }
};

  const opcionesFiltradasPorFila = useMemo(() => {
    const opciones = {};
    filas.forEach(fila => {
        let tipoPlatoFiltrado = tipoPlatoPorFila[fila];
        let opcionesFiltradas = platos.filter(plato => plato.categoria === tipoPlatoFiltrado);

        if (tipoPlatoFiltrado === "PLATO DE FONDO") {
            opcionesFiltradas = platos.filter(plato => plato.categoria === tipoPlatoFiltrado || plato.categoria === "LEGUMBRES");

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

  const isOptionDisabled = (option, row) => {
    if (tipoPlatoPorFila[row] !== "PLATO DE FONDO") {
        return false;
    }

    const platosDeFondoSeleccionados = new Set();
    encabezados.slice(1).forEach(encabezado => {
        filas.filter(f => tipoPlatoPorFila[f] === "PLATO DE FONDO").forEach(filaInterna =>{
            if(data[encabezado] && data[encabezado][filaInterna]){
                platosDeFondoSeleccionados.add(data[encabezado][filaInterna])
            }
        })
    });
    return platosDeFondoSeleccionados.has(option._id);
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
                    <TextField 
         label="Sucursal" 
         type="text" 
         value={sucursal}  // Ahora tiene el valor "Centro" por defecto
         onChange={handleSucursalChange}  // Actualiza el estado cuando el valor cambie
         sx={{ width: 200 }}  
    />
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
                                            getOptionDisabled={(option) => isOptionDisabled(option, fila)}
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