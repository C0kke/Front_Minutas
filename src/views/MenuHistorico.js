import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './styles/menuhistorico.css';
import Header from '../components/Header';
import TablaMinutaAprobacion from '../components/TablaMinuta';

const MinutaLista = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSemana, setSelectedSemana] = useState(null);
  const [filter, setFilter] = useState('');
  const [allWeeks, setAllWeeks] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [minutasAgrupadas, setMinutasAgrupadas] = useState({}); // Estado para las minutas agrupadas
  const tablaMinutaRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMinutas = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/v1/menudiario', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const groupedMinutas = groupBySemana(response.data);
        setMinutasAgrupadas(groupedMinutas);
        setAllWeeks(Object.keys(groupedMinutas));
      } catch (error) {
        setError("Error al cargar las minutas");
        console.error('Error fetching minutas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinutas();
  }, []);

  const groupBySemana = (data) => {
    return data.reduce((acc, minuta) => {
      const semana = minuta.semana; 
      const año = minuta.year;
      const key = `${semana}-${año}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(minuta);
      return acc;
    }, {});
  };

  const handleSemanaClick = (semana) => {
    setSelectedSemana(semana);
    setMostrarTabla(true);
  };

  const filteredWeeks = allWeeks.filter((semana) =>
    semana.toString().includes(filter)
  );

  const obtenerAño = (minutas) => {
    if(minutas && minutas.length > 0) {
      return new Date(minutas[0].fecha).getFullYear()
    }
    return new Date().getFullYear();
  }

  const formatMinutasForTable = (minutas) => {
      if (!minutas) return [];

      return minutas.map(minuta => ({
          ...minuta,
          listaplatos: minuta.listaplatos.map(item => ({
            ...item,
            platoId: item.platoId._id
          }))
        }));
  }

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <Header />
      <div className="minuta-lista-container">
        <div className="filter-container">
          <h2>Selecciona una Semana</h2>
          <input
            type="text"
            className="filter-input"
            placeholder="Filtrar por semana..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="weeks-container">
          {/* Mostrar las semanas filtradas solo si hay filtro */}
          {filter && filteredWeeks.length > 0 && (
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
          )}

          {/* Mensaje cuando no hay filtro o no hay coincidencias */}
          {(!filter || filteredWeeks.length === 0) && (
            <p>
              {filter
                ? "No hay semanas que coincidan con el filtro."
                : "Ingrese un filtro para ver las semanas."}
            </p>
          )}
        </div>

        {/* Mostrar la tabla al seleccionar una semana */}
        {selectedSemana && mostrarTabla && (
          <div className="tabla-minuta-container">
            <TablaMinutaAprobacion
              semana={{
                _id: {
                  semana: selectedSemana,
                  año: obtenerAño(minutasAgrupadas[selectedSemana]),
                },
                menus: formatMinutasForTable(
                  minutasAgrupadas[selectedSemana]
                ),
              }}
              ref={tablaMinutaRef}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MinutaLista;