import React, { useState, useEffect, useRef } from "react";
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

// StyledTableCell para personalizar los estilos de las celdas
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

const TablaMinutaAprobacion = ({ semana, tableRef }) => {
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
    // Ejecutar obtenerNombresPlatos solo si semana cambia
    obtenerNombresPlatos();
  }, [semana, token]);

  useEffect(() => {
    // Este useEffect se ejecuta cuando platosData cambia
    if (Object.keys(platosData).length > 0) {
      const construirTablaData = () => {
        const data = {};
        const platosUsadosPorDia = {}; // Objeto para rastrear platos usados por día

        semana.menus.forEach((menu) => {
          const fecha = formatearFecha(new Date(menu.fecha));
          const diaSemana = obtenerDiaSemana(new Date(menu.fecha)); // Obtener el nombre del día
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
            diaSemana: diaSemana, // Guardar el nombre del día
          };
          platosUsadosPorDia[fecha] = new Set(); // Inicializar conjunto de platos usados para la fecha

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
                  // Verificar si el plato ya fue usado en el día
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
                platosUsadosPorDia[fecha].add(plato.nombre); // Marcar plato como usado
              }
            }
          });
        });
        setTablaData(data);
      };
      construirTablaData(); // Llamada correcta a la función
    }
  }, [platosData, semana]);

  const obtenerDiaSemana = (fecha) => {
    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return dias[fecha.getDay()];
  };

  const formatearFecha = (fecha) => {
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const encabezadosFecha = semana.menus
    .map((menu) => {
      const fecha = new Date(menu.fecha);
      const diaSemana = obtenerDiaSemana(fecha);
      const fechaFormateada = formatearFecha(fecha);
      return {
        id: menu._id,
        diaSemana: diaSemana,
        fecha: fechaFormateada,
      };
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // Ordenar por fecha

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
    <TableContainer component={Paper} ref={tableRef}>
      <Table sx={{ minWidth: 650 }} aria-label="tabla de aprobación de minuta">
        <TableHead>
          <TableRow>
            <StyledTableCell className="encabezado" sx={{ textWrap: "nowrap" }}>
              SEMANA {semana._id.semana} - {semana._id.año}
            </StyledTableCell>
            {encabezadosFecha.map((encabezado) => (
              <StyledTableCell
                key={encabezado.id}
                align="center"
                className="encabezado"
              >
                <div>{encabezado.diaSemana}</div> {/* Mostrar el día de la semana */}
                <div>{encabezado.fecha}</div> {/* Mostrar la fecha */}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filasOrdenadas.map((fila) => (
            <TableRow key={fila}>
              <StyledTableCell
                component="th"
                scope="row"
                className="subtitulo"
              >
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