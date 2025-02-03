import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './styles/Aprobar.css';
import { Box, Alert, Button, Modal, TextField } from '@mui/material';
import Header from '../components/Header';
import TablaMinutaAprobacion from '../components/TablaMinuta';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const MenuSemanalAprobacion = () => {
  const [menusPendientes, setMenusPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ setSelectedMenu] = useState(null);  
  const [selectedSemana, setSelectedSemana] = useState(null);
  const [error, setError] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const tableRef = useRef(null);
  const [actualizado, setActualizado] = useState(false)
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
        setMenusPendientes(response.data);
      } catch (error) {
        console.error('Error al cargar los menús pendientes:', error);
        setError('Hubo un error al cargar los menús.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenusPendientes();
  }, [actualizado,token]);

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
        alert(`Minuta de la semana ${selectedSemana._id.semana} aprobado exitosamente`);
       
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

  const handleMensaje = () => {
    setOpenModal(true);
  };

  const handleEnviarMensaje = async () => {
    if (selectedSemana) {
      try {
        await axios.patch(`http://localhost:3000/api/v1/menudiario/${selectedSemana.menus[0]._id}/mensaje`, 
          { mensaje },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Mensaje enviado exitosamente');
        setOpenModal(false);
        setSelectedSemana(null)
        setMensaje('');
        setActualizado(true)
      } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        setError('Hubo un error al enviar el mensaje.');
      }
    }
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
                  <Box className="item">
                    <Button 
                      onClick={() => handleSemanaClick(semana)} 
                      className='semanaContainer'
                      sx={{
                        width: '15rem',
                        height: '3rem',
                        color: 'white',
                        my: '2px',
                        borderRadius: '25px',
                        backgroundColor: semana.menus[0]?.mensaje !== "sin mensaje" ? '#FB8C00' : '#008000',
                        '&:hover': {
                          backgroundColor: semana.menus[0]?.mensaje !== "sin mensaje" ? '#FB8C00' : '#008000',
                        },
                      }}  
                      >
                      Semana {semana._id.semana} - {semana._id.año}
                    </Button>
                    <p>
                      {semana.menus[0]?.mensaje !== 'sin mensaje'? (
                        "Esperando edición"
                      ) : ""}
                    </p>
                  </Box>
                  {selectedSemana && selectedSemana._id.semana === semana._id.semana && (
                      <>
                        <TablaMinutaAprobacion semana={selectedSemana} tableRef={tableRef} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button 
                        className='buttons'
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

                        <Button 
                          className='buttons'
                          onClick={() => handleMensaje()}
                          sx={{
                            mt: 2,
                            backgroundColor: 'FF9800', // Color naranja
                            color: 'white',
                            '&:hover': {
                              backgroundColor: '#FB8C00', // Más oscuro al pasar el mouse
                            },
                          }}
                        >
                          Feedback Rechazo
                        </Button>
                      </div>
                     
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <h2 style={{ color: 'black' }}>Enviar Feedback de Rechazo de minuta </h2>
          <TextField
            fullWidth
            label="Mensaje de Rechazo"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            multiline
            rows={4}
            sx={{ mt: 2 ,
              color:"black"
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              sx={{ mr: 2 }}
              onClick={() => setOpenModal(false)}
              color="secondary"
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarMensaje}
              sx={{
                backgroundColor: '#FF9800',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#FB8C00',
                },
              }}
            >
              Enviar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default MenuSemanalAprobacion;
