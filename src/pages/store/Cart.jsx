import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import toast from 'react-hot-toast';
import { useCart } from '../../contexts/CartContext';
import { checkoutAPI } from '../../api/services';
import {
  HiOutlineTrash,
  HiOutlineArrowNarrowLeft,
  HiOutlineLockClosed,
  HiChevronDown,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineTag,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiX,
  HiSparkles,
} from 'react-icons/hi';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { getItemSpecs } from '../../utils/productSpecs';

import EmptyCartView from '../../components/store/EmptyCartView';
import { formatPrice } from '../../utils/currency';

const unwrapResponse = (response) => response?.data?.data ?? response?.data;
const COUPON_STORAGE_KEY = 'neirah_applied_coupon';

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
  const [couponCode, setCouponCode] = useState(() => {
    try {
      const saved = sessionStorage.getItem(COUPON_STORAGE_KEY);
      if (saved) return JSON.parse(saved)?.coupon?.code || '';
    } catch {}
    return '';
  });
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem(COUPON_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

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

  const handleApplyCoupon = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    const code = couponCode.trim();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      toast.error('Enter a coupon code first.');
      return;
    }

    setCouponError('');
    setCouponLoading(true);
    try {
      const data = unwrapResponse(await checkoutAPI.validateCoupon(code, subtotal));
      setAppliedCoupon(data);
      setCouponCode(data?.coupon?.code || code.toUpperCase());
      setCouponError('');
      try {
        sessionStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(data));
      } catch {}
      toast.success('Coupon applied successfully.');
    } catch (error) {
      setAppliedCoupon(null);
      try {
        sessionStorage.removeItem(COUPON_STORAGE_KEY);
      } catch {}
      const errMsg = error.response?.data?.message || 'Invalid coupon code';
      setCouponError(errMsg);
      toast.error(errMsg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    try {
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
    toast.success('Coupon removed');
  };

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const type = appliedCoupon.discount?.type || 'Percentage';
    const val = Number(appliedCoupon.discount?.value || 0);
    if (type === 'Percentage') {
      return Math.round((subtotal * val) / 100);
    }
    return Math.min(val, subtotal);
  }, [appliedCoupon, subtotal]);

  // If subtotal drops below minimum required order for the applied coupon, auto-remove
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.discount?.minimumOrderAmount) {
      if (subtotal < appliedCoupon.discount.minimumOrderAmount) {
        setAppliedCoupon(null);
        try {
          sessionStorage.removeItem(COUPON_STORAGE_KEY);
        } catch {}
        toast.error(`Coupon removed: minimum order of ₹${appliedCoupon.discount.minimumOrderAmount} required`);
      }
    }
  }, [subtotal, appliedCoupon]);

  const finalTotal = Math.max(0, total - discountAmount);

  if (cart.length === 0) {
    return <EmptyCartView />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 sm:pb-12 space-y-4 sm:space-y-5">
      <SEO title="Shopping Bag | Neirah Fine Jewellery" noindex={true} />
      {/* Title & Return */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-3.5 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-xl sm:text-3xl font-medium text-[#26221e]">
            Shopping Bag ({cart.length})
          </h1>
        </div>
        <Link
          to="/shop"
          style={{
            color: 'var(--btn-primary-bg, #8c6536)',
            borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 35%, #ffffff)',
          }}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border bg-white hover:opacity-85 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all shadow-2xs cursor-pointer group shrink-0"
        >
          <HiOutlineArrowNarrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
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
                    className="bg-[#fcfaf7] hover:bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 hover:border-stone-300 p-3 sm:p-4 flex gap-3 sm:gap-4 transition-all shadow-2xs items-start sm:items-center"
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
                <span
                  className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full border text-[10px] font-semibold shadow-xs transition-all"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 10%, #ffffff)',
                    borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 28%, #ffffff)',
                    color: 'var(--btn-primary-bg, #8c6536)',
                  }}
                >
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
              <span className="text-emerald-700 font-medium">Complimentary</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Estimated Sales Tax</span>
              <span className="text-[#2c2722] font-medium">{formatPrice(tax)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-700 font-medium text-xs sm:text-sm">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <HiOutlineTag className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Coupon Savings ({appliedCoupon.coupon?.code || couponCode})</span>
                  {appliedCoupon.discount?.type === 'Percentage' && Number(appliedCoupon.discount?.value) > 0 ? (
                    <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                      {appliedCoupon.discount.value}% OFF
                    </span>
                  ) : appliedCoupon.discount?.type === 'Fixed' && Number(appliedCoupon.discount?.value) > 0 ? (
                    <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                      ₹{Number(appliedCoupon.discount.value).toLocaleString('en-IN')} OFF
                    </span>
                  ) : null}
                </span>
                <span className="font-bold text-emerald-700">−{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline text-base font-bold text-[#2c2722]">
              <span>Total</span>
              <span className="text-xl font-sans font-bold tabular-nums" style={{ color: 'var(--btn-primary-bg, #8c6536)' }}>
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>

          {/* Coupon Code Section - Matching Checkout */}
          <div className="border-t border-stone-150 pt-4">
            {appliedCoupon ? (
              <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-[#f2f9f4] via-[#f7fbf8] to-[#edf7f1] p-3.5 shadow-[0_2px_12px_rgba(16,185,129,0.06)] transition-all">
                <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-2xs">
                      <HiSparkles className="h-[18px] w-[18px] text-emerald-600 animate-pulse" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 bg-white px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-emerald-800 shadow-2xs">
                          <HiOutlineTag className="h-3.5 w-3.5 text-emerald-600" />
                          {appliedCoupon.coupon?.code || couponCode}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <HiOutlineCheck className="h-3 w-3 stroke-[3]" /> Applied
                        </span>
                      </div>
                      <p className="text-xs font-medium text-emerald-900 leading-snug">
                        Yay! You save <span className="font-bold text-emerald-950 underline decoration-emerald-300 decoration-2 underline-offset-2">{formatPrice(discountAmount)}</span> on this order!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 shadow-2xs transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer shrink-0"
                    title="Remove coupon"
                    aria-label="Remove coupon"
                  >
                    <span>Remove</span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors">
                      <HiX className="h-2.5 w-2.5" />
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-900">
                  <HiOutlineTag className="h-4 w-4 text-[#8c6536]" />
                  <span>Apply Coupon Code</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className={`h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 sm:px-3.5 text-base sm:text-xs text-stone-800 placeholder:text-stone-400 outline-none transition ${
                      couponError
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : 'border-stone-200 focus:border-[#8c6536] focus:ring-1 focus:ring-[#8c6536]'
                    }`}
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      if (couponError) setCouponError('');
                    }}
                    placeholder="Enter coupon code or gift card"
                    aria-label="Coupon code or gift card"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="h-10 px-4 sm:px-5 rounded-xl bg-[#f2e6db] hover:bg-[#e8dacb] active:scale-[0.98] text-xs font-bold text-stone-900 transition disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                  >
                    {couponLoading ? 'Verifying...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <HiOutlineExclamationCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Checkout CTA */}
          <button
            onClick={() => navigate('/checkout')}
            style={{
              backgroundColor: 'var(--btn-primary-bg, #8c6536)',
              color: 'var(--btn-primary-text, #ffffff)',
            }}
            className="w-full rounded-xl hover:opacity-90 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider py-3.5 transition-all cursor-pointer shadow-sm"
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
