import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  MenuItem,
  Alert,
} from "@mui/material";
import Header from "../components/Header"; // Importar Header desde la ruta correcta

const BACKEND_URL = process.env.REACT_APP_BACK_URL; // Constante para la URL del backend

const Sucursales = () => {
  const [sucursales, setSucursales] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalCrearIsOpen, setModalCrearIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [newSucursal, setNewSucursal] = useState({ nombresucursal: "", direccion: "" });
  const [originalSucursal, setOriginalSucursal] = useState(null); // Guardar el estado original de la sucursal

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}sucursal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSucursales(response.data);
      } catch (error) {
        console.error("Error al obtener sucursales:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.setItem("error", "error de sesion");
          navigate("/login");
        } else if (error.response) {
          setError(
            new Error(
              `Error del servidor: ${error.response.status} - ${error.response.data.message || "Detalles no disponibles"}`
            )
          );
        } else if (error.request) {
          setError(new Error("No se recibió respuesta del servidor."));
        } else {
          setError(new Error("Error al configurar la solicitud."));
        }
      }
    };
    fetchSucursales();
  }, [navigate, token]);

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const closeModalCrear = () => {
    setModalCrearIsOpen(false);
  };

  const openModal = (sucursal) => {
    setNewSucursal(sucursal);
    setOriginalSucursal({ ...sucursal }); // Guardar el estado original de la sucursal
    setModalIsOpen(true);
  };

  const openModalCrear = () => {
    setNewSucursal({ nombresucursal: "", direccion: "" });
    setModalCrearIsOpen(true);
  };

  const handleCreateSucursalChange = (event) => {
    const { name, value } = event.target;
    setNewSucursal((prevSucursal) => ({ ...prevSucursal, [name]: value }));
  };

  const hasChanges = () => {
    return JSON.stringify(newSucursal) !== JSON.stringify(originalSucursal);
  };

  const handleCreateSucursal = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}sucursal`, newSucursal, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSucursales((prevSucursales) => [...prevSucursales, response.data]);
      alert("Sucursal creada con éxito");
      closeModalCrear();
    } catch (error) {
      console.error("Error al crear sucursal:", error);

      if (error.response?.status === 400) {
        alert("TIENES QUE LLENAR TODOS LOS CAMPOS");
        return;
      }

      if (error.response?.data?.error?.errorResponse?.errmsg) {
        const errorMessage = error.response.data.error.errorResponse.errmsg;

        if (errorMessage.includes("nombresucursal")) {
          alert("El nombre de la sucursal ya está en uso.");
        } else {
          alert("No se pudo crear la sucursal debido a un error desconocido.");
        }
      } else {
        alert("No se pudo crear la sucursal.");
      }
    }
  };

  const handleEditSucursal = async () => {
    if (!hasChanges()) {
      alert("No hay cambios para guardar.");
      return;
    }

    const confirmed = window.confirm("¿Está seguro de que desea editar esta sucursal?");
    if (confirmed) {
      try {
        const response = await axios.put(
          `${BACKEND_URL}sucursal/${newSucursal._id}`,
          newSucursal,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSucursales((prevSucursales) =>
          prevSucursales.map((s) => (s._id === newSucursal._id ? response.data : s))
        );
        closeModal();
      } catch (error) {
        console.error("Error al editar sucursal:", error);
        setError(new Error("No se pudo editar la sucursal."));
      }
    }
  };

  const handleDeleteSucursal = async () => {
    const confirmedFirst = window.confirm(
      "¡Este proceso es irreversible! ¿Está seguro que quiere eliminar esta sucursal?"
    );
    if (confirmedFirst) {
      const confirmedSecond = window.confirm(
        "Este es el segundo paso de la confirmación. ¿Seguro que desea continuar?"
      );
      if (confirmedSecond) {
        const confirmedThird = window.confirm(
          "¡Última confirmación! ¿Realmente desea eliminar esta sucursal?"
        );
        if (confirmedThird) {
          try {
            await axios.delete(`${BACKEND_URL}sucursal/${newSucursal._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setSucursales((prevSucursales) =>
              prevSucursales.filter((s) => s._id !== newSucursal._id)
            );
            closeModal();
          } catch (error) {
            console.error("Error al eliminar sucursal:", error);
            setError(new Error("No se pudo eliminar la sucursal."));
          }
        }
      }
    }
  };

  return (
    <Box>
      <Header />
      <Box sx={{ padding: "20px" }}>
        <Button variant="contained" onClick={openModalCrear}>
          Crear Nueva Sucursal
        </Button>

        {error && <Alert severity="error">{error.message}</Alert>}

        <Box sx={{ marginTop: "20px" }}>
          {sucursales.map((sucursal) => (
            <Box
              key={sucursal._id}
              onClick={() => openModal(sucursal)}
              className="PlatoCard"
              sx={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                cursor: "pointer",
              }}
            >
              {sucursal.nombresucursal}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Modal para crear una nueva sucursal */}
      <Modal open={modalCrearIsOpen} onClose={closeModalCrear}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6">Crear Nueva Sucursal</Typography>
          <TextField
            fullWidth
            label="Nombre de la Sucursal"
            name="nombresucursal"
            value={newSucursal.nombresucursal}
            onChange={handleCreateSucursalChange}
            sx={{ marginTop: "10px" }}
          />
          <TextField
            fullWidth
            label="Dirección"
            name="direccion"
            value={newSucursal.direccion}
            onChange={handleCreateSucursalChange}
            sx={{ marginTop: "10px" }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <Button variant="outlined" onClick={closeModalCrear}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleCreateSucursal}>
              Crear
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal para editar o eliminar sucursal */}
      <Modal open={modalIsOpen} onClose={closeModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6">Editar Sucursal</Typography>
          <TextField
            fullWidth
            label="Nombre de la Sucursal"
            name="nombresucursal"
            value={newSucursal.nombresucursal}
            onChange={handleCreateSucursalChange}
            sx={{ marginTop: "10px" }}
          />
          <TextField
            fullWidth
            label="Dirección"
            name="direccion"
            value={newSucursal.direccion}
            onChange={handleCreateSucursalChange}
            sx={{ marginTop: "10px" }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <Button variant="outlined" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleEditSucursal}>
              Editar
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteSucursal}>
              Eliminar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Sucursales;