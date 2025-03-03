import React from 'react';
import { Button } from '@mui/material';
import ExcelJS from 'exceljs';
import { createTheme, ThemeProvider } from '@mui/material/styles';

let theme = createTheme({
    palette: {
        green: {
            main: '#2e8b57',
        },
    },
});

const ExportToExcel = ({ data, fileName, buttonLabel, semana, encabezadosFecha }) => {
    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Minuta`);
        
        // Definir colores por categoría
        const colors = {
            "FONDO 1": "F1A983", // FONDO COLOR SALMÓN
            "FONDO 2": "F1A983",
            "PROTEINA 1": "F1A983", 
            "PROTEINA 2": "F1A983",
            "PROTEINA 3": "F1A983",

            "GUARNICIÓN 1": "FFFFFF", // GUARNICIONES BLANCAS
            "GUARNICIÓN 2": "FFFFFF", 
            "GUARNICION 1": "FFFFFF",  
            "GUARNICION 2": "FFFFFF", 

            "HIPOCALÓRICO": "00B050", // HIPO, ENSALADAS Y VEGGS VERDES
            "HIPOCALORICO": "00B050", 
            "VEGETARIANO": "92D050", 
            "VEGETARIANA": "92D050", 
            "VEGANO": "B3E5A1", 
            "VEGANA": "B3E5A1", 

            "ENSALADA 1": "4EA72E", 
            "ENSALADA 2": "4EA72E", 
            "ENSALADA 3": "4EA72E", 
            "SALAD BAR 1": "4EA72E", 
            "SALAD BAR 2": "4EA72E", 
            "SALAD BAR 3": "4EA72E", 

            "SOPA" : "BF4F14", // SOPA ROJA
            "SOPA DIA" : "BF4F14", 

            "POSTRE" : "CE4ACB", // POSTRE ROSA 
        };

        let currentRow = 2;
        worksheet.addRow([]);
        currentRow++;
        worksheet.mergeCells(currentRow, 2, currentRow, encabezadosFecha.length + 2);
        const titleRow = worksheet.getRow(currentRow);
        titleRow.getCell(2).value = `MINUTA SEMANAL S${semana._id.semana} ${semana._id.año} - ${semana._id.sucursal}`;
        titleRow.eachCell((cell) => {
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
        worksheet.addRow([]);
        currentRow++;

        const daysHeader = encabezadosFecha.map(h => `${h.diaSemana.toUpperCase()} ${h.fecha}`);
        const daysHeaderRow = worksheet.addRow([null, "CATEGORÍA", ...daysHeader]);
        daysHeaderRow.eachCell((cell, colNumber) => {
            if (colNumber > 1) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '501549' },
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
        daysHeaderRow.height = 35;

        data.slice(1).forEach(row => {
            const excelRow = [];
            Object.keys(row).forEach(key => {
                excelRow.push(row[key]);
            });
            const dataRow = worksheet.addRow([null, ...excelRow]);
            dataRow.eachCell((cell, colNumber) => {
                if (colNumber === 2) {
                    const category = row.FILA;
                    const color = colors[category] || 'FFFFFF'; 
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: color },
                    };
                    cell.font = {
                        bold: true,
                        color: { argb: '000000' }, // Negro
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
            dataRow.height = 30;
        });

        // Establecer el ancho de las columnas
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
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <ThemeProvider theme={theme}>
            <Button variant="contained" color='green' sx={{color:'white'}} onClick={exportToExcel}>
                {buttonLabel || 'Exportar a Excel'}
            </Button>
        </ThemeProvider>
    );
};

export default ExportToExcel;