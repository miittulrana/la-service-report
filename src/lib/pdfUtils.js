import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatDate, formatKm } from './utils';

/**
 * Main function to generate PDF report
 */
export const generateServiceReport = async ({ categoryName, dateRange, services }) => {
  try {
    // Initialize PDF
    const doc = new jsPDF();

    // Company Logo/Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text('LA RENTALS', doc.internal.pageSize.width/2, 20, { align: 'center' });
    
    // Report Title
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text('Service History Report', doc.internal.pageSize.width/2, 32, { align: 'center' });

    // Category and Date Range
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Category: ${categoryName}`, 15, 45);
    doc.text(`Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 15, 52);

    // Filter and sort services
    const validServices = services
      .filter(service => service && service.service_date)
      .sort((a, b) => new Date(b.service_date) - new Date(a.service_date));

    // Prepare table data
    const tableData = validServices.map(service => [
      formatDate(service.service_date),
      service.scooter?.id || '',
      formatKm(service.current_km),
      formatKm(service.next_km),
      service.service_details || ''
    ]);

    // Add table
    doc.autoTable({
      startY: 60,
      head: [['Date', 'Vehicle ID', 'Current KM', 'Next Service', 'Service Details']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    // Add Summary
    const finalY = doc.lastAutoTable.finalY || 60;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Summary', 15, finalY + 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Services: ${validServices.length}`, 15, finalY + 30);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      'Developed & Powered by Umanav Apti LTD.', 
      doc.internal.pageSize.width/2, 
      doc.internal.pageSize.height - 18,
      { align: 'center' }
    );

    // Save PDF
    const filename = `${categoryName}_Service_History_${formatDate(new Date())}.pdf`;
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default {
  generateServiceReport
};