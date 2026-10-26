import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import { useCart } from '../../contexts/CartContext';
import Modal from '../common/Modal';
import EmptyCartView from './EmptyCartView';
import { getImageUrl } from '../../utils/imageUrl';
import { getPrimaryProductImage } from '../../utils/productImages';
import { resolveMetalName } from '../../utils/metalColors';

/* eslint-disable react/prop-types */
const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function CartDrawer({ open, onClose }) {
  const { cart, totalItems, subtotal, removeFromCart, refreshCart } = useCart();
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
              const metalName = resolveMetalName(item.selectedMetal);
              return (
                <li key={`${item.id}-${item.selectedMetal || ''}`} className="flex gap-4 py-5">
                  <img src={getImageUrl(item.image) || getPrimaryProductImage(item) || '/featured/ring.jpg'} alt={item.name} className="h-24 w-20 shrink-0 bg-[#f3f0eb] object-contain p-2" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${encodeURIComponent(item.slug || (item.name ? item.name.toLowerCase().trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') : ''))}`} onClick={onClose} className="line-clamp-2 text-sm leading-5 hover:text-[#92704e]">{item.name}</Link>
                    <p className="mt-1 text-xs text-stone-500">Qty {item.quantity}{metalName ? ` · ${metalName}` : ''}</p>
                    <p className="mt-2 text-sm font-semibold">{formatPrice(item.price)}</p>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name} from cart`} className="self-start p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors">
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
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
          <Link to="/cart" onClick={onClose} className={`mt-5 flex w-full items-center justify-center bg-[#201e1b] py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#92704e] ${cart.length ? '' : 'pointer-events-none opacity-40'}`} aria-disabled={!cart.length}>
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
