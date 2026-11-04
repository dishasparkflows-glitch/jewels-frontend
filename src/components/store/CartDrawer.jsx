import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineX, HiOutlineTrash, HiPlus, HiMinus, HiArrowRight } from 'react-icons/hi';
import { useCart } from '../../contexts/CartContext';
import Modal from '../common/Modal';
import EmptyCartView from './EmptyCartView';
import { formatPrice } from '../../utils/currency';
import { getImageUrl } from '../../utils/imageUrl';
import { getPrimaryProductImage } from '../../utils/productImages';
import { resolveMetalName, cleanAttribute } from '../../utils/metalColors';

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
      <aside className="relative flex h-[100dvh] w-[min(100vw,480px)] flex-col bg-[#faf7f2] text-[#201e1b] shadow-2xl overflow-hidden font-sans">
        
        {/* Subtle Luxury Floral Watermark at Bottom Right */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.07] select-none overflow-hidden z-0">
          <svg width="280" height="280" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C80 60 40 80 0 100C40 120 80 140 100 180C120 140 160 120 200 100C160 80 120 60 100 20Z" fill="#9c774e" />
            <path d="M100 45C85 75 55 90 25 100C55 110 85 125 100 155C115 125 145 110 175 100C145 90 115 75 100 45Z" fill="#9c774e" />
            <circle cx="100" cy="100" r="14" fill="#9c774e" />
          </svg>
        </div>

        {/* ─── Header: Your Bag | 1 item ─────────────────────────── */}
        <header className="relative z-10 flex items-center justify-between border-b border-[#ebdcc8] px-6 py-5 bg-[#faf7f2]">
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
            className="rounded-full p-2 text-stone-500 hover:text-stone-900 hover:bg-[#f2e9dc] transition-colors cursor-pointer"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </header>

        {/* ─── Cart Items List ────────────────────────────────────── */}
        {cart.length ? (
          <ul className="relative z-10 flex-1 divide-y divide-[#ebdcc8] overflow-y-auto px-6 luxury-scrollbar">
            {cart.map((item, index) => {
              const attrs = item.selectedAttributes || {};
              const rawDiamondType = attrs.diamondType || 'LAB GROWN DIAMOND';
              const diamondType = cleanAttribute(rawDiamondType) || 'LAB GROWN DIAMOND';
              const metalPurity = cleanAttribute(attrs.metalPurity) || '';
              const metalColor = cleanAttribute(attrs.metalColor) || resolveMetalName(item.selectedMetal) || '';
              const metalDisplay = [metalPurity, metalColor].filter(Boolean).join(' ') || resolveMetalName(item.selectedMetal);
              const diamondShape = cleanAttribute(attrs.diamondShape) || '';
              const diamondColor = cleanAttribute(attrs.diamondColor) || '';
              const diamondClarity = cleanAttribute(attrs.diamondClarity) || '';
              const clarityDisplay = [diamondColor, diamondClarity].filter(Boolean).join(' ');
              const caratWeight = attrs.caratWeight != null ? attrs.caratWeight : null;
              const sizeDisplay = cleanAttribute(attrs.size || item.selectedSize);

              let centerSummary = '';
              if (diamondType || caratWeight || clarityDisplay) {
                const parts = [];
                if (caratWeight) parts.push(`${caratWeight} CT`);
                if (clarityDisplay) parts.push(`Clarity: ${clarityDisplay}`);
                const detailsStr = parts.length > 0 ? ` (${parts.join(', ')})` : '';
                centerSummary = `Center: ${diamondType}${detailsStr}`;
              }

              const displayName = item.title || item.basicInfo?.title || 'Fine Jewellery';
              const targetIdentifier = item.slug || item.basicInfo?.slug || item.productId || item.id || (displayName ? displayName.toLowerCase().trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') : '');
              const productLink = `/product/${encodeURIComponent(targetIdentifier)}`;

              const itemKey = `${item.id || item.productId || index}-${item.selectedMetal || ''}-${item.selectedSize || ''}`;

              return (
                <li key={itemKey} className="flex gap-4 py-5">
                  {/* Clickable Image Link to PDP */}
                  <Link
                    to={productLink}
                    onClick={onClose}
                    className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 bg-[#f4ece1] rounded-2xl p-2.5 border border-[#eae0d2] block cursor-pointer hover:opacity-95 transition-opacity overflow-hidden"
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

                    {/* Diamond Type Pill Badge */}
                    {diamondType && (
                      <div className="mt-1.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#f1e6d8] text-[#866543] border border-[#e5d5c0]">
                          {diamondType}
                        </span>
                      </div>
                    )}

                    {/* Attributes 2-Column Grid with Vertical Divider */}
                    {(metalDisplay || metalColor || clarityDisplay || caratWeight != null || diamondShape || sizeDisplay) && (
                      <div className="mt-2 grid grid-cols-2 text-[9px] sm:text-[10px] tracking-wide uppercase font-sans border-b border-[#ebdcc8]/70 pb-2">
                        {/* Left Column */}
                        <div className="border-r border-[#ebdcc8] pr-2 space-y-1">
                          {metalDisplay && (
                            <p className="text-stone-600 font-semibold">
                              METAL: <span className="text-stone-900 font-bold">{metalDisplay}</span>
                            </p>
                          )}
                          {clarityDisplay && (
                            <p className="text-stone-600 font-semibold">
                              CLARITY: <span className="text-stone-900 font-bold">{clarityDisplay}</span>
                            </p>
                          )}
                          {diamondShape && (
                            <p className="text-stone-600 font-semibold">
                              DIAMOND SHAPE: <span className="text-stone-900 font-bold">{diamondShape}</span>
                            </p>
                          )}
                          {!metalDisplay && sizeDisplay && (
                            <p className="text-stone-600 font-semibold">
                              SIZE: <span className="text-stone-900 font-bold">{sizeDisplay}</span>
                            </p>
                          )}
                        </div>

                        {/* Right Column */}
                        <div className="pl-2.5 space-y-1">
                          {metalColor && (
                            <p className="text-stone-600 font-semibold">
                              COLOR: <span className="text-stone-900 font-bold">{metalColor}</span>
                            </p>
                          )}
                          {caratWeight != null && (
                            <p className="text-stone-600 font-semibold">
                              CARAT: <span className="text-stone-900 font-bold">{caratWeight}</span>
                            </p>
                          )}
                          {metalDisplay && sizeDisplay && (
                            <p className="text-stone-600 font-semibold">
                              SIZE: <span className="text-stone-900 font-bold">{sizeDisplay}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Center Diamond Summary */}
                    {centerSummary && (
                      <p className="mt-1.5 text-[10px] text-stone-500 font-sans">
                        {centerSummary}
                      </p>
                    )}

                    {/* Price */}
                    <p className="mt-2 font-sans text-xs sm:text-sm font-bold text-stone-900">
                      {formatPrice(item.price)}
                    </p>

                    {/* Stepper + Remove row */}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      {/* Rounded Pill Stepper */}
                      <div className="inline-flex items-center rounded-full border border-[#d8c8b4] bg-white px-2.5 py-0.5 shadow-2xs">
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
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#8a7258] hover:text-[#6e5840] transition-colors cursor-pointer uppercase"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
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
        <footer className="relative z-10 border-t border-[#ebdcc8] bg-[#faf7f2] px-6 pb-6 pt-5 shadow-[0_-8px_24px_rgba(0,0,0,0.03)]">
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
