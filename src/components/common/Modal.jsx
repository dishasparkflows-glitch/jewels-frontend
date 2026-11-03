import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/* eslint-disable react/prop-types */
export default function Modal({ open, onClose, label, children, className = '' }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDrawer = className.includes('cart-drawer');

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className={`fixed inset-0 z-[9000] bg-black/60 backdrop-blur-xs flex ${
        isDrawer ? 'justify-end' : 'items-center justify-center p-3 sm:p-4 overflow-y-auto'
      } animate-fadeIn`}
    >
      <div
        className={`relative ${
          isDrawer
            ? 'h-full w-[min(460px,100vw)] max-h-none shadow-2xl'
            : 'm-auto max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)]'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
