import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
}

export function Card({ children, className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        {
          'bg-gray-800 border-gray-700': variant === 'default',
          'bg-gray-800/50 backdrop-blur-sm border-gray-700/50': variant === 'glass',
          'bg-gray-800 border-gray-700 shadow-2xl': variant === 'elevated',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('p-6 pb-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-lg font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  );
}