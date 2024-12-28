import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    active: {
      icon: CheckCircle,
      className: 'bg-green-50 text-green-700 border-green-200',
      label: 'Active'
    },
    'service soon': {
      icon: Clock,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      label: 'Service Soon'
    },
    'needs service': {
      icon: AlertCircle,
      className: 'bg-red-50 text-red-700 border-red-200',
      label: 'Needs Service'
    },
    inactive: {
      icon: XCircle,
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      label: 'Inactive'
    },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.active;
  const Icon = config.icon;

  return (
    <div 
      className={`status-badge border ${config.className} ${className}`}
    >
      <Icon className="h-4 w-4 mr-1.5 inline-block" />
      <span>{config.label}</span>
    </div>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['active', 'service soon', 'needs service', 'inactive']).isRequired,
  className: PropTypes.string
};

export default StatusBadge;