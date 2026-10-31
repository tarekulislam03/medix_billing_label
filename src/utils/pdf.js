import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Download an HTML element as PDF
 * @param {HTMLElement} element 
 * @param {string} fileName 
 * @param {string} format 'a4' | 'a5' | [100, 150]
 */
export async function downloadElementAsPDF(element, fileName = 'document.pdf', format = 'a4') {
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    let pdf;
    if (format === 'label') {
      // 4x6 inches: ~101.6mm x 152.4mm
      pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [101.6, 152.4],
      });
      const imgWidth = 101.6;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 152.4));
    } else if (format === 'a5') {
      pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, Math.min(imgHeight, pageHeight - 10));
    } else {
      // Default A4
      pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 16;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 8, 8, imgWidth, Math.min(imgHeight, pageHeight - 16));
    }

    pdf.save(fileName);
  } catch (err) {
    console.error('Failed to generate PDF', err);
    alert('Failed to generate PDF. You can also use the Print button and choose "Save as PDF".');
  }
}
