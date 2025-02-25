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
  Modal as MuiModal,
  List,
  Typography,
  useMediaQuery,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  const [mensaje, setMensaje] = useState("");
  
  const [platoEditado, setPlatoEditado] = useState({});

  const [modalAbierto, setModalAbierto] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [tiposCorte, setTiposCorte] = useState([]);
  const [nuevoTipoCorte, setNuevoTipoCorte] = useState("");

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const BACKEND_URL = process.env.REACT_APP_BACK_URL;
  const token = localStorage.getItem("token")?.trim();

  // Función para cargar los datos iniciales
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMensaje("Cargando datos...");
    if (!token) {
      console.error("Token no encontrado.");
      setMensaje("Sesión no válida. Redirigiendo...");
      navigate("/");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const platoResponse = await axios.get(
        `${BACKEND_URL}plato/${platoId}`,
        { headers }
      );
      if (JSON.stringify(platoResponse.data) !== JSON.stringify(plato)) {
        setPlato(platoResponse.data);
      }
      const ingredientesResponse = await axios.get(
      `${BACKEND_URL}ingredientexplato/plato/${platoId}`,
        { headers }
      );
      
      if (JSON.stringify(ingredientesResponse.data) !== JSON.stringify(ingredientes)) {
        setIngredientes(ingredientesResponse.data);
      }
      setMensaje("Datos cargados correctamente.");
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setError("Error al obtener los datos del plato o sus ingredientes.");
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
        setMensaje("Redirigiendo a la lista de platos...");
        navigate("/platos");
    }
  }, [fetchData, navigate, platoId]);

  useEffect(() => {
    const fetchOpciones = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}plato`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ordenar platos alfabéticamente
            const sortedPlatos = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));


            //Obtener tipos de cortes 
            const tipodecortesUnicos = new Set();
            sortedPlatos.forEach(plato => {
                tipodecortesUnicos.add(plato.tipo_corte);
            });
       
            setTiposCorte([...tipodecortesUnicos]);

            //Obtener familias unicas
            const FamiliasUnicas = new Set();
            sortedPlatos.forEach(plato => {
                FamiliasUnicas.add(plato.familia);
            });
            
            setFamilias([...FamiliasUnicas]);


            // Obtener categorías únicas
            const categoriasUnicas = new Set();
            sortedPlatos.forEach(plato => {
                categoriasUnicas.add(plato.categoria);
            });

            setCategorias([...categoriasUnicas]);

        } catch (error) {
            console.error("Error al obtener Opciones:", error);
            if (error.response && error.response.status === 401) {
                console.error("Token inválido. Redirigiendo al login.");
                localStorage.removeItem('token');
                localStorage.setItem('error', 'error en la sesion')
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    fetchOpciones();
}, [navigate]);

  // Manejar cambios en los campos de los ingredientes
  const handleChange = useCallback(
    (index, field, newValue) => {
      setIngredientes((prevIngredientes) => {
        const nuevosIngredientes = [...prevIngredientes];
        nuevosIngredientes[index][field] = newValue;
        if (field === "porcion_neta" || field === "rendimiento") {
          nuevosIngredientes[index].peso_bruto =
            (nuevosIngredientes[index].porcion_neta * 100) /
            nuevosIngredientes[index].rendimiento;
        }
        return nuevosIngredientes;
      });
    },
    []
  );

  // Manejar la eliminación de un ingrediente
  const handleEliminarIngrediente = useCallback(
    async (id) => {
      const token = localStorage.getItem("token")?.trim();
      if (!token) {
        console.error("Token no encontrado.");
        return;
      }

      try {
        await axios.delete(`${BACKEND_URL}ingredientexplato/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Actualizar el estado local eliminando el ingrediente
        setIngredientes((prevIngredientes) =>
          prevIngredientes.filter((ingrediente) => ingrediente._id !== id)
        );

        setMensaje("Ingrediente eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el ingrediente:", error);
        setError("Error al eliminar el ingrediente.");
      }
    },
    []
  );

  const handleEditarPlato = () => {
    setPlatoEditado(plato); // Inicializamos con los datos actuales del plato
    setModalAbierto(true);
  };
  
  const handleChangePlato = (field, value) => {
    setPlatoEditado((prev) => ({ ...prev, [field]: value }));
  };

  // Manejar el agregado de un nuevo ingrediente
  const handleIngredienteAgregado = () => {
    setMensaje("Ingrediente agregado correctamente.");
    fetchData();
  };

  const handleGuardarPlato = async () => {
    try {
      const token = localStorage.getItem("token")?.trim();
      if (!token) {
        console.error("Token no encontrado.");
        return;
      }
  
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${BACKEND_URL}plato/${plato._id}`, platoEditado, { headers });
  
      setPlato(platoEditado); // Actualizamos el estado local
      setModalAbierto(false);
      alert("Cambios guardados exitosamente.");
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Error al guardar los cambios. Intenta nuevamente más tarde.");
    }
  };

  // Guardar cambios en el backend
  const handleGuardarCambios = useCallback(async () => {
    setGuardando(true);
    setSuccess(false);
    setError(null);
    setMensaje("Guardando cambios...");
    const token = localStorage.getItem("token")?.trim();
    if (!token) {
      console.error("Token no encontrado.");
      setMensaje("Error: sesión no válida.");
      setGuardando(false);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all(
        ingredientes.map((ingredienteEditado) =>
          axios.put(
            `${BACKEND_URL}ingredientexplato/${ingredienteEditado._id}`,
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
      setMensaje("Cambios guardados correctamente.");
      setSuccess(true);
      fetchData(); // Recargar los datos después de guardar
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      setError("Error al guardar los cambios.");
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setGuardando(false);
    }
  }, [fetchData, ingredientes, navigate]);

  const handleVolverAPlatos = () => {
    navigate("../platos");
  };

  const handleEstadoPlato = async () => {
    if (!plato) return; // Asegúrate de que plato no sea null
  
    // Actualiza el estado local
    const nuevoEstado = !plato.descontinuado;
    setPlato((prevPlato) => ({
      ...prevPlato,
      descontinuado: nuevoEstado,
    }));
  
    // Opcional: Envía el cambio al backend
    try {
      const token = localStorage.getItem("token")?.trim();
      if (!token) {
        console.error("Token no encontrado.");
        return;
      }
  
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${BACKEND_URL}plato/${platoId}`,
        {
          ...plato, 
          descontinuado: nuevoEstado
        },
        { headers }
      );
  
      console.log("Estado del plato actualizado en el backend");
    } catch (error) {
      console.error("Error al actualizar el estado del plato:", error);
      // Si falla el backend, puedes revertir el estado local si es necesario
      setPlato((prevPlato) => ({
        ...prevPlato,
        descontinuado: !nuevoEstado,
      }));
    }
  };
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
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          ml: 5,
          mr: 8
        }}
      >
        <Button
          onClick={handleVolverAPlatos}
          sx={{
            width: "20%",
            bgcolor: "#14375A",
            color: "white",
            marginLeft: "25px",
          }}
        >
          Volver atrás
        </Button>
        <Button
          onClick={handleEditarPlato}
          sx={{
            width: "20%",
            bgcolor: "#14375A",
            color: "white",
            marginLeft: "25px",
          }}
        >
          Editar plato
        </Button>
        <Button
          onClick={handleEstadoPlato}
          sx={{
            width: "20%",
            bgcolor: "#14375A",
            color: "white",
            marginLeft: "25px",
          }}
        >
          {plato?.descontinuado ? (
            "ACTIVAR "
          ) : (
            "DESCONTINUAR "
          )}
           PLATO
        </Button>
      </Box>
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
          Ingredientes de {plato ? plato.nombre : ""}
        </Typography>
        {mensaje && (
          <Alert severity={success ? "success" : "info"} sx={{ mb: 2 }}>
            {mensaje}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
         <AgregarIngrediente
          platoId={platoId}
          onIngredienteAgregado={handleIngredienteAgregado}
        />
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
                      onEliminar={handleEliminarIngrediente} // Pasar la función de eliminación
                    />
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
      </Box>
      <div>
      {modalAbierto && (
        <MuiModal open={modalAbierto} onClose={() => setModalAbierto(false)}>
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
          <Typography variant="h6" gutterBottom color="#2E8B57"> 
            Editar Plato
          </Typography>
          <TextField
            label="Nombre"
            value={platoEditado.nombre || ""}
            onChange={(e) => handleChangePlato("nombre", e.target.value.toUpperCase())}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="categoria-label">Categoría</InputLabel>
            <Select
              labelId="categoria-label"
              value={platoEditado.categoria || ""}
              onChange={(e) => handleChangePlato("categoria", e.target.value)}
            >
              {categorias.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="familia-label">Familia</InputLabel>
            <Select
              labelId="familia-label"
              value={platoEditado.familia || ""}
              onChange={(e) => handleChangePlato("familia", e.target.value)}
            >
              {familias.map((fam) => (
                <MenuItem key={fam} value={fam}>
                  {fam}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="tipo-corte-label">Tipo de corte</InputLabel>
            <Select
              labelId="tipo-corte-label"
              value={platoEditado.tipo_corte || ""}
              onChange={(e) => handleChangePlato("tipo_corte", e.target.value)}
            >
              {tiposCorte.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Agregar nuevo tipo de corte"
            value={nuevoTipoCorte}
            onChange={(e) => setNuevoTipoCorte(e.target.value.toUpperCase())}
            fullWidth
            margin="normal"
          />
          <Button
            onClick={() => {
              if (nuevoTipoCorte.trim()) {
                setTiposCorte((prev) => [...prev, nuevoTipoCorte]);
                setNuevoTipoCorte("");
              }
            }}
            variant="contained"
            color="success"
            fullWidth
            margin="normal"
          >
            Agregar
          </Button>
          <Box display="flex" justifyContent="space-between" marginTop={2}>
            <Button
              onClick={handleGuardarPlato}
              variant="contained"
              color="primary"
            >
              Guardar
            </Button>
            <Button
              onClick={() => setModalAbierto(false)}
              variant="contained"
              color="error"
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </MuiModal>
      )}
      </div>
    </div>
  );
};

export default EditarIngredientes;