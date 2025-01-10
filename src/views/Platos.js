import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import "./styles/Platos.css"
import Header from "../components/Header";
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { TextField, Box, InputLabel, MenuItem, FormControl, Select, Button } from '@mui/material';

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

    const [pageSize] = useState(10); // Number of dishes per page
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1); // Nuevo estado para el número total de páginas
    const navigate = useNavigate();

    const token = localStorage.getItem('token')?.trim();     
    useEffect(() => {
        const fetchPlatos = async () => {
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
                setTotalPages(Math.ceil(response.data.length / pageSize));   
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
    }, [currentPage]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };
    
    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
        setCurrentPage(1);
    };

    const filteredPlatos = useMemo(() => {
        return platos.filter(plato => {
            const nombreCoincide = plato.nombre && plato.nombre.trim().toUpperCase().includes(searchTerm.trim().toUpperCase());
            const categoriaCoincide = selectedCategory === "Todas" || plato.categoria === selectedCategory;
            return nombreCoincide && categoriaCoincide;
        });
    }, [platos, searchTerm, selectedCategory]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const displayedDishes = useMemo(() => {
        return filteredPlatos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredPlatos, currentPage, pageSize]);
    
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
        //window.location.replace('crear-minuta')
        navigate("../crear-minuta")
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
            <Box className='FilterBox'>
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
                {displayedDishes.map((plato) => (
                    <div key={plato._id} onClick={() => openModal(plato)} className='PlatoCard' style={plato.descontinuado? {color : 'red', border: '1px solid red'} : {color : 'inert'}}>
                        {plato.nombre}
                        <div className='Descontinuado'>{plato.descontinuado ? 'descontinuado' : ''}</div>
                    </div>
                ))}
            </div>
        <div className="PaginationButtons">
    
        <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            variant="contained"
            sx={{
                backgroundColor: '#2E8B57',
                '&:hover': { // Estilos para el hover
                    backgroundColor: '#1A5230', // Un verde más oscuro al pasar el mouse
                },
                color: 'white' //Color del texto
            }}
        >
            {'<'}
        </Button>

        <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            variant="contained"
            sx={{
                backgroundColor: '#2E8B57',
                '&:hover': {
                    backgroundColor: '#1A5230',
                },
                color: 'white'
            }}
        >
            {'>'}
        </Button>
        </div>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="ReactModal__Content"
                overlayClassName="ReactModal__Overlay"
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
                            <Button className='ModalButton' onClick={closeModal} variant="outlined">Cerrar</Button>
                            <Button className='ModalButton' onClick={actualizarIngredientes} variant="outlined">Actualizar Ingredientes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Platos;