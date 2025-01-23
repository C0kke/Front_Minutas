import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './styles/Aprobar.css';
import { Box, Alert, Button } from '@mui/material';
import Header from '../components/Header';
import ExportToExcel from '../components/ExportToExcel';
import TablaMinutaAprobacion from '../components/TablaMinuta';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const MenuSemanalAprobacion = () => {
  const [menusPendientes, setMenusPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);  
  const [selectedSemana, setSelectedSemana] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMenu, setLoadingMenu] = useState(false); 
  const tableRef = useRef(null);

  const token = localStorage.getItem('token')?.trim();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenusPendientes = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/menudiario/verificar/no-aprobados', {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        console.log(response.data)
        setMenusPendientes(response.data);
      } catch (error) {
        console.error('Error al cargar los menús pendientes:', error);
        setError('Hubo un error al cargar los menús.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenusPendientes();
  }, []);

  const agruparPorSemana = (menus) => {
    const menusPorSemana = {};
    menus.forEach(menu => {
      const semana = moment(menu.fecha).week();
      const año = moment(menu.fecha).year();
      const key = `${año}-${semana}`;
      if (!menusPorSemana[key]) {
        menusPorSemana[key] = [];
      }
      menusPorSemana[key].push(menu);
    });
    return Object.entries(menusPorSemana).map(([key, menus]) => {
      const [año, semana] = key.split('-');
      return { _id: { año: parseInt(año), semana: parseInt(semana) }, menus };
    });
  };

  const handleMenuClick = async (menu) => {
    setLoadingMenu(true);
    setSelectedMenu(menu);
    setLoadingMenu(false);
  };

  const handleAprobar = async () => {
    if (selectedSemana) {
      try {
        await Promise.all(selectedSemana.menus.map(async (menu) => {
          await axios.patch(`http://localhost:3000/api/v1/menudiario/Verificar/aprobado/${menu._id}`, 
            { aprobado: true },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }));

        setMenusPendientes(prevState => prevState.map(menu => 
          selectedSemana.menus.some(m => m._id === menu._id) ? { ...menu, aprobado: true } : menu
        ));
        alert(`Minuta de la semana ${selectedSemana._id.semana} aprobado exitosamente`)
       
        setSelectedMenu(null);
        setSelectedSemana(null);
        setError(null);

        navigate('/home');
      } catch (error) {
        console.error('Error al aprobar el menú:', error);
        setError('Hubo un error al aprobar el menú.');
      }
    }
  };

  const handleSemanaClick = (semana) => {
    if(!selectedSemana) {
      setSelectedSemana(semana);
      return;
    }
    setSelectedSemana(null);
  };

  if (loading) {
    return <div>Cargando menús...</div>;
  }

  const menusAgrupados = agruparPorSemana(menusPendientes);

  return (
    <Box>
      <Header />
      <div className='menu-pendiente'>
        <h1>Menús Pendientes de Aprobación</h1>

        {error && <Alert severity="error">{error}</Alert>}

        {menusPendientes.length === 0 ? (
          <p>No hay menús pendientes de aprobación.</p>
        ) : (
          <div>
            <ul>
              {menusAgrupados.map(semana => (
                <li key={`${semana._id.año}-${semana._id.semana}`}>
                  <Button 
                    onClick={() => handleSemanaClick(semana)} 
                    className='semanaContainer'
                    sx={{
                      width: '15rem',
                      height: '3rem',
                      color: 'white',
                      backgroundColor: '#2e8b57',
                      borderRadius: '25px',
                    }}  
                  >
                    Semana {semana._id.semana} - {semana._id.año}
                  </Button>
                  {selectedSemana && selectedSemana._id.semana === semana._id.semana && (
                      <>
                          <TablaMinutaAprobacion semana={selectedSemana} tableRef={tableRef} />
                          <Button 
                          onClick={() => handleAprobar()}
                          sx={{
                              mt: 2,
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              '&:hover': {
                              backgroundColor: '#45a049',
                              },
                          }}
                          >
                          Aprobar Menú
                          </Button>
                      </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Box>
  );
};

export default MenuSemanalAprobacion;