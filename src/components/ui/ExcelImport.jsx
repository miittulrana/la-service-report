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
      // Format from YYYY-MM-DD to YYYY-MM-DD
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return dateString.split('T')[0]; // Remove time part if exists
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
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Get row data starting from row 2 (skip header)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: 1  // Skip header row
      });

      console.log('Parsed Excel Data:', jsonData); // Debug log

      // Format data for database
      const serviceRecords = jsonData
        .filter(row => {
          return row['MILAGE'] !== undefined && 
                 row['EXT SERVICE'] !== undefined && 
                 row['SERVICE DATE'] !== undefined;
        })
        .map(row => {
          console.log('Processing row:', row); // Debug log

          const currentKm = parseInt(row['MILAGE']);
          const nextKm = parseInt(row['EXT SERVICE']);
          const serviceDate = row['SERVICE DATE'];
          const workDone = row['DONE'] || '';

          if (isNaN(currentKm) || isNaN(nextKm)) {
            console.log('Invalid KM values:', { current: currentKm, next: nextKm });
            throw new Error('Invalid kilometer values in Excel');
          }

          return {
            scooter_id: scooterId,
            service_date: formatDate(serviceDate),
            current_km: currentKm,
            next_km: nextKm,
            service_details: workDone
          };
        });

      console.log('Processed Records:', serviceRecords); // Debug log

      if (serviceRecords.length === 0) {
        throw new Error('No valid records found in Excel file');
      }

      const { error } = await supabase
        .from('services')
        .insert(serviceRecords);

      if (error) throw error;

      setImportStatus('success');
      setImportDetails({
        totalRecords: serviceRecords.length,
        dateRange: {
          first: new Date(serviceRecords[serviceRecords.length-1].service_date).toLocaleDateString(),
          last: new Date(serviceRecords[0].service_date).toLocaleDateString()
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