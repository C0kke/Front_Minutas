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
          console.log("  --- Procesando menú para la fecha:", menu.fecha, " ---");
          const fecha = formatearFecha(new Date(menu.fecha));
          const diaSemana = obtenerDiaSemana(new Date(menu.fecha));

          data[fecha] = {
            "PROTEINA_1": [],
            "PROTEINA_2": [],
            "PROTEINA_3": [],
            "VEGETARIANA": [],
            "VEGANA": [],
            "GUARNICION_1": [],
            "GUARNICION_2": [],
            "HIPOCALORICO": [],
            "ENSALADA_1": [],
            "ENSALADA_2": [],
            "ENSALADA_3": [],
            "SOPA_DIA": [],
            "POSTRE": [],
            diaSemana: diaSemana,
          };
          
          console.log("  Data[fecha] inicializada:", data[fecha]);

          menu.listaplatos.forEach((item) => {
            console.log("    --- Procesando item:", item, " ---");
            const plato = platosData[item.platoId];
            console.log("    Plato encontrado:", plato);
            const fila = item.fila;
            console.log("    Fila:", fila);

            if (plato && fila && data[fecha][fila]) {
              console.log("      Plato y fila válidos. Añadiendo plato a la fila:", fila);
              // Añadir el plato a la fila especificada
              if (!data[fecha][fila].includes(plato.nombre)) {
                data[fecha][fila].push(plato.nombre);
                console.log("      Plato añadido:", plato.nombre, "a la fila", fila);
              } else {
                console.log("      Plato ya existe en la fila:", plato.nombre, "en la fila", fila);
              }
            } else {
              console.log("      Plato, fila o data[fecha][fila] no válidos. No se añade el plato.");
            }
          });
          console.log("  Data[fecha] después de procesar platos:", data[fecha]);
        });
        console.log("--- TablaData final:", data);
        setTablaData(data);
      };
      construirTablaData();
    }
  }, [platosData, semana]);

  const obtenerDiaSemana = (fecha) => {
    const dias = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    let dia = fecha.getDay();
    dia = dia === 0 ? 6 : dia - 1;
    return dias[dia];
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
    const fechaFormateada = formatearFecha(fecha);
    const fechaSiguiente = new Date(menu.fecha);
    fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
    const fechaSiguienteFormateada = formatearFecha(fechaSiguiente);
    const diaSiguiente = obtenerDiaSemana(fechaSiguiente);

    return {
      id: menu._id,
      diaSemana: diaSiguiente,
      fecha: fechaFormateada,
      fechaSiguiente: fechaSiguienteFormateada,
      fechaOriginal: fecha
    };
  })
  .sort((a, b) => a.fechaOriginal - b.fechaOriginal);

  const filasOrdenadas = [
    "PROTEINA_1",
    "PROTEINA_2",
    "PROTEINA_3",
    "VEGETARIANA",
    "VEGANA",
    "GUARNICION_1",
    "GUARNICION_2",
    "HIPOCALORICO" ,
    "ENSALADA_1",
    "ENSALADA_2",
    "ENSALADA_3",
    "SOPA_DIA",
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
                <div>{encabezado.fechaSiguiente}</div>
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