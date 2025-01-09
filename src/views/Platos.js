import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from "../components/Header";
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

Modal.setAppElement('#root');

const Platos = () => {
    const [platos, setPlatos] = useState([]);
    const [selectedPlato, setSelectedPlato] = useState(null);
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
                const platosFiltrados = response.data.filter(plato => !plato.descontinuado);
                setPlatos(platosFiltrados);
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
    }, [navigate]); // Añade navigate como dependencia  
    
    const openModal = async (plato) => {
        setSelectedPlato(plato);
        setModalIsOpen(true);
        setIngredientes([]);
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token')?.trim();
        if (!token) {
            console.error("Token no encontrado en localStorage. Redirigiendo al login.");
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
                console.error("Token inválido o expirado. Redirigiendo al login.");
                localStorage.removeItem('token');
                navigate("/"); // Redirige al login si el token es inválido
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setModalIsOpen(false);
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
            <div className="ListaPLatos">
                {platos.map((plato) => (
                    <div key={plato._id} onClick={() => openModal(plato)} style={{ cursor: 'pointer', border: '1px solid black', margin: '5px', padding: '10px' }}>
                        {plato.nombre}
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
                        <button onClick={closeModal}>Cerrar</button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Platos;