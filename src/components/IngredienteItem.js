import React, { useCallback } from "react";
import axios from "axios";
import {
  Divider,
  Grid,
  InputAdornment,
  ListItem,
  TextField,
  Typography,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";

const IngredienteItem = ({ ingredientePlato, index, handleChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getUnidadMedida = useCallback((unidad, cantidad) => {
    if (!unidad) return "";
    return unidad.toUpperCase() === "GRAMO" && cantidad !== 1
      ? "GRAMOS"
      : unidad;
  }, []);

  const handleEliminar = async (id, nombreIngrediente) => {
    const token = localStorage.getItem("token")?.trim();
    if (!token) {
      console.error("Token no encontrado.");
      return;
    }
  
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar el ingrediente: ${nombreIngrediente}?`
    );
  
    if (!confirmacion) {
      console.log("Eliminación cancelada.");
      return;
    }
  
    try {
      await axios.delete(`http://localhost:3000/api/v1/ingredientexplato/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Ingrediente eliminado exitosamente.");
      // Aquí puedes actualizar el estado para eliminar el ingrediente de la lista.
    } catch (error) {
      console.error("Error eliminando el ingrediente:", error);
    }
  };
  

  const handleEliminarIngrediente = () => {
    const ingredienteNombre = ingredientePlato.id_ingrediente.nombreIngrediente;
    const id = ingredientePlato._id;

    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${ingredienteNombre}?`)) {
      return;
    }
    handleEliminar(id, ingredienteNombre );
  };

  return (
    <>
      <ListItem sx={{ padding: 3 }}>
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
          <Grid item xs={12} md={8}>
            <Grid container spacing={2} justifyContent="space-around">
              
              {[
                {
                  label: "Cantidad Neta",
                  value: ingredientePlato.porcion_neta,
                  onChange: (value) => handleChange(index, "porcion_neta", value),
                  unidad: getUnidadMedida(
                    ingredientePlato.id_ingrediente.unidadmedida,
                    ingredientePlato.porcion_neta
                  ),
                  readOnly: false,
                  min: 0,
                },
                {
                  label: "Peso Bruto",
                  value:
                    ingredientePlato.peso_bruto !== null &&
                    ingredientePlato.peso_bruto >= 0
                      ? ingredientePlato.peso_bruto.toFixed(2)
                      : "0.00",
                  unidad: getUnidadMedida(
                    ingredientePlato.id_ingrediente.unidadmedida,
                    ingredientePlato.peso_bruto
                  ),
                  readOnly: true,
                },
                {
                  label: "Rendimiento",
                  value: ingredientePlato.rendimiento,
                  onChange: (value) => handleChange(index, "rendimiento", value),
                  unidad: "%",
                  readOnly: false,
                  min: 0,
                  max: 100,
                },
              ].map((field) => (
                <Grid item xs={12} sm={4} key={field.label}>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={field.value}
                    onChange={(e) =>
                      field.onChange && field.onChange(parseFloat(e.target.value))
                    }
                    InputProps={{
                      readOnly: field.readOnly,
                      inputProps: { min: field.min, max: field.max },
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography
                            variant="body2"
                            sx={{ ml: 1, whiteSpace: "nowrap" }}
                          >
                            {field.unidad}
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          transform: "translate(0, 1.5px) scale(1)",
                        }}
                      >
                        {field.label}
                      </Typography>
                    }
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
                      "& .MuiInputLabel-root": {
                        top: -6,
                      },
                      "& .MuiInputLabel-shrink": {
                        transform: "translate(14px, -9px) scale(0.75)",
                      },
                      "& .MuiInputBase-input": {
                        paddingTop: "10px",
                        paddingBottom: "10px",
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
          {/* Botón de eliminar */}
          <Grid item xs={12} md={1}>
            <IconButton
              aria-label="Eliminar ingrediente"
              color="error"
              onClick={handleEliminarIngrediente}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </ListItem>
      <Divider />
    </>
  );
};

export default IngredienteItem;
