import PropTypes from 'prop-types';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="loading-spinner h-8 w-8" />
  </div>
);

export const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const skeletons = {
    card: (
      <div className="card p-4 space-y-3">
        <div className="skeleton h-6 w-2/3"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-3/4"></div>
      </div>
    ),
    list: (
      <div className="space-y-2 p-2">
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-5/6"></div>
        <div className="skeleton h-4 w-4/6"></div>
      </div>
    ),
    timeline: (
      <div className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <div className="skeleton h-4 w-4 rounded-full mt-2"></div>
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-1/4"></div>
            <div className="skeleton h-4 w-full"></div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          {skeletons[type]}
        </div>
      ))}
    </div>
  );
};

LoadingSkeleton.propTypes = {
  type: PropTypes.oneOf(['card', 'list', 'timeline']),
  count: PropTypes.number
};