import { useEffect, useRef } from 'react';

/* eslint-disable react/prop-types */
export default function Modal({ open, onClose, label, children, className = '' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const previousOverflow = document.body.style.overflow;
    if (open && !dialog.open) {
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleCancel = (event) => {
    event.preventDefault();
    onClose();
  };

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={handleCancel}
      onMouseDown={handleBackdropClick}
      className={`store-modal m-auto max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-visible rounded-lg border-0 bg-transparent p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm ${className}`}
    >
      {children}
    </dialog>
  );
}
