import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate, formatKm } from './utils';

/**
 * Adds centered text to PDF
 */
const addCenteredText = (doc, text, y) => {
  const pageWidth = doc.internal.pageSize.width;
  const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
  const x = (pageWidth - textWidth) / 2;
  doc.text(text, x, y);
};

/**
 * Adds page number to each page
 */
const addPageNumbers = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128);
    addCenteredText(doc, `Page ${i} of ${pageCount}`, doc.internal.pageSize.height - 10);
  }
};

/**
 * Adds header to PDF
 */
const addHeader = (doc, { categoryName, dateRange }) => {
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  addCenteredText(doc, 'LA RENTALS', 20);
  
  doc.setFontSize(16);
  addCenteredText(doc, 'Service History Report', 30);

  // Category and Date Range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Category: ${categoryName}`, 15, 45);
  doc.text(`Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 15, 52);
};

/**
 * Adds summary section to PDF
 */
const addSummary = (doc, { services }, finalY) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Summary', 15, finalY + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Services: ${services.length}`, 15, finalY + 30);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 15, finalY + 37);
};

/**
 * Adds footer to PDF
 */
const addFooter = (doc) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128);
  addCenteredText(doc, 'Developed & Powered by Umanav Apti LTD.', doc.internal.pageSize.height - 18);
};

/**
 * Main function to generate PDF report
 */
export const generateServiceReport = async ({ categoryName, dateRange, services }) => {
  try {
    // Initialize PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add header
    addHeader(doc, { categoryName, dateRange });

    // Prepare table data
    const tableData = services.map(service => [
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
        0: { cellWidth: 25 },  // Date
        1: { cellWidth: 25 },  // Vehicle ID
        2: { cellWidth: 25, halign: 'right' },  // Current KM
        3: { cellWidth: 25, halign: 'right' },  // Next Service
        4: { cellWidth: 'auto' }  // Service Details
      },
      didDrawPage: () => {
        // Add footer to each page
        addFooter(doc);
      }
    });

    // Add summary after table
    const finalY = doc.lastAutoTable.finalY || 60;
    addSummary(doc, { services }, finalY);

    // Add page numbers
    addPageNumbers(doc);

    // Save PDF
    const filename = `${categoryName}_Service_History_${formatDate(new Date())}.pdf`;
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const testPDFGeneration = async () => {
  const testData = {
    categoryName: 'Test Category',
    dateRange: {
      startDate: new Date(),
      endDate: new Date()
    },
    services: [
      {
        service_date: new Date().toISOString(),
        scooter: { id: 'TEST001' },
        current_km: 5000,
        next_km: 8000,
        service_details: 'Regular maintenance'
      }
    ]
  };

  try {
    await generateServiceReport(testData);
    return true;
  } catch (error) {
    console.error('PDF test generation failed:', error);
    return false;
  }
};