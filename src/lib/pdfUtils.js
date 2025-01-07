// pdfUtils.js
import { jsPDF } from 'jspdf';

// Dynamic import for autotable to avoid build issues
let autoTable;
const loadAutoTable = async () => {
  if (!autoTable) {
    const module = await import('jspdf-autotable');
    autoTable = module.default;
  }
  return autoTable;
};

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
  // Company Logo/Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(41, 128, 185); // Blue color
  addCenteredText(doc, 'LA RENTALS', 20);
  
  // Report Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  addCenteredText(doc, 'Service History Report', 32);

  // Category and Date Range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Category: ${categoryName}`, 15, 45);
  doc.text(`Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 15, 52);

  // Decorative Line
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(15, 55, doc.internal.pageSize.width - 15, 55);
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
};

/**
 * Adds footer to PDF
 */
const addFooter = (doc) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128);
  addCenteredText(
    doc, 
    'Developed & Powered by Umanav Apti LTD.', 
    doc.internal.pageSize.height - 18
  );
};

/**
 * Format date helper function
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format kilometer helper function
 */
const formatKm = (km) => {
  if (!km && km !== 0) return '';
  return km.toLocaleString() + ' km';
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

    // Load autotable dynamically
    await loadAutoTable();

    // Add header
    addHeader(doc, { categoryName, dateRange });

    // Filter out any undefined or invalid services
    const validServices = services.filter(service => 
      service && service.service_date && service.scooter
    );

    // Sort services by date (newest first)
    validServices.sort((a, b) => new Date(b.service_date) - new Date(a.service_date));

    // Prepare table data
    const tableData = validServices.map(service => [
      formatDate(service.service_date),
      service.scooter?.id || '',
      formatKm(service.current_km),
      formatKm(service.next_km),
      service.service_details || ''
    ]);

    // Add table with styling
    doc.autoTable({
      startY: 60,
      head: [['Date', 'Vehicle ID', 'Current KM', 'Next Service', 'Service Details']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.1
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
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didDrawPage: function(data) {
        // Add footer to each page
        addFooter(doc);
      }
    });

    // Add summary after table
    const finalY = doc.lastAutoTable.finalY || 60;
    addSummary(doc, { services: validServices }, finalY);

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

/**
 * Test function to verify PDF generation
 */
export const testPDFGeneration = async () => {
  const testData = {
    categoryName: 'Test Category',
    dateRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    services: [
      {
        service_date: '2024-01-15',
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

export default {
  generateServiceReport,
  testPDFGeneration
};