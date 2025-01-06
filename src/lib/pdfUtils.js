import { formatDate, formatKm } from './utils';

/**
 * Simple function to download data as a file
 */
function downloadFile(data, filename) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Generate a CSV report
 */
export const generateServiceReport = async ({ categoryName, dateRange, services }) => {
  try {
    // Create CSV content
    const headers = ['Date', 'Vehicle ID', 'Current KM', 'Next Service', 'Service Details'];
    const rows = services.map(service => [
      formatDate(service.service_date),
      service.scooter?.id || '',
      service.current_km,
      service.next_km,
      service.service_details || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download the file
    const filename = `${categoryName}_Service_History_${formatDate(new Date())}.csv`;
    downloadFile(csvContent, filename);
    return true;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export const testPDFGeneration = async () => {
  try {
    const testData = {
      categoryName: 'Test',
      dateRange: { 
        startDate: new Date(), 
        endDate: new Date() 
      },
      services: [{
        service_date: new Date().toISOString(),
        scooter: { id: 'TEST001' },
        current_km: 5000,
        next_km: 8000,
        service_details: 'Test maintenance'
      }]
    };
    return await generateServiceReport(testData);
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
};