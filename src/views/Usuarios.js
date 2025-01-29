import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Button, IconButton, Modal, TextField } from "@mui/material";
import Header from "../components/Header";

const Usuarios = () => {
    const [user, setUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalCrearIsOpen, setModalCrearIsOpen] = useState(false);

    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/v1/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsuarios(response.data);
            } catch (error) {
                console.error("Error al obtener usuarios:", error);
                if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.setItem('error', 'error de sesion');
                navigate("/login");
                } else if (error.response) {
                setError(new Error(`Error del servidor: ${error.response.status} - ${error.response.data.message || 'Detalles no disponibles'}`));
                } else if (error.request) {
                setError(new Error("No se recibió respuesta del servidor."));
                } else {
                setError(new Error("Error al configurar la solicitud."));
                }
            }
        };
        fetchUsuarios();
    }, [navigate]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const closeModalCrear = () => {
        setModalCrearIsOpen(false);
    };

    return (
        <div>
            <Header />
            <Box className='FilterBox'>
                <TextField
                    label="Buscar usuario"
                    variant="outlined"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ flexGrow: 1, marginRight: '16px' }}
                />
                {/*< FormControl sx={{ m: 1, minWidth: 120 }}>
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
                </FormControl> */}
                {/* <FormControl sx={{ m: 1, minWidth: 120 }}>
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
                </FormControl> */}
            </Box>
            <Button
                onClick={() => setModalCrearIsOpen(true)}
                variant="contained"
                sx={{ marginBottom: '16px', backgroundColor: '#2E8B57', color: 'white', '&:hover': { backgroundColor: '#1A5230' } }}
            >
                Crear Nuevo Usuario
            </Button>
            <div className="ListaUsuarios">
                {usuarios.map((user) => (
                    <div key={user._id} onClick={() => openModal(user)} className='PlatoCard'>
                        {user.name}
                    </div>
                ))}
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
                </IconButton>
            </Modal>
        </div>
    );
}

export default Usuarios;