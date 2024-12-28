import PropTypes from 'prop-types';
import { Modal } from './Modal';
import { Check, AlertCircle, Loader } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const ImportModal = ({ isOpen, onClose, status, details }) => {
  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex flex-col items-center py-6">
            <Loader className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Processing service history...</p>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-green-600">
              <Check className="h-6 w-6" />
              <h3 className="text-lg font-medium">Import Successful</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total Records:</span> {details.totalRecords}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Successfully Imported:</span> {details.processedRecords}
              </p>
              {details.skippedRecords > 0 && (
                <p className="text-sm text-yellow-600">
                  <span className="font-medium">Skipped Records:</span> {details.skippedRecords}
                </p>
              )}
              {details.dateRange && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date Range:</span>{' '}
                    {formatDate(details.dateRange.earliest)} - {formatDate(details.dateRange.latest)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                         hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-medium">Import Failed</h3>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-red-600">
                {details?.error || 'An error occurred while importing the service history.'}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg 
                         hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                         hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={status !== 'processing' ? onClose : undefined}
      title="Import Service History"
      showCloseButton={status !== 'processing'}
    >
      {renderContent()}
    </Modal>
  );
};

ImportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  status: PropTypes.oneOf(['idle', 'processing', 'success', 'error']).isRequired,
  details: PropTypes.shape({
    totalRecords: PropTypes.number,
    processedRecords: PropTypes.number,
    skippedRecords: PropTypes.number,
    dateRange: PropTypes.shape({
      earliest: PropTypes.string,
      latest: PropTypes.string
    }),
    error: PropTypes.string
  })
};

export default ImportModal;