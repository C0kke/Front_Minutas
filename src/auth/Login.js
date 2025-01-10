import React, { useState } from 'react';
import './Login.css';
import Header from '../components/Header';
import axios from 'axios';

function Login() {
    const [ auth, setAuth ] = useState({ username: '', password: ''})

    const handleSubmit = async (e) => {

        e.preventDefault();

        try{
            const resp = await axios.post(`http://localhost:3000/api/v1/auth/signin`, {
                username: auth.username,
                password: auth.password
            });
            const { access_token } = resp.data;
            localStorage.setItem('token', access_token);
            console.log(resp)
            localStorage.setItem('id_user', resp.data.id );
    
            if (access_token) {
                window.location.replace('/home');
                alert("Inicio de sesión exitoso");
            } else {
                console.log("Usuario no existe")
            }
        } catch (error){
            console.error('Error en el login:', error);
        }
    };

    const handleChange = (e) => {
        setAuth({
            ...auth,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div>
            <Header />
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
                                placeholder='Nombre de Usuario: '
                            />
                        </div>
                        <div>
   
                            <input
                                type="password"
                                name="password"
                                value={auth.password}
                                onChange={handleChange}
                                placeholder='Contraseña: '
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