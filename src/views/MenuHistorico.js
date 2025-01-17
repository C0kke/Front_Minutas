import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/menuhistorico.css';
import Header from '../components/Header';
import { Navigate } from 'react-router-dom';

const MinutaLista = () => {
  const [minutas, setMinutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemana, setSelectedSemana] = useState(null);
  const [selectedMinuta, setSelectedMinuta] = useState(null); 
  const [filter, setFilter] = useState('');
  const [allWeeks, setAllWeeks] = useState([]);
  const token = localStorage.getItem('token');
  useEffect(() => {
    const fetchMinutas = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/menudiario', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const groupedMinutas = groupBySemana(response.data);
        setMinutas(groupedMinutas);

        const semanas = Object.keys(groupedMinutas);

        setAllWeeks(semanas);
      } catch (error) {
        setError("Error al cargar las minutas");
        console.error('Error fetching minutas:', error);
        localStorage.setItem('error', 'error en la sesion')
        window.location.replace('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchMinutas();
  }, []);

  const groupBySemana = (data) => {
    return data.reduce((acc, minuta) => {
      const semana = minuta.semana;
      if (!acc[semana]) {
        acc[semana] = [];
      }
      acc[semana].push(minuta);
      return acc;
    }, {});
  };

  const handleSemanaClick = (semana) => {
    setSelectedSemana(semana);
    setSelectedMinuta(null); 
  };
  
  const handleMinutaClick = (minuta) => {
    if (minuta.listaplatos && minuta.listaplatos.length > 0) {
      setSelectedMinuta(minuta);
    } else {
      setSelectedMinuta({
        ...minuta,
        listaplatos: [], 
      });
    }
  };

  const filteredWeeks = allWeeks.filter((semana) =>
    semana.includes(filter)
  );

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <Header/>
      <div className="minuta-lista-container">
        <div className="filter-container">
          <h2>Selecciona una Semana</h2>
          <input
            type="text"
            className="filter-input"
            placeholder="Filtrar por semana..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)} // Actualiza el filtro
          />
        </div>

        <div className="weeks-container">
          {/* Mostrar las semanas filtradas */}
          {filter && filteredWeeks.length > 0 ? (
            <div className="filtered-weeks">
              {filteredWeeks.map((semana) => (
                <button
                  key={semana}
                  onClick={() => handleSemanaClick(semana)}
                  className="week-button"
                >
                  Semana {semana}
                </button>
              ))}
            </div>
          ) : (
            <p>No hay semanas que coincidan con el filtro.</p>
          )}
        </div>

        {selectedSemana && (
          <div className="minuta-details">
            <h3>Minutas de la Semana {selectedSemana}</h3>
            <table className="Minuta">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {minutas[selectedSemana]?.map((minuta) => (
                  <tr
                    key={minuta._id}
                    onClick={() => handleMinutaClick(minuta)} // Al hacer clic en la fila, se selecciona la minuta
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{minuta.nombre}</td>
                    <td>{new Date(minuta.fecha).toLocaleDateString()}</td>
                    <td>{minuta.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

{selectedMinuta && (
  <div className="platos-lista">
    <h4>Platos de la Minuta: {selectedMinuta?.nombre}</h4>
    <ul>
      {selectedMinuta?.listaplatos?.length === 0 ? (
        <p>No hay platos disponibles para este día.</p>
      ) : (
        selectedMinuta?.listaplatos.map((plato, index) => (
          <li key={`${plato._id}-${index}`}> {/* Usa una clave única */}
            {plato.nombre} - {plato.descripcion}
          </li>
        ))
      )}
    </ul>
  </div>
)}
      </div>
    </div>
  );
};

export default MinutaLista;