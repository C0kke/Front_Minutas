import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  "&.encabezado": {
    backgroundColor: "#2e8b57",
    color: "white",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    padding: "12px 15px",
  },
  "&.subtitulo": {
    backgroundColor: "#4CAF50",
    color: "white",
    fontWeight: "bold",
  },
}));

const TablaMinutaAprobacion = ({ semana }) => {
  const [platosData, setPlatosData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tablaData, setTablaData] = useState({});

  const token = localStorage.getItem("token")?.trim();

  useEffect(() => {
    const obtenerNombresPlatos = async () => {
      setLoading(true);
      try {
        const nombresPlatos = {};
        await Promise.all(
          semana.menus.map(async (menu) => {
            await Promise.all(
              menu.listaplatos.map(async (platoId) => {
                if (!nombresPlatos[platoId]) {
                  const response = await axios.get(
                    `http://localhost:3000/api/v1/plato/${platoId}`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  nombresPlatos[platoId] = response.data;
                }
              })
            );
          })
        );
        setPlatosData(nombresPlatos);
      } catch (error) {
        console.error("Error al obtener los nombres de los platos:", error);
        setError("Error al cargar los datos de los platos.");
      } finally {
        setLoading(false);
      }
    };
    obtenerNombresPlatos();
  }, [semana, token]);

  useEffect(() => {
    if (Object.keys(platosData).length > 0) {
      const construirTablaData = () => {
        const data = {};
        const platosUsadosPorDia = {}; 

        semana.menus.forEach((menu) => {
          const fecha = formatearFecha(new Date(menu.fecha));
          data[fecha] = {
            "PROTEINA 1": [],
            "PROTEINA 2": [],
            "PROTEINA 3": [],
            "VEGETARIANA": [],
            "VEGANA": [],
            "GUARNICION 1": [],
            "GUARNICION 2": [],
            "HIPOCALÓRICO": [],
            "ENSALADA 1": [],
            "ENSALADA 2": [],
            "ENSALADA 3": [],
            "SOPA DEL DÍA": [],
            "POSTRE": [],
          };
          platosUsadosPorDia[fecha] = new Set();

          menu.listaplatos.forEach((platoId) => {
            const plato = platosData[platoId];
            if (plato) {
              let filaParaPlato = null;
              for (const fila in data[fecha]) {
                if (
                  (fila.startsWith("PROTEINA") &&
                    plato.categoria === "PLATO DE FONDO") ||
                  (fila.startsWith("GUARNICION") &&
                    plato.categoria === "GUARNICIÓN") ||
                  (fila.startsWith("ENSALADA") &&
                    plato.categoria === "ENSALADA") ||
                  (fila === "VEGETARIANA" &&
                    plato.categoria === "VEGETARIANO") ||
                  (fila === "VEGANA" && plato.categoria === "VEGANA") ||
                  (fila === "HIPOCALÓRICO" &&
                    plato.categoria === "HIPOCALORICO") ||
                  (fila === "SOPA DEL DÍA" && plato.categoria === "SOPA") ||
                  (fila === "POSTRE" && plato.categoria === "POSTRES")
                ) {
                  if (!platosUsadosPorDia[fecha].has(plato.nombre)) {
                    if (data[fecha][fila].length === 0) {
                      filaParaPlato = fila;
                      break;
                    }
                  }
                }
              }
              if (filaParaPlato) {
                data[fecha][filaParaPlato].push(plato.nombre);
                platosUsadosPorDia[fecha].add(plato.nombre);
              }
            }
          });
        });
        setTablaData(data);
      };
      construirTablaData();
    }
  }, [platosData, semana]);

  const formatearFecha = (fecha) => {
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const diasSemana = [
    "LUNES",
    "MARTES",
    "MIÉRCOLES",
    "JUEVES",
    "VIERNES",
  ];

  const fechasMenus = semana.menus.reduce((acc, menu) => {
    const fecha = new Date(menu.fecha);
    const diaSemana = diasSemana[fecha.getDay() - 1];
    if (diaSemana) {
      acc[diaSemana] = {
        id: menu._id,
        fecha: formatearFecha(fecha),
      };
    }
    return acc;
  }, {});

  const encabezadosFecha = diasSemana
    .filter((diaSemana) => fechasMenus[diaSemana])
    .map((diaSemana) => ({
      id: fechasMenus[diaSemana].id,
      fecha: fechasMenus[diaSemana].fecha,
    }));

  const filasOrdenadas = [
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

  if (loading) {
    return <div>Cargando platos...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="tabla de aprobación de minuta">
        <TableHead>
          <TableRow>
            <StyledTableCell className="encabezado">Categoría</StyledTableCell>
            {encabezadosFecha.map((encabezado) => (
              <StyledTableCell
                key={encabezado.id}
                align="center"
                className="encabezado"
              >
                {encabezado.fecha}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filasOrdenadas.map((fila) => (
            <TableRow key={fila}>
              <StyledTableCell component="th" scope="row" className="subtitulo">
                {fila}
              </StyledTableCell>
              {encabezadosFecha.map((encabezado) => {
                const fecha = encabezado.fecha;
                return (
                  <StyledTableCell key={encabezado.id} align="center">
                    {fecha && tablaData[fecha] && tablaData[fecha][fila]
                      ? tablaData[fecha][fila].join(", ")
                      : "-"}
                  </StyledTableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TablaMinutaAprobacion;