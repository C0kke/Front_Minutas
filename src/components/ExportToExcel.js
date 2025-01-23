import React from 'react';
import { Button } from '@mui/material';
import ExcelJS from 'exceljs';

const ExportToExcel = ({ data, fileName, buttonLabel, semana, encabezadosFecha }) => {

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`MINUTA`);

    const headerData = [
      { key: 'semana', label: 'SEMANA', value: semana._id.semana },
      { key: 'año', label: 'AÑO', value: semana._id.año },
      { key: 'desde', label: 'DESDE', value: encabezadosFecha[0].fecha },
      { key: 'hasta', label: 'HASTA', value: encabezadosFecha[encabezadosFecha.length - 1].fecha },
    ];

    let currentRow = 1;
    headerData.forEach((header) => {
      worksheet.mergeCells(currentRow, 2, currentRow, 4);
      const headerRow = worksheet.addRow([null, `${header.label}: ${header.value}`]);
      headerRow.eachCell((cell) => {
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
        };
      });
      headerRow.height = 20;
      currentRow++;
    });

    worksheet.addRow([]);
    currentRow++;

    worksheet.mergeCells(currentRow, 1, currentRow, 8, 'MINUTA');
    const titleRow = worksheet.addRow([null, ...'MINUTA SEMANAL S' + semana._id.semana]);
    titleRow.eachCell((cell) => {
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
    });
    titleRow.height = 30;
    currentRow++;

    worksheet.addRow([]);
    currentRow++;

    const daysHeader = encabezadosFecha.map(h => `${h.diaSemana.toUpperCase()} ${h.fecha}`);
    const daysHeaderRow = worksheet.addRow([null, null, ...daysHeader]);
    daysHeaderRow.eachCell((cell, colNumber) => {
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

    data.slice(1).forEach(row => {
      const excelRow = [];
      Object.keys(row).forEach(key => {
          excelRow.push(row[key]);
      });
      const dataRow = worksheet.addRow([null, ...excelRow]);
      dataRow.eachCell((cell, colNumber) => {
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

    worksheet.columns.forEach((column, index) => {
      if (index > 1) {
        column.width = 25;
      } else if (index === 0) {
        column.width = 5; 
      } else {
        column.width = 18; 
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Button variant="contained" color="primary" onClick={exportToExcel}>
      {buttonLabel || 'Exportar a Excel'}
    </Button>
  );
};

export default ExportToExcel;