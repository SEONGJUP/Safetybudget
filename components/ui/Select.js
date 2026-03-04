'use client';
import { cn } from '@/lib/utils';

export default function Select({ value, onChange, options, label, className, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
