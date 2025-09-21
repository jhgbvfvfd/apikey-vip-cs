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
        <label htmlFor={id} className={`block text-sm font-medium text-slate-700 mb-1.5 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={`block w-full px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none ${leftIcon ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''} ${className}`}
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