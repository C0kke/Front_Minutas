import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert
} from "@mui/material";

const API_BASE_URL = "http://localhost:3000/api/v1";

const AgregarIngrediente = ({ platoId, onIngredienteAgregado }) => {
  const [nombreIngrediente, setNombreIngrediente] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const unidadesMedida = ["GRAMOS", "KILOS", "CC", "UNIDADES", "LITROS"];

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
      // Buscar el ingrediente por nombre
      let ingredienteResponse = await axios.get(
        `${API_BASE_URL}/ingrediente/buscar/${nombreIngrediente}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let ingrediente = ingredienteResponse.data;

      
      // Agregar el ingrediente al plato
      await axios.post(
        `${API_BASE_URL}/ingredientexplato`,
        {
          id_plato: platoId,
          id_ingrediente: ingrediente._id,
          porcion_neta: 0,
          peso_bruto: 0,
          rendimiento: 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Notificar a EditarIngredientes que se agregó un nuevo ingrediente
      onIngredienteAgregado();
      setNombreIngrediente("");
      setUnidadMedida("");

    } catch (error) {
      console.error("Error al agregar ingrediente:", error);
      setError(
        error.response?.data?.message ||
          "El ingrediente no existe. Por favor, inténtalo de nuevo más tarde."
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
          <TextField
            label="Nombre del Ingrediente"
            fullWidth
            value={nombreIngrediente}
            onChange={(e) => setNombreIngrediente(e.target.value)}
            sx={{
              "& .MuiInputBase-root": {
                "& fieldset": {
                  borderWidth: 1,
                  borderColor: "rgba(0, 0, 0, 0.23)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.23)",
                  borderWidth: 1,
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  borderWidth: 1,
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <FormControl fullWidth>
            <InputLabel id="unidad-medida-label">Unidad de Medida</InputLabel>
            <Select
              labelId="unidad-medida-label"
              value={unidadMedida}
              label="Unidad de Medida"
              onChange={(e) => setUnidadMedida(e.target.value)}
              sx={{
                "& .MuiInputBase-root": {
                  "& fieldset": {
                    borderWidth: 1,
                    borderColor: "rgba(0, 0, 0, 0.23)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 0, 0, 0.23)",
                    borderWidth: 1,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    borderWidth: 1,
                  },
                },
              }}
            >
              {unidadesMedida.map((unidad) => (
                <MenuItem key={unidad} value={unidad}>
                  {unidad}
                </MenuItem>
              ))}
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