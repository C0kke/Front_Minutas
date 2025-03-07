import React, { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  InputLabel,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Button,
  Grid,
  Modal,
} from "@mui/material";

import dayjs from "dayjs";
import isLeapYear from "dayjs/plugin/isLeapYear";
import weekday from "dayjs/plugin/weekday";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/es";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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

dayjs.extend(isLeapYear);
dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(localizedFormat);
dayjs.locale("es");

const generateWeekDays = (year, week) => {
  const firstDayOfYear = dayjs().year(year).startOf("year").isoWeekday(1);
  const firstDayOfWeek = firstDayOfYear.add(week - 1, "week");

  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    weekDays.push(firstDayOfWeek.add(i, "day"));
  }
  return weekDays;
};
const BACKEND_URL = process.env.REACT_APP_BACK_URL;

const EditarMinuta = () => {
  const [menus, setMenus] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(dayjs().week());
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [sucursalDict, setSucursalDict] = useState({});
  const [weekDays, setWeekDays] = useState(
    generateWeekDays(selectedYear, selectedWeek)
  );
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [availableWeeksAndYears, setAvailableWeeksAndYears] = useState([]);
  const [platosDisponibles, setPlatosDisponibles] = useState({});
  const [allMenus, setAllMenus] = useState([]); // **Nuevo estado para todos los menús**

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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
      }
    };
    fetchPlatos();
  }, [navigate]);

  // Obtención de Menús No Aprobados
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menusResponse = await axios.get(
          `${BACKEND_URL}menudiario`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const menusNoAprobados = menusResponse.data.filter(
          (menu) => !menu.aprobado
        );
  
        // Agrupar los menús por semana, año y id_sucursal
        const weeksAndYearsAndSucursales = menusNoAprobados.map((menu) => {
          const menuDate = dayjs(menu.fecha);
          return {
            week: menu.semana,
            year: menuDate.year(),
            id_sucursal: menu.id_sucursal.toString(), // Convertir ObjectId a string
          };
        });
  
        // Filtrar duplicados y ordenar
        const uniqueWeeksAndYearsAndSucursales = Array.from(
          new Set(weeksAndYearsAndSucursales.map(JSON.stringify))
        ).map(JSON.parse).sort((a, b) => 
          a.year - b.year || a.week - b.week || a.id_sucursal.localeCompare(b.id_sucursal)
        );
  
        setAvailableWeeksAndYears(uniqueWeeksAndYearsAndSucursales);
        setAllMenus(menusNoAprobados);
      } catch (error) {
        console.error("Error al obtener menús:", error);
      }
    };
    fetchMenus();
  }, [token]);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}sucursal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sucursalesData = response.data;
        setSucursales(sucursalesData);
        console.log(sucursalesData)
        // Crear el diccionario de sucursales
        const dict = {};
        sucursalesData.forEach((sucursal) => {
          dict[sucursal._id.toString()] = sucursal.nombresucursal;
        });
        setSucursalDict(dict);
      } catch (error) {
        console.error("Error al obtener sucursales:", error);
      }
    };
    fetchSucursales();
    console.log(setSucursalDict)
  }, [navigate]);

  useEffect(() => {
  if (availableWeeksAndYears.length > 0) {
    const initialWeekAndYearAndSucursal = availableWeeksAndYears[0];
    setSelectedWeek(initialWeekAndYearAndSucursal.week);
    setSelectedYear(initialWeekAndYearAndSucursal.year);
    setSelectedSucursal(
      sucursales.find(
        (s) => s._id.toString() === initialWeekAndYearAndSucursal.id_sucursal
      )
    );
    setWeekDays(generateWeekDays(initialWeekAndYearAndSucursal.year, initialWeekAndYearAndSucursal.week));
  }
}, [availableWeeksAndYears, sucursales]);

  useEffect(() => {
    setMenus(allMenus.filter((menu) => menu.semana === selectedWeek));
  }, [selectedWeek, allMenus]);

  useEffect(() => {
    const fetchedWeeks = [
      ...new Set(allMenus.map((menu) => menu.semana)),
    ].sort((a, b) => a - b);
    setAvailableWeeks(fetchedWeeks);
  }, [allMenus]);

  useEffect(() => {
    if (selectedWeek && selectedYear && selectedSucursal) {
      setMenus(allMenus.filter((menu) => 
        menu.semana === selectedWeek &&
        dayjs(menu.fecha).year() === selectedYear &&
        menu.id_sucursal.toString() === selectedSucursal._id.toString()
      ));
    }
  }, [selectedWeek, selectedYear, selectedSucursal, allMenus]);

  useEffect(() => {
    const fetchPlatosDisponibles = async () => {
        setLoading(true);
        try {
            const newPlatosDisponibles = {};
            for (const day of weekDays) {
                const fechaFormateada = day.format("YYYY-MM-DD");
                const response = await axios.get(
                    `${BACKEND_URL}menudiario/Verificar/platos-disponibles?fecha=${fechaFormateada}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const nombreDia = day
                                .format("dddd")
                                .toUpperCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "") 
                newPlatosDisponibles[nombreDia] = response.data.filter(plato => plato.descontinuado === false); 
            }
            setPlatosDisponibles(newPlatosDisponibles);
        } catch (error) {
            console.error("Error al obtener platos disponibles:", error);
        } finally {
            setLoading(false);
        }
    };
    if (weekDays.length > 0 && selectedYear) {
        fetchPlatosDisponibles();
    }
}, [weekDays, token, selectedYear]);

  const handleOpenFeedback = () => {
    if (menus.length > 0 && menus[0].mensaje) {
      setOpenFeedbackModal(true);
    } else {
      alert("No hay feedback disponible para esta minuta");
    }
  };
  // Actualizar la semana seleccionada usando el selector
  const handleWeekChange = (event) => {
    const selectedWeekAndYear = JSON.parse(event.target.value);
    setSelectedWeek(selectedWeekAndYear.week);
    setSelectedYear(selectedWeekAndYear.year);
    setWeekDays(generateWeekDays(selectedWeekAndYear.year, selectedWeekAndYear.week));
  };

  // Actualizar la lista de platos del menú seleccionado
  const handlePlatoChange = (day, fila, newPlato) => {
    setMenus((prevMenus) => {
      return prevMenus.map((menu) => {
        if (dayjs(menu.fecha).isSame(day, "day")) {
          // Filtrar los platos existentes para eliminar el plato correspondiente a esta fila
          const updatedListaplatos = menu.listaplatos.filter(
            (plato) => plato.fila.toUpperCase() !== fila.toUpperCase()
          );
  
          // Si hay un nuevo plato seleccionado, lo agregamos a la lista
          if (newPlato) {
            updatedListaplatos.push({
              fila: fila,
              platoId: { _id: newPlato._id, nombre: newPlato.nombre },
            });
          }
  
          return {
            ...menu,
            listaplatos: updatedListaplatos,
          };
        }
        return menu;
      });
    });
  };

  const handleUpdateMinuta = async () => {
    setLoading(true);
    const minutasAEnviar = [];
  
    // Crear un objeto para rastrear las ensaladas por fecha
    const ensaladasPorFecha = {};
  
    for (const menu of menus) {
      const listaplatosToUpdate = menu.listaplatos.map(plato => ({
        platoId: plato.platoId._id, 
        fila: plato.fila
      }));
  
      const updatedMenu = {
        ...menu,
        listaplatos: listaplatosToUpdate,
        nombre: menu.nombre,
        fecha: menu.fecha,
        semana: menu.semana,
        id_sucursal: menu.id_sucursal,
        estado: menu.estado,
        mensaje: "sin mensaje",
      };

  
      minutasAEnviar.push(updatedMenu);
  
      // Agregar las ensaladas de la minuta actual al objeto ensaladasPorFecha
      const fechaISO = dayjs(updatedMenu.fecha).format('YYYY-MM-DD');
      if (!ensaladasPorFecha[fechaISO]) {
        ensaladasPorFecha[fechaISO] = [];
      }
      updatedMenu.listaplatos.forEach(plato => {
        if (plato.fila.startsWith("SALAD BAR") && plato.platoId) {
          ensaladasPorFecha[fechaISO].push(plato.platoId);
        }
      });
    }
  
    // Verificar combinaciones de ensaladas repetidas
    let hayErrores = false;
    for (const fecha of Object.keys(ensaladasPorFecha)) {
      const combinacionActual = ensaladasPorFecha[fecha];
      if (combinacionActual.length > 0) {
        for (const otraFecha of Object.keys(ensaladasPorFecha)) {
          if (fecha !== otraFecha) {
            const otraCombinacion = ensaladasPorFecha[otraFecha];
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
        for (const menu of minutasAEnviar) {
          await axios.put(
            `${BACKEND_URL}menudiario/${menu._id}`,
            menu,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        alert("Minuta actualizada correctamente");
        navigate("../home");
      } catch (error) {
        console.error("Error al actualizar la minuta:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.setItem('error', 'error de sesion');
          navigate("/login");
        } else if (error.response) {
          alert(`Error del servidor: ${error.response.status} - ${error.response.data.message || 'Detalles no disponibles'}`);
        } else if (error.request) {
          alert("No se recibió respuesta del servidor.");
        } else {
          alert("Se produjo un error al actualizar la minuta. Por favor, inténtalo de nuevo.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      alert("Se encontraron errores en la minuta. No se actualizará.");
      setLoading(false);
    }
  };

  // **Función para filtrar las opciones**
   const opcionesFiltradasPorFila = useMemo(() => {
    const opciones = {};
    const dias = weekDays.map((day) =>
      day
        .format("dddd")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    );

    filas.forEach((fila) => {
      let tipoPlatoFiltrado = tipoPlatoPorFila[fila];
      dias.forEach((dia) => {
        const diaNormalizado = dia;

        if (!opciones[fila]) {
          opciones[fila] = {};
        }

        if (
          platosDisponibles[diaNormalizado] &&
          platosDisponibles[diaNormalizado].length > 0
        ) {
          let opcionesFiltradas = platosDisponibles[diaNormalizado].filter(
            (plato) => plato.categoria === tipoPlatoFiltrado
          );

          // **Lógica de Filtrado para EditarMinuta**
          opcionesFiltradas = opcionesFiltradas.filter((plato) => {
            // Verificar si el plato ya está seleccionado en la semana actual
            const yaSeleccionado = menus.some((menu) => {
              const esMismoDia = dayjs(menu.fecha).isSame(
                weekDays[dias.indexOf(dia)],
                "day"
              );
              const esMismaSemana = menu.semana === selectedWeek;

              // **Restricciones por tipo de plato**
              if (
                tipoPlatoFiltrado === "PLATO DE FONDO" ||
                tipoPlatoFiltrado === "GUARNICIÓN"
              ) {
                // Para estos tipos de plato, no se debe repetir en la semana
                if (esMismaSemana) {
                  // Buscar en todas las filas correspondientes al tipo de plato
                  return filas.some((otraFila) => {
                    if (tipoPlatoPorFila[otraFila] === tipoPlatoFiltrado) {
                      const platoEnOtraFila = menu.listaplatos.find(
                        (p) => p.fila.toUpperCase() === otraFila.toUpperCase()
                      );
                      return platoEnOtraFila?.platoId?._id === plato._id;
                    }
                    return false;
                  });
                }
              } else if (tipoPlatoFiltrado === "ENSALADA") {
                // Para ensaladas, no se debe repetir en el mismo día
                if (esMismoDia) {
                  // Buscar en todas las filas de ensalada
                  return filas.some((otraFila) => {
                    if (tipoPlatoPorFila[otraFila] === "ENSALADA") {
                      const platoEnOtraFila = menu.listaplatos.find(
                        (p) => p.fila.toUpperCase() === otraFila.toUpperCase()
                      );
                      return platoEnOtraFila?.platoId?._id === plato._id;
                    }
                    return false;
                  });
                }
              } else if (["HIPOCALORICO","VEGANA/VEGETARIANA"].includes(tipoPlatoFiltrado)) {
                if (esMismaSemana) {
                  return menus.some(otroMenu => {
                    if (otroMenu.semana === selectedWeek) {
                      const esOtroDia = !dayjs(otroMenu.fecha).isSame(
                        weekDays[dias.indexOf(dia)],
                        "day"
                      );
                      if (esOtroDia) {
                        return filas.some(otraFila => {
                          if (["VEGANA/VEGETARIANA", "HIPOCALORICO"].includes(tipoPlatoPorFila[otraFila])) {
                            const platoEnOtraFila = otroMenu.listaplatos.find(
                              p => p.fila.toUpperCase() === otraFila.toUpperCase()
                            );
                            return platoEnOtraFila?.platoId?._id === plato._id;
                          }
                          return false;
                        });
                      }
                    }
                    return false;
                  });
                }
              }
              // Para otros tipos de plato, no hay restricciones
              return false;
            });

            return !yaSeleccionado;
          });

          // **Casos Especiales: SOPA DIA y VEGANA**
          if (fila === "SOPA") {
            opcionesFiltradas = opcionesFiltradas.concat(
              platosDisponibles[diaNormalizado].filter(
                (plato) => plato.categoria === "CREMAS"
              )
            );
          }

          opciones[fila][diaNormalizado] = opcionesFiltradas;
        } else {
          opciones[fila][diaNormalizado] = [];
        }
      });
    });

    return opciones;
  }, [platosDisponibles, selectedWeek, menus, selectedYear]);


  if (loading) {
        return (
            <div>
                <Header />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                    }}
                >
                    <CircularProgress />
                </div>
            </div>
        );
    }
    
    return (
      <Grid container direction="column" style={{ minHeight: '100vh' }}>
        <Grid item>
          <Header />
        </Grid>
        <Grid item container justifyContent="center" style={{ flexGrow: 1 }}>
          <Grid item xs={12} md={11}> {/* Ajusta el Grid item para que ocupe el ancho deseado */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'white',
              padding: 2,
              borderRadius: '25px',
              my: '2rem', // Margen superior e inferior
              width: '100rem',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 3,
                    height: "5rem",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    mb: 2,
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    width: '80rem',
                  }}
                >
                  <FormControl fullWidth margin="normal" sx={{ width: "25%" }}>
                    <InputLabel
                        id="week-year-select-label"
                        sx={{
                            fontWeight: "bold",
                            color: "#0d47a1",
                        }}
                    >
                        Semana y Año
                    </InputLabel>
                    <Select
                      value={JSON.stringify({ week: selectedWeek, year: selectedYear, id_sucursal: selectedSucursal?._id })}
                      onChange={(event) => {
                        const selectedWeekAndYearAndSucursal = JSON.parse(event.target.value);
                        setSelectedWeek(selectedWeekAndYearAndSucursal.week);
                        setSelectedYear(selectedWeekAndYearAndSucursal.year);
                        setSelectedSucursal(
                          sucursales.find(
                            (s) => s._id.toString() === selectedWeekAndYearAndSucursal.id_sucursal
                          )
                        );
                        setWeekDays(
                          generateWeekDays(
                            selectedWeekAndYearAndSucursal.year,
                            selectedWeekAndYearAndSucursal.week
                          )
                        );
                      }}
                      sx={{ width: '100%' }}
                      defaultValue={availableWeeksAndYears.length > 0 ? JSON.stringify(availableWeeksAndYears[0]) : ""}
                    >
                      {availableWeeksAndYears.map((weekAndYear) => (
                        <MenuItem key={`${weekAndYear.week}-${weekAndYear.year}-${weekAndYear.id_sucursal}`} value={JSON.stringify(weekAndYear)}>
                          Semana {weekAndYear.week} - {weekAndYear.year} - {sucursalDict[weekAndYear.id_sucursal]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                <Button
                  onClick={handleOpenFeedback}
                  variant="contained"
                  color="warning"
                  disabled={!menus.length || !menus[0]?.mensaje || menus[0]?.mensaje === "sin mensaje"}
                  sx={{ marginLeft: "2rem" }}
                >
                  Ver Feedback Minuta
                </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdateMinuta}
                    disabled={loading}
                    sx={{ marginLeft: "2rem" }}
                  >
                    Actualizar Minuta
                  </Button>
                </Box>
              </LocalizationProvider>
  
              <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <Table sx={{ width: '100%', fontFamily: 'Roboto, sans-serif', margin: '0 auto', border: '1px solid rgb(4, 109, 0)', minWidth: '1000px' }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell key="empty-cell" sx={{ backgroundColor: "#2E8B57", width: "10%", border: "none" }}></TableCell>
                      {weekDays.map((day) => (
                        <TableCell
                          key={day.toString()}
                          align="center"
                          sx={{
                            width: "17.5%",
                            height: "40px",
                            backgroundColor: "#2E8B57",
                            color: "white",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                            letterSpacing: "1.5px",
                            padding: "10px",
                            fontSize: "14px",
                            border: "none",
                          }}
                        >
                          {day.format("dddd DD [de] MMMM")}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filas.map((fila) => (
                      <TableRow
                        key={fila}
                        sx={{
                          "&:nth-of-type(odd)": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          align="center"
                          sx={{
                            width: "10%",
                            minWidth: "150px",
                            p: 1,
                            fontSize: "14px",
                            fontWeight: "bold",
                            backgroundColor: "#2E8B57",
                            color: "white",
                            border: "none",
                          }}
                        >
                          {fila}
                        </TableCell>
                        {weekDays.map((day) => {
                          const menuDia = menus.find((menu) =>
                            dayjs(menu.fecha).isSame(day, "day")
                          );
                          const platoExistente = menuDia?.listaplatos.find(
                            (plato) => plato.fila.toUpperCase() === fila.toUpperCase()
                          );
                          const platoExistenteId = platoExistente?.platoId?._id;
                          const platoExistenteNombre = platoExistente?.platoId?.nombre;
                          return (
                            <TableCell
                              key={`${day.format("YYYY-MM-DD")}-${fila}`}
                              align="center"
                              sx={{
                                p: 1.2,
                                fontSize: "12px",
                                wordBreak: "break-word",
                                border: "none",
                              }}
                            >
                              <Autocomplete
                                disablePortal
                                id={`${day.format("YYYY-MM-DD")}-${fila}`}
                                options={
                                  opcionesFiltradasPorFila[fila]?.[
                                    dayjs(day)
                                      .format("dddd")
                                      .toUpperCase()
                                      .normalize("NFD")
                                      .replace(/[\u0300-\u036f]/g, "")
                                  ] || []
                                }
                                getOptionLabel={(option) => option.nombre || ""}
                                value={
                                  opcionesFiltradasPorFila[fila]?.[
                                    dayjs(day)
                                      .format("dddd")
                                      .toUpperCase()
                                      .normalize("NFD")
                                      .replace(/[\u0300-\u036f]/g, "")
                                  ]?.find((p) => p._id === platoExistenteId) ||
                                  (platoExistenteId
                                    ? { _id: platoExistenteId, nombre: platoExistenteNombre }
                                    : null)
                                }
                                onChange={(event, newValue) => {
                                  // Llamamos a handlePlatoChange con newValue (que puede ser null)
                                  handlePlatoChange(day, fila, newValue);
                                }}
                                isOptionEqualToValue={(option, value) =>
                                  option?._id === value?._id
                                }
                                sx={{ width: "100%" }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label={
                                      platoExistente
                                        ? platoExistenteNombre
                                        : `Seleccione ${tipoPlatoPorFila[fila]}`
                                    }
                                    size="small"
                                    sx={{
                                      width: "100%",
                                      color: "#2E8B57",
                                      "& .MuiInputLabel-root": {
                                        fontWeight: "bold",
                                        fontSize: "14px",
                                      },
                                      "& .MuiOutlinedInput-root": {
                                        "& fieldset": {
                                          borderColor: "#2E8B57",
                                        },
                                        "&:hover fieldset": {
                                          borderColor: "#2E8B57",
                                        },
                                        "&.Mui-focused fieldset": {
                                          borderColor: "#2E8B57",
                                        },
                                      },
                                    }}
                                  />
                                )}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Modal open={openFeedbackModal} onClose={() => setOpenFeedbackModal(false)}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      borderRadius: 2,
    }}
  >
    <h2 style={{ color: '#FF9800', marginBottom: '1rem' }}>Feedback de Rechazo</h2>
    <TextField
      fullWidth
      value={menus[0]?.mensaje || ''}
      multiline
      rows={4}
      InputProps={{
        readOnly: true,
      }}
      sx={{
        '& .MuiInputBase-root': {
          color: '#616161',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#FF9800',
        }
      }}
    />
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
      <Button
        onClick={() => setOpenFeedbackModal(false)}
        sx={{ color: '#FF9800' }}
      >
        Cerrar
      </Button>
    </Box>
  </Box>
</Modal>
            </Box>
          </Grid>
        </Grid>
      </Grid> 
      
    );
  };
  
  export default EditarMinuta;