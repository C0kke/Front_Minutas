// PdfUtils.js
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generarPDF = (tableRef, semana) => {
  if (tableRef.current) {
    const input = tableRef.current;

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      console.log(semana)
      pdf.save(`Minuta_Semana_${semana}.pdf`);
    });
  } else {
    console.error("No se encontró la referencia a la tabla.");
  }
};