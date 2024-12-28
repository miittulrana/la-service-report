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

  const formatDate = (dateString) => {
    try {
      // Remove any leading/trailing spaces
      dateString = dateString.trim();
      
      // Handle both formats: "01-Dec-23" and "01-Dec-2023"
      const [day, month, yearPart] = dateString.split('-');
      
      const months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };

      // Convert year to 4 digits if necessary
      let fullYear = yearPart;
      if (yearPart.length === 2) {
        fullYear = parseInt(yearPart) + 2000;
      } else if (yearPart.length === 4) {
        fullYear = yearPart;
      } else {
        throw new Error('Invalid year format');
      }

      // Validate month
      if (!months[month]) {
        throw new Error('Invalid month');
      }

      // Validate day
      const paddedDay = day.padStart(2, '0');
      if (parseInt(paddedDay) < 1 || parseInt(paddedDay) > 31) {
        throw new Error('Invalid day');
      }

      // Format as YYYY-MM-DD
      const formattedDate = `${fullYear}-${months[month]}-${paddedDay}`;
      
      // Final validation
      const testDate = new Date(formattedDate);
      if (isNaN(testDate.getTime())) {
        throw new Error('Invalid date');
      }

      return formattedDate;
    } catch (error) {
      console.error('Date parsing error:', { error, dateString });
      throw new Error(`Invalid date format: ${dateString}`);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsModalOpen(true);
      setImportStatus('processing');

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        cellDates: false,
        cellNF: true,
        cellText: true
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: ['service_date', 'current_km', 'next_km', 'service_details'],
        range: 1  // Skip header row
      });

      // Format data for database
      const serviceRecords = jsonData.map(record => {
        if (!record.service_date || !record.current_km || !record.next_km) {
          throw new Error('Missing required fields in row');
        }

        // Basic validation for numbers
        const currentKm = parseInt(record.current_km);
        const nextKm = parseInt(record.next_km);
        
        if (isNaN(currentKm) || isNaN(nextKm)) {
          throw new Error('Invalid kilometer values');
        }

        return {
          scooter_id: scooterId,
          service_date: formatDate(record.service_date),
          current_km: currentKm,
          next_km: nextKm,
          service_details: record.service_details || ''
        };
      });

      // Sort records by date (oldest first)
      serviceRecords.sort((a, b) => new Date(a.service_date) - new Date(b.service_date));

      const { error } = await supabase
        .from('services')
        .insert(serviceRecords);

      if (error) throw error;

      setImportStatus('success');
      setImportDetails({
        totalRecords: serviceRecords.length,
        dateRange: serviceRecords.length > 0 ? {
          first: new Date(serviceRecords[0].service_date).toLocaleDateString(),
          last: new Date(serviceRecords[serviceRecords.length - 1].service_date).toLocaleDateString()
        } : null
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