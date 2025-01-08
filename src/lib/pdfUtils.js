import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate, formatKm } from './utils';

// Constants for PDF layout
const PAGE_MARGIN = 15;
const FOOTER_HEIGHT = 35;
const FOOTER_PADDING = 10;
const COLUMN_GAP = 15;

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
 * Adds footer to each page
 */
const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Add line above footer
  doc.setDrawColor(200, 200, 200);
  doc.line(PAGE_MARGIN, pageHeight - FOOTER_HEIGHT, pageWidth - PAGE_MARGIN, pageHeight - FOOTER_HEIGHT);
  
  // Add footer content
  doc.setFontSize(8);
  doc.setTextColor(128);
  
  // Company text
  addCenteredText(doc, 'Developed & Powered by Umanav Apti LTD.', pageHeight - 25);
  
  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  addCenteredText(doc, `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`, pageHeight - 15);
};

/**
 * Formats damage report text
 */
const formatDamageReport = (scooterId, date, description) => {
  return [
    `Scooter ${scooterId}`,
    `Reported on: ${formatDate(date)}`,
    description
  ].join('\n');
};

/**
 * Calculate space required for a damage report
 */
const getDamageReportHeight = (doc, text) => {
  const lines = doc.splitTextToSize(text, (doc.internal.pageSize.width - (3 * PAGE_MARGIN)) / 2);
  return lines.length * (doc.internal.getFontSize() / (72 / 25.6)) + 10; // Add some padding
};

/**
 * Adds damage reports section in 2-column layout
 */
const addDamageReports = (doc, scooters, startY) => {
  const pageWidth = doc.internal.pageSize.width;
  const columnWidth = (pageWidth - (3 * PAGE_MARGIN)) / 2;
  let currentY = startY + 10;
  let leftColumn = true;
  let maxColumnHeight = 0;

  // Collect all damages
  const allDamages = scooters.reduce((damages, scooter) => {
    if (scooter.damages && scooter.damages.length > 0) {
      const scooterDamages = scooter.damages.map(damage => ({
        ...damage,
        scooterId: scooter.id
      }));
      return [...damages, ...scooterDamages];
    }
    return damages;
  }, []);

  // Add section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Damage Reports', PAGE_MARGIN, currentY);
  currentY += 10;

  // Process each damage report
  allDamages.forEach((damage, index) => {
    const damageText = formatDamageReport(
      damage.scooterId,
      damage.created_at,
      damage.description
    );
    
    const textHeight = getDamageReportHeight(doc, damageText);

    // Check if we need to start a new page
    if (currentY + textHeight > doc.internal.pageSize.height - FOOTER_HEIGHT - FOOTER_PADDING) {
      doc.addPage();
      currentY = PAGE_MARGIN + 10;
      maxColumnHeight = 0;
      leftColumn = true;
    }

    // Calculate X position based on column
    const x = leftColumn ? PAGE_MARGIN : PAGE_MARGIN * 2 + columnWidth;

    // Add damage report box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, currentY, columnWidth, textHeight, 2, 2, 'F');
    
    // Add text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    const textLines = doc.splitTextToSize(damageText, columnWidth - 10);
    doc.text(textLines, x + 5, currentY + 5);

    // Update positions
    if (leftColumn) {
      maxColumnHeight = Math.max(maxColumnHeight, textHeight);
    } else {
      currentY += maxColumnHeight + 10;
      maxColumnHeight = 0;
    }

    leftColumn = !leftColumn;
  });

  // Return final Y position
  return currentY + maxColumnHeight + 10;
};

/**
 * Adds header section to PDF
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
 * Calculate remaining space on current page
 */
const getRemainingSpace = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const currentY = doc.previousAutoTable ? doc.previousAutoTable.finalY : doc.y;
  return pageHeight - currentY - FOOTER_HEIGHT - FOOTER_PADDING;
};

/**
 * Generate PDF report for service history
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

    // Add service history table
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
      margin: { top: PAGE_MARGIN, bottom: FOOTER_HEIGHT + FOOTER_PADDING },
      didDrawPage: function(data) {
        addFooter(doc);
      }
    });

    // Get Y position after table
    let currentY = doc.lastAutoTable.finalY + 15;

    // Add damage reports if there's enough space, otherwise add new page
    if (getRemainingSpace(doc) < 40) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }

    // Add damage reports section
    currentY = addDamageReports(doc, services.map(s => s.scooter).filter(Boolean), currentY);

    // Add summary section
    if (getRemainingSpace(doc) < 40) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }

    // Add summary content
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Summary', PAGE_MARGIN, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Services: ${services.length}`, PAGE_MARGIN, currentY + 10);
    
    // Count active damage reports
    const activeDamages = services.reduce((count, service) => {
      return count + (service.scooter?.damages?.filter(d => !d.resolved)?.length || 0);
    }, 0);
    
    doc.text(`Active Damage Reports: ${activeDamages}`, PAGE_MARGIN, currentY + 20);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, PAGE_MARGIN, currentY + 30);

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
              description: 'Left mirror damaged',
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