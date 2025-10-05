import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  labelClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, leftIcon, rightElement, labelClassName = '', className = '', ...props }) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium text-[var(--space-text-secondary)] mb-1.5 tracking-wide ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgba(167,192,255,0.6)]">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={`block w-full px-3 py-2 bg-[rgba(18,22,54,0.85)] border border-[rgba(130,163,255,0.35)] rounded-lg text-sm shadow-[0_12px_25px_rgba(8,0,35,0.45)] placeholder-[rgba(181,203,255,0.45)] focus:outline-none focus:border-[rgba(111,160,255,0.8)] focus:ring-2 focus:ring-[rgba(102,141,255,0.5)] focus:ring-offset-2 focus:ring-offset-[rgba(7,9,24,0.75)] disabled:bg-[rgba(12,16,38,0.5)] disabled:text-[rgba(160,182,240,0.45)] disabled:border-[rgba(96,120,180,0.35)] ${leftIcon ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </span>
        )}
      </div>
    </div>
  );
};

export default Input;