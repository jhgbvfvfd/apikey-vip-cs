import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-[0_25px_45px_rgba(20,0,60,0.45)] hover:-translate-y-0.5 transition-all duration-300'
    : '';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[rgba(138,178,255,0.25)] bg-[rgba(18,22,52,0.78)] text-[var(--space-text-primary)] shadow-[0_25px_45px_rgba(10,0,50,0.35)] backdrop-blur-2xl ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(108,128,255,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[rgba(93,142,255,0.4)] to-transparent" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`border-b border-[rgba(120,150,255,0.2)] p-4 text-[var(--space-text-secondary)] ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-[var(--space-text-primary)] tracking-wide ${className}`}>{children}</h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 text-[var(--space-text-secondary)] ${className}`}>
    {children}
  </div>
);


export default Card;