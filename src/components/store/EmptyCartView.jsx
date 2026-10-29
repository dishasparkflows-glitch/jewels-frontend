import { Link } from 'react-router-dom';

/* eslint-disable react/prop-types */
export const EmptyBagIllustration = ({ className = 'w-44 h-44 sm:w-52 sm:h-52' }) => (
  <div className={`relative mx-auto flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background Soft Circular Halo */}
      <circle cx="120" cy="120" r="76" fill="#FDFBF7" stroke="#EBDCC8" strokeWidth="1.2" />

      {/* Left Botanical Sprig */}
      <path
        d="M 52 148 C 64 143 75 146 84 154"
        stroke="#CAA062"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 60 146 C 62 139 68 136 74 140"
        stroke="#CAA062"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M 70 144 C 73 136 80 135 84 141"
        stroke="#CAA062"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M 78 150 C 82 144 88 144 91 151"
        stroke="#CAA062"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Right Botanical Sprig */}
      <path
        d="M 188 148 C 176 143 165 146 156 154"
        stroke="#CAA062"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 180 146 C 178 139 172 136 166 140"
        stroke="#CAA062"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M 170 144 C 167 136 160 135 156 141"
        stroke="#CAA062"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M 162 150 C 158 144 152 144 149 151"
        stroke="#CAA062"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* 4-Point Golden Stars / Sparkles */}
      <path d="M 98 80 Q 98 86 92 86 Q 98 86 98 92 Q 98 86 104 86 Q 98 86 98 80 Z" fill="#D4A362" />
      <path d="M 144 72 Q 144 78 139 78 Q 144 78 144 84 Q 144 78 149 78 Q 144 78 144 72 Z" fill="#D4A362" />
      <path d="M 154 102 Q 154 106 150 106 Q 154 106 154 110 Q 154 106 158 106 Q 154 106 154 102 Z" fill="#D4A362" />

      {/* Bag Handle */}
      <path
        d="M 108 93 C 108 73, 132 73, 132 93"
        stroke="#A87738"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bag Body Front Panel */}
      <path
        d="M 100 93 L 95 152 C 95 154.5 96.5 156 99 156 L 141 156 C 143.5 156 145 154.5 145 152 L 140 93 Z"
        stroke="#A87738"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="#FFFFFF"
      />

      {/* Bag Side Crease */}
      <path
        d="M 100 93 L 103 156"
        stroke="#CAA062"
        strokeWidth="1.2"
        strokeDasharray="2.5 2"
      />

      {/* Top Bag Opening Fold */}
      <line x1="99" y1="97" x2="141" y2="97" stroke="#E6CEAB" strokeWidth="1" />

      {/* Center Faceted Diamond Outline */}
      <g transform="translate(112, 116) scale(0.95)">
        <polygon
          points="8,0 16,0 21,5 12,17 3,5"
          fill="#FFFDF7"
          stroke="#A87738"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <line x1="8" y1="0" x2="12" y2="17" stroke="#A87738" strokeWidth="0.9" />
        <line x1="16" y1="0" x2="12" y2="17" stroke="#A87738" strokeWidth="0.9" />
        <line x1="3" y1="5" x2="21" y2="5" stroke="#A87738" strokeWidth="0.9" />
        <line x1="8" y1="0" x2="3" y2="5" stroke="#A87738" strokeWidth="0.9" />
        <line x1="16" y1="0" x2="21" y2="5" stroke="#A87738" strokeWidth="0.9" />
      </g>
    </svg>
  </div>
);

export default function EmptyCartView({ isDrawer = false, onClose }) {
  if (isDrawer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center animate-in fade-in duration-200">
        <EmptyBagIllustration className="w-36 h-36" />
        <h3 className="font-serif text-xl font-normal text-[#1A1815] mt-4">
          Your Shopping Bag is Empty
        </h3>
        <p className="mt-2 text-xs text-stone-500 leading-relaxed max-w-xs">
          Looks like you haven&apos;t found your perfect piece yet. Explore our handcrafted jewellery.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-xs">
          <Link
            to="/shop"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#be8438] hover:bg-[#a6712c] text-white text-xs font-bold uppercase tracking-[0.16em] py-3.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <span>EXPLORE JEWELLERY</span>
            <span className="text-sm font-bold">›</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-16 sm:py-24 px-4 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
      <EmptyBagIllustration className="w-48 h-48 sm:w-56 sm:h-56" />

      <h1 className="font-serif text-2xl sm:text-3xl lg:text-[38px] font-normal text-[#1A1815] tracking-tight mt-6">
        Your Shopping Bag is Empty
      </h1>

      <div className="mt-3 text-stone-500 text-xs sm:text-sm leading-relaxed max-w-md mx-auto space-y-0.5">
        <p>Looks like you haven&apos;t found your perfect piece yet.</p>
        <p>Explore our handcrafted jewellery and find something you&apos;ll treasure.</p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3.5">
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-2 bg-[#be8438] hover:bg-[#a6712c] text-white text-xs font-bold uppercase tracking-[0.16em] px-8 py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span>EXPLORE JEWELLERY</span>
          <span className="text-sm font-bold">›</span>
        </Link>
      </div>
    </div>
  );
}
