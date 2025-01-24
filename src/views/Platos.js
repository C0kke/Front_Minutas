import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import "./styles/Platos.css"
import Header from "../components/Header";
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { TextField, Box, InputLabel, MenuItem, FormControl, Select, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
    const [modalCrearIsOpen, setModalCrearIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('Todos');
    const [eliminacion, setEliminacion] = useState(false);

    const [pageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [nuevoPlato, setNuevoPlato] = useState({
        nombre: '',
        categoria: '',
        descripcion: '',
    });
    const navigate = useNavigate();

    const token = localStorage.getItem('token')?.trim();    
    localStorage.removeItem('id_plato') 
    const role =  localStorage.getItem('ROL')?.trim();

    useEffect(() => {
        const fetchPlatos = async () => {
            setEliminacion(false);
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
                    localStorage.setItem('error', 'error en la sesion')
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlatos();
    }, [currentPage, eliminacion]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };
    
    const handleStatusChange = (event) => {
        setSelectedStatus(event.target.value);
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
            const estadoCoincide = 
                selectedStatus === "Todos" ||
                (selectedStatus === "Activos" && !plato.descontinuado) ||
                (selectedStatus === "Descontinuados" && plato.descontinuado);
    
            return nombreCoincide && categoriaCoincide && estadoCoincide;
        });
    }, [platos, searchTerm, selectedCategory, selectedStatus]);

    const displayedDishes = useMemo(() => {
        return filteredPlatos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredPlatos, currentPage, pageSize]);

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

    const handleDescontinuarClick = async () => {

        if (selectedPlato.descontinuado && ingredientes.length === 0){
            alert("Ingrese algún ingrediente primero - Los platos deben contener ingredientes");
            return;
        }

        const platoData = {
            nombre : selectedPlato.nombre,
            categoria : selectedPlato.categoria,
            descripcion: "Plato editado desde software",
            descontinuado: !selectedPlato.descontinuado,
        }
        try {
            const response = await axios.put(`http://localhost:3000/api/v1/plato/${selectedPlato._id}`, platoData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            selectedPlato.descontinuado = !selectedPlato.descontinuado;
            
        } catch (error) {
            console.error("Error al actualizar el plato:", error);
            if (error.response && error.response.status === 401) {
                console.error("Token inválido. Redirigiendo al login.");
                localStorage.removeItem('token');
                localStorage.setItem('error', 'error en la sesion')
                navigate("/login");
            }
        }
        closeModal();
    };
    
    const openModal = async (plato) => {
        setSelectedPlato(plato);
        setModalIsOpen(true);
        setIngredientes([]);
        setLoading(true);
        setError(null);

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
                localStorage.setItem('error', 'error en la sesion');
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const closeModalCrear = () => {
        setModalCrearIsOpen(false);
    };

    const actualizarIngredientes = () => {
        localStorage.setItem('id_plato', selectedPlato._id);
        navigate("/editar-ingredientes");
    }

    const handleCrearPlato = async () => {
        const token = localStorage.getItem('token')?.trim();
        if (!token) {
            alert("Sesión inválida. Redirigiendo...");
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/api/v1/plato', nuevoPlato, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlatos([...platos, response.data]);
            alert(`PLATO ${nuevoPlato.nombre} CREADO CON ÉXITO`)
            closeModalCrear();
            setNuevoPlato({ nombre: '', categoria: '', descripcion: '' });
        } catch (err) {
            console.error("Error al crear plato:", err);
            alert("Ocurrió un error al crear el plato.");
        }
    };

    const handleEliminarPlato = async (id,nombre) => {
        const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar el plato : ${nombre}?`);
        if (confirmacion) {
            try {
                const response = await axios.delete(`http://localhost:3000/api/v1/plato/${id}`, {headers: { Authorization: `Bearer ${token}` }});
                
                if (response.status === 200) {
                    alert('Plato eliminado exitosamente.');
                    setEliminacion(true);
                    closeModal();
                } else {
                    alert('No se pudo eliminar el plato. Inténtalo de nuevo.');
                }
            } catch (error) {
                console.error('Error eliminando el plato:', error);
                alert('Ocurrió un error al eliminar el plato.');
            }
        }
    };

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
                <FormControl sx={{ m: 1, minWidth: 120 }}>
    <InputLabel id="estado-select-label">Estado</InputLabel>
    <Select
        labelId="estado-select-label"
        id="estado-select"
        value={selectedStatus}
        label="Estado"
        onChange={handleStatusChange}
    >
        <MenuItem value="Todos">Todos</MenuItem>
        <MenuItem value="Activos">Activos</MenuItem>
        <MenuItem value="Descontinuados">Descontinuados</MenuItem>
    </Select>
</FormControl>
            </Box>
            <Button
                onClick={() => setModalCrearIsOpen(true)}
                variant="contained"
                sx={{ marginBottom: '16px', backgroundColor: '#2E8B57', color: 'white', '&:hover': { backgroundColor: '#1A5230' } }}
            >
                Crear Nuevo Plato
            </Button>
            <div className="ListaPLatos">
                {displayedDishes.map((plato) => (
                    <div key={plato._id} onClick={() => openModal(plato)} className='PlatoCard' style={plato.descontinuado? {color : 'red', border: '1px solid red'} : {color : '#2E8B57'}}>
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
                        '&:hover': {
                            backgroundColor: '#1A5230', 
                        },
                        color: 'white'
                    }}
                >
                    {'<'}
                </Button>

                <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || displayedDishes.length < pageSize}
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
                <IconButton
                    aria-label="close"
                    onClick={closeModal}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
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
                        <Button variant="contained" color={selectedPlato.descontinuado ? "success" : "error"} onClick={handleDescontinuarClick}>
                            {selectedPlato.descontinuado ? 'Reactivar' : 'Descontinuar'}
                        </Button>                            
                   
                    <Button className='ModalButton'   onClick={actualizarIngredientes} variant="outlined">Actualizar Ingredientes</Button>

                    
                    {role === "admin" && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleEliminarPlato(selectedPlato._id, selectedPlato.nombre)}
                        >
                            Eliminar
                        </Button>
                        )}

                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={modalCrearIsOpen}
                onRequestClose={closeModalCrear}
                className="ReactModal__Content"
                overlayClassName="ReactModal__Overlay"
            >
                <IconButton
                    aria-label="close"
                    onClick={closeModalCrear}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
                <div>
                    <h2>Crear Nuevo Plato</h2>
                    <TextField
                        label="Nombre"
                        value={nuevoPlato.nombre}
                        onChange={(e) => setNuevoPlato({ ...nuevoPlato, nombre: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Categoría</InputLabel>
                        <Select
                            value={nuevoPlato.categoria}
                            onChange={(e) => setNuevoPlato({ ...nuevoPlato, categoria: e.target.value })}
                        >
                            {categorias.map((categoria) => (
                                <MenuItem key={categoria} value={categoria}>
                                    {categoria}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Descripción"
                        value={nuevoPlato.descripcion}
                        onChange={(e) => setNuevoPlato({ ...nuevoPlato, descripcion: e.target.value })}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={4}
                    />
                    <div className="ButtonContainer">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCrearPlato}
                            sx={{ marginRight: '8px' }}
                        >
                            Crear
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={closeModalCrear}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Platos;

