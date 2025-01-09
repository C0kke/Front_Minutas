import React, { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import './CrearMinuta.css';
import Header from '../components/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const encabezados = [
  "", 
  "LUNES 06 de enero",
  "MARTES 07 de enero",
  "MIERCOLES 08 de enero",
  "JUEVES 09 de enero",
  "VIERNES 10 de enero",
];

const filas = [
  "PROTEINA 1",
  "PROTEINA 2",
  "PROTEINA 3",
  "VEGETARIANA",
  "VEGANA",
  "GUARNICION 1",
  "GUARNICION 2",
  "HIPOCALÓRICO",
  "ENSALADA 1",
  "ENSALADA 2",
  "ENSALADA 3",
  "SOPA DEL DÍA",
  "POSTRE",
];

const Minutas = () => {
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [data, setData] = useState({});

  useEffect(() => {
      const fetchPlatos = async () => {
          const token = localStorage.getItem('token')?.trim();

          if (!token) {
              console.error("Token no encontrado en localStorage. Redirigiendo al login.");
              setError(new Error("No autorizado. Inicie sesión."));
              setLoading(false);
              navigate("/"); // Redirección al login
              return; // Importante: detener la ejecución de fetchPlatos
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
                  navigate("/"); // Redirección al login en caso de token inválido
              } else if (error.response) {
                setError(new Error(`Error del servidor: ${error.response.status} - ${error.response.data.message || 'Detalles no disponibles'}`));
              } else if (error.request) {
                setError(new Error("No se recibió respuesta del servidor."));
              } else {
                setError(new Error("Error al configurar la solicitud."));
              }
          } finally {
              setLoading(false);
          }
      };

      fetchPlatos();
  }, [navigate]);

  const handleAutocompleteChange = (event, value, row, col) => {
    setData(prevData => ({
        ...prevData,
        [col]: {
            ...prevData[col],
            [row]: value ? value._id : null,
        },
    }));
  };

  return (
      <div>
          <Header />
          <TableContainer component={Paper} className="Minuta">
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                      <TableRow>
                          {encabezados.map((encabezado) => (
                              <TableCell key={encabezado} align="center">{encabezado}</TableCell>
                          ))}
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {filas.map((fila) => (
                          <TableRow key={fila} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell component="th" scope="row" align="center">{fila}</TableCell>
                              {encabezados.slice(1).map((encabezado) => (
                                  <TableCell key={encabezado} align="center">
                                      <Autocomplete
                                          disablePortal
                                          id={`${encabezado}-${fila}`}
                                          options={platos}
                                          getOptionLabel={(option) => option.nombre} 
                                          value={platos.find(p => p._id === data[encabezado]?.[fila]) || null}
                                          onChange={(event, newValue) => handleAutocompleteChange(event, newValue, fila, encabezado)}
                                          sx={{ width: 300 }}
                                          renderInput={(params) => <TextField {...params} label="Seleccionar plato" size="small" />}
                                      />
                                  </TableCell>
                              ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </TableContainer>
      </div>
  );
}

export default Minutas;