import React, { useState, useEffect } from 'react';
import { Box, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, Autocomplete, Button, Select, MenuItem } from '@mui/material';
import Header from '../components/Header';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const encabezados = [
    "",
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
];

const filas = ["FONDO 1", "FONDO 2", "GUARNICION 1", "GUARNICION 2"];

const Estructura = () => {
    const [estructuras, setEstructuras] = useState([]);
    const [temporada, setTemporada] = useState('VERANO');
    const [semanas, setSemanas] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/api/v1/estructura')
            .then(response => response.json())
            .then(data => {
                setEstructuras(data);
                setSemanas(Array.from({ length: Math.min(6, data.length) }, (_, i) => i + 1));
            })
            .catch(error => console.error('Error fetching estructuras:', error));
    }, []);

    const handleTemporadaChange = (event) => {
        setTemporada(event.target.value);
    };

    const getValueForAutocomplete = (fila, encabezado, semana) => {
        // Implementar la lógica para obtener el valor actual del autocomplete
        return null;
    };

    const handleAutocompleteChange = (event, newValue, fila, encabezado, semana) => {
        // Implementar la lógica para manejar cambios en el autocomplete
    };

    return (
        <Box>
            <Header />
            <Grid container justifyContent="center" style={{ flexGrow: 1 }}>
                <Grid item xs={12} md={11}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        bgcolor: 'white',
                        padding: 2,
                        borderRadius: '25px',
                        my: '2rem',
                        width: '100%',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 3,
                                height: '5rem',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 2,
                                mb: 2,
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                width: '100rem',
                            }}
                        >
                            <Select
                                value={temporada}
                                onChange={handleTemporadaChange}
                                sx={{ width: '9rem' }}
                            >
                                <MenuItem value='INVIERNO'>Invierno</MenuItem>
                                <MenuItem value='VERANO'>Verano</MenuItem>
                            </Select>
                            <Button
                                variant="contained"
                                sx={{
                                    height: '3rem',
                                    borderRadius: '4px', 
                                    px: 3, 
                                    fontSize: '1rem',
                                }}
                                onClick={() => console.log('Editar Estructura Alimentaria')}
                            >
                                Editar Estructura Alimentaria
                            </Button>
                        </Box>
                        <TableContainer component={Paper} sx={{ width: '100%', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto', maxHeight: '500px' }}>
                            <Table sx={{ width: '100%', fontFamily: 'Roboto, sans-serif', margin: '0 auto', border: '1px solid rgb(4, 109, 0)', minWidth: '1000px' }} aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell key="empty-cell" sx={{ backgroundColor: '#2E8B57', width: '15%' }}></TableCell>
                                        {encabezados.slice(1).map((day) => (
                                            <TableCell
                                                key={day.toString()}
                                                align="center"
                                                sx={{
                                                    width: '17%',
                                                    backgroundColor: '#2E8B57',
                                                    color: 'white',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 'bold',
                                                    letterSpacing: '1.5px',
                                                    padding: '20px 15px',
                                                }}
                                            >
                                                {day}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filas.map((fila) => (
                                        semanas.map((semana) => (
                                            <TableRow
                                                key={`${fila}-${semana}`}
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                                }}
                                            >
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                    align="center"
                                                    sx={{
                                                        width: '15%',
                                                        minWidth: '150px',
                                                        p: 1.5,
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: '#2E8B57',
                                                        color: 'white'
                                                    }}
                                                >
                                                    {`${fila} - SEMANA ${semana}`}
                                                </TableCell>
                                                {encabezados.slice(1).map((encabezado, index) => (
                                                    <TableCell key={`${encabezado}-${fila}-${semana}`} align="center" sx={{ p: 1.5, fontSize: '12px', wordBreak: 'break-word' }}>
                                                        <Autocomplete
                                                            disablePortal
                                                            id={`${encabezado}-${fila}-${semana}`}
                                                            options={['Option 1', 'Option 2']} // Replace with actual options
                                                            getOptionLabel={(option) => option}
                                                            value={getValueForAutocomplete(fila, encabezado, semana)}
                                                            onChange={(event, newValue) => handleAutocompleteChange(event, newValue, fila, encabezado, semana)}
                                                            isOptionEqualToValue={(option, value) => option === value}
                                                            sx={{ width: '100%' }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label={`Seleccionar ${fila}`}
                                                                    size="small"
                                                                    sx={{ width: '100%' }}
                                                                    multiline
                                                                />
                                                            )}
                                                        />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Estructura;