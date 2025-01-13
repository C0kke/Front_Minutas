import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import { Card, CardContent, Grid, Typography, Box, List, ListItem, CircularProgress, ListItemText, TextField, Button } from '@mui/material'; // Importa List y ListItem
import './styles/EditarIngredientes.css';
import { useTheme } from '@mui/material/styles'; // Importa useTheme
import useMediaQuery from '@mui/material/useMediaQuery'; // Importa useMediaQuery

const EditarIngredientes = () => {
    const platoId = localStorage.getItem('id_plato');
    const [plato, setPlato] = useState(null); // Usa useState para inicializar el estado
    const [ingredientes, setIngredientes] = useState([]); // Nuevo estado para los ingredientes
    const [loading, setLoading] = useState(true); // Estado para controlar la carga
    const [error, setError] = useState(null); 
    const [ingredientesEditados, setIngredientesEditados] = useState([]);

    const navigate = useNavigate();

    const [guardando, setGuardando] = useState(false);

    const theme = useTheme(); // Obtiene el tema actual
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        
        const token = localStorage.getItem('token')?.trim();

        if (!token) {
            console.error("Token no encontrado.");
            navigate("/");
            return;
        }

        const fetchIngredientesPlato = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/v1/ingredientexplato/plato/${platoId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Ingredientes del plato recibidos:", response.data);
                setIngredientes(response.data);
            } catch (error) {
                console.error("Error al obtener ingredientes del plato:", error);
                setError(error);
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    navigate("/");
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchPlato = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/v1/plato/${platoId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Plato recibido:", response.data);
                setPlato(response.data);
            } catch (error) {
                console.error("Error al obtener plato:", error);
                setError(error);
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
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
          console.error("No se encontró el id del plato")
          navigate("/platos")
        }
    }, [navigate, platoId]);

    useEffect(() => {
        if (ingredientes.length > 0) {
          setIngredientesEditados(JSON.parse(JSON.stringify(ingredientes)));
        }
      }, [ingredientes]);

    if (loading) {
        return <div>Cargando ingredientes...</div>;
    }

    if (!plato) {
        return <Typography variant="body1">Plato no encontrado.</Typography>;
    }

    if (error) {
        return <div>Error al cargar los ingredientes.</div>;
    }

    if (!ingredientes || ingredientes.length === 0) {
        return <div>Este plato no tiene ingredientes asignados.</div>
    }

    const handleChangeCantidad = (index, nuevaCantidad) => {
        const nuevosIngredientes = [...ingredientesEditados];
        nuevosIngredientes[index].porcion_neta = nuevaCantidad;
        nuevosIngredientes[index].peso_bruto = nuevaCantidad*100/nuevosIngredientes[index].rendimiento;
        setIngredientesEditados(nuevosIngredientes);
    };
    
    const handleChangeRendimiento = (index, nuevaCantidad) => {
        const nuevosIngredientes = [...ingredientesEditados];
        nuevosIngredientes[index].rendimiento = nuevaCantidad;
        nuevosIngredientes[index].peso_bruto = nuevosIngredientes[index].porcion_neta*100/nuevaCantidad;
        setIngredientesEditados(nuevosIngredientes);
    };

    const handleGuardarCambios = async () => {
        const token = localStorage.getItem('token')?.trim();

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

                await axios.put(`http://localhost:3000/api/v1/ingredientexplato/${ingredienteEditado._id}`, 
                    updatedIngrediente, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

        } catch (error) {
            console.error("Error al guardar los cambios:", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                navigate("/");
            }
        } finally {
            setGuardando(false); 
            navigate("/platos")
        }
    };

    const getUnidadMedida = (unidad, cantidad) => {
        if (!unidad) return '';
        if (unidad.toUpperCase() === "GRAMO" && cantidad !== 1) {
            return "GRAMOS";
        } 
        return unidad;
    };

    return (
        <div className="MainContainer">
            <Header />
            <Box
                sx={{
                    flexGrow: 1, // Permite que el Box ocupe el espacio disponible
                    padding: 4,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    margin: '20px auto',
                    width: isMobile ? '95%' : '100%',
                    maxWidth: 2000,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Typography variant={isMobile ? "h5" : "h4"} gutterBottom align="center">Ingredientes de {plato.nombrePlato}</Typography>

                <Grid container spacing={isMobile ? 2 : 4} justifyContent="center" alignItems="stretch" sx={{ mr:'5em' }}>
                <Grid item xs={12} md={5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{/*Centrar imagen vertical y horizontalmente*/}
                        <Card sx={{ maxWidth: '100%', maxHeight: '100%' }}>{/*Ajustar tamaño de la Card para la imagen*/}
                            <CardContent className="image-container" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                {<img src={plato.imagen} alt={plato.nombrePlato} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}/>}
                                <Typography variant="body1" color="text.secondary">Imagen de {plato.nombre}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column' }}>{/*Ajustar Grid para que los elementos se expandan verticalmente*/}
                        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>{/*Permite que la Card se expanda verticalmente*/}
                            <CardContent className="ingredient-list-container" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>{/*Permite que el contenido se expanda verticalmente*/}
                                <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>Ingredientes:</Typography>
                                <List dense={!isMobile} sx={{ flexGrow: 1, overflowY: 'auto' }}>{/*Permite scroll si el contenido excede la altura*/}
                                    {ingredientesEditados.map((ingredientePlato, index) => (
                                        <ListItem key={ingredientePlato._id} disableGutters sx={{ paddingY: 1 }}> {/*Reducir el padding vertical*/}
                                            <ListItemText
                                                primary={<Typography variant={isMobile ? "body1" : "h6"}>{ingredientePlato.id_ingrediente.nombreIngrediente}</Typography>}
                                                secondary={
                                                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary" sx={{ width: '100px'}}>
                                                                Cantidad:
                                                            </Typography>
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={ingredientePlato.porcion_neta}
                                                                onChange={(e) => handleChangeCantidad(index, parseFloat(e.target.value) || 0)}
                                                                sx={{ width: 80 }}
                                                            />
                                                            <Typography variant={isMobile ? "body2" : "body1"} sx={{ ml: 1 }}>
                                                                {getUnidadMedida(ingredientePlato.id_ingrediente.unidadmedida, ingredientePlato.porcion_neta)}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' , gap: 2 }}>
                                                            <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary" sx={{ width: '100px' }}>
                                                                Peso Bruto:
                                                            </Typography>
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={ingredientePlato.peso_bruto}
                                                                sx={{ width: 80 }}
                                                            />
                                                            <Typography variant={isMobile ? "body2" : "body1"} sx={{ ml: 1 }}>
                                                                {getUnidadMedida(ingredientePlato.id_ingrediente.unidadmedida, ingredientePlato.peso_bruto)}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' , gap: 2, mr:'20%'}}>
                                                            <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary" sx={{ width: '100px' }}>
                                                                Rendimiento:
                                                            </Typography>
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={ingredientePlato.rendimiento}
                                                                onChange={(e) => handleChangeRendimiento(index, parseFloat(e.target.value) || 0)}
                                                                sx={{ width: 80 }}
                                                            />
                                                            <Typography variant={isMobile ? "body2" : "body1"} sx={{ ml: 1 }}>
                                                                %
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
                <Box sx={{ m: '0 auto' }}>
                    <Button variant="contained" onClick={handleGuardarCambios} disabled={guardando}>
                        {guardando ? <CircularProgress size={24} /> : "Guardar Cambios"}
                    </Button>
                </Box>
            </Box>
        </div>
    );
};

export default EditarIngredientes;