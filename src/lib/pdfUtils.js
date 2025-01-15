import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatKm } from './utils';

// Constants for PDF layout
const PAGE_MARGIN = 15;
const FOOTER_HEIGHT = 35;
const FOOTER_PADDING = 10;
const COLUMN_GAP = 15;

/**
 * Format date consistently
 */
const formatPDFDate = (date) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
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
const formatDamageReport = (scooterId, date, description, resolved) => {
  return [
    `Scooter ${scooterId}`,
    `Reported on: ${formatPDFDate(date)}`,
    `Status: ${resolved ? 'Resolved' : 'Active'}`,
    description
  ].join('\n');
};

/**
 * Calculate space required for a damage report
 */
const getDamageReportHeight = (doc, text) => {
  const lines = doc.splitTextToSize(text, (doc.internal.pageSize.width - (3 * PAGE_MARGIN)) / 2);
  return lines.length * (doc.internal.getFontSize() / (72 / 25.6)) + 10;
};

/**
 * Collects damages within date range
 */
const getFilteredDamages = (services, startDate, endDate) => {
  let damages = [];
  services.forEach(service => {
    if (service.scooter?.damages) {
      service.scooter.damages.forEach(damage => {
        const damageDate = damage.created_at.split('T')[0];
        if (damageDate >= startDate && damageDate <= endDate) {
          damages.push({
            ...damage,
            scooterId: service.scooter.id
          });
        }
      });
    }
  });
  return damages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

/**
 * Adds damage reports section in 2-column layout
 */
const addDamageReports = (doc, damages, startY) => {
  const pageWidth = doc.internal.pageSize.width;
  const columnWidth = (pageWidth - (3 * PAGE_MARGIN)) / 2;
  let currentY = startY + 10;
  let leftColumn = true;
  let maxColumnHeight = 0;

  // Add section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Damage Reports', PAGE_MARGIN, currentY);
  currentY += 10;

  if (damages.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No damage reports found for this period.', PAGE_MARGIN, currentY + 5);
    return currentY + 20;
  }

  // Process each damage report
  damages.forEach((damage, index) => {
    const damageText = formatDamageReport(
      damage.scooterId,
      damage.created_at,
      damage.description,
      damage.resolved
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

    // Add damage report box with background color
    doc.setDrawColor(200, 200, 200);
    if (damage.resolved) {
      doc.setFillColor(245, 245, 245); // Light gray for resolved
    } else {
      doc.setFillColor(254, 242, 242); // Light red for active
    }
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

  // Return final Y position, ensuring we account for the last row
  return currentY + (leftColumn ? 0 : maxColumnHeight) + 10;
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
  doc.text(`Category: ${categoryName}`, PAGE_MARGIN, 45);
  doc.text(`Period: ${formatPDFDate(dateRange.startDate)} - ${formatPDFDate(dateRange.endDate)}`, PAGE_MARGIN, 52);
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

    // Get damages within date range
    const filteredDamages = getFilteredDamages(services, dateRange.startDate, dateRange.endDate);

    // Prepare table data for services
    const tableData = services.map(service => {
      const date = new Date(service.service_date);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      return [
        formattedDate,
        service.scooter?.id || '',
        formatKm(service.current_km),
        formatKm(service.next_km),
        service.time_taken || '-',
        service.service_details || ''
      ];
    });

    // Add service history table if there are services
    if (tableData.length > 0) {
      doc.autoTable({
        startY: 60,
        head: [['Date', 'Vehicle ID', 'Current KM', 'Next Service', 'Time Taken', 'Service Details']],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 25 },  // Increased width for date
          1: { cellWidth: 20 },
          2: { cellWidth: 20, halign: 'right' },
          3: { cellWidth: 20, halign: 'right' },
          4: { cellWidth: 20 },
          5: { cellWidth: 'auto' }
        },
        margin: { top: PAGE_MARGIN, bottom: FOOTER_HEIGHT + FOOTER_PADDING },
        didDrawPage: function(data) {
          addFooter(doc);
        }
      });
    } else {
      // If no services, add a message
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No service records found for this period.', PAGE_MARGIN, 65);
    }

    // Get Y position after table or message
    let currentY = services.length > 0 ? doc.lastAutoTable.finalY + 15 : 75;

    // Add damage reports if there's enough space, otherwise add new page
    if (getRemainingSpace(doc) < 40) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }

    // Add damage reports section
    currentY = addDamageReports(doc, filteredDamages, currentY);

    // Add summary section on new page if needed
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
    doc.text(`Services Performed: ${services.length}`, PAGE_MARGIN, currentY + 10);
    doc.text(`Damage Reports: ${filteredDamages.length}`, PAGE_MARGIN, currentY + 20);
    
    // Count active damage reports
    const activeDamages = filteredDamages.filter(d => !d.resolved).length;
    if (filteredDamages.length > 0) {
      doc.text(`Active Damage Reports: ${activeDamages}`, PAGE_MARGIN, currentY + 30);
      doc.text(`Resolved Damage Reports: ${filteredDamages.length - activeDamages}`, PAGE_MARGIN, currentY + 40);
    }
    
    const now = new Date();
    const formattedNow = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    doc.text(`Generated on: ${formattedNow}`, PAGE_MARGIN, currentY + (filteredDamages.length > 0 ? 50 : 30));

    // Save PDF
    const filename = `${categoryName}_Service_History_${formatPDFDate(new Date())}.pdf`;
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
        time_taken: '1 hour',
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