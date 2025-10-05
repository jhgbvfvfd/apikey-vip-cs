import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  size?: 'sm' | 'md';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', size = 'md', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(10,0,40,0.35)]';

  const sizeClasses = {
      md: 'px-4 py-2 text-sm',
      sm: 'px-3 py-1.5 text-xs'
  };

  const variantClasses = {
    primary:
      'bg-[linear-gradient(135deg,#7b5bff,#25d6ff)] text-white hover:brightness-110 focus-visible:ring-[rgba(98,138,255,0.45)] focus-visible:ring-offset-[rgba(9,13,34,0.8)]',
    secondary:
      'bg-[rgba(29,37,85,0.75)] text-[var(--space-text-secondary)] border border-[rgba(131,163,255,0.3)] hover:bg-[rgba(46,59,122,0.85)] focus-visible:ring-[rgba(86,136,255,0.4)] focus-visible:ring-offset-[rgba(9,13,34,0.85)]',
    danger:
      'bg-[linear-gradient(135deg,#ff4d8f,#ff8756)] text-white hover:brightness-110 focus-visible:ring-[rgba(255,120,160,0.45)] focus-visible:ring-offset-[rgba(9,13,34,0.85)]',
  };

  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;