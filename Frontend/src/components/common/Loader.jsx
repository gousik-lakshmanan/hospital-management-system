import React from 'react';

export const Loader = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 py-6 ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full border-blue-100 border-t-blue-600`}
        role="status"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;
