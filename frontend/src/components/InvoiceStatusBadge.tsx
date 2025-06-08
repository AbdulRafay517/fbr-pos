import React from 'react';
import type { InvoiceStatus } from '../api/invoices';
import { getStatusColor, getStatusLabel } from '../api/invoices';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, className = '' }) => {
  const colorClasses = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}>
      {label}
    </span>
  );
};

export default InvoiceStatusBadge; 