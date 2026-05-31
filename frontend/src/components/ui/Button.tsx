import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const variants = {
  primary: 'bg-cyber-red hover:bg-red-500 text-white shadow-cyber-red border border-red-600',
  secondary: 'bg-cyber-panel-2 hover:bg-cyber-panel-3 text-cyber-text border border-cyber-border',
  danger: 'bg-red-800 hover:bg-red-700 text-white border border-red-600',
  ghost: 'bg-transparent hover:bg-cyber-panel-2 text-cyber-text-dim border border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', children, loading, className = '', disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`font-mono rounded-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <span className="animate-pulse">...</span> : children}
    </button>
  );
}
