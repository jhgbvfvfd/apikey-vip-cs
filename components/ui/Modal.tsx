import React, { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  disableBackdropClose?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  disableBackdropClose = false,
  showCloseButton = true,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  const handleBackdropClick = () => {
    if (!disableBackdropClose) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleBackdropClick}
    >
      <div className="fixed inset-0 bg-[rgba(3,4,18,0.85)] backdrop-blur-xl"></div>
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(134,165,255,0.35)] bg-[rgba(16,20,46,0.88)] shadow-[0_30px_60px_rgba(5,0,35,0.6)] transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,150,255,0.25),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[rgba(123,92,255,0.6)] to-transparent" />
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-[rgba(120,150,255,0.25)]">
          <h2 className="text-lg font-semibold text-[var(--space-text-primary)] tracking-wide">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-[rgba(184,206,255,0.65)] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(110,160,255,0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(7,9,24,0.75)] rounded-full p-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="relative px-5 py-4 text-[var(--space-text-secondary)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;