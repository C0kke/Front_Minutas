import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
    const [auth, setAuth] = useState({ username: '', password: '' });
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState(''); // Estado para el mensaje de error
    const BACKEND_URL = process.env.REACT_APP_BACK_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación de la contraseña
        const passwordRegex = /^(?=.*\d).{6,}$/; // Al menos 6 caracteres y un número
        if (!passwordRegex.test(auth.password)) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres y un número.');
            return;
        }

        setLoading(true);
        try {
            const resp = await axios.post(`${BACKEND_URL}auth/signin`, {
                username: auth.username.trim(),
                password: auth.password,
            });
            const { access_token } = resp.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('id_user', resp.data.id);
            if (access_token) {
                localStorage.setItem('session', 'exito');
                window.location.replace('/home');
            } else {
                console.log("Usuario no existe");
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                alert('Usuario o contraseña incorrectos');
            } else {
                console.error('Error en el login:', error);
                alert('Ocurrió un error. Por favor, inténtalo de nuevo más tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAuth({
            ...auth,
            [name]: value,
        });

        // Limpiar el mensaje de error si el usuario corrige la contraseña
        if (name === 'password') {
            const passwordRegex = /^(?=.*\d).{6,}$/;
            if (passwordRegex.test(value)) {
                setPasswordError('');
            }
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!isPasswordVisible);
    };

    if (localStorage.getItem('error')) {
        localStorage.removeItem('error');
        setTimeout(() => {
            alert('Error en la sesión, ingresa nuevamente');
        }, 150);
    }

    if (localStorage.getItem('logout')) {
        localStorage.removeItem('logout');
        setTimeout(() => {
            alert('Has cerrado sesión');
        }, 250);
    }

    return (
        <div>
            <header>
                <img src="/LOGO_GM_EXPRESS.png" className="app-logo" alt="logo" />
            </header>
            <div className="ActualBody">
                <div className="Login">
                    <h2>Iniciar Sesión</h2>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <input
                                type="text"
                                name="username"
                                value={auth.username}
                                onChange={handleChange}
                                placeholder="Nombre de Usuario: "
                            />
                        </div>
                        <div className="password-container">
                            <input
                                type={isPasswordVisible ? 'text' : 'password'}
                                name="password"
                                value={auth.password}
                                onChange={handleChange}
                                placeholder="Contraseña: "
                            />
                            <span onClick={togglePasswordVisibility} className="password-toggle">
                                {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                            </span>
                        </div>
                        {passwordError && (
                            <p className="error-message">{passwordError}</p>
                        )}
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Cargando...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;