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
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-md transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-3 border-b border-slate-200">
          <h2 className="text-md font-semibold text-slate-800">{title}</h2>
          {showCloseButton && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-3">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;