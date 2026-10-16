/* eslint-disable react/prop-types */
import { HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi';

export default function FilterGroup({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen || undefined} className="group/filter border-b border-stone-200/70 py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] text-stone-700 [&::-webkit-details-marker]:hidden">
        {title}
        <HiOutlinePlus className="h-4 w-4 text-stone-400 group-open/filter:hidden" />
        <HiOutlineMinus className="hidden h-4 w-4 text-stone-400 group-open/filter:block" />
      </summary>
      <div className="space-y-3 pt-5 text-sm text-stone-600">{children}</div>
    </details>
  );
}
