import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  List,
  ListItem,
  CircularProgress,
  TextField,
  Button,
  Divider,
  Alert,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const EditarIngredientes = () => {
  const platoId = localStorage.getItem("id_plato");
  const [plato, setPlato] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ingredientesEditados, setIngredientesEditados] = useState([]);
  
  const [guardando, setGuardando] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const token = localStorage.getItem("token")?.trim();

    if (!token) {
      console.error("Token no encontrado.");
      navigate("/");
      return;
    }

    const fetchIngredientesPlato = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/v1/ingredientexplato/plato/${platoId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Ingredientes del plato recibidos:", response.data);
        setIngredientes(response.data);
      } catch (error) {
        console.error("Error al obtener ingredientes del plato:", error);
        setError(error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchPlato = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/v1/plato/${platoId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Plato recibido:", response.data);
        setPlato(response.data);
      } catch (error) {
        console.error("Error al obtener plato:", error);
        setError(error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    if (platoId) {
      fetchPlato();
      fetchIngredientesPlato();
    } else {
      console.error("No se encontró el id del plato");
      navigate("/platos");
    }
  }, [navigate, platoId]);

  useEffect(() => {
    if (ingredientes.length > 0) {
      setIngredientesEditados(JSON.parse(JSON.stringify(ingredientes)));
    }
  }, [ingredientes]);

  const handleChangeCantidad = (index, nuevaCantidad) => {
    const nuevosIngredientes = [...ingredientesEditados];
    nuevosIngredientes[index].porcion_neta = nuevaCantidad;
    nuevosIngredientes[index].peso_bruto =
      (nuevaCantidad * 100) / nuevosIngredientes[index].rendimiento;
    setIngredientesEditados(nuevosIngredientes);
  };

  const handleChangeRendimiento = (index, nuevaCantidad) => {
    const nuevosIngredientes = [...ingredientesEditados];
    const value = parseFloat(nuevaCantidad);

    // Validación para valores no negativos y no mayores a 100
    if (value >= 0 && value <= 100) {
        nuevosIngredientes[index].rendimiento = value;
        nuevosIngredientes[index].peso_bruto =
          (nuevosIngredientes[index].porcion_neta * 100) / value;
        setIngredientesEditados(nuevosIngredientes);
    }
  };

  const handleGuardarCambios = async () => {
    setGuardando(true);
    setSuccess(false);
    setError(null);
    const token = localStorage.getItem("token")?.trim();

    if (!token) {
      console.error("Token no encontrado.");
      setGuardando(false);
      return;
    }

    try {
      for (const ingredienteEditado of ingredientesEditados) {
        const updatedIngrediente = {
          id_plato: ingredienteEditado.id_plato,
          id_ingrediente: ingredienteEditado.id_ingrediente._id,
          porcion_neta: ingredienteEditado.porcion_neta,
          peso_bruto: ingredienteEditado.peso_bruto,
          rendimiento: ingredienteEditado.rendimiento,
        };

        await axios.put(
          `http://localhost:3000/api/v1/ingredientexplato/${ingredienteEditado._id}`,
          updatedIngrediente,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      setSuccess(true);
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      setError(error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setGuardando(false);
    }
  };

  const getUnidadMedida = (unidad, cantidad) => {
    if (!unidad) return "";
    if (unidad.toUpperCase() === "GRAMO" && cantidad !== 1) {
      return "GRAMOS";
    }
    return unidad;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!plato) {
    return (
      <Alert severity="error">
        <Typography variant="body1">Plato no encontrado.</Typography>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error al cargar los ingredientes. Por favor, inténtalo de nuevo más tarde.
      </Alert>
    );
  }

  if (!ingredientes || ingredientes.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body1">
          Este plato no tiene ingredientes asignados.
        </Typography>
      </Alert>
    );
  }
  
  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <Box
        sx={{
          flexGrow: 1,
          padding: 4,
          borderRadius: 2,
          margin: "20px auto",
          width: "95%",
          maxWidth: 800,
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          border: "1px solid #bdbdbd",
          backgroundColor: "white",
        }}
      >
        <Typography
          variant={isMobile ? "h5" : "h4"}
          gutterBottom
          align="center"
          sx={{
            fontWeight: "bold",
            color: "#2e8b57",
            marginBottom: 4,
          }}
        >
          Ingredientes de {plato.nombre}
        </Typography>
        <Grid container justifyContent="center">
          <Grid item xs={12}>
            <Card
              sx={{
                border: "1px solid #bdbdbd",
              }}
            >
              <CardContent sx={{ padding: 0 }}>
                <List>
                  {ingredientesEditados.map((ingredientePlato, index) => (
                    <React.Fragment key={ingredientePlato._id}>
                      <ListItem
                        sx={{
                          padding: 3,
                        }}
                      >
                        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                          <Grid item xs={12} md={3}>
                            <Typography
                              variant={isMobile ? "body1" : "h6"}
                              sx={{
                                fontWeight: "bold",
                                marginBottom: isMobile ? "0.5rem" : "0",
                                textAlign: isMobile ? "left" : "center",
                                fontSize: "16px",
                              }}
                            >
                              {ingredientePlato.id_ingrediente.nombreIngrediente}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={9}>
                            <Grid container spacing={2} justifyContent="space-around">
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  type="number"
                                  size="small"
                                  fullWidth
                                  value={ingredientePlato.porcion_neta}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (value >= 0) {
                                      handleChangeCantidad(index, value);
                                    }
                                  }}
                                  InputProps={{
                                    min: 0,
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <Typography
                                          variant="body2"
                                          sx={{ ml: 1, whiteSpace: "nowrap" }}
                                        >
                                          {getUnidadMedida(
                                            ingredientePlato.id_ingrediente.unidadmedida,
                                            ingredientePlato.porcion_neta
                                          )}
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  }}
                                  InputLabelProps={{
                                    shrink: true, // Fuerza a la etiqueta a estar siempre arriba
                                  }}
                                  label={<Typography variant="body2" sx={{fontWeight: 'bold', transform: 'translate(0, 1.5px) scale(1)',}}>Cantidad Neta</Typography>} // Ajuste para la etiqueta
                                  sx={{
                                    "& .MuiInputBase-root": {
                                        "& fieldset": {
                                        borderWidth: 1, // Borde menos grueso
                                        borderColor: "rgba(0, 0, 0, 0.23)", // Color del borde por defecto
                                        },
                                        "&:hover fieldset": {
                                        borderColor: "rgba(0, 0, 0, 0.23)", // Color del borde al pasar el ratón
                                        borderWidth: 1, // Borde menos grueso
                                        },
                                        "&.Mui-focused fieldset": {
                                        borderColor: "primary.main", // Color del borde al enfocar
                                        borderWidth: 1, // Borde menos grueso al enfocar
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        top: -6,
                                        
                                        
                                    },
                                    "& .MuiInputLabel-shrink": {
                                      transform: "translate(14px, -9px) scale(0.75)", // Ajuste fino para la etiqueta encogida
                                      
                                    },
                                    "& .MuiInputBase-input": {
                                      paddingTop: "10px", // Ajusta el padding superior del input
                                      paddingBottom: "10px", // Ajusta el padding inferior del input
                                    },
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  
                                  type="number"
                                  size="small"
                                  fullWidth
                                  value={
                                    ingredientePlato.peso_bruto !== null &&
                                    ingredientePlato.peso_bruto >= 0
                                      ? ingredientePlato.peso_bruto.toFixed(2)
                                      : "0.00"
                                  }
                                  InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <Typography
                                          variant="body2"
                                          sx={{ ml: 1, whiteSpace: "nowrap" }}
                                        >
                                          {getUnidadMedida(
                                            ingredientePlato.id_ingrediente.unidadmedida,
                                            ingredientePlato.peso_bruto
                                          )}
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  }}
                                  InputLabelProps={{
                                    shrink: true,
                                  }}
                                  label={<Typography variant="body2" sx={{fontWeight: 'bold', transform: 'translate(0, 1.5px) scale(1.0)',}}>Peso Bruto</Typography>}
                                  sx={{
                                    "& .MuiInputBase-root": {
                                        "& fieldset": {
                                        borderWidth: 1, // Borde menos grueso
                                        borderColor: "rgba(0, 0, 0, 0.23)", // Color del borde por defecto
                                        },
                                        "&:hover fieldset": {
                                        borderColor: "rgba(0, 0, 0, 0.23)", // Color del borde al pasar el ratón
                                        borderWidth: 1, // Borde menos grueso
                                        },
                                        "&.Mui-focused fieldset": {
                                        borderColor: "primary.main", // Color del borde al enfocar
                                        borderWidth: 1, // Borde menos grueso al enfocar
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        top: -6,
                                        
                                    },
                                    "& .MuiInputLabel-shrink": {
                                      transform: "translate(14px, -9px) scale(0.75)",
                                      
                                    },
                                    "& .MuiInputBase-input": {
                                      paddingTop: "10px", // Ajusta el padding superior del input
                                      paddingBottom: "10px", // Ajusta el padding inferior del input
                                    },
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  
                                  type="number"
                                  size="small"
                                  fullWidth
                                  value={ingredientePlato.rendimiento}
                                  onChange={(e) =>
                                    handleChangeRendimiento(
                                      index,
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  InputProps={{
                                    inputProps: { min: 0, max: 100 },
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <Typography
                                          variant="body2"
                                          sx={{ ml: 1, whiteSpace: "nowrap" }}
                                        >
                                          %
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  }}
                                  InputLabelProps={{
                                    shrink: true,
                                  }}
                                  label={<Typography variant="body2" sx={{fontWeight: 'bold', transform: 'translate(0, 1.5px) scale(1)',}}>Rendimiento</Typography>}
                                  sx={{
                                    "& .MuiInputBase-root": {
                                        "& fieldset": {
                                        borderWidth: 1, // Borde menos grueso
                                        borderColor: "rgba(0, 0, 0, 0.23)", // Color del borde por defecto
                                        },
                                        "&:hover fieldset": {
                                        borderColor: "rgba(0, 0, 0, 0.23)", // Color del borde al pasar el ratón
                                        borderWidth: 1, // Borde menos grueso
                                        },
                                        "&.Mui-focused fieldset": {
                                        borderColor: "primary.main", // Color del borde al enfocar
                                        borderWidth: 1, // Borde menos grueso al enfocar
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        top: -6,
                                        
                                    },
                                    "& .MuiInputLabel-shrink": {
                                      transform: "translate(14px, -9px) scale(0.75)",
                                      
                                    },
                                    "& .MuiInputBase-input": {
                                      paddingTop: "10px", // Ajusta el padding superior del input
                                      paddingBottom: "10px", // Ajusta el padding inferior del input
                                    },
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={handleGuardarCambios}
            disabled={guardando}
            sx={{ width: isMobile ? "100%" : "auto" }}
          >
            {guardando ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </Box>
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body1">
              Los cambios se han guardado correctamente.
            </Typography>
          </Alert>
        )}
      </Box>
    </div>
  );
};

export default EditarIngredientes;