import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Calendar } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';

const SingleDateFilter = ({ onDateSelect, onClear }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      onDateSelect(selectedDate);
    }
  }, [selectedDate, onDateSelect]);

  const handleClear = () => {
    setSelectedDate(null);
    onClear();
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="w-48">
        <CustomDatePicker
          label="Filter by Date"
          date={selectedDate || new Date()}
          onChange={(date) => setSelectedDate(date)}
        />
      </div>
      
      {selectedDate && (
        <button
          onClick={handleClear}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Clear date filter"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      )}
      
      {!selectedDate && (
        <div className="absolute right-3 top-9 pointer-events-none">
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

SingleDateFilter.propTypes = {
  onDateSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default SingleDateFilter;