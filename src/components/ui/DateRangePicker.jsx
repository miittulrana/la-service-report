import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Calendar, FileDown } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';

const DateRangePicker = ({ isOpen, onClose, onExport, isLoading, categoryName }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });

  const handleExport = (e) => {
    e.preventDefault();
    onExport(
      dateRange.startDate.toISOString().split('T')[0],
      dateRange.endDate.toISOString().split('T')[0]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Export Service History</h2>
            <p className="text-sm text-gray-600 mt-1">
              Category: {categoryName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleExport} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <CustomDatePicker
                label="Start Date"
                date={dateRange.startDate}
                onChange={(date) => setDateRange(prev => ({
                  ...prev,
                  startDate: date
                }))}
              />
            </div>
            <div>
              <CustomDatePicker
                label="End Date"
                date={dateRange.endDate}
                onChange={(date) => setDateRange(prev => ({
                  ...prev,
                  endDate: date
                }))}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-700">
                Select a date range to export service history. The report will include all services performed during this period.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

DateRangePicker.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  categoryName: PropTypes.string.isRequired
};

export default DateRangePicker;