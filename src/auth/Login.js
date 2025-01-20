import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';

function Login() {
    const [auth, setAuth] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const resp = await axios.post(`http://localhost:3000/api/v1/auth/signin`, {
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
        }
    };

    const handleChange = (e) => {
        setAuth({
            ...auth,
            [e.target.name]: e.target.value,
        });
    };

    if (localStorage.getItem('error')) {
        localStorage.removeItem('error');
        setTimeout(function () {
            alert('Error en la sesión, ingresa nuevamente');
        }, 500);
    }

    if (localStorage.getItem('logout')) {
        localStorage.removeItem('logout');
        setTimeout(function () {
            alert('Has cerrado sesión');
        }, 500);
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
                        <div>
                            <input
                                type="password"
                                name="password"
                                value={auth.password}
                                onChange={handleChange}
                                placeholder="Contraseña: "
                            />
                        </div>
                        <button type="submit">Login</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
