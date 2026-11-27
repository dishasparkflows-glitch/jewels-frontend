/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi';

export default function FilterGroup({ title, children, defaultOpen = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true);
    }
  }, [defaultOpen]);

  return (
    <div className={`group/filter border-b border-stone-200/80 py-3.5 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer list-none items-center justify-between gap-3 text-xs sm:text-[13px] font-semibold uppercase tracking-[0.06em] text-stone-800 hover:text-stone-950 select-none text-left"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? (
          <HiOutlineMinus className="h-3.5 w-3.5 text-stone-400 shrink-0" />
        ) : (
          <HiOutlinePlus className="h-3.5 w-3.5 text-stone-400 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-2.5 pt-3 pb-1 text-sm text-stone-600 animate-fadeIn">{children}</div>
      )}
    </div>
  );
}
