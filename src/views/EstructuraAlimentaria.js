import React, { useState, useEffect } from 'react';
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  Button,
  Modal,
  Typography,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Header from '../components/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const filas = ["FONDO 1", "GUARNICIÓN 1", "FONDO 2", "GUARNICIÓN 2"];
const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];

const Estructura = () => {
  const [estructuras, setEstructuras] = useState({});
  const [temporada, setTemporada] = useState('VERANO');
  const [semanas, setSemanas] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [editedData, setEditedData] = useState({}); // Estado para almacenar los datos editados
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const groupDataByWeekAndDay = (data) => {
    return data.reduce((acc, item) => {
      if (!acc[item.semana]) acc[item.semana] = {};
      if (!acc[item.semana][item.dia]) acc[item.semana][item.dia] = {};
      if (!acc[item.semana][item.dia][item.categoria]) acc[item.semana][item.dia][item.categoria] = [];
      acc[item.semana][item.dia][item.categoria].push({
        _id: item._id,
        familia: item.familia || "",
        corteqlo: item.corteqlo || "",
      });
      return acc;
    }, {});
  };

  useEffect(() => {
    const fetchEstructuras = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/estructura', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const groupedData = groupDataByWeekAndDay(response.data);
        setEstructuras(groupedData);
        setSemanas(Object.keys(groupedData));
      } catch (error) {
        console.error("Error al obtener estructuras:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.setItem('error', 'error de sesion');
          navigate("/login");
        } else {
          console.error("Error del servidor:", error);
        }
      }
    };
    fetchEstructuras();
  }, [navigate]);

  const handleTemporadaChange = (event) => {
    setTemporada(event.target.value);
  };

  const getValueForAutocomplete = (fila, dia, semana) => {
    return estructuras[semana]?.[dia]?.[fila] || [];
  };

  const handleEditWeek = (semana) => {
    setSelectedWeek(semana);
    setEditedData(estructuras[semana] || {});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedWeek(null);
  };

  const handleSaveChanges = async () => {
    try {
      const updates = [];
      Object.entries(editedData).forEach(([dia, categorias]) => {
        Object.entries(categorias).forEach(([categoria, registros]) => {
          registros.forEach(({ _id, familia, corteqlo }) => {
            updates.push({
              dia,
              semana: selectedWeek,
              categoria,
              familia,
              corteqlo,
            });
          });
        });
      });
  
      await axios.put(
        `http://localhost:3000/api/v1/estructura/semana/${selectedWeek}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setEstructuras((prev) => ({ ...prev, [selectedWeek]: editedData }));
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  const handleAddEntry = (dia, fila) => {
    setEditedData((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [fila]: [...(prev[dia]?.[fila] || []), { _id: null, familia: "", corteqlo: "" }],
      },
    }));
  };

  const handleRemoveEntry = (dia, fila, index) => {
    setEditedData((prev) => {
      const updatedEntries = [...(prev[dia]?.[fila] || [])];
      updatedEntries.splice(index, 1);
      return {
        ...prev,
        [dia]: {
          ...prev[dia],
          [fila]: updatedEntries,
        },
      };
    });
  };

  const handleCellChange = (dia, fila, index, field, value) => {
    setEditedData((prev) => {
      const updatedEntries = [...(prev[dia]?.[fila] || [])];
      updatedEntries[index] = { ...updatedEntries[index], [field]: value };
      return {
        ...prev,
        [dia]: {
          ...prev[dia],
          [fila]: updatedEntries,
        },
      };
    });
  };

  return (
    <Box>
      <Header />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'white',
          padding: 2,
          borderRadius: '25px',
          my: '2rem',
          width: '100%',
          minWidth: '80%',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Renderizar una tabla por semana */}
        {semanas.map((semana) => (
          <Box key={semana} sx={{ marginTop: 4, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}> 
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ml: 10 }}>
              <h2 style={{ color: "#1C2D58" }}>SEMANA {semana}</h2>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleEditWeek(semana)}
              >
                Editar
              </Button>
            </Box>

            {/* Tabla de la semana */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#1C2D58", color: "white", fontWeight: "bold", textAlign: "center" }}>CATEGORÍA</TableCell>
                    {dias.map((dia) => (
                      <TableCell key={dia} sx={{ backgroundColor: "#1C2D58", color: "white", fontWeight: "bold", textAlign: "center" }}>
                        {dia}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filas.map((fila) => (
                    <TableRow key={fila}>
                      <TableCell sx={{ backgroundColor: "#1C2D58", color: "white", textAlign: "center" }}>{fila}</TableCell>
                      {dias.map((dia) => (
                        <TableCell key={`${fila}-${dia}`} sx={{ width: '20%', wordBreak: 'break-word', textAlign: "center" }}>
                          {getValueForAutocomplete(fila, dia, semana)
                            .map(({ familia, corteqlo }, index) => (
                              <div key={index}>
                                {familia} {corteqlo && `(${corteqlo})`}
                              </div>
                            ))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        {/* Modal para editar la semana */}
        <Modal open={openModal} onClose={handleCloseModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 8000,
              bgcolor: 'background.paper',
              border: '2px solid #000',
              boxShadow: 24,
              p: 4,
              overflowY: 'auto', 
              maxHeight: '90vh',
            }}
          >
            <Typography variant="h6" component="h2" mx={'50rem'} textAlign={'center'}>
              Editar SEMANA {selectedWeek}
            </Typography>

            {/* Tabla editable en el modal */}
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#1C2D58", color: "white", fontWeight: "bold", textAlign: "center" }}>CATEGORÍA</TableCell>
                    {dias.map((dia) => (
                      <TableCell key={dia} sx={{ backgroundColor: "#1C2D58", color: "white", textAlign: "center"}}>
                        {dia}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filas.map((fila) => (
                    <TableRow key={fila}>
                      <TableCell sx={{ backgroundColor: "#1C2D58", color: "white", fontWeight: "bold", textAlign: "center"}}>{fila}</TableCell>
                      {dias.map((dia) => (
                        <TableCell key={`${fila}-${dia}`} sx={{ padding: 0 }}>
                          <Grid container spacing={2} direction="column" mb={2} ml={1}>
                            {(editedData[dia]?.[fila] || []).map((entry, index) => (
                              <Grid item key={index} xs={8}>
                                <Grid container spacing={2} alignItems="center" marginTop={1}>
                                  <Grid item xs={4.5}>
                                    <TextField
                                      label="Familia"
                                      value={entry.familia}
                                      onChange={(e) => handleCellChange(dia, fila, index, "familia", e.target.value)}
                                    />
                                  </Grid>
                                  <Grid item xs={4.5}>
                                    <TextField
                                      label="Tipo de corte"
                                      value={entry.corteqlo}
                                      onChange={(e) => handleCellChange(dia, fila, index, "corteqlo", e.target.value)}
                                    />
                                  </Grid>
                                  <Grid item>
                                    <IconButton onClick={() => handleRemoveEntry(dia, fila, index)}>
                                      <DeleteIcon />
                                    </IconButton>
                                  </Grid>
                                </Grid>
                              </Grid>
                            ))}
                            <Grid item xs={8} alignSelf={'end'} mr={5}>
                              <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => handleAddEntry(dia, fila)}
                              >
                                Añadir
                              </Button>
                            </Grid>
                          </Grid>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleCloseModal} sx={{ mr: 2 }}>
                Cancelar
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveChanges}>
                Guardar
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default Estructura;