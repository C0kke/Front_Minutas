import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import "./Platos.css"
import Header from "../components/Header";
import Minutas from "./CrearMinuta"
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { TextField, Box, InputLabel, MenuItem, FormControl, Select } from '@mui/material';

Modal.setAppElement('#root');

const categorias = [
    "PLATO DE FONDO",
    "VEGETARIANO",
    "VEGANA",
    "GUARNICIÓN",
    "HIPOCALORICO",
    "ENSALADA",
    "SOPA",
    "POSTRES",
]

const Platos = () => {
    const [platos, setPlatos] = useState([]);
    const [selectedPlato, setSelectedPlato] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [ingredientes, setIngredientes] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlatos = async () => {
            const token = localStorage.getItem('token')?.trim();     
            if (!token) {
                console.error("Token no encontrado en localStorage. Redirigiendo al login.");
                setError(new Error("No autorizado. Inicie sesión."));
                setLoading(false);
                return;
            }   
            try {
                const response = await axios.get('http://localhost:3000/api/v1/plato', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPlatos(response.data);
            } catch (error) {
                console.error("Error al obtener platos:", error);
                if (error.response && error.response.status === 401) {
                    console.error("Token inválido. Redirigiendo al login.");
                    localStorage.removeItem('token');
                    navigate("/");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlatos();
    }, []);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };
    
    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    const filteredPlatos = useMemo(() => {
        return platos.filter(plato => {
            const nombreCoincide = plato.nombre && plato.nombre.trim().toUpperCase().includes(searchTerm.trim().toUpperCase());
            const categoriaCoincide = selectedCategory === "Todas" || plato.categoria === selectedCategory;
            return nombreCoincide && categoriaCoincide;
        });
    }, [platos, searchTerm, selectedCategory]);

    const openModal = async (plato) => {
        setSelectedPlato(plato);
        setModalIsOpen(true);
        setIngredientes([]);
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token')?.trim();
        if (!token) {
            alert("Sesión inválida. Redirigiendo...");
            setError(new Error("No autorizado. Inicie sesión."));
            setLoading(false);
            navigate("/"); // Redirige al login si no hay token
            return;
        }

        try {
            const response = await axios.get(`http://localhost:3000/api/v1/ingredientexplato/plato/${plato._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIngredientes(response.data);
        } catch (err) {
            console.error("Error fetching ingredientes:", err);
            setError(err);
            if (err.response?.status === 401) {
                alert("Su sesión ha expirado. Redirigiendo...");
                localStorage.removeItem('token');
                navigate("/");
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const actualizarIngredientes = () => {
        window.location.replace('crear-minuta')
    }
    if (loading) {
        return <div>Cargando platos...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <Header />
            <Box sx={{ display: 'flex', alignItems: 'center', margin: '16px' }}>
                <TextField
                    label="Buscar plato"
                    variant="outlined"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ flexGrow: 1, marginRight: '16px' }}
                />
                <FormControl sx={{ m: 1, minWidth: 120 }}>
                    <InputLabel id="categoria-select-label">Categoría</InputLabel>
                    <Select
                        labelId="categoria-select-label"
                        id="categoria-select"
                        value={selectedCategory}
                        label="Categoría"
                        onChange={handleCategoryChange}
                    >
                        <MenuItem value="Todas">Todas</MenuItem>
                        {categorias.map((categoria) => (
                            <MenuItem key={categoria} value={categoria}>
                                {categoria}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <div className="ListaPLatos">
                {filteredPlatos.map((plato) => (
                    <div key={plato._id} onClick={() => openModal(plato)} className='PlatoCard' style={plato.descontinuado? {color : 'red', border: '1px solid red'} : {color : 'inert'}}>
                        {plato.nombre}
                        <div className='Descontinuado'>{plato.descontinuado ? 'descontinuado' : ''}</div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={{
                    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                    content: {
                        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
                        marginRight: '-50%', transform: 'translate(-50%, -50%)'
                    }
                }}
            >
                {selectedPlato && (
                    <div>
                        <h2>Ingredientes de {selectedPlato.nombre}</h2>
                        {loading && <div>Cargando ingredientes...</div>}
                        {error && <div>Error: {error.message}</div>}
                        {!loading && !error && ingredientes.length > 0 && (
                            <ul>
                                {ingredientes.filter(ingrediente => ingrediente.porcion_neta !== 0).map((ingrediente) => (
                                    <li key={ingrediente._id}>
                                        {ingrediente.id_ingrediente.nombreIngrediente}: {ingrediente.porcion_neta}{ingrediente.id_ingrediente.unidadmedida ? ` ${ingrediente.id_ingrediente.unidadmedida}` : ''}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!loading && !error && ingredientes.length === 0 && (
                            <p>Este plato no tiene ingredientes registrados.</p>
                        )}
                        <div className='ButtonContainer'>
                            <button onClick={closeModal}>Cerrar</button>
                            <button onClick={actualizarIngredientes}>Actualizar Ingredientes</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Platos;