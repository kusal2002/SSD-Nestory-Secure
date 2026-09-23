import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  size = 'md',
  isLoading = false,
}) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
      return undefined;
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isRendered) {
    return null;
  }

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] ${sizeMap[size]} w-full overflow-hidden border border-orange-50/50 transform transition-all duration-300 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header - Glass effect */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-orange-50 bg-gradient-to-r from-white to-orange-50/30">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
            <div className="h-1 w-8 bg-nestory-500 rounded-full mt-1"></div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-100/50 text-gray-400 hover:text-nestory-600 rounded-xl transition-all duration-200 group"
            disabled={isLoading}
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content - Modern scrollbar */}
        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white/50">
          {children}
        </div>

        {/* Footer */}
        {onConfirm && (
          <div className="flex gap-3 justify-end px-8 py-5 border-t border-orange-50 bg-orange-50/20">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="relative overflow-hidden px-8 py-2.5 bg-nestory-600 text-white font-black rounded-xl hover:bg-nestory-700 hover:shadow-lg hover:shadow-nestory-200 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <span className="relative z-10">{confirmText}</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
