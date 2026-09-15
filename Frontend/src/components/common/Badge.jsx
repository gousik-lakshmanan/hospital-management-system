import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const getColors = (val) => {
    const text = val?.toString().toUpperCase() || '';
    
    // Status color mappings
    if (['AVAILABLE', 'IN STOCK', 'PAID', 'COMPLETED', 'CONFIRMED', 'NORMAL', 'ON DUTY', 'SUCCESS'].includes(text)) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (['OCCUPIED', 'LOW STOCK', 'EXPIRING SOON', 'RESERVED', 'PENDING', 'SCHEDULED', 'OBSERVATION', 'WARNING'].includes(text)) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (['OUT OF STOCK', 'CRITICAL', 'CANCELLED', 'DANGER', 'EMERGENCY ALERT', 'OFF DUTY', 'MAINTENANCE'].includes(text)) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (['ADMITTED', 'INFO', 'SYSTEM', 'APPOINTMENT', 'VISITOR', 'PHARMACY'].includes(text)) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    
    // Explicit variants
    const explicitVariants = {
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      danger: 'bg-rose-50 text-rose-700 border-rose-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
      neutral: 'bg-slate-50 text-slate-700 border-slate-200'
    };

    return explicitVariants[variant] || explicitVariants.neutral;
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getColors(children || variant)} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
