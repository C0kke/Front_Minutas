import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  Button,
} from "@mui/material";
import './styles/GenerarReporte.css'; // Asegúrate de tener los estilos

const GenerarReporte = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sucursal, setSucursal] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platos, setPlatos] = useState([]);
  const [platosConCantidad, setPlatosConCantidad] = useState([{ platoId: "", cantidad: 0 }]);
  const navigate = useNavigate();

  // Cargar las sucursales desde la API o servicio
  useEffect(() => {
    const fetchSucursales = async () => {
      setLoading(true);
      try {
        // Asegúrate de tener el endpoint correcto para obtener las sucursales
        const response = await fetch("/api/sucursales"); // Cambia la URL por la correcta
        const data = await response.json();
        setSucursales(data); // Asumiendo que la respuesta tiene un array de sucursales
      } catch (error) {
        console.error("Error al obtener sucursales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  // Cargar los platos o menús según las fechas seleccionadas
  const handleFechaChange = async () => {
    if (fechaInicio && fechaFin && sucursal) {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/menudiario?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&sucursalId=${sucursal}`
        ); // Cambia la URL por la correcta
        const data = await response.json();
        setPlatos(data.platos); // Asume que la respuesta contiene un array de platos
      } catch (error) {
        console.error("Error al obtener platos:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePlatoChange = (index, field, value) => {
    const newPlatos = [...platosConCantidad];
    newPlatos[index][field] = value;
    setPlatosConCantidad(newPlatos);
  };

  const addPlato = () => {
    setPlatosConCantidad([...platosConCantidad, { platoId: "", cantidad: 0 }]);
  };

  const handleSubmit = () => {
    const reportData = {
      fechaInicio,
      fechaFin,
      sucursal,
      platosConCantidad,
    };

    console.log("Datos para generar reporte:", reportData);
    navigate("/reportes-generados"); // Cambia esta URL si es necesario
  };

  return (
    <div className="reporte-container">
      <h1>Generar Reporte</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <TextField
            label="Fecha de Inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="Fecha de Fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </div>

        <div className="form-group">
          <FormControl sx={{ width: 200 }}>
            <InputLabel>Sucursal</InputLabel>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Select
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                label="Sucursal"
              >
                {sucursales.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.nombresucursal}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
        </div>

        <div className="form-group">
          <Button variant="contained" onClick={handleFechaChange}>
            Cargar Platos
          </Button>
        </div>

        {loading ? (
          <CircularProgress size={24} />
        ) : (
          platos.length > 0 && (
            <div className="form-group">
              <h3>Platos para el Reporte</h3>
              {platos.map((plato, index) => (
                <div key={index} className="plato-input">
                  <input
                    type="text"
                    value={plato.nombre} // Cambia "nombre" por el campo correspondiente
                    readOnly
                  />
                  <input
                    type="number"
                    value={platosConCantidad[index]?.cantidad || 0}
                    onChange={(e) => handlePlatoChange(index, "cantidad", e.target.value)}
                    placeholder="Cantidad"
                  />
                </div>
              ))}
              <Button variant="outlined" onClick={addPlato}>
                Agregar Plato
              </Button>
            </div>
          )
        )}

        <div className="form-group">
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Generar Reporte
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GenerarReporte;