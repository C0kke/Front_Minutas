import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './styles/menuhistorico.css';
import Header from '../components/Header';
import TablaMinutaAprobacion from '../components/TablaMinuta';

const MinutaLista = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSemana, setSelectedSemana] = useState(null);
  const [selectedAño, setSelectedAño] = useState(null);
  const [filterSemana, setFilterSemana] = useState('');
  const [filterAño, setFilterAño] = useState('2025');
  const [allWeeks, setAllWeeks] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [minutasAgrupadas, setMinutasAgrupadas] = useState({});
  const tablaMinutaRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMinutas = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/v1/menudiario', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const groupedMinutas = groupBySemanaYAño(response.data); 
        setMinutasAgrupadas(groupedMinutas);

        // Se obtienen las semanas de cada minuta una única vez
        const semanasUnicas = Object.keys(groupedMinutas).map(key => {
            const [año, semana] = key.split('-');
            return { semana: Number(semana), año: Number(año) };
          });
          setAllWeeks(semanasUnicas);
      } catch (error) {
        setError("Error al cargar las minutas");
        console.error('Error fetching minutas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinutas();
  }, []);

  const groupBySemanaYAño = (data) => {
    return data.reduce((acc, minuta) => {
      const semana = minuta.semana;
      const año = minuta.year;
      const key = `${año}-${semana}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(minuta);
      return acc;
    }, {});
  };

  const handleSemanaClick = (semana, año) => {
    if (selectedSemana == semana) {
      setMostrarTabla(!mostrarTabla);
    }
    
    setSelectedSemana(semana);
    setSelectedAño(año);
    setMostrarTabla(true);
  };

  // Filtrar por semana y año
  const filteredWeeks = filterSemana || filterAño
    ? allWeeks.filter((semana) => {
        const matchSemana =
          !filterSemana || semana.semana.toString().includes(filterSemana);
        const matchAño = !filterAño || semana.año.toString().includes(filterAño);
        return matchSemana && matchAño;
      })
    : [];

  const formatMinutasForTable = (minutas) => {
    if (!minutas) return [];

    return minutas.map((minuta) => ({
      ...minuta,
      listaplatos: minuta.listaplatos.map((item) => ({
        ...item,
        platoId: item.platoId._id,
      })),
    }));
  };

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
        <div className='filters-container'>
          <div className="filter-container">
            <h2>Selecciona un Año</h2>
            <input
              type="number"
              className="filter-input"
              placeholder="Filtrar por año..."
              value={filterAño}
              onChange={(e) => {
                setMostrarTabla(false)
                setFilterAño(e.target.value)}
              }
              min={2024}
              defaultValue={2024}
            />
          </div>
          <div className="filter-container">
            <h2>Selecciona una Semana</h2>
            <input
              type="number"
              className="filter-input"
              placeholder="Filtrar por semana..."
              value={filterSemana}
              onChange={(e) => {
                setMostrarTabla(false)
                setFilterSemana(e.target.value)}
              }
              min={1}
            />
          </div>
        </div>

        <div className="weeks-container">
          {(filterSemana && filterAño.length > 0) && (
            <div className="filtered-weeks">
              {filteredWeeks.map((semana) => (
                <button
                  key={`${semana.año}-${semana.semana}`}
                  onClick={() => handleSemanaClick(semana.semana, semana.año)}
                  className="week-button"
                >
                  Semana {semana.semana} - {semana.año}
                </button>
              ))}
            </div>
          )}

          {(!(filterSemana || filterAño || filteredWeeks)) && (
            <p>
              {filterSemana 
                ? "No hay semanas que coincidan con el filtro."
                : "Ingrese un filtro para ver las semanas."}  
            </p>
          )}
        </div>

        {selectedSemana && mostrarTabla && (
          <div className="tabla-minuta-container">
            <TablaMinutaAprobacion
              semana={{
                _id: { semana: selectedSemana, año: selectedAño },
                menus: formatMinutasForTable(
                  minutasAgrupadas[`${selectedAño}-${selectedSemana}`]
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