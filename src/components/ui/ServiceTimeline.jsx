import { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Wrench } from 'lucide-react';
import { formatDate, formatKm, getServiceIntervalText } from '../../lib/utils';

export const ServiceTimeline = ({ services, scooterCcType }) => {
  const [expandedService, setExpandedService] = useState(null);

  if (!services?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No service history found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service, index) => {
        const isExpanded = expandedService === service.id;
        const isFirst = index === 0;
        const isLast = index === services.length - 1;

        return (
          <div key={service.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-6 top-10 bottom-0 w-px bg-gray-200" />
            )}

            {/* Service entry */}
            <div className="card hover:bg-gray-50/50">
              {/* Header */}
              <button
                className="w-full text-left p-4 focus:outline-none"
                onClick={() => setExpandedService(isExpanded ? null : service.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-full ${
                    isFirst ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Wrench className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          Service at {formatKm(service.current_km)} km
                          <span className="ml-2 text-sm text-gray-500">
                            ({scooterCcType} - {getServiceIntervalText(scooterCcType)} interval)
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(service.service_date)}
                        </p>
                        <div className="mt-2 text-sm text-gray-600">
                          Next service due at: {formatKm(service.next_km)} km
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-16 pb-4 animate-fade-in">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Service Details:</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {service.service_details}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

ServiceTimeline.propTypes = {
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      service_date: PropTypes.string.isRequired,
      current_km: PropTypes.number.isRequired,
      next_km: PropTypes.number.isRequired,
      service_details: PropTypes.string.isRequired,
    })
  ).isRequired,
  scooterCcType: PropTypes.string.isRequired
};

export default ServiceTimeline;