import React, { useState } from 'react';
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Modal,
  Typography,
} from '@mui/material';

const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
const filas = ["FONDO 1", "GUARNICIÓN 1", "FONDO 2", "GUARNICIÓN 2"];

const WeekStructureModal = ({ open, onClose, weekStructure }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          overflowY: 'auto',
          maxHeight: '90vh',
          borderRadius: '15px'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Estructura de la Semana
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CATEGORÍA</TableCell>
                {dias.map((dia) => (
                  <TableCell key={dia}>{dia}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((fila) => (
                <TableRow key={fila}>
                  <TableCell>{fila}</TableCell>
                  {dias.map((dia) => (
                    <TableCell key={dia}>
                      {weekStructure?.[dia]?.[fila]?.map(({ familia, corteqlo }, index) => (
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
    </Modal>
  );
};

export default WeekStructureModal;