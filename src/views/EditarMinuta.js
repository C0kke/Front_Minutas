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
} from "@mui/material";

import dayjs from "dayjs";
import isLeapYear from "dayjs/plugin/isLeapYear";
import weekday from "dayjs/plugin/weekday";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/es";

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

const EditarMinuta = () => {
  const [menus, setMenus] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentYear = dayjs().year();
  const [selectedWeek, setSelectedWeek] = useState(dayjs().week());
  const [weekDays, setWeekDays] = useState(
    generateWeekDays(currentYear, selectedWeek)
  );
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [platosDisponibles, setPlatosDisponibles] = useState({});
  const [allMenus, setAllMenus] = useState([]); // **Nuevo estado para todos los menús**

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Obtención de Platos
  useEffect(() => {
    const fetchPlatos = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/v1/plato", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const platosFiltrados = response.data.filter(plato => plato.descontinuado === false);
        setPlatos(platosFiltrados);
      } catch (error) {
        console.error("Error al obtener platos:", error);
      }
    };
    fetchPlatos();
  }, [token]);

  // Obtención de Menús No Aprobados
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menusResponse = await axios.get(
          "http://localhost:3000/api/v1/menudiario",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const menusNoAprobados = menusResponse.data.filter(
          (menu) => menu.aprobado === false
        );
        setAllMenus(menusNoAprobados); 
      } catch (error) {
        console.error("Error al obtener menús:", error);
      }
    };
    fetchMenus();
  }, [token]);

  // Establecer Semana Seleccionada, generar días y filtrar menús
  useEffect(() => {
    const initialWeek = availableWeeks.length > 0 ? availableWeeks[0] : dayjs().week();

    if (!availableWeeks.includes(selectedWeek)) {
        setSelectedWeek(initialWeek);
    }
    
    setWeekDays(generateWeekDays(currentYear, initialWeek));

    setMenus(allMenus.filter((menu) => menu.semana === selectedWeek));
}, [availableWeeks, currentYear, allMenus]);

  // **Filtrar los menús por la semana seleccionada al cambiar selectedWeek**
  useEffect(() => {
    setMenus(allMenus.filter((menu) => menu.semana === selectedWeek));
  }, [selectedWeek, allMenus]);

  // **Actualizar availableWeeks cuando cambie allMenus**
  useEffect(() => {
    const fetchedWeeks = [
      ...new Set(allMenus.map((menu) => menu.semana)),
    ].sort((a, b) => a - b);
    setAvailableWeeks(fetchedWeeks);
  }, [allMenus]);

  // Obtener Platos Disponibles para la Semana Seleccionada
  useEffect(() => {
    const fetchPlatosDisponibles = async () => {
      setLoading(true);
      try {
        const newPlatosDisponibles = {};
        for (const day of weekDays) {
          const fechaFormateada = day.format("YYYY-MM-DD");
          const response = await axios.get(
            `http://localhost:3000/api/v1/menudiario/Verificar/platos-disponibles?fecha=${fechaFormateada}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const nombreDia = day.format("dddd").toUpperCase();
          const nombreDiaNormalizado = nombreDia
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          newPlatosDisponibles[nombreDiaNormalizado] = response.data;
        }
        setPlatosDisponibles(newPlatosDisponibles);
      } catch (error) {
        console.error("Error al obtener platos disponibles:", error);
      } finally {
        setLoading(false);
      }
    };
    if (weekDays.length > 0) {
      fetchPlatosDisponibles();
    }
  }, [weekDays, token]);

  // Actualizar la semana seleccionada usando el selector
  const handleWeekChange = (event) => {
    const newSelectedWeek = parseInt(event.target.value, 10);
    setSelectedWeek(newSelectedWeek);
    setWeekDays(generateWeekDays(currentYear, newSelectedWeek));
  };

  // Actualizar la lista de platos del menú seleccionado
  const handlePlatoChange = (day, fila, newPlato) => {
    setMenus((prevMenus) => {
      return prevMenus.map((menu) => {
        if (dayjs(menu.fecha).isSame(day, "day")) {
          const updatedListaplatos = menu.listaplatos.filter(
            (plato) => plato.fila.toUpperCase() !== fila.toUpperCase()
          );
  
          updatedListaplatos.push({
            fila: fila,
            platoId: { _id: newPlato._id, nombre: newPlato.nombre },
          });
  
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
    try {
      setLoading(true);
      for (const menu of menus) {
        // **Enviar todos los platos, incluidos los nuevos (con ID temporal)**
        const listaplatosToUpdate = menu.listaplatos;
  
        const updatedMenu = {
          ...menu,
          listaplatos: listaplatosToUpdate,
          nombre: menu.nombre,
          fecha: menu.fecha,
          semana: menu.semana,
          id_sucursal: menu.id_sucursal,
          estado: menu.estado,
        };
  
        delete updatedMenu._id;
  
        // Depuración
        console.log("Enviando a:", `http://localhost:3000/api/v1/menudiario/${menu._id}`);
        console.log("Datos a enviar:", updatedMenu);
  
        await axios.put(
          `http://localhost:3000/api/v1/menudiario/${menu._id}`,
          updatedMenu,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert("Minuta actualizada correctamente");
      navigate("../home");
    } catch (error) {
      // ... (manejo de errores)
    } finally {
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
  
          // **Lógica de Filtrado para EditarMinuta (CORREGIDA)**
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
                tipoPlatoFiltrado === "GUARNICIÓN" ||
                tipoPlatoFiltrado === "HIPOCALORICO" ||
                tipoPlatoFiltrado === "VEGETARIANO" ||
                tipoPlatoFiltrado === "VEGANO"
              ) {
                // Para estos tipos de plato, no se debe repetir en la semana
                if (esMismaSemana) {
                  // Buscar en todas las filas correspondientes al tipo de plato
                  return filas.some((otraFila) => {
                    if (tipoPlatoPorFila[otraFila] === tipoPlatoFiltrado) {
                      const platoEnOtraFila = menu.listaplatos.find(
                        (p) => p.fila.toUpperCase() === otraFila.toUpperCase()
                      );
                      // **Verificar si el plato ya está seleccionado en el mismo día, en otra fila del mismo tipo**
                      if (esMismoDia) {
                        return platoEnOtraFila?.platoId?._id === plato._id;
                      }
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
              }
  
              // Para otros tipos de plato, no hay restricciones
              return false;
            });
  
            return !yaSeleccionado;
          });
  
          // **Casos Especiales: SOPA DIA y VEGANA**
          if (fila === "SOPA DIA") {
            opcionesFiltradas = opcionesFiltradas.concat(
              platosDisponibles[diaNormalizado].filter(
                (plato) => plato.categoria === "CREMAS"
              )
            );
          }
  
          if (fila === "VEGANA") {
            opcionesFiltradas = opcionesFiltradas.concat(
              platosDisponibles[diaNormalizado].filter(
                (plato) => plato.categoria === "VEGETARIANO"
              )
            );
          }

          if (fila === "VEGETARIANA") {
            opcionesFiltradas = opcionesFiltradas.concat(
              platosDisponibles[diaNormalizado].filter(
                (plato) => plato.categoria === "VEGANA"
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
  }, [platosDisponibles, selectedWeek, currentYear, menus, platos]);


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
    }return (
      <div>
        <Header />
        {/* Contenedor principal */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            padding: 2,
            margin: "2rem auto",
            width: "calc(100% - 4rem)",
            maxWidth: "2200px",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              width: "90%",
              marginBottom: "1rem",
            }}
          >
            {/* Selector de semana */}
            <FormControl fullWidth margin="normal" sx={{ width: "25%" }}>
              <InputLabel
                id="week-select-label"
                sx={{
                  fontWeight: "bold",
                  color: "#0d47a1",
                }}
              >
                Semana
              </InputLabel>
              <Select
                labelId="week-select-label"
                id="week-select"
                value={selectedWeek}
                label="Semana"
                onChange={handleWeekChange}
                sx={{
                  bgcolor: "white",
                  borderRadius: "4px",
                  "& .MuiSelect-select": {
                    fontWeight: "bold",
                    color: "#1565c0",
                  },
                }}
              >
                {availableWeeks.map((week) => (
                  <MenuItem
                    key={week}
                    value={week}
                    sx={{
                      fontWeight: "bold",
                      color: "#1565c0",
                    }}
                  >
                    Semana {week}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateMinuta}
              disabled={loading}
              sx={{ marginLeft: "2rem" }}
            >
              Actualizar Minuta
            </Button>
          </div>
  
          <TableContainer
            component={Paper}
            sx={{
              width: "100%",
              overflowX: "auto",
              boxShadow: "none",
              border: "none",
            }}
          >
            <Table
              sx={{
                width: "150%",
                fontFamily: "Roboto, sans-serif",
                margin: "0 auto",
                borderCollapse: "collapse",
              }}
              aria-label="simple table"
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    key="empty-cell"
                    sx={{
                      backgroundColor: "#2e7d32",
                      width: "15%",
                      border: "none",
                    }}
                  ></TableCell>
                  {weekDays.map((day) => (
                    <TableCell
                      key={day.toString()}
                      align="center"
                      sx={{
                        width: "17%",
                        backgroundColor: "#2e7d32",
                        color: "white",
                        textTransform: "uppercase",
                        fontWeight: "bold",
                        letterSpacing: "1.5px",
                        padding: "10px",
                        fontSize: "14px",
                        border: "none",
                      }}
                    >
                      {day
                        .format("dddd DD [de] MMMM")
                        .replace(
                          day.format("dddd"),
                          day.format("dddd").slice(0, 3)
                        )}
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
                        width: "15%",
                        minWidth: "150px",
                        p: 1,
                        fontSize: "14px",
                        fontWeight: "bold",
                        backgroundColor: "#2e7d32",
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
                            p: 1,
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
                              if (newValue) {
                                handlePlatoChange(day, fila, newValue);
                              }
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
                                  color: "#2e7d32",
                                  "& .MuiInputLabel-root": {
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                  },
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                      borderColor: "#2e7d32",
                                    },
                                    "&:hover fieldset": {
                                      borderColor: "#2e7d32",
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: "#2e7d32",
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
        </Box>
      </div>
    );
  };
  
  export default EditarMinuta;