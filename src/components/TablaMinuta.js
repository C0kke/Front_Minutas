import React, { useState, useEffect, useMemo } from "react";
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
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const StyledTableCell = styled(TableCell)(() => ({
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

  // Obtener los platos segun los ids
  useEffect(() => {
    const obtenerNombresPlatos = async () => {
      setLoading(true);
      try {
        const nombresPlatos = {};
        await Promise.all(
          semana.menus.map(async (menu) => {
            await Promise.all(
              menu.listaplatos.map(async (item) => {
                if (!nombresPlatos[item.platoId]) {
                  const response = await axios.get(
                    `http://localhost:3000/api/v1/plato/${item.platoId}`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  nombresPlatos[item.platoId] = response.data;
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

        semana.menus.forEach((menu) => {
          // Convertir la fecha a la zona horaria deseada (ej. UTC-3)
          const fecha = dayjs(menu.fecha).tz('America/Argentina/Buenos_Aires').format("DD/MM/YYYY");
          const diaSemana = obtenerDiaSemana(dayjs(menu.fecha).tz('America/Argentina/Buenos_Aires'));

          data[fecha] = {
            "PROTEINA 1": [],
            "PROTEINA 2": [],
            "PROTEINA 3": [],
            "VEGETARIANA": [],
            "VEGANA": [],
            "GUARNICION 1": [],
            "GUARNICION 2": [],
            "HIPOCALORICO": [],
            "ENSALADA 1": [],
            "ENSALADA 2": [],
            "ENSALADA 3": [],
            "SOPA DIA": [],
            "POSTRE": [],
            diaSemana: diaSemana,
          };

          menu.listaplatos.forEach((item) => {
            const plato = platosData[item.platoId];
            const fila = item.fila;

            if (plato && fila && data[fecha][fila]) {
              if (!data[fecha][fila].includes(plato.nombre)) {
                data[fecha][fila].push(plato.nombre);
              }
            }
          });
        });
        setTablaData(data);
      };
      construirTablaData();
    }
  }, [platosData, semana]);

  // Función obtenerDiaSemana (ahora usa dayjs internamente)
  const obtenerDiaSemana = (fecha) => {
    const dias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    return dias[fecha.day()];
  };

  // useMemo para encabezadosFecha
  const encabezadosFecha = useMemo(() => {
    const { menus } = semana;
    const fechasSet = new Set();
    const encabezados = [];

    menus.forEach((menu) => {
      // Convertir la fecha a la zona horaria deseada (ej. UTC-3)
      const fecha = dayjs(menu.fecha).tz('America/Argentina/Buenos_Aires');
      const fechaFormateada = fecha.format("DD/MM/YYYY");
      const diaSemana = obtenerDiaSemana(fecha);

      // Verificar si la fecha ya fue agregada
      if (!fechasSet.has(fechaFormateada)) {
        fechasSet.add(fechaFormateada);
        encabezados.push({
          id: menu._id,
          diaSemana: diaSemana,
          fecha: fechaFormateada,
        });
      }
    });

    // Ordenar los encabezados por fecha
    encabezados.sort((a, b) => dayjs(a.fecha, "DD/MM/YYYY").diff(dayjs(b.fecha, "DD/MM/YYYY")));

    return encabezados;
  }, [semana]);

  const filasOrdenadas = [
    "PROTEINA 1",
    "PROTEINA 2",
    "PROTEINA 3",
    "VEGETARIANA",
    "VEGANA",
    "GUARNICION 1",
    "GUARNICION 2",
    "HIPOCALORICO",
    "ENSALADA 1",
    "ENSALADA 2",
    "ENSALADA 3",
    "SOPA DIA",
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
                <div>{encabezado.diaSemana}</div>
                <div>{encabezado.fecha}</div>
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
              {encabezadosFecha.map((encabezado) => (
                <StyledTableCell key={encabezado.id} align="center">
                  {tablaData[encabezado.fecha] && tablaData[encabezado.fecha][fila]
                    ? tablaData[encabezado.fecha][fila].join(", ")
                    : "-"}
                </StyledTableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TablaMinutaAprobacion;