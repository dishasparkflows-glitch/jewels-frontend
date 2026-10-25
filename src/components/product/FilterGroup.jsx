/* eslint-disable react/prop-types */
import { HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi';

export default function FilterGroup({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen || undefined} className="group/filter border-b border-stone-200/80 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs sm:text-[12.5px] font-semibold uppercase tracking-[0.06em] text-stone-800 hover:text-stone-950 select-none [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <HiOutlinePlus className="h-3.5 w-3.5 text-stone-400 group-open/filter:hidden shrink-0" />
        <HiOutlineMinus className="hidden h-3.5 w-3.5 text-stone-400 group-open/filter:block shrink-0" />
      </summary>
      <div className="space-y-2.5 pt-3.5 pb-1 text-xs text-stone-600 max-h-64 overflow-y-auto pr-1">{children}</div>
    </details>
  );
}
