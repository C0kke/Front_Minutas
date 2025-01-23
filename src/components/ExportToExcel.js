import React from 'react';
import { Button } from '@mui/material';
import ExcelJS from 'exceljs';

const ExportToExcel = ({ data, fileName, buttonLabel, semana, encabezadosFecha }) => {

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Minuta`);

        console.log("Iniciando exportToExcel");

        const headerData = [
            { key: 'semana', label: 'SEMANA', value: semana._id.semana },
            { key: 'año', label: 'AÑO', value: semana._id.año },
            { key: 'desde', label: 'DESDE', value: encabezadosFecha[0].fecha },
            { key: 'hasta', label: 'HASTA', value: encabezadosFecha[encabezadosFecha.length - 1].fecha },
        ];

        console.log("headerData:", headerData);

        let currentRow = 2;
        headerData.forEach((header) => {
            console.log(`Procesando header: ${header.label}`);
            worksheet.mergeCells(currentRow, 2, currentRow, 4);
            const headerRow = worksheet.addRow([null, `${header.label}: ${header.value}`]);
            console.log(`Fila agregada para ${header.label}. currentRow: ${currentRow}`);

            headerRow.eachCell((cell) => {
                console.log(`Procesando celda: ${cell.address}`);
                if (cell.address !== 'A' + currentRow) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'D3D3D3' },
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                    cell.font = {
                        bold: true,
                    };
                    cell.alignment = {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: true,
                    };
                }
            });
            headerRow.height = 20;
            currentRow++;
        });

        console.log("Cabecera terminada. currentRow:", currentRow);

        worksheet.addRow([]);
        currentRow++;

        console.log("Agregando título. currentRow:", currentRow);
        worksheet.mergeCells(currentRow, 2, currentRow, encabezadosFecha.length + 2);
        console.log("Merge realizado para título. currentRow:", currentRow);
        const titleRow = worksheet.addRow([null, 'MINUTA SEMANAL S' + semana._id.semana]);
        console.log("Fila de título agregada. currentRow:", currentRow);
        titleRow.eachCell((cell) => {
            console.log(`Procesando celda del título: ${cell.address}`);
            if (cell.address !== 'A' + currentRow) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '2e8b57' },
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.font = {
                    bold: true,
                    size: 14,
                    color: { argb: 'FFFFFF' },
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle',
                };
            }
        });
        titleRow.height = 30;
        currentRow++;

        console.log("Título terminado. currentRow:", currentRow);

        worksheet.addRow([]);
        currentRow++;

        console.log("Agregando encabezados de días. currentRow:", currentRow);
        const daysHeader = encabezadosFecha.map(h => `${h.diaSemana.toUpperCase()} ${h.fecha}`);
        const daysHeaderRow = worksheet.addRow([null, null, ...daysHeader]);
        console.log("Encabezados de días agregados. currentRow:", currentRow);
        daysHeaderRow.eachCell((cell, colNumber) => {
            console.log(`Procesando celda de encabezado de día: ${cell.address}`);
            if (colNumber > 1) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '2e8b57' },
                };
                cell.font = {
                    bold: true,
                    color: { argb: 'FFFFFF' },
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle',
                };
            }
        });
        daysHeaderRow.height = 25;

        console.log("Encabezados de días terminados. currentRow:", currentRow);

        console.log("Agregando datos de la tabla. currentRow:", currentRow);
        data.slice(1).forEach(row => {
            const excelRow = [];
            Object.keys(row).forEach(key => {
                console.log(`Agregando valor de celda: ${row[key]}`);
                excelRow.push(row[key]);
            });
            const dataRow = worksheet.addRow([null, ...excelRow]);
            console.log("Fila de datos agregada. currentRow:", currentRow);
            dataRow.eachCell((cell, colNumber) => {
                console.log(`Procesando celda de datos: ${cell.address}`);
                if (colNumber === 2) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '4CAF50' },
                    };
                    cell.font = {
                        bold: true,
                        color: { argb: 'FFFFFF' },
                    };
                }
                if (cell.address[0] !== 'A') {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        wrapText: true
                    };
                }
            });
            dataRow.height = 60;
        });

        console.log("Datos de la tabla terminados. currentRow:", currentRow);

        // Establecer el ancho de las columnas
        console.log("Estableciendo ancho de columnas");
        worksheet.columns.forEach((column, index) => {
            if (index > 0) {
                column.width = 25;
            } else if (index === 0) {
                column.width = 5;
            } else {
                column.width = 18;
            }
        });

        // Descargar el archivo
        console.log("Descargando archivo");
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
        console.log("Archivo descargado");
    };

    return (
        <Button variant="contained" color="primary" onClick={exportToExcel}>
            {buttonLabel || 'Exportar a Excel'}
        </Button>
    );
};

export default ExportToExcel;