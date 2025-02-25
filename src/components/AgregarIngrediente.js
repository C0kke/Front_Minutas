import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Autocomplete,
} from "@mui/material";

const BACKEND_URL = process.env.REACT_APP_BACK_URL;

const AgregarIngrediente = ({ platoId, onIngredienteAgregado }) => {
  const [nombreIngrediente, setNombreIngrediente] = useState("");
  const [unidadMedida, setUnidadMedida] = useState(""); // Inicialmente vacío
  const [opcionesIngrediente, setOpcionesIngrediente] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIngredientes = async () => {
      const token = localStorage.getItem("token")?.trim();
      if (!token) {
        console.error("Token no encontrado.");
        return;
      }
      try {
        const response = await axios.get(`${BACKEND_URL}ingrediente`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIngredientes(response.data);
      } catch (error) {
        console.error("Error al obtener ingredientes:", error);
      }
    };
    fetchIngredientes();
  }, []);

  const handleBuscarIngredientes = (query) => {
    if (!query) {
      setOpcionesIngrediente([]);
      return;
    }
    const filtered = ingredientes.filter((ingrediente) =>
      ingrediente.nombreIngrediente
        ?.toLowerCase()
        .includes(query.toLowerCase())
    );
    setOpcionesIngrediente(filtered);
  };

  const handleSeleccionarIngrediente = (ingredienteSeleccionado) => {
    if (ingredienteSeleccionado) {
      setNombreIngrediente(ingredienteSeleccionado.nombreIngrediente);
      setUnidadMedida(ingredienteSeleccionado.unidadmedida); 
    } else {
      setNombreIngrediente("");
      setUnidadMedida(""); 
    }
  };

  const handleAgregarIngrediente = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem("token")?.trim();
    if (!token) {
      console.error("Token no encontrado.");
      setLoading(false);
      return;
    }
    try {
      const ingredienteSeleccionado = ingredientes.find(
        (i) => i.nombreIngrediente === nombreIngrediente
      );
      if (!ingredienteSeleccionado) {
        setError("Por favor selecciona un ingrediente válido.");
        setLoading(false);
        return;
      }
      await axios.post(
        `${BACKEND_URL}ingredientexplato`,
        {
          id_plato: platoId,
          id_ingrediente: ingredienteSeleccionado._id,
          porcion_neta: 1,
          peso_bruto: 1,
          rendimiento: 100,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onIngredienteAgregado();
      setNombreIngrediente("");
      setUnidadMedida(""); // Limpiar la unidad de medida después de agregar
      setSuccessMessage("Ingrediente agregado correctamente.");
    } catch (error) {
      console.error("Error al agregar ingrediente:", error);
      setError(
        error.response?.data?.message || "Ocurrió un error. Por favor, inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Agregar Ingrediente
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={5}>
          <Autocomplete
            options={opcionesIngrediente}
            getOptionLabel={(option) => option.nombreIngrediente || ""}
            inputValue={nombreIngrediente}
            onInputChange={(event, newInputValue) => {
              setNombreIngrediente(newInputValue);
              handleBuscarIngredientes(newInputValue);
            }}
            onChange={(event, newValue) => {
              handleSeleccionarIngrediente(newValue);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Nombre del Ingrediente" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <FormControl fullWidth>
            <InputLabel id="unidad-medida-label">Unidad de Medida</InputLabel>
            <Select
              labelId="unidad-medida-label"
              value={unidadMedida}
              label="Unidad de Medida"
              disabled // Deshabilitar el select porque la unidad de medida viene del ingrediente seleccionado
            >
              <MenuItem value={unidadMedida}>{unidadMedida}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            variant="contained"
            onClick={handleAgregarIngrediente}
            disabled={!nombreIngrediente || !unidadMedida || loading}
            sx={{ width: "100%" }}
          >
            {loading ? "Agregando..." : "Agregar"}
          </Button>
        </Grid>
      </Grid>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}
    </Box>
  );
};

export default AgregarIngrediente;