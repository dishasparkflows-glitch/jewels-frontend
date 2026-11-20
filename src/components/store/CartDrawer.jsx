import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineX, HiOutlineTrash, HiPlus, HiMinus, HiArrowRight } from 'react-icons/hi';
import { useCart } from '../../contexts/CartContext';
import Modal from '../common/Modal';
import EmptyCartView from './EmptyCartView';
import { formatPrice } from '../../utils/currency';
import { getImageUrl } from '../../utils/imageUrl';
import { getPrimaryProductImage } from '../../utils/productImages';
import { getItemSpecs } from '../../utils/productSpecs';
import ItemSpecsDisplay from '../common/ItemSpecsDisplay';

/* eslint-disable react/prop-types */

export default function CartDrawer({ open, onClose }) {
  const { cart, totalItems, subtotal, updateQuantity, removeFromCart, refreshCart } = useCart();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      refreshCart();
    }
    wasOpenRef.current = open;
  }, [open, refreshCart]);

  return (
    <Modal open={open} onClose={onClose} label="Shopping bag" className="cart-drawer">
      <aside className="relative flex h-[100dvh] w-[min(100vw,480px)] flex-col bg-white text-[#201e1b] shadow-2xl overflow-hidden font-sans">
        
        {/* Subtle Luxury Floral Watermark at Bottom Right */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.03] select-none overflow-hidden z-0">
          <svg width="280" height="280" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C80 60 40 80 0 100C40 120 80 140 100 180C120 140 160 120 200 100C160 80 120 60 100 20Z" fill="#9c774e" />
            <path d="M100 45C85 75 55 90 25 100C55 110 85 125 100 155C115 125 145 110 175 100C145 90 115 75 100 45Z" fill="#9c774e" />
            <circle cx="100" cy="100" r="14" fill="#9c774e" />
          </svg>
        </div>

        {/* ─── Header: Your Bag | 1 item ─────────────────────────── */}
        <header className="relative z-10 flex items-center justify-between border-b border-stone-200/80 px-6 py-5 bg-white">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-2xl font-normal text-stone-900">Your Bag</h2>
            <span className="text-stone-300 font-light select-none">|</span>
            <span className="text-xs text-stone-500">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="rounded-full p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </header>

        {/* ─── Cart Items List ────────────────────────────────────── */}
        {cart.length ? (
          <ul className="relative z-10 flex-1 divide-y divide-stone-100 overflow-y-auto px-6 luxury-scrollbar bg-white">
            {cart.map((item, index) => {
              const specs = getItemSpecs(item);
              const { displayName, productLink } = specs;
              const itemKey = `${item.id || item.productId || index}-${item.selectedMetal || ''}-${item.selectedSize || ''}`;

              return (
                <li key={itemKey} className="flex gap-4 py-5">
                  {/* Clickable Image Link to PDP */}
                  <Link
                    to={productLink}
                    onClick={onClose}
                    className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 bg-[#fbf9f6] rounded-2xl p-2.5 border border-stone-200/80 block cursor-pointer hover:opacity-95 transition-opacity overflow-hidden"
                    title={`View ${displayName}`}
                  >
                    <img
                      src={getImageUrl(item.image) || getPrimaryProductImage(item) || '/featured/ring.jpg'}
                      alt={displayName}
                      className="h-full w-full object-contain"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    {/* Clickable Title Link to PDP */}
                    <Link
                      to={productLink}
                      onClick={onClose}
                      className="line-clamp-2 text-xs font-semibold leading-snug text-stone-900 hover:text-[#92704e] transition-colors block cursor-pointer font-sans"
                    >
                      {displayName}
                    </Link>

                    {/* Shared Specs Display */}
                    <ItemSpecsDisplay specs={specs} />

                    {/* Price */}
                    <p className="mt-2 font-sans text-xs sm:text-sm font-bold text-stone-900">
                      {formatPrice(item.price)}
                    </p>

                    {/* Stepper + Remove row */}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      {/* Rounded Pill Stepper */}
                      <div className="inline-flex items-center rounded-full border border-stone-200 bg-white px-2.5 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${displayName}`}
                          className="flex h-6 w-5 items-center justify-center text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                        >
                          <HiMinus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-stone-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${displayName}`}
                          className="flex h-6 w-5 items-center justify-center text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                        >
                          <HiPlus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove Button with Trash Icon */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${displayName} from cart`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-red-500 hover:text-red-700 transition-colors cursor-pointer uppercase group"
                      >
                        <HiOutlineTrash className="h-4 w-4 text-red-500 group-hover:text-red-700 transition-colors" />
                        <span>REMOVE</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyCartView isDrawer onClose={onClose} />
        )}

        {/* ─── Footer: Subtotal + Checkout + Continue Shopping ────── */}
        <footer className="relative z-10 border-t border-stone-200/80 bg-white px-6 pb-6 pt-5 shadow-[0_-8px_24px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-800">
              SUBTOTAL
            </span>
            <span className="font-sans text-lg sm:text-xl font-bold text-stone-900">
              {formatPrice(subtotal)}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Taxes and shipping calculated at checkout.
          </p>

          <Link
            to="/checkout"
            onClick={onClose}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#9c774e] hover:bg-[#85633e] py-3.5 text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-white transition-all shadow-sm ${
              cart.length ? '' : 'pointer-events-none opacity-40'
            }`}
            aria-disabled={!cart.length}
          >
            <span>PROCEED TO CHECKOUT</span>
            <HiArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-3.5 block w-full text-center text-xs font-bold uppercase tracking-[0.18em] text-stone-800 hover:text-[#9c774e] transition-colors underline underline-offset-4 decoration-stone-800 hover:decoration-[#9c774e] cursor-pointer"
          >
            CONTINUE SHOPPING
          </button>
        </footer>
      </aside>
    </Modal>
  );
}
