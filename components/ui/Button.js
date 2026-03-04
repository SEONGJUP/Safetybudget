'use client';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'text-gray-600 hover:bg-gray-100',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon: Icon,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}
