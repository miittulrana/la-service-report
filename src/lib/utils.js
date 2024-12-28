// src/lib/utils.js

/**
 * Date formatter
 * Formats a date into DD/MM/YYYY format
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * KM formatter with commas
 * Formats kilometers with thousand separators
 */
export const formatKm = (km) => {
  return km?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '0';
};

/**
 * Status color helper
 * Returns Tailwind CSS classes based on status
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-700',
    'service soon': 'bg-yellow-100 text-yellow-700',
    'needs service': 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-700'
  };
  return colors[status?.toLowerCase()] || colors.active;
};

/**
 * Calculate next service KM based on CC type
 * Service intervals:
 * - 125cc BOLT: Always 3000km
 * - 125cc: 4000km
 * - 50cc: 2500km
 */
export const calculateNextServiceKm = (currentKm, ccType) => {
  let interval;
  
  switch (ccType) {
    case '125cc BOLT':
      interval = 3000;
      break;
    case '125cc':
      interval = 4000;
      break;
    case '50cc':
      interval = 2500;
      break;
    default:
      interval = 4000; // Default to 125cc interval if type is unknown
  }

  return currentKm + interval;
};

/**
 * Get damage alert status and styling
 */
export const getDamageAlertStatus = (damages = []) => {
  if (!damages || damages.length === 0) {
    return {
      hasDamage: false,
      style: '',
      text: ''
    };
  }

  const unresolvedDamages = damages.filter(damage => !damage.resolved);
  
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
 * Returns date in format: DD/MM/YYYY HH:mm
 */
export const formatDamageDate = (date) => {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate if service is needed
 * Returns one of: 'needs service', 'service soon', 'active', 'unknown'
 */
export const calculateServiceStatus = (currentKm, nextServiceKm) => {
  if (!currentKm || !nextServiceKm) return 'unknown';
  const difference = nextServiceKm - currentKm;
  if (difference <= 0) return 'needs service';
  if (difference <= 500) return 'service soon';
  return 'active';
};

/**
 * Get service interval based on CC type
 * Returns the interval in kilometers
 */
export const getServiceInterval = (ccType) => {
  switch (ccType) {
    case '125cc BOLT':
      return 3000;
    case '125cc':
      return 4000;
    case '50cc':
      return 2500;
    default:
      return 4000;
  }
};

/**
 * Get service interval text display
 * Returns human-readable interval text
 */
export const getServiceIntervalText = (ccType) => {
  return `${getServiceInterval(ccType)}km`;
};

/**
 * Format CC type for display
 * Returns formatted CC type text
 */
export const formatCcType = (ccType) => {
  switch (ccType) {
    case '125cc BOLT':
      return 'Bolt (3000km)';
    case '125cc':
      return '125cc (4000km)';
    case '50cc':
      return '50cc (2500km)';
    default:
      return ccType || 'Unknown';
  }
};

/**
 * Format date for WhatsApp messages
 * Returns date in format: DD/MM/YYYY HH:mm
 */
export const formatWhatsAppDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};