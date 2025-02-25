import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Button, Modal, TextField, Typography, MenuItem, Alert } from "@mui/material";
import { Eye, EyeOff } from "lucide-react"; // Importar íconos de ojo
import Header from "../components/Header"; // Importar Header desde la ruta correcta

const BACKEND_URL = process.env.REACT_APP_BACK_URL; // Constante para la URL del backend

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalCrearIsOpen, setModalCrearIsOpen] = useState(false);
    const [error, setError] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: '' });
    const [originalUser, setOriginalUser] = useState(null); // Guardar el estado original del usuario
    const [passwordError, setPasswordError] = useState(""); // Mensaje de error para la contraseña
    const [isPasswordVisible, setPasswordVisible] = useState(false); // Estado para mostrar/ocultar la contraseña
    const [firstFocus, setFirstFocus] = useState(true); // Estado para controlar el primer foco en la contraseña

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('id_user');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}user`, {
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

    const closeModal = () => {
        setModalIsOpen(false);
        setPasswordError("");
        setPasswordVisible(false); // Resetear visibilidad de la contraseña
        setFirstFocus(true); // Reiniciar el estado del primer foco
    };

    const closeModalCrear = () => {
        setModalCrearIsOpen(false);
        setPasswordError("");
        setPasswordVisible(false); // Resetear visibilidad de la contraseña
        setFirstFocus(true); // Reiniciar el estado del primer foco
    };

    const openModal = (user) => {
        setNewUser(user);
        setOriginalUser({ ...user }); // Guardar el estado original del usuario
        setModalIsOpen(true);
    };

    const openModalCrear = () => {
        setNewUser({ name: '', username: '', email: '', password: '', role: '' });
        setModalCrearIsOpen(true);
    };

    const handleCreateUserChange = (event) => {
        const { name, value } = event.target;
        setNewUser((prevUser) => ({ ...prevUser, [name]: value }));

        // Validar la contraseña mientras se escribe
        if (name === "password") {
            validatePassword(value);
        }
    };

    const validatePassword = (password) => {
        if (password.length < 6 || !/\d/.test(password)) {
            setPasswordError("La contraseña debe tener al menos 6 caracteres y 1 número.");
        } else {
            setPasswordError("");
        }
    };

    const handlePasswordFocus = () => {
        if (firstFocus) {
            setNewUser((prevUser) => ({ ...prevUser, password: "" })); // Borrar la contraseña solo la primera vez
            setFirstFocus(false); // Desactivar el borrado automático después del primer foco
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!isPasswordVisible); // Alternar visibilidad de la contraseña
    };

    const hasChanges = () => {
        return JSON.stringify(newUser) !== JSON.stringify(originalUser);
    };

    const handleCreateUser = async () => {
        if (passwordError) {
            alert("La contraseña no cumple con los requisitos.");
            return;
        }

        try {
            const response = await axios.post(`${BACKEND_URL}user`, newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios((prevUsuarios) => [...prevUsuarios, response.data]);
            alert("Usuario Creado con éxito");
            closeModalCrear();
        } catch (error) {
            console.error("Error al crear usuario:", error);

            if (error.response?.status === 400) {
                alert("TIENES QUE LLENAR TODOS LOS CAMPOS");
                return;
            }

            if (error.response?.data?.error?.errorResponse?.errmsg) {
                const errorMessage = error.response.data.error.errorResponse.errmsg;

                if (errorMessage.includes('username')) {
                    alert("El nombre de usuario ya está en uso.");
                } else if (errorMessage.includes('email')) {
                    alert("El correo electrónico ya está en uso.");
                } else {
                    alert("No se pudo crear el usuario debido a un error desconocido.");
                }
            } else {
                alert("No se pudo crear el usuario.");
            }
        }
    };

    const handleEditUser = async () => {
        if (!hasChanges()) {
            alert("No hay cambios para guardar.");
            return;
        }

        if (passwordError) {
            alert("La contraseña no cumple con los requisitos.");
            return;
        }

        const confirmed = window.confirm("¿Está seguro de que desea editar este usuario?");
        if (confirmed) {
            try {
                const response = await axios.put(`${BACKEND_URL}user/${newUser._id}`, newUser, {
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
        if (newUser._id === userId) {
            alert("No puedes eliminar el usuario actual");
            return;
        }

        const confirmedFirst = window.confirm("¡Este proceso es irreversible! ¿Está seguro que quiere eliminar al usuario?");
        if (confirmedFirst) {
            const confirmedSecond = window.confirm("Este es el segundo paso de la confirmación. ¿Seguro que desea continuar?");
            if (confirmedSecond) {
                const confirmedThird = window.confirm("¡Última confirmación! ¿Realmente desea eliminar este usuario?");
                if (confirmedThird) {
                    try {
                        await axios.delete(`${BACKEND_URL}user/${newUser._id}`, {
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

            <Button
                onClick={openModalCrear}
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
                    <Box position="relative">
                        <TextField
                            label="Contraseña"
                            name="password"
                            type={isPasswordVisible ? "text" : "password"}
                            value={newUser.password}
                            onChange={handleCreateUserChange}
                            fullWidth
                            margin="normal"
                        />
                        <span
                            onClick={togglePasswordVisibility}
                            style={{
                                position: "absolute",
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#2E8B57", // Color verde para el ícono de ojo
                            }}
                        >
                            {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </Box>
                    {passwordError && (
                        <Alert severity="error">{passwordError}</Alert>
                    )}
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
                            <Button
                                onClick={handleCreateUser}
                                variant="contained"
                                disabled={!!passwordError}
                                sx={{ backgroundColor: '#2E8B57', color: 'white', '&:hover': { backgroundColor: '#1A5230' } }}
                            >
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
                    <Box position="relative">
                        <TextField
                            label="Contraseña"
                            name="password"
                            type={isPasswordVisible ? "text" : "password"}
                            value={newUser.password}
                            onChange={handleCreateUserChange}
                            onFocus={handlePasswordFocus} // Borrar solo la primera vez
                            fullWidth
                            margin="normal"
                        />
                        {!firstFocus ?
                            <span
                                onClick={togglePasswordVisibility}
                                style={{
                                    position: "absolute",
                                    right: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    cursor: "pointer",
                                    color: "#2E8B57", // Color verde para el ícono de ojo
                                }}
                            >
                                {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                            </span>
                        : 
                            <p></p>
                        }
                    </Box>
                    {passwordError && (
                        <Alert severity="error">{passwordError}</Alert>
                    )}
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
                            <Button
                                onClick={handleEditUser}
                                variant="contained"
                                disabled={!hasChanges() || !!passwordError}
                                sx={{ backgroundColor: '#2E8B57', color: 'white', '&:hover': { backgroundColor: '#1A5230' } }}
                            >
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