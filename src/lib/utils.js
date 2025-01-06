/**
 * Enhanced utility functions for LA Service Record
 */

/**
 * Date formatter
 * Formats a date into DD/MM/YYYY format with optional time
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time in the format
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    return dateObj.toLocaleDateString('en-GB', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * KM formatter with commas and validation
 * @param {number|string} km - Kilometer value to format
 * @returns {string} Formatted kilometer string
 */
export const formatKm = (km) => {
  if (!km && km !== 0) return '0';
  
  try {
    const numKm = typeof km === 'string' ? parseFloat(km) : km;
    if (isNaN(numKm)) return '0';
    
    return numKm.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } catch (error) {
    console.error('KM formatting error:', error);
    return '0';
  }
};

/**
 * Get Tailwind CSS classes for different status types
 * @param {string} status - Status value
 * @returns {string} Tailwind CSS classes
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    'service soon': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'needs service': 'bg-red-100 text-red-700 border-red-200',
    inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    unknown: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return colors[status?.toLowerCase()] || colors.unknown;
};

/**
 * Calculate next service KM based on CC type with validation
 * @param {number} currentKm - Current kilometer reading
 * @param {string} ccType - Engine CC type
 * @returns {number} Next service kilometer reading
 */
export const calculateNextServiceKm = (currentKm, ccType) => {
  if (typeof currentKm !== 'number' || isNaN(currentKm)) {
    console.error('Invalid current KM value:', currentKm);
    return 0;
  }

  const intervals = {
    '125cc BOLT': 3000,
    '125cc': 4000,
    '50cc': 2500,
    'default': 4000
  };

  const interval = intervals[ccType] || intervals.default;
  return currentKm + interval;
};

/**
 * Get damage alert status and styling
 * @param {Array} damages - Array of damage records
 * @returns {Object} Status object with alert information
 */
export const getDamageAlertStatus = (damages = []) => {
  if (!Array.isArray(damages)) return {
    hasDamage: false,
    style: '',
    text: ''
  };

  const unresolvedDamages = damages.filter(damage => damage && !damage.resolved);
  
  if (unresolvedDamages.length > 0) {
    return {
      hasDamage: true,
      style: 'border-red-300 bg-red-50',
      text: `${unresolvedDamages.length} damage${unresolvedDamages.length > 1 ? 's' : ''} reported`
    };
  }

  return {
    hasDamage: false,
    style: '',
    text: ''
  };
};

/**
 * Format date specifically for damage reports
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string with time
 */
export const formatDamageDate = (date) => {
  return formatDate(date, true);
};

/**
 * Calculate service status based on kilometer readings
 * @param {number} currentKm - Current kilometer reading
 * @param {number} nextServiceKm - Next service kilometer reading
 * @returns {string} Service status
 */
export const calculateServiceStatus = (currentKm, nextServiceKm) => {
  if (!currentKm || !nextServiceKm) return 'unknown';
  
  try {
    const difference = nextServiceKm - currentKm;
    if (difference <= 0) return 'needs service';
    if (difference <= 500) return 'service soon';
    return 'active';
  } catch (error) {
    console.error('Service status calculation error:', error);
    return 'unknown';
  }
};

/**
 * Get service interval based on CC type
 * @param {string} ccType - Engine CC type
 * @returns {number} Service interval in kilometers
 */
export const getServiceInterval = (ccType) => {
  const intervals = {
    '125cc BOLT': 3000,
    '125cc': 4000,
    '50cc': 2500,
    'default': 4000
  };
  return intervals[ccType] || intervals.default;
};

/**
 * Format service interval for display
 * @param {string} ccType - Engine CC type
 * @returns {string} Formatted interval string
 */
export const getServiceIntervalText = (ccType) => {
  return `${getServiceInterval(ccType)}km`;
};

/**
 * Format CC type for display with interval
 * @param {string} ccType - Engine CC type
 * @returns {string} Formatted CC type string
 */
export const formatCcType = (ccType) => {
  const types = {
    '125cc BOLT': 'Bolt (3000km)',
    '125cc': '125cc (4000km)',
    '50cc': '50cc (2500km)'
  };
  return types[ccType] || ccType || 'Unknown';
};

/**
 * Format date for WhatsApp messages
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatWhatsAppDate = (date) => {
  return formatDate(date, true);
};

/**
 * Validate kilometer input
 * @param {number|string} km - Kilometer value to validate
 * @returns {boolean} Whether the input is valid
 */
export const isValidKilometer = (km) => {
  const numKm = typeof km === 'string' ? parseFloat(km) : km;
  return !isNaN(numKm) && numKm >= 0 && numKm <= 999999;
};

/**
 * Calculate service due status with percentage
 * @param {number} currentKm - Current kilometer reading
 * @param {number} nextServiceKm - Next service kilometer reading
 * @returns {Object} Service status details
 */
export const getServiceDueStatus = (currentKm, nextServiceKm) => {
  if (!currentKm || !nextServiceKm) {
    return { status: 'unknown', percentage: 0 };
  }

  try {
    const difference = nextServiceKm - currentKm;
    const interval = nextServiceKm - (currentKm - difference);
    const percentage = Math.floor((difference / interval) * 100);

    if (difference <= 0) {
      return { status: 'needs service', percentage: 0 };
    }
    if (difference <= 500) {
      return { status: 'service soon', percentage };
    }
    return { status: 'active', percentage };
  } catch (error) {
    console.error('Service due status calculation error:', error);
    return { status: 'unknown', percentage: 0 };
  }
};

/**
 * Format large numbers with K/M suffix
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (value) => {
  if (!value && value !== 0) return '0';
  
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  } catch (error) {
    console.error('Number formatting error:', error);
    return '0';
  }
};