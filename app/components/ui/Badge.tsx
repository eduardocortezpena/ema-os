import React, { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-800 text-gray-100 border-gray-700',
  success: 'bg-green-900/50 text-green-200 border-green-800',
  warning: 'bg-yellow-900/50 text-yellow-200 border-yellow-800',
  danger: 'bg-red-900/50 text-red-200 border-red-800',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
