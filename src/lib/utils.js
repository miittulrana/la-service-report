import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Date formatter
 * Formats a date into DD/MM/YYYY format
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * KM formatter with commas
 * Formats kilometers with thousand separators
 */
export const formatKm = (km) => {
  return km?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '0';
};

/**
 * Status color helper
 * Returns Tailwind CSS classes based on status
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-700',
    'service soon': 'bg-yellow-100 text-yellow-700',
    'needs service': 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-700'
  };
  return colors[status?.toLowerCase()] || colors.active;
};

/**
 * Calculate next service KM based on CC type
 */
export const calculateNextServiceKm = (currentKm, ccType) => {
  let interval;
  
  switch (ccType) {
    case '125cc BOLT':
      interval = 3000;
      break;
    case '125cc':
      interval = 4000;
      break;
    case '50cc':
      interval = 2500;
      break;
    default:
      interval = 4000;
  }

  return currentKm + interval;
};

/**
 * Get damage alert status and styling
 */
export const getDamageAlertStatus = (damages = []) => {
  if (!damages || damages.length === 0) {
    return {
      hasDamage: false,
      style: '',
      text: ''
    };
  }

  const unresolvedDamages = damages.filter(damage => !damage.resolved);
  
  if (unresolvedDamages.length > 0) {
    return {
      hasDamage: true,
      style: 'border-red-300 bg-red-50',
      text: `${unresolvedDamages.length} damage${unresolvedDamages.length > 1 ? 's' : ''} reported`
    };
  }

  return {
    hasDamage: false,
    style: '',
    text: ''
  };
};

/**
 * Format damage date with time
 */
export const formatDamageDate = (date) => {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate if service is needed
 */
export const calculateServiceStatus = (currentKm, nextServiceKm) => {
  if (!currentKm || !nextServiceKm) return 'unknown';
  const difference = nextServiceKm - currentKm;
  if (difference <= 0) return 'needs service';
  if (difference <= 500) return 'service soon';
  return 'active';
};

/**
 * Get service interval based on CC type
 */
export const getServiceInterval = (ccType) => {
  switch (ccType) {
    case '125cc BOLT':
      return 3000;
    case '125cc':
      return 4000;
    case '50cc':
      return 2500;
    default:
      return 4000;
  }
};

/**
 * Get service interval text display
 */
export const getServiceIntervalText = (ccType) => {
  return `${getServiceInterval(ccType)}km`;
};

/**
 * Format CC type for display
 */
export const formatCcType = (ccType) => {
  switch (ccType) {
    case '125cc BOLT':
      return 'Bolt (3000km)';
    case '125cc':
      return '125cc (4000km)';
    case '50cc':
      return '50cc (2500km)';
    default:
      return ccType || 'Unknown';
  };
};

/**
 * Format date for WhatsApp messages
 */
export const formatWhatsAppDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Generate PDF report for service history
 */
export const generateServiceReport = async ({ categoryName, dateRange, services }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(20);
  doc.text('LA Rentals Service History Report', 15, 20);
  
  doc.setFontSize(12);
  doc.text(`Category: ${categoryName}`, 15, 30);
  doc.text(`Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 15, 40);

  // Table Content
  const tableData = services.map(service => [
    formatDate(service.service_date),
    service.scooter?.id || '',
    formatKm(service.current_km),
    formatKm(service.next_km),
    service.service_details || ''
  ]);

  doc.autoTable({
    startY: 50,
    head: [['Date', 'Vehicle ID', 'Current KM', 'Next Service', 'Service Details']],
    body: tableData,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 'auto' }
    }
  });

  // Summary
  const finalY = doc.lastAutoTable.finalY || 50;
  doc.setFontSize(14);
  doc.text('Summary', 15, finalY + 20);
  
  doc.setFontSize(10);
  doc.text(`Total Services: ${services.length}`, 15, finalY + 30);
  doc.text(`Generated on: ${formatWhatsAppDate(new Date())}`, 15, finalY + 40);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    'Developed & Powered by Umanav Apti LTD.',
    pageWidth / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );

  // Download
  doc.save(`${categoryName}_Service_History_${formatDate(new Date())}.pdf`);
};