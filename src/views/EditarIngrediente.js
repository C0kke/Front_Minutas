import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  List,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import IngredienteItem from "../components/IngredienteItem.js";
import AgregarIngrediente from "../components/AgregarIngrediente.js";

const EditarIngredientes = () => {
    const platoId = localStorage.getItem("id_plato");
    const [plato, setPlato] = useState(null);
    const [ingredientes, setIngredientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
    const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token")?.trim();
  
      if (!token) {
        console.error("Token no encontrado.");
        navigate("/");
        return;
      }
  
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const platoResponse = await axios.get(
          `http://localhost:3000/api/v1/plato/${platoId}`,
          { headers }
        );
        setPlato(platoResponse.data);
  
        const ingredientesResponse = await axios.get(
          `http://localhost:3000/api/v1/ingredientexplato/plato/${platoId}`,
          { headers }
        );
        setIngredientes(ingredientesResponse.data);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setError(error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    }, [navigate, platoId]);
  
    useEffect(() => {
      if (platoId) {
        fetchData();
      } else {
        console.error("No se encontró el id del plato");
        navigate("/platos");
      }
    }, [fetchData, navigate, platoId]);
  
    const handleChange = useCallback(
      (index, field, newValue) => {
        setIngredientes((prevIngredientes) => {
          const nuevosIngredientes = [...prevIngredientes];
          nuevosIngredientes[index][field] = newValue;
  
          if (field === "porcion_neta" || field === "rendimiento") {
            nuevosIngredientes[index].peso_bruto =
              nuevosIngredientes[index].porcion_neta *
              100 /
              nuevosIngredientes[index].rendimiento;
          }
  
          return nuevosIngredientes;
        });
      },
      []
    );

    const handleIngredienteAgregado = () => {
        fetchData();
      };
  
    const handleGuardarCambios = useCallback(async () => {
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
        const headers = { Authorization: `Bearer ${token}` };
        await Promise.all(
          ingredientes.map((ingredienteEditado) =>
            axios.put(
              `http://localhost:3000/api/v1/ingredientexplato/${ingredienteEditado._id}`,
              {
                id_plato: ingredienteEditado.id_plato,
                id_ingrediente: ingredienteEditado.id_ingrediente._id,
                porcion_neta: ingredienteEditado.porcion_neta,
                peso_bruto: ingredienteEditado.peso_bruto,
                rendimiento: ingredienteEditado.rendimiento,
              },
              { headers }
            )
          )
        );
        setSuccess(true);
        fetchData(); // Recargar los datos después de guardar
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
    }, [fetchData, ingredientes, navigate]);
  
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
  
    if (error) {
      return (
        <Alert severity="error">
          Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.
        </Alert>
      );
    }
  
    if (!plato) {
      return (
        <Alert severity="error">
          <Typography variant="body1">Plato no encontrado.</Typography>
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
              <Card sx={{ border: "1px solid #bdbdbd" }}>
                <CardContent sx={{ padding: 0 }}>
                  <List>
                    {ingredientes.map((ingredientePlato, index) => (
                      <IngredienteItem
                        key={ingredientePlato._id}
                        ingredientePlato={ingredientePlato}
                        index={index}
                        handleChange={handleChange}
                      />
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
            <AgregarIngrediente
                platoId={platoId}
                onIngredienteAgregado={handleIngredienteAgregado}
            />
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