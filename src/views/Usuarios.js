import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Button, Modal, TextField, Typography, MenuItem } from "@mui/material";
import Header from "../components/Header";

const Usuarios = () => {
    const [user, setUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalCrearIsOpen, setModalCrearIsOpen] = useState(false);
    const [error, setError] = useState(null); // Declare error state
    const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: '' }); // Declare new user state
    const [currentPage, setCurrentPage] = useState(1); // Declare currentPage state
    const [deletionConfirmation, setDeletionConfirmation] = useState(0); // For the delete confirmation

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
    }, [navigate, token]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const closeModalCrear = () => {
        alert("Usuario Creado con exito")
        setModalCrearIsOpen(false);
    };

    const openModal = (user) => {
        setNewUser(user);  // Cargar los datos del usuario en el estado para editar
        setModalIsOpen(true);
    };

    const openModalCrear = () => {
        setNewUser({ name: '', username: '', email: '', password: '', role: '' });  // Resetear a un objeto vacío para crear un nuevo usuario
        setModalCrearIsOpen(true);
    };

    const handleCreateUserChange = (event) => {
        const { name, value } = event.target;
        setNewUser((prevUser) => ({ ...prevUser, [name]: value }));
    };

    const handleCreateUser = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/v1/user', newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios((prevUsuarios) => [...prevUsuarios, response.data]);
            closeModalCrear();
        } catch (error) {
            console.error("Error al crear usuario:", error);
            
            if (error.response.status === 400){
                alert("TIENES QUE LLENAR TODOS LOS CAMPOS")
            return
            }
            // Verifica si el error tiene la estructura esperada para un error de MongoDB
            if (error.response.data.error.errorResponse.errmsg) {
                const errorMessage = error.response.data.error.errorResponse.errmsg
    ;
                console.log(errorMessage)
                console.log("alo")
                
                // Captura el error específico y le pasa un mensaje más claro al usuario
                if (errorMessage.includes('username')) {
                    alert("El nombre de usuario ya está en uso.");
                } else if (errorMessage.includes('email')) {
                    alert("El correo electrónico ya está en uso.");
                } else {
                    alert("No se pudo crear el usuario debido a un error desconocido.");
                }
            } else {
                // Si el error no tiene una respuesta esperada, muestra un mensaje genérico
                alert("No se pudo crear el usuario.");
            }
        }
    };

    const handleEditUser = async() => {
        const confirmed = window.confirm("¿Está seguro de que desea editar este usuario?");
        if (confirmed) {
            try {
                const response = await axios.put(`http://localhost:3000/api/v1/user/${newUser._id}`, newUser, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsuarios((prevUsuarios) => prevUsuarios.map(u => u._id === newUser._id ? response.data : u));
                closeModal();
            } catch (error) {
                console.error("Error al editar usuario:", error);
                setError(new Error("No se pudo editar el usuario."));
            }
        }
    };

    const handleDeleteUser = async () => {
        const confirmedFirst = window.confirm("¡Este proceso es irreversible! ¿Está seguro que quiere eliminar al usuario?");
        if (confirmedFirst) {
            const confirmedSecond = window.confirm("Este es el segundo paso de la confirmación. ¿Seguro que desea continuar?");
            if (confirmedSecond) {
                const confirmedThird = window.confirm("¡Última confirmación! ¿Realmente desea eliminar este usuario?");
                if (confirmedThird) {
                    try {
                        await axios.delete(`http://localhost:3000/api/v1/user/${newUser._id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUsuarios((prevUsuarios) => prevUsuarios.filter(u => u._id !== newUser._id));
                        closeModal();
                    } catch (error) {
                        console.error("Error al eliminar usuario:", error);
                        setError(new Error("No se pudo eliminar el usuario."));
                    }
                }
            }
        }
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
            </Box>
            <Button
                onClick={openModalCrear}  // Cambié esta parte para abrir el modal de crear usuario
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

            {/* Modal para crear un nuevo usuario */}
            <Modal
                open={modalCrearIsOpen}
                onClose={closeModalCrear}
                aria-labelledby="modal-crear-usuario"
                aria-describedby="modal-crear-usuario-descripcion"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: '8px' }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Crear Nuevo Usuario
                    </Typography>
                    <TextField
                        label="Nombre"
                        name="name"
                        value={newUser.name}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Username"
                        name="username"
                        value={newUser.username}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Email"
                        name="email"
                        value={newUser.email}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={newUser.password}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        select
                        label="Rol"
                        name="role"
                        value={newUser.role}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    >
                        <MenuItem value="nutricionista">Nutricionista</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="logistica">Logística</MenuItem>
                    </TextField>
                    <Box mt={2} display="flex" justifyContent="space-between">
                        <Button onClick={closeModalCrear} sx={{ marginRight: 2, color: '#2E8B57', '&:hover': { backgroundColor: '#f5f5f5' } }}>
                            Cancelar
                        </Button>
                        <Box>
                            <Button onClick={handleCreateUser} variant="contained" sx={{ backgroundColor: '#2E8B57', color: 'white', '&:hover': { backgroundColor: '#1A5230' } }}>
                                Crear
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Modal>

            {/* Modal para editar o eliminar usuario */}
            <Modal
                open={modalIsOpen}
                onClose={closeModal}
                aria-labelledby="modal-editar-eliminar-usuario"
                aria-describedby="modal-editar-eliminar-usuario-descripcion"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: '8px' }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Editar Usuario
                    </Typography>
                    <TextField
                        label="Nombre"
                        name="name"
                        value={newUser.name}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Username"
                        name="username"
                        value={newUser.username}
                        disabled
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Email"
                        name="email"
                        value={newUser.email}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={newUser.password}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        select
                        label="Rol"
                        name="role"
                        value={newUser.role}
                        onChange={handleCreateUserChange}
                        fullWidth
                        margin="normal"
                    >
                        <MenuItem value="nutricionista">Nutricionista</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="logistica">Logística</MenuItem>
                    </TextField>
                    <Box mt={2} display="flex" justifyContent="space-between">
                        <Button onClick={closeModal} sx={{ marginRight: 2, color: '#2E8B57', '&:hover': { backgroundColor: '#f5f5f5' } }}>
                            Cancelar
                        </Button>
                        <Box>
                            <Button onClick={handleEditUser} variant="contained" sx={{ backgroundColor: '#2E8B57', color: 'white', '&:hover': { backgroundColor: '#1A5230' } }}>
                                Editar
                            </Button>
                            <Button onClick={handleDeleteUser} variant="contained" color="error" sx={{ marginLeft: 2 }}>
                                Eliminar
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};

export default Usuarios;
