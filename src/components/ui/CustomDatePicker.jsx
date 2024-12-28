import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({ date, onChange, label }) => {
  const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        className="w-full px-4 py-3 bg-white rounded-lg
                 border border-gray-200 hover:border-blue-200
                 cursor-pointer flex items-center gap-2
                 focus-within:ring-2 focus-within:ring-blue-500/50
                 focus-within:border-blue-300
                 transition duration-300"
        onClick={onClick}
        ref={ref}
      >
        <Calendar className="h-5 w-5 text-gray-400" />
        <input
          value={value}
          className="bg-transparent border-none p-0 focus:ring-0 w-full cursor-pointer"
          readOnly
        />
      </div>
    </div>
  ));

  CustomInput.displayName = 'CustomInput';

  return (
    <DatePicker
      selected={date}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      customInput={<CustomInput />}
      wrapperClassName="w-full"
      showPopperArrow={false}
      label={label}
      portalId="root"
      withPortal
    />
  );
};

CustomDatePicker.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired
};

export default CustomDatePicker;