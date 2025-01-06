/**
 * Excel utility functions for service history imports
 */

/**
 * Converts Excel date number to ISO date string
 * @param {number} excelDate - Excel date number
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const convertExcelDate = (excelDate) => {
  // Excel dates are number of days since 1900-01-01
  const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
};

/**
 * Validates and normalizes a single service record
 * @param {Object} record - Raw record from Excel
 * @param {string} scooterId - Scooter ID to associate with the record
 * @returns {Object} Normalized record or null if invalid
 */
export const validateServiceRecord = (record, scooterId) => {
  try {
    // Check required fields
    if (!record['MILAGE'] || 
        !record['NEXT SERVICE AT'] || 
        !record['SERVICE DATE']) {
      return null;
    }

    const currentKm = parseInt(record['MILAGE']);
    const nextKm = parseInt(record['NEXT SERVICE AT']);
    const serviceDate = convertExcelDate(record['SERVICE DATE']);
    const workDone = record['DONE'] || '';

    // Validate numbers
    if (isNaN(currentKm) || isNaN(nextKm)) {
      return null;
    }

    // Validate km values make sense
    if (currentKm < 0 || nextKm < currentKm) {
      return null;
    }

    // Validate date
    if (!serviceDate) {
      return null;
    }

    return {
      scooter_id: scooterId,
      service_date: serviceDate,
      current_km: currentKm,
      next_km: nextKm,
      service_details: workDone.trim()
    };
  } catch (error) {
    console.error('Record validation error:', error);
    return null;
  }
};

/**
 * Processes Excel data for service records
 * @param {Array} jsonData - Raw JSON data from Excel
 * @param {string} scooterId - Scooter ID to associate with records
 * @returns {Object} Processed records and summary
 */
export const processExcelData = (jsonData, scooterId) => {
  const summary = {
    totalRecords: jsonData.length,
    processedRecords: 0,
    skippedRecords: 0,
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  // Process and validate each record
  const validRecords = jsonData
    .map(record => validateServiceRecord(record, scooterId))
    .filter(record => {
      if (record === null) {
        summary.skippedRecords++;
        return false;
      }
      summary.processedRecords++;

      // Update date range
      const date = new Date(record.service_date);
      if (!summary.dateRange.earliest || date < new Date(summary.dateRange.earliest)) {
        summary.dateRange.earliest = record.service_date;
      }
      if (!summary.dateRange.latest || date > new Date(summary.dateRange.latest)) {
        summary.dateRange.latest = record.service_date;
      }

      return true;
    });

  return {
    records: validRecords,
    summary
  };
};

/**
 * Validates Excel file structure
 * @param {Array} headers - Excel file headers
 * @returns {Object} Validation result
 */
export const validateExcelStructure = (headers) => {
  const requiredColumns = [
    'MODEL NUMBER',
    'SERVICE DATE',
    'MILAGE',
    'NEXT SERVICE AT',
    'DONE'
  ];

  const missingColumns = requiredColumns.filter(
    col => !headers.includes(col)
  );

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    message: missingColumns.length > 0
      ? `Missing required columns: ${missingColumns.join(', ')}`
      : 'Valid Excel structure'
  };
};

/**
 * Gets Excel read options for service history
 * @returns {Object} XLSX read options
 */
export const getExcelReadOptions = () => ({
  cellDates: false,  // Get raw date numbers
  cellNF: false,     // Don't parse number formats
  cellText: false    // Don't generate text versions
});

/**
 * Debugs Excel parsing issues
 * @param {Object} worksheet - XLSX worksheet
 */
export const debugExcelParsing = (worksheet) => {
  console.group('Excel Debug Info');
  
  // Log column headers
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const headers = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    headers.push(cell ? cell.v : undefined);
  }
  console.log('Headers found:', headers);

  // Log first data row
  const firstRow = {};
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const header = headers[C];
    const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r + 1, c: C })];
    if (header && cell) {
      firstRow[header] = {
        value: cell.v,
        type: cell.t,
        formula: cell.f
      };
    }
  }
  console.log('First row data:', firstRow);

  console.groupEnd();
};