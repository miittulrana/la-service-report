import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Modal } from './Modal';

const ExcelImport = ({ scooterId, onImportComplete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('idle');
  const [importDetails, setImportDetails] = useState(null);
  const fileInputRef = useRef(null);

  const convertExcelDate = (excelDate) => {
    try {
      // Handle both date strings and Excel numeric dates
      if (typeof excelDate === 'string') {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // Excel dates are number of days since 1900-01-01
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      throw new Error('Invalid date format');
    } catch (error) {
      console.error('Date conversion error:', { excelDate, error });
      throw new Error('Invalid date format in Excel file');
    }
  };

  const parseKilometers = (value) => {
    // Handle various formats of kilometer values
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      // Remove commas and other non-numeric characters except decimal point
      const cleanValue = value.replace(/[^\d.]/g, '');
      const number = parseFloat(cleanValue);
      if (!isNaN(number)) {
        return number;
      }
    }
    throw new Error('Invalid kilometer value');
  };

  const validateHeaders = (headers) => {
    const requiredHeaders = ['SERVICE DATE', 'MILAGE', 'NEXT SERVICE AT'];
    const missingHeaders = requiredHeaders.filter(
      required => !headers.some(header => 
        header && header.toString().toUpperCase().includes(required)
      )
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsModalOpen(true);
      setImportStatus('processing');

      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        cellDates: false, // Get raw date values
        cellNF: false,    // Don't parse number formats
        cellText: false   // Don't generate text versions
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Get headers from first row
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const headers = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
        headers.push(cell ? cell.v : undefined);
      }

      // Validate headers
      validateHeaders(headers);

      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log('Parsed Excel Data:', jsonData);

      // Format data for database
      const serviceRecords = jsonData
        .map((row, index) => {
          try {
            // Log row being processed
            console.log('Processing row:', { rowNumber: index + 2, data: row });

            const currentKm = parseKilometers(row['MILAGE']);
            const nextKm = parseKilometers(row['NEXT SERVICE AT']);
            const serviceDate = convertExcelDate(row['SERVICE DATE']);
            const workDone = row['DONE'] || '';

            // Validate values
            if (isNaN(currentKm) || isNaN(nextKm)) {
              console.log('Invalid KM values:', { currentKm, nextKm, rowNumber: index + 2 });
              throw new Error('Invalid kilometer values');
            }

            // Validate KM logic
            if (nextKm <= currentKm) {
              console.log('Next KM not greater than current:', { currentKm, nextKm, rowNumber: index + 2 });
              throw new Error('Next service KM must be greater than current KM');
            }

            // Validate positive values
            if (currentKm < 0 || nextKm < 0) {
              console.log('Negative KM values:', { currentKm, nextKm, rowNumber: index + 2 });
              throw new Error('Kilometer values cannot be negative');
            }

            return {
              scooter_id: scooterId,
              service_date: serviceDate,
              current_km: currentKm,
              next_km: nextKm,
              service_details: workDone.trim()
            };
          } catch (error) {
            console.error(`Error processing row ${index + 2}:`, error);
            return null;
          }
        })
        .filter(record => record !== null);

      // Validate we have records to import
      if (serviceRecords.length === 0) {
        throw new Error('No valid records found in Excel file');
      }

      console.log('Records to import:', serviceRecords);

      // Sort records by date ascending
      serviceRecords.sort((a, b) => new Date(a.service_date) - new Date(b.service_date));

      // Insert records into database
      const { error } = await supabase
        .from('services')
        .insert(serviceRecords);

      if (error) {
        console.error('Supabase insert error:', error);
        if (error.message.includes('services_check')) {
          throw new Error('Invalid service record: Please ensure next service KM is greater than current KM');
        }
        throw error;
      }

      // Success handling
      setImportStatus('success');
      setImportDetails({
        totalRecords: serviceRecords.length,
        dateRange: {
          first: new Date(serviceRecords[0].service_date).toLocaleDateString(),
          last: new Date(serviceRecords[serviceRecords.length - 1].service_date).toLocaleDateString()
        }
      });

      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setImportDetails({
        error: error.message
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg 
                 hover:bg-blue-200 transition-colors flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">Import History</span>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Import Service History"
      >
        <div className="p-4">
          {importStatus === 'processing' && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-600">Processing...</span>
            </div>
          )}

          {importStatus === 'success' && (
            <div className="space-y-4">
              <div className="text-green-600 font-medium">
                Successfully imported {importDetails.totalRecords} service records
                {importDetails.dateRange && (
                  <div className="text-sm text-gray-600 mt-1">
                    Date range: {importDetails.dateRange.first} to {importDetails.dateRange.last}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="space-y-4">
              <div className="text-red-600">
                Import failed: {importDetails.error}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

ExcelImport.propTypes = {
  scooterId: PropTypes.string.isRequired,
  onImportComplete: PropTypes.func
};

export default ExcelImport;