import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  as?: 'button' | 'span';
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled,
  as = 'button',
  ...props 
}: ButtonProps) {
  const Component = as;
  
  return (
    <Component
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          // Variants
          'bg-gradient-to-r from-green-400 to-emerald-500 text-black hover:from-green-500 hover:to-emerald-600 shadow-lg hover:shadow-green-500/25': variant === 'primary',
          'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-green-500/30': variant === 'secondary',
          'border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300': variant === 'outline',
          'text-gray-400 hover:text-green-400 hover:bg-green-500/10': variant === 'ghost',
          'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700': variant === 'danger',
          
          // Sizes
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </Component>
  );
}