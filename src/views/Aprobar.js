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
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedSemanaSucursal, setSelectedSemanaSucursal] = useState(null);
  const [sucursalesDict, setSucursalesDict] = useState({});

  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const tableRef = useRef(null);
  const [actualizado, setActualizado] = useState(false);
  const token = localStorage.getItem('token')?.trim();
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACK_URL;

  useEffect(() => {
    const fetchMenusPendientes = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}menudiario/verificar/no-aprobados`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
  }, [actualizado, token]);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}sucursal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dict = {};
        response.data.forEach((sucursal) => {
          dict[sucursal._id] = sucursal.nombresucursal;
        });
        setSucursalesDict(dict);
      } catch (error) {
        console.error("Error al obtener sucursales:", error);
      }
    };
    fetchSucursales();
  }, [token]);

  const agruparPorSemanaYSucursal = (menus) => {
  const menusPorSemanaYSucursal = {};
  menus.forEach((menu) => {
    const semana = moment(menu.fecha).week();
    const año = moment(menu.fecha).year();
    const sucursal = sucursalesDict[menu.id_sucursal._id] || '';
    const key = `${año}-${semana}-${sucursal}`;
    if (!menusPorSemanaYSucursal[key]) {
      menusPorSemanaYSucursal[key] = [];
    }
    menusPorSemanaYSucursal[key].push(menu);
  });

  // Verificación temporal
  console.log('Menus agrupados:', menusPorSemanaYSucursal);

  return Object.entries(menusPorSemanaYSucursal).map(([key, menus]) => {
    const [año, semana, sucursal] = key.split('-');
    return {
      _id: { año: parseInt(año), semana: parseInt(semana), sucursal },
      menus,
    };
  });
};

  const handleAprobar = async () => {
    if (selectedSemanaSucursal) {
      try {
        setLoadingBtn(true);
        await Promise.all(
          selectedSemanaSucursal.menus.map(async (menu) => {
            await axios.patch(
              `${BACKEND_URL}menudiario/Verificar/aprobado/${menu._id}`,
              { aprobado: true },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          })
        );
        setMenusPendientes((prevState) =>
          prevState.map((menu) =>
            selectedSemanaSucursal.menus.some((m) => m._id === menu._id)
              ? { ...menu, aprobado: true }
              : menu
          )
        );
        alert(`Minuta de la semana ${selectedSemanaSucursal._id.semana} - ${selectedSemanaSucursal._id.sucursal} aprobada exitosamente`);
        setSelectedMenu(null);
        setSelectedSemanaSucursal(null);
        setError(null);
        navigate('/home');
      } catch (error) {
        console.error('Error al aprobar el menú:', error);
        setError('Hubo un error al aprobar el menú.');
      } finally {
        setLoadingBtn(false);
      }
    }
  };

  const handleSemanaSucursalClick = (semanaSucursal) => {
    if (
      selectedSemanaSucursal &&
      selectedSemanaSucursal._id.semana === semanaSucursal._id.semana &&
      selectedSemanaSucursal._id.sucursal === semanaSucursal._id.sucursal
    ) {
      // Si ya está seleccionada, deseleccionar
      setSelectedSemanaSucursal(null);
    } else {
      // Seleccionar nueva semana y sucursal
      setSelectedSemanaSucursal(semanaSucursal);
    }
  };

  const handleMensaje = () => {
    setOpenModal(true);
  };

  const handleEnviarMensaje = async () => {
    if (selectedSemanaSucursal) {
      try {
        setLoadingBtn(true);
        await axios.patch(
          `${BACKEND_URL}menudiario/${selectedSemanaSucursal.menus[0]._id}/mensaje`,
          { mensaje },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Mensaje enviado exitosamente');
        setOpenModal(false);
        setSelectedSemanaSucursal(null);
        setMensaje('');
        setActualizado(true);
      } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        setError('Hubo un error al enviar el mensaje.');
      } finally {
        setLoadingBtn(false);
      }
    }
  };

  if (loading) {
    return <div>Cargando menús...</div>;
  }

  const menusAgrupados = agruparPorSemanaYSucursal(menusPendientes);

  return (
    <Box>
      <Header />
      <div className="menu-pendiente">
      <h1 className="title" style={{ color: '#008000' }}>Menús Pendientes de Aprobación</h1>
      {error && <Alert severity="error">{error}</Alert>}
        {menusPendientes.length === 0 ? (
          <p>No hay menús pendientes de aprobación.</p>
        ) : (
          <div>
            <ul>
              {menusAgrupados.map((semanaSucursal) => (
                <li style={{justifyContent: "center"}} key={`${semanaSucursal._id.año}-${semanaSucursal._id.semana}-${semanaSucursal._id.nombreSucursal}`}>
                  <Box className="item">
                    <Button
                      onClick={() => handleSemanaSucursalClick(semanaSucursal)}
                      className="semanaContainer"
                      sx={{
                        width: '15rem',
                        height: '3rem',
                        color: 'white',
                        my: '2px',
                        borderRadius: '25px',
                        backgroundColor:
                          semanaSucursal.menus[0]?.mensaje !== 'sin mensaje' ? '#FB8C00' : '#008000',
                        '&:hover': {
                          backgroundColor:
                            semanaSucursal.menus[0]?.mensaje !== 'sin mensaje' ? '#FB8C00' : '#008000',
                        },
                      }}
                    >
                      Semana {semanaSucursal._id.semana} - {semanaSucursal._id.sucursal}
                    </Button>
                    <p>
                      {semanaSucursal.menus[0]?.mensaje !== 'sin mensaje' ? 'Esperando edición' : ''}
                    </p>
                  </Box>
                  {selectedSemanaSucursal &&
                    selectedSemanaSucursal._id.semana === semanaSucursal._id.semana &&
                    selectedSemanaSucursal._id.sucursal === semanaSucursal._id.sucursal && (
                      <>
                        <TablaMinutaAprobacion semana={selectedSemanaSucursal} tableRef={tableRef} />
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 50,
                          }}
                        >
                          <Button
                            className="buttons"
                            onClick={() => handleAprobar()}
                            disabled={loadingBtn}
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
                            className="buttons"
                            onClick={() => handleMensaje()}
                            disabled={loadingBtn}
                            sx={{
                              mt: 2,
                              backgroundColor: '#FF9800', // Color naranja
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#FB8C00', // Más oscuro al pasar el mouse
                              },
                            }}
                          >
                            RECHAZAR MENÚ
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
          <h2 style={{ color: 'black' }}>Enviar Feedback de Rechazo de Minuta</h2>
          <TextField
            fullWidth
            label="Mensaje de Rechazo"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            multiline
            rows={4}
            sx={{ mt: 2, color: 'black' }}
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