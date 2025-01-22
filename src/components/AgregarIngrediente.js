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

const API_BASE_URL = "http://localhost:3000/api/v1";

const AgregarIngrediente = ({ platoId, onIngredienteAgregado }) => {
  const [nombreIngrediente, setNombreIngrediente] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [opcionesIngrediente, setOpcionesIngrediente] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const unidadesMedida = ["GRAMOS", "KILOS", "CC", "UNIDADES", "LITROS"];

  useEffect(() => {
    const fetchIngredientes = async () => {
      const token = localStorage.getItem("token")?.trim();
      if (!token) {
        console.error("Token no encontrado.");
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/ingrediente`, {
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
        `${API_BASE_URL}/ingredientexplato`,
        {
          id_plato: platoId,
          id_ingrediente: ingredienteSeleccionado._id,
          porcion_neta: 0,
          peso_bruto: 0,
          rendimiento: 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onIngredienteAgregado();
      setNombreIngrediente("");
      setUnidadMedida("");
      setSuccessMessage("Ingrediente agregado correctamente.");
    } catch (error) {
      console.error("Error al agregar ingrediente:", error);
      setError(
        error.response?.data?.message ||
          "Ocurrió un error. Por favor, inténtalo nuevamente."
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
              onChange={(e) => setUnidadMedida(e.target.value)}
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