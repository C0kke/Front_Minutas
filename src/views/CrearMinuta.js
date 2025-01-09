import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import './CrearMinuta.css'
import Header from '../components/Header';

// Datos de ejemplo para las cabeceras (puedes ajustarlas)
const encabezados = [
  "", // Celda vacía en la esquina superior izquierda
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
    const [data, setData] = React.useState({});

    const handleInputChange = (row, col, value) => {
      setData(prevData => ({
        ...prevData,
        [row]: {
          ...prevData[row],
          [col]: value,
        },
      }));
    };
  
    return (
        <div>
            <Header/>
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
                        {encabezados.slice(1).map((encabezado) => ( //Comenzar desde el segundo encabezado
                        <TableCell key={encabezado} align="center">
                            <TextField
                            id={`${fila}-${encabezado}`}
                            value={data[fila]?.[encabezado] || ""}
                            onChange={(e) => handleInputChange(fila, encabezado, e.target.value)}
                            variant="outlined"
                            size="small" // Puedes ajustar el tamaño
                            fullWidth
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