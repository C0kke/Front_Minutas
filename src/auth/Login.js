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
                    <h2>Login</h2>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Username:</label>
                            <input
                                type="text"
                                name="username"
                                value={auth.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Password:</label>
                            <input
                                type="password"
                                name="password"
                                value={auth.password}
                                onChange={handleChange}
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