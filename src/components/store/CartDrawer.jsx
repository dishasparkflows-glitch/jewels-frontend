import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineX, HiPlus, HiMinus } from 'react-icons/hi';
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
      <aside className="flex h-[100dvh] w-[min(100vw,460px)] flex-col bg-[#fffdfb] text-[#201e1b] shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-2xl">Cart</h2>
            <span className="text-xs text-stone-500">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close shopping bag" className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">
            <HiOutlineX className="h-5 w-5" />
          </button>
        </header>

        {cart.length ? (
          <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto px-6">
            {cart.map((item) => {
              const attrs = item.selectedAttributes || {};
              const diamondType = attrs.diamondType || '';
              const metalPurity = attrs.metalPurity || '';
              const metalColor = attrs.metalColor || resolveMetalName(item.selectedMetal) || '';
              const metalDisplay = [metalPurity, metalColor].filter(Boolean).join(' ') || resolveMetalName(item.selectedMetal);
              const diamondShape = attrs.diamondShape || '';
              const diamondColor = attrs.diamondColor || '';
              const diamondClarity = attrs.diamondClarity || '';
              const clarityDisplay = [diamondColor, diamondClarity].filter(Boolean).join(' ');
              const caratWeight = attrs.caratWeight != null ? attrs.caratWeight : null;
              const sizeDisplay = cleanAttribute(attrs.size || item.selectedSize);

              let centerSummary = '';
              if (diamondType || caratWeight || clarityDisplay) {
                const parts = [];
                if (caratWeight) parts.push(`${caratWeight} CT`);
                if (clarityDisplay) parts.push(`Clarity: ${clarityDisplay}`);
                const detailsStr = parts.length > 0 ? ` (${parts.join(', ')})` : '';
                centerSummary = `Center: ${diamondType || 'Diamond'}${detailsStr}`;
              }

              const targetIdentifier = item.slug || item.productId || item.id || (item.name ? item.name.toLowerCase().trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') : '');
              const productLink = `/product/${encodeURIComponent(targetIdentifier)}`;

              return (
                <li key={`${item.id}-${item.selectedMetal || ''}`} className="flex gap-4 py-5">
                  {/* Clickable Image Link to PDP */}
                  <Link
                    to={productLink}
                    onClick={onClose}
                    className="h-24 w-20 shrink-0 bg-[#f3f0eb] object-contain p-2 rounded-sm block cursor-pointer hover:opacity-90 transition-opacity"
                    title={`View ${item.name}`}
                  >
                    <img
                      src={getImageUrl(item.image) || getPrimaryProductImage(item) || '/featured/ring.jpg'}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    {/* Clickable Title Link to PDP */}
                    <Link
                      to={productLink}
                      onClick={onClose}
                      className="line-clamp-2 text-xs font-semibold leading-snug text-stone-900 hover:text-[#92704e] transition-colors block cursor-pointer"
                    >
                      {item.name}
                    </Link>

                    {/* Clickable Details Block to PDP */}
                    <Link
                      to={productLink}
                      onClick={onClose}
                      className="block cursor-pointer group"
                    >
                      {/* Diamond Type Tag */}
                      {diamondType && (
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#b83b3b]">
                          {diamondType}
                        </p>
                      )}

                      {/* Attributes 2-Column Grid */}
                      {(metalDisplay || metalColor || clarityDisplay || caratWeight != null || diamondShape || sizeDisplay) && (
                        <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-medium tracking-wide uppercase text-stone-500 font-sans group-hover:text-stone-700 transition-colors">
                          {metalDisplay && (
                            <p>METAL: <span className="text-stone-800 font-semibold">{metalDisplay}</span></p>
                          )}
                          {metalColor && (
                            <p>COLOR: <span className="text-stone-800 font-semibold">{metalColor}</span></p>
                          )}
                          {clarityDisplay && (
                            <p>CLARITY: <span className="text-stone-800 font-semibold">{clarityDisplay}</span></p>
                          )}
                          {caratWeight != null && (
                            <p>CARAT: <span className="text-stone-800 font-semibold">{caratWeight}</span></p>
                          )}
                          {diamondShape && (
                            <p className="col-span-2">DIAMOND SHAPE: <span className="text-stone-800 font-semibold">{diamondShape}</span></p>
                          )}
                          {sizeDisplay && (
                            <p>SIZE: <span className="text-stone-800 font-semibold">{sizeDisplay}</span></p>
                          )}
                        </div>
                      )}

                      {/* Center Diamond Summary */}
                      {centerSummary && (
                        <p className="mt-1 text-[9px] text-stone-400 font-sans">
                          {centerSummary}
                        </p>
                      )}

                      <p className="mt-2 text-xs font-bold text-stone-900">{formatPrice(item.price)}</p>
                    </Link>

                    {/* Stepper + Remove row */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-md border border-stone-200 bg-[#fbfaf8] text-[#2c2722]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex h-6 w-6 items-center justify-center text-xs font-bold text-stone-500 hover:text-[#2c2722] hover:bg-stone-100 rounded-l-md transition-colors cursor-pointer"
                        >
                          <HiMinus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-6 w-6 items-center justify-center text-xs font-bold text-stone-500 hover:text-[#2c2722] hover:bg-stone-100 rounded-r-md transition-colors cursor-pointer"
                        >
                          <HiPlus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="text-xs">✕</span>
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

        <footer className="border-t border-stone-200 bg-white px-6 pb-6 pt-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">Shipping and taxes are calculated at checkout.</p>
          <Link to="/cart" onClick={onClose} className={`btn-theme-primary mt-5 flex w-full items-center justify-center py-4 text-xs font-semibold uppercase tracking-[0.2em] transition ${cart.length ? '' : 'pointer-events-none opacity-40'}`} aria-disabled={!cart.length}>
            Checkout
          </Link>
          <Link to="/cart" onClick={onClose} className="mt-4 block text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#92704e] underline underline-offset-4">
            View shopping cart
          </Link>
        </footer>
      </aside>
    </Modal>
  );
}
