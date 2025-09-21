import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger?: React.ReactElement;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {trigger ? (
        React.cloneElement(trigger, {
          onClick: (e: React.MouseEvent) => {
            trigger.props.onClick?.(e);
            setIsOpen(prev => !prev);
          }
        })
      ) : (
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      )}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 origin-bottom-right">
          <div className="py-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 ${className || ''}`}
  >
    {children}
  </button>
);

export default DropdownMenu;
