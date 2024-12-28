/**
 * Processes and validates Excel data for service records
 * @param {Array} jsonData - Raw JSON data from Excel file
 * @returns {Object} Processed records and summary
 */
export const processExcelData = (jsonData) => {
    const summary = {
      totalRecords: 0,
      skippedRecords: 0,
      processedRecords: 0,
      dateRange: {
        earliest: null,
        latest: null
      }
    };
  
    const processedRecords = jsonData
      .map(record => {
        try {
          // Normalize field names (case-insensitive)
          const normalizedRecord = {};
          Object.keys(record).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('date')) normalizedRecord.service_date = record[key];
            if (lowerKey.includes('km') || lowerKey.includes('kilometer')) normalizedRecord.current_km = record[key];
            if (lowerKey.includes('next') && (lowerKey.includes('km') || lowerKey.includes('kilometer'))) {
              normalizedRecord.next_km = record[key];
            }
            if (lowerKey.includes('detail') || lowerKey.includes('work') || lowerKey.includes('service')) {
              normalizedRecord.service_details = record[key];
            }
          });
  
          // Validate required fields
          if (!normalizedRecord.service_date || 
              !normalizedRecord.current_km || 
              !normalizedRecord.next_km || 
              !normalizedRecord.service_details) {
            summary.skippedRecords++;
            return null;
          }
  
          // Ensure date is in correct format
          const date = new Date(normalizedRecord.service_date);
          if (isNaN(date.getTime())) {
            summary.skippedRecords++;
            return null;
          }
          normalizedRecord.service_date = date.toISOString();
  
          // Update date range
          if (!summary.dateRange.earliest || date < new Date(summary.dateRange.earliest)) {
            summary.dateRange.earliest = normalizedRecord.service_date;
          }
          if (!summary.dateRange.latest || date > new Date(summary.dateRange.latest)) {
            summary.dateRange.latest = normalizedRecord.service_date;
          }
  
          // Ensure kilometers are numbers
          normalizedRecord.current_km = Number(normalizedRecord.current_km);
          normalizedRecord.next_km = Number(normalizedRecord.next_km);
          if (isNaN(normalizedRecord.current_km) || isNaN(normalizedRecord.next_km)) {
            summary.skippedRecords++;
            return null;
          }
  
          summary.processedRecords++;
          return normalizedRecord;
  
        } catch (error) {
          console.error('Error processing record:', error);
          summary.skippedRecords++;
          return null;
        }
      })
      .filter(Boolean) // Remove null records
      .sort((a, b) => new Date(a.service_date) - new Date(b.service_date));
  
    summary.totalRecords = jsonData.length;
  
    return {
      processedRecords,
      summary
    };
  };
  
  /**
   * Validates if the Excel file has the required columns
   * @param {Array} headers - Array of column headers
   * @returns {Object} Validation result
   */
  export const validateExcelStructure = (headers) => {
    const requiredFields = ['date', 'km', 'next', 'details'];
    const lowerHeaders = headers.map(h => h.toLowerCase());
    
    const missing = requiredFields.filter(field => 
      !lowerHeaders.some(header => header.includes(field))
    );
  
    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };