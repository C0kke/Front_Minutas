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
import ExportToExcel from "./ExportToExcel";
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
        const filasUnicas = new Set();

        semana.menus.forEach((menu) => {
          const fecha = dayjs(menu.fecha).tz('America/Argentina/Buenos_Aires').format("DD/MM/YYYY");
          const diaSemana = obtenerDiaSemana(dayjs(menu.fecha).tz('America/Argentina/Buenos_Aires'));
          data[fecha] = {
            diaSemana: diaSemana,
          };

          menu.listaplatos.forEach((item) => {
            const plato = platosData[item.platoId];
            const fila = item.fila;

            if (plato && fila) {
              filasUnicas.add(fila);

              if (!data[fecha][fila]) {
                data[fecha][fila] = [];
              }

              if (!data[fecha][fila].includes(plato.nombre)) {
                data[fecha][fila].push(plato.nombre);
              }
            }
          });
        });

        setTablaData(data);
        setFilasOrdenadas(Array.from(filasUnicas));
      };

      construirTablaData();
    }
  }, [platosData, semana]);

  const obtenerDiaSemana = (fecha) => {
    const dias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    return dias[fecha.day()];
  };

  const encabezadosFecha = useMemo(() => {
    const { menus } = semana;
    const fechasSet = new Set();
    const encabezados = [];

    menus.forEach((menu) => {
      const fecha = dayjs(menu.fecha).tz('America/Argentina/Buenos_Aires');
      const fechaFormateada = fecha.format("DD/MM/YYYY");
      const diaSemana = obtenerDiaSemana(fecha);

      if (!fechasSet.has(fechaFormateada)) {
        fechasSet.add(fechaFormateada);
        encabezados.push({
          id: menu._id,
          diaSemana: diaSemana,
          fecha: fechaFormateada,
        });
      }
    });

    encabezados.sort((a, b) => dayjs(a.fecha, "DD/MM/YYYY").diff(dayjs(b.fecha, "DD/MM/YYYY")));
    return encabezados;
  }, [semana]);

  const [filasOrdenadas, setFilasOrdenadas] = useState([]);

  if (loading) {
    return <div>Cargando platos...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const prepareDataForExcel = () => {
    const excelData = [];
    const headers = ["SEMANA " + semana._id.semana + " - " + semana._id.año, ...encabezadosFecha.map(h => `${h.diaSemana} ${h.fecha}`)];
    excelData.push(headers);

    filasOrdenadas.forEach(fila => {
      const row = [fila];
      encabezadosFecha.forEach(encabezado => {
        const fecha = encabezado.fecha;
        const cellValue = (fecha && tablaData[fecha] && tablaData[fecha][fila]) ? tablaData[fecha][fila].join(", ") : "-";
        row.push(cellValue);
      });
      excelData.push(row);
    });

    const flattenedData = excelData.map(row => {
      const rowObject = {};
      row.forEach((cell, index) => {
        rowObject[headers[index]] = cell;
      });
      return rowObject;
    });

    return flattenedData;
  };

  return (
    <div>
      <TableContainer component={Paper} ref={tableRef}>
        <ExportToExcel
          data={prepareDataForExcel()}
          fileName={`PLANIFICACIÓN DE MINUTA ${semana._id.semana} - ${semana._id.año}`}
          sheetName={`MINUTA`}
          semana={semana}
          encabezadosFecha={encabezadosFecha}
          buttonLabel="Exportar a Excel"
        />
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
    </div>
  );
};

export default TablaMinutaAprobacion;