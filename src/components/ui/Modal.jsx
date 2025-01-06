import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  showCloseButton = true,
  size = 'default', // 'small', 'default', 'large', 'full'
  preventClose = false
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-sm',
    default: 'max-w-md',
    large: 'max-w-lg',
    full: 'max-w-4xl'
  };

  const handleBackdropClick = (e) => {
    if (!preventClose) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={title}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          {/* Modal Content */}
          <div 
            className={`relative transform overflow-hidden rounded-lg bg-white 
                       text-left shadow-xl transition-all sm:my-8 w-full 
                       ${sizeClasses[size]} ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                {showCloseButton && !preventClose && (
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-500 
                             hover:bg-gray-100 focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// WhatsApp Number Selection Modal Component
export const WhatsAppModal = ({
  isOpen,
  onClose,
  onSend,
  category,
  isLoading
}) => {
  const handleSend = async (numberType) => {
    await onSend(numberType);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Notification"
      size="small"
      preventClose={isLoading}
    >
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <button
            onClick={() => handleSend('primary')}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg 
                     hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            Send to Primary Number
          </button>
          
          {category?.toLowerCase().includes('bolt') && (
            <button
              onClick={() => handleSend('bolt')}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg 
                       hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              Send to Bolt Number
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  showCloseButton: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'default', 'large', 'full']),
  preventClose: PropTypes.bool
};

WhatsAppModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  category: PropTypes.string,
  isLoading: PropTypes.bool
};

export default {
  Modal,
  WhatsAppModal
};