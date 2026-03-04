'use client';
import { cn } from '@/lib/utils';

export default function Card({ children, className, title, action, noPad }) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm', className)}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <h3 className="font-extrabold text-gray-800 text-sm">{title}</h3>
          {action}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, trend, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-extrabold text-gray-900 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend != null && (
        <div className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% 전월 대비
        </div>
      )}
    </div>
  );
}
