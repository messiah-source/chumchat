import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...rest }, ref) => (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="font-mono text-xs text-cyber-text-dim uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        ref={ref}
        {...rest}
        className={`
          font-mono text-sm bg-cyber-panel border rounded-sm px-3 py-2.5
          text-cyber-text placeholder-cyber-text-muted
          dark:border-cyber-border dark:focus:border-cyber-cyan
          light:border-light-border light:bg-light-panel light:text-light-text
          focus:outline-none focus:ring-1 focus:ring-cyber-cyan/30
          transition-colors duration-200
          ${error ? 'border-cyber-red focus:ring-cyber-red/30' : ''}
          ${className}
        `}
      />
      {error && <span className="font-mono text-xs text-cyber-red">{error}</span>}
    </div>
  ),
);

Input.displayName = 'Input';
