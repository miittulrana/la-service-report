import { formatDate, formatKm } from './utils';
import html2pdf from 'html2pdf.js';

/**
 * Create a PDF template string
 */
const createPDFTemplate = ({ categoryName, dateRange, services }) => {
  const rows = services.map(service => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(service.service_date)}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${service.scooter?.id || ''}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatKm(service.current_km)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatKm(service.next_km)}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${service.service_details || ''}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin-bottom: 10px;">LA RENTALS</h1>
        <h2 style="font-size: 20px; margin-bottom: 20px;">Service History Report</h2>
        <p style="font-size: 14px; margin-bottom: 5px;">Category: ${categoryName}</p>
        <p style="font-size: 14px;">Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #2980b9; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">Date</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Vehicle ID</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Current KM</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Next Service</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Service Details</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; margin-bottom: 10px;">Summary</h3>
        <p style="font-size: 14px; margin-bottom: 5px;">Total Services: ${services.length}</p>
        <p style="font-size: 14px;">Generated on: ${new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>

      <div style="text-align: center; color: #666; font-size: 12px;">
        <p>Developed & Powered by Umanav Apti LTD.</p>
      </div>
    </div>
  `;
};

/**
 * Generate PDF report
 */
export const generateServiceReport = async ({ categoryName, dateRange, services }) => {
  try {
    const element = document.createElement('div');
    element.innerHTML = createPDFTemplate({ categoryName, dateRange, services });
    document.body.appendChild(element);

    const opt = {
      margin: 10,
      filename: `${categoryName}_Service_History_${formatDate(new Date())}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(element).set(opt).save();
    document.body.removeChild(element);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Test function
 */
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