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
  const [selectedSucursal, setSelectedSucursal] = useState(null); // Estado para la sucursal seleccionada
  const [filterSemana, setFilterSemana] = useState('');
  const [filterAño, setFilterAño] = useState('2025');
  const [allWeeks, setAllWeeks] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [minutasAgrupadas, setMinutasAgrupadas] = useState({});
  const [sucursalesDict, setSucursalesDict] = useState({}); // Diccionario de sucursales
  const tablaMinutaRef = useRef(null);
  const token = localStorage.getItem('token');
  const BACKEND_URL = process.env.REACT_APP_BACK_URL;

  // Obtener el diccionario de sucursales
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}sucursal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dict = {};
        response.data.forEach((sucursal) => {
          dict[sucursal._id] = sucursal.nombresucursal; // Mapear ID a nombre
        });
        setSucursalesDict(dict);
      } catch (error) {
        console.error("Error al obtener sucursales:", error);
      }
    };
    fetchSucursales();
  }, [token]);

  // Obtener las minutas
  useEffect(() => {
    const fetchMinutas = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}menudiario`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Agrupar minutas por semana, año y sucursal
        const groupedMinutas = groupBySemanaAñoYSucursal(response.data.filter((menu) => menu.aprobado === true));
        setMinutasAgrupadas(groupedMinutas);

        // Obtener las semanas únicas con su respectiva sucursal
        const semanasUnicas = Object.keys(groupedMinutas).map(key => {
          const [año, semana, sucursalId] = key.split('-');
          return { semana: Number(semana), año: Number(año), sucursalId };
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
  }, [token]);

  // Función para agrupar las minutas por semana, año y sucursal
  const groupBySemanaAñoYSucursal = (data) => {
    return data.reduce((acc, minuta) => {
      const semana = minuta.semana;
      const año = minuta.year;
      const sucursalId = minuta.id_sucursal; // Usar el ID de la sucursal
      const key = `${año}-${semana}-${sucursalId}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(minuta);
      return acc;
    }, {});
  };

  const handleSemanaClick = (semana, año, sucursalId) => {
    setSelectedSemana(semana);
    setSelectedAño(año);
    setSelectedSucursal(sucursalId); // Guardar la sucursal seleccionada
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
              {filteredWeeks.map((semana) => {
                const sucursalNombre = sucursalesDict[semana.sucursalId] || 'Sin Sucursal'; // Obtener nombre de la sucursal
                return (
                  <button
                    key={`${semana.año}-${semana.semana}-${semana.sucursalId}`}
                    onClick={() => handleSemanaClick(semana.semana, semana.año, semana.sucursalId)}
                    className="week-button"
                  >
                    Semana {semana.semana} - {sucursalNombre} - {semana.año}
                  </button>
                );
              })}
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
                _id: { semana: selectedSemana, año: selectedAño, sucursalId: selectedSucursal },
                menus: formatMinutasForTable(
                  minutasAgrupadas[`${selectedAño}-${selectedSemana}-${selectedSucursal}`]
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