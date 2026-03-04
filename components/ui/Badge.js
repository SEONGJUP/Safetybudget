'use client';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

export default function Badge({ status, label, className = '' }) {
  const displayLabel = label || getStatusLabel(status);
  const colorClass = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
