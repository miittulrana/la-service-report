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
 * Adds damage notes section to PDF
 */
const addDamageNotes = (doc, services, startY) => {
  // Only proceed if there are damages to report
  const servicesWithDamages = services.filter(service => service.scooter?.damages?.length > 0);
  if (servicesWithDamages.length === 0) return startY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Damage Reports', 15, startY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  let currentY = startY + 25;
  
  servicesWithDamages.forEach(service => {
    const damages = service.scooter.damages.filter(d => !d.resolved);
    if (damages.length === 0) return;

    damages.forEach(damage => {
      // Add scooter ID and date
      doc.setFont('helvetica', 'bold');
      doc.text(`Scooter ${service.scooter.id}`, 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reported on: ${formatDate(damage.created_at)}`, 15, currentY + 5);
      
      // Add damage description with word wrap
      const splitText = doc.splitTextToSize(damage.description, 180);
      doc.text(splitText, 15, currentY + 12);
      
      currentY += 20 + (splitText.length * 5);

      // Add extra spacing between damage reports
      currentY += 5;

      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        currentY = 20;
      }
    });
  });

  return currentY;
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

  // Count unresolved damages
  const totalDamages = services.reduce((count, service) => {
    return count + (service.scooter?.damages?.filter(d => !d.resolved)?.length || 0);
  }, 0);
  
  if (totalDamages > 0) {
    doc.text(`Active Damage Reports: ${totalDamages}`, 15, finalY + 37);
  }

  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 15, finalY + (totalDamages > 0 ? 44 : 37));
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
      didDrawPage: function(data) {
        // Add footer to each page
        addFooter(doc);
      }
    });

    // Get the final Y position after the service table
    const finalY = doc.lastAutoTable.finalY || 60;

    // Add damage notes section
    const damageY = addDamageNotes(doc, services, finalY);

    // Add summary after damage notes
    addSummary(doc, { services }, damageY);

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
        scooter: { 
          id: 'TEST001',
          damages: [
            {
              created_at: '2024-01-10',
              description: 'Test damage report',
              resolved: false
            }
          ]
        },
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