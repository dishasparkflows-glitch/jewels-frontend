import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import {
  HiOutlineTrash,
  HiOutlineArrowNarrowLeft,
  HiOutlineLockClosed,
  HiChevronDown,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { getItemSpecs } from '../../utils/productSpecs';

import EmptyCartView from '../../components/store/EmptyCartView';
import { formatPrice } from '../../utils/currency';

const formatCategoryName = (cat) => {
  if (!cat) return '';
  const val = typeof cat === 'object' ? (cat.name || '') : cat;
  const str = String(val).trim();
  if (!str || /^[0-9a-fA-F]{24}$/.test(str)) return '';

  return str
    .replace(/[_-]+/g, ' ')
    .replace(/collectionn/i, 'Collection')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w === 'collectionn' ? 'Collection' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
};

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, subtotal, shipping, tax, total } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ text: '', type: '' });

  const itemsListRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  const checkScroll = () => {
    if (itemsListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = itemsListRef.current;
      setCanScroll(scrollTop + clientHeight < scrollHeight - 8);
    }
  };

  useEffect(() => {
    checkScroll();
  }, [cart]);

  const applyPromo = (e) => {
    e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) {
      setPromoMessage({ text: 'Please enter a privilege code', type: 'error' });
      return;
    }
    if (cleanCode === 'JEWELS10' || cleanCode === 'WELCOME10') {
      setDiscountPercent(10);
      setPromoMessage({ text: '10% VIP Privilege discount applied!', type: 'success' });
    } else {
      setDiscountPercent(0);
      setPromoMessage({ text: 'Invalid privilege code', type: 'error' });
    }
  };

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, total - discountAmount);

  if (cart.length === 0) {
    return <EmptyCartView />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 sm:pb-12 space-y-4 sm:space-y-5">
      {/* Title & Return */}
      <div className="flex items-center justify-between gap-3 pb-3 sm:pb-3.5 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-xl sm:text-3xl font-medium text-[#26221e]">
            Shopping Bag ({cart.length})
          </h1>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[#d6c7b2] bg-white hover:bg-[#FAF7F2] hover:border-[#8b6f4e] text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#8b6f4e] transition-all shadow-2xs cursor-pointer group shrink-0"
        >
          <HiOutlineArrowNarrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8b6f4e] group-hover:-translate-x-0.5 transition-transform" />
          <span>Continue Exploring</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
        {/* Cart Items Box (Single contained box with scroll) */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-3 sm:p-6 lg:p-7 shadow-sm space-y-3 sm:space-y-4">
          {/* Header inside the box */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3.5 border-b border-stone-150">
            <h2 className="font-serif text-base sm:text-xl font-medium text-[#26221e]">
              Items in Your Bag <span className="font-sans text-xs sm:text-sm font-normal text-stone-400">({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
            </h2>
          </div>

          {/* Scrollable Products List inside the Box */}
          <div className="relative">
            <div
              ref={itemsListRef}
              onScroll={checkScroll}
              className="max-h-[520px] sm:max-h-[580px] lg:max-h-[620px] overflow-y-auto luxury-scrollbar pr-1 sm:pr-2.5 space-y-2.5 sm:space-y-3.5 pb-2"
            >
              {cart.map((item, index) => {
                const specs = getItemSpecs(item);
                const {
                  isSilver,
                  diamondType,
                  metalDisplay,
                  metalColor,
                  clarityDisplay,
                  diamondShape,
                  caratWeight,
                  sizeDisplay,
                  hasSpecs,
                  productLink,
                } = specs;

                const itemKey = `${item.id || index}-${item.selectedMetal || ''}-${item.selectedSize || ''}`;

                return (
                  <div
                    key={itemKey}
                    className="bg-[#fcfaf7] hover:bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 hover:border-stone-300 p-2.5 sm:p-4.5 flex gap-3 sm:gap-4.5 transition-all shadow-2xs items-start sm:items-center"
                  >
                    <Link
                      to={productLink}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-stone-200/70 shrink-0 flex items-center justify-center p-1 hover:opacity-95 transition-opacity"
                      title={`View ${item.name}`}
                    >
                      <img
                        src={item.image && !isOrnateImage(item.image) ? item.image : getPrimaryProductImage(item)}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      {(formatCategoryName(item.category) || diamondType) && (
                        <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
                          {formatCategoryName(item.category) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#F3E5D1] text-[#7F4F27]">
                              {formatCategoryName(item.category)}
                            </span>
                          )}
                          {diamondType && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#b83b3b] bg-red-50 border border-red-100">
                              {diamondType}
                            </span>
                          )}
                        </div>
                      )}
                      <Link
                        to={productLink}
                        className="block font-sans font-bold text-xs sm:text-base text-stone-900 hover:text-[#8b6b47] transition-colors line-clamp-2 sm:truncate leading-snug"
                        title={item.name}
                      >
                        {item.name}
                      </Link>

                      {/* Attributes Grid */}
                      {hasSpecs && (
                        <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-[11px] sm:text-xs text-stone-600 pt-0.5">
                          {metalDisplay && (
                            <p><span className="text-[10px] sm:text-[11px] font-semibold uppercase text-stone-500">Metal:</span> <span className="text-stone-800 font-medium">{isSilver ? 'Silver' : metalDisplay}</span></p>
                          )}
                          {metalColor && (
                            <p><span className="text-[10px] sm:text-[11px] font-semibold uppercase text-stone-500">Color:</span> <span className="text-stone-800 font-medium">{metalColor}</span></p>
                          )}
                          {clarityDisplay && (
                            <p><span className="text-[10px] sm:text-[11px] font-semibold uppercase text-stone-500">Clarity:</span> <span className="text-stone-800 font-medium">{clarityDisplay}</span></p>
                          )}
                          {caratWeight != null && (
                            <p><span className="text-[10px] sm:text-[11px] font-semibold uppercase text-stone-500">Carat:</span> <span className="text-stone-800 font-medium">{caratWeight}</span></p>
                          )}
                          {diamondShape && (
                            <p><span className="text-[10px] sm:text-[11px] font-semibold uppercase text-stone-500">Shape:</span> <span className="text-stone-800 font-medium">{diamondShape}</span></p>
                          )}
                          {sizeDisplay && (
                            <p><span className="text-[10px] sm:text-[11px] font-semibold uppercase text-stone-500">Size:</span> <span className="text-stone-800 font-medium">{sizeDisplay}</span></p>
                          )}
                        </div>
                      )}

                      {/* Desktop-only Price */}
                      <p className="hidden sm:block text-sm sm:text-base font-bold text-stone-900 pt-0.5">
                        {formatPrice(item.price)}
                      </p>

                      {/* Mobile-only Price + Stepper + Trash Row */}
                      <div className="flex sm:hidden items-center justify-between gap-2 pt-1.5 mt-1 border-t border-stone-200/60">
                        <p className="text-sm font-bold text-stone-900">
                          {formatPrice(item.price)}
                        </p>

                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center bg-white border border-stone-200 rounded-lg px-1 py-0.5 text-[#2c2722] shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-[#2c2722] cursor-pointer text-sm"
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-[#2c2722] cursor-pointer text-sm"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="w-7 h-7 rounded-lg border border-red-200/80 bg-red-50/50 hover:bg-red-100/70 text-red-600 hover:text-red-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop-only Quantity Stepper & Remove Button */}
                    <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
                      <div className="flex items-center bg-white border border-stone-200 rounded-lg px-1.5 py-0.5 text-[#2c2722] shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-[#2c2722] cursor-pointer text-base"
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-[#2c2722] cursor-pointer text-base"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-lg border border-red-200/80 bg-red-50/50 hover:bg-red-100/70 text-red-600 hover:text-red-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:border-red-300 shrink-0"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <HiOutlineTrash className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Indicator Cue: when there are more items to scroll */}
            {canScroll && (
              <div
                onClick={() => itemsListRef.current?.scrollBy({ top: 140, behavior: 'smooth' })}
                className="absolute -bottom-1 left-0 right-0 h-9 bg-gradient-to-t from-white via-white/85 to-transparent flex items-end justify-center pb-0.5 cursor-pointer z-10 select-none group"
                title="Scroll for more items"
              >
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#f8f4ee]/95 border border-[#e6dacb] text-[10px] font-semibold text-[#8c6536] shadow-xs group-hover:bg-[#f2e8dc] transition-all">
                  <span>Scroll for more items ({cart.length})</span>
                  <HiChevronDown className="w-3 h-3 animate-bounce" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-sm lg:sticky lg:top-8">
          <h3 className="font-serif text-xl font-medium text-[#26221e] border-b border-stone-200 pb-4">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span className="text-[#2c2722] font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Insured Courier Shipping</span>
              <span className="text-[#8b6b47] font-medium">
                {shipping === 0 ? 'Complimentary' : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Estimated Sales Tax</span>
              <span className="text-[#2c2722] font-medium">{formatPrice(tax)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>VIP Privilege ({discountPercent}%)</span>
                <span>-${discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-bold text-[#2c2722]">
              <span>Total</span>
              <span className="text-xl text-[#8b6b47] font-serif">
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>

          {/* Promo Code Form */}
          <form onSubmit={applyPromo} className="space-y-2 pt-2">
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500">
              Privilege / Promotional Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  if (promoMessage.text) setPromoMessage({ text: '', type: '' });
                }}
                placeholder="Try 'WELCOME10'"
                className={`bg-white border text-stone-800 text-xs rounded-xl px-3 py-2.5 flex-1 focus:outline-none uppercase tracking-wider transition-colors ${
                  promoMessage.type === 'error'
                    ? 'border-red-300 focus:border-red-500'
                    : promoMessage.type === 'success'
                    ? 'border-emerald-300 focus:border-emerald-500'
                    : 'border-stone-200 focus:border-[#9b7951]'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#f7f3ed] hover:bg-[#8b6b47] text-[#705638] hover:text-white border border-[#e8ddce] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
            {promoMessage.text && (
              <p
                className={`text-xs flex items-center gap-1.5 pt-0.5 ${
                  promoMessage.type === 'error' ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {promoMessage.type === 'error' ? (
                  <HiOutlineInformationCircle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <HiOutlineCheckCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{promoMessage.text}</span>
              </p>
            )}
          </form>

          {/* Checkout CTA */}
          <button
            onClick={() => navigate('/checkout')}
            className="w-full rounded-xl bg-[#8b6b47] hover:bg-[#745735] text-white flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider py-3.5 transition-colors"
          >
            <HiOutlineLockClosed className="w-5 h-5" />
            <span>Proceed to Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
