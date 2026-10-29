import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import {
  HiOutlineTrash,
  HiOutlineArrowNarrowLeft,
  HiOutlineLockClosed,
} from 'react-icons/hi';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { resolveMetalName, cleanAttribute } from '../../utils/metalColors';

import EmptyCartView from '../../components/store/EmptyCartView';
import { formatPrice } from '../../utils/currency';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, subtotal, shipping, tax, total } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const applyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'JEWELS10' || promoCode.trim().toUpperCase() === 'WELCOME10') {
      setDiscountPercent(10);
      toast.success('10% VIP Privilege discount applied!', { icon: '✨' });
    } else {
      toast.error('Invalid privilege code');
    }
  };

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, total - discountAmount);

  if (cart.length === 0) {
    return <EmptyCartView />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-7 sm:space-y-8">
      {/* Title & Return */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#9b7951] font-semibold">
            Review Bag
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#26221e] mt-1">
            Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h1>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-[#8b6b47] transition-colors"
        >
          <HiOutlineArrowNarrowLeft className="w-4 h-4" />
          <span>Continue Exploring</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={`${item.id}-${item.selectedMetal}`}
              className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 shadow-sm"
            >
              <img
                src={item.image && !isOrnateImage(item.image) ? item.image : getPrimaryProductImage(item)}
                alt={item.name}
                className="w-full sm:w-28 h-48 sm:h-28 rounded-xl object-cover object-center bg-[#f4f0eb] flex-shrink-0"
              />

              <div className="flex-1 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#9b7951] font-semibold">
                  {item.category}
                </span>
                <Link
                  to={`/product/${encodeURIComponent(item.slug || (item.name ? item.name.toLowerCase().trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') : ''))}`}
                  className="block font-serif text-lg font-medium text-[#2c2722] hover:text-[#8b6b47] transition-colors"
                >
                  {item.name}
                </Link>
                {resolveMetalName(item.selectedMetal) && (
                  <p className="text-xs text-stone-500">
                    Metal: <span className="text-stone-700">{resolveMetalName(item.selectedMetal)}</span>
                  </p>
                )}
                {cleanAttribute(item.selectedSize) && (
                  <p className="text-xs text-stone-500">
                    Size: <span className="text-stone-700">{cleanAttribute(item.selectedSize)}</span>
                  </p>
                )}
                <p className="text-sm font-semibold text-[#2c2722] pt-1">
                  {formatPrice(item.price)}
                </p>
              </div>

              {/* Quantity Stepper & Remove */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                <div className="flex items-center bg-[#fbfaf8] border border-stone-200 rounded-lg px-2 py-1 text-[#2c2722]">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#2c2722]"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#2c2722]"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 transition-colors"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm lg:sticky lg:top-8">
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
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Try 'WELCOME10'"
                className="bg-white border border-stone-200 text-stone-800 text-xs rounded-xl px-3 py-2.5 flex-1 focus:outline-none focus:border-[#9b7951] uppercase tracking-wider"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#f7f3ed] hover:bg-[#8b6b47] text-[#705638] hover:text-white border border-[#e8ddce] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Checkout CTA */}
          <button
            onClick={() => navigate('/checkout')}
            className="w-full rounded-xl bg-[#8b6b47] hover:bg-[#745735] text-white flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider py-3.5 transition-colors"
          >
            <HiOutlineLockClosed className="w-5 h-5" />
            <span>Proceed to Secure Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
