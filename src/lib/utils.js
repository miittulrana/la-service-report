/**
 * Date formatter
 * Formats a date into DD/MM/YYYY format with optional time
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
* KM formatter with commas
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
* Status color helper
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
* Calculate next service KM based on CC type
*/
export const calculateNextServiceKm = (currentKm, ccType) => {
  if (!currentKm || typeof currentKm !== 'number' || isNaN(currentKm)) return 0;

  const intervals = {
      '125cc BOLT': 3000,
      '125cc': 4000,
      '50cc': 2500
  };

  const interval = intervals[ccType] || 4000; // Default to 4000 if type not found
  return currentKm + interval;
};

/**
* Get damage alert status and styling
*/
export const getDamageAlertStatus = (damages = []) => {
  if (!Array.isArray(damages)) return {
      hasDamage: false,
      style: '',
      text: ''
  };

  const unresolvedDamages = damages.filter(damage => 
      damage && !damage.resolved
  );
  
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
* Format damage date with time
*/
export const formatDamageDate = (date) => {
  return formatDate(date, true);
};

/**
* Calculate service status
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
*/
export const getServiceInterval = (ccType) => {
  const intervals = {
      '125cc BOLT': 3000,
      '125cc': 4000,
      '50cc': 2500
  };
  return intervals[ccType] || 4000;
};

/**
* Get service interval text
*/
export const getServiceIntervalText = (ccType) => {
  return `${getServiceInterval(ccType)}km`;
};

/**
* Format CC type for display
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
*/
export const formatWhatsAppDate = (date) => {
  return formatDate(date, true);
};

/**
* Validate service data for WhatsApp notification
*/
export const validateServiceData = (serviceData) => {
  const required = ['date', 'scooterId', 'currentKm', 'nextKm', 'serviceDetails'];
  const missing = required.filter(field => !serviceData?.[field]);
  
  if (missing.length > 0) {
      return {
          isValid: false,
          error: `Missing required fields: ${missing.join(', ')}`
      };
  }

  return {
      isValid: true,
      error: null
  };
};

/**
* Format service details for display
*/
export const formatServiceDetails = (details, maxLength = 200) => {
  if (!details) return '';
  return details.length > maxLength 
      ? `${details.substring(0, maxLength)}...`
      : details;
};

/**
* Check if km value requires service
*/
export const needsService = (currentKm, nextServiceKm) => {
  if (!currentKm || !nextServiceKm) return false;
  return currentKm >= nextServiceKm;
};

/**
* Get days until next service
*/
export const getDaysUntilService = (lastServiceDate, nextServiceKm, currentKm, dailyAverage = 100) => {
  if (!lastServiceDate || !nextServiceKm || !currentKm) return null;
  
  const kmRemaining = nextServiceKm - currentKm;
  if (kmRemaining <= 0) return 0;
  
  return Math.ceil(kmRemaining / dailyAverage);
};

export default {
  formatDate,
  formatKm,
  getStatusColor,
  calculateNextServiceKm,
  getDamageAlertStatus,
  formatDamageDate,
  calculateServiceStatus,
  getServiceInterval,
  getServiceIntervalText,
  formatCcType,
  formatWhatsAppDate,
  validateServiceData,
  formatServiceDetails,
  needsService,
  getDaysUntilService
};