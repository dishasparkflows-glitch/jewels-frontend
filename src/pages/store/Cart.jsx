import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import {
  HiOutlineTrash,
  HiOutlineArrowNarrowLeft,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiCheckCircle,
} from 'react-icons/hi';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, shipping, tax, total } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

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

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderComplete(true);
      clearCart();
    }, 1500);
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <HiCheckCircle className="w-12 h-12" />
        </div>
        <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-semibold">
          Order Confirmed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
          Thank You For Choosing Jewels
        </h1>
        <p className="text-sm text-surface-400 max-w-md mx-auto leading-relaxed">
          Your acquisition is being prepared in our private atelier. A personal concierge will contact you shortly with your insured courier dispatch details.
        </p>
        <div className="pt-4">
          <Link to="/shop" className="btn-gold text-xs uppercase tracking-wider">
            Explore More Masterpieces
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-surface-900 border border-surface-800 flex items-center justify-center text-3xl mx-auto">
          💎
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-sm text-surface-400 max-w-sm mx-auto leading-relaxed">
          Discover our curated collection of fine jewelry, engagement rings, and certified solitaire diamonds.
        </p>
        <div className="pt-2">
          <Link to="/shop" className="btn-gold text-xs uppercase tracking-wider">
            Explore Creations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title & Return */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-800">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
            Review Bag
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
            Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h1>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400 hover:text-gold-300 transition-colors"
        >
          <HiOutlineArrowNarrowLeft className="w-4 h-4" />
          <span>Continue Exploring</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={`${item.id}-${item.selectedMetal}`}
              className="bg-surface-900/40 rounded-2xl border border-surface-800 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <img
                src={item.image && !isOrnateImage(item.image) ? item.image : getPrimaryProductImage(item)}
                alt={item.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover object-center bg-surface-950 flex-shrink-0"
              />

              <div className="flex-1 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-gold-400 font-semibold">
                  {item.category}
                </span>
                <Link
                  to={`/product/${item.id}`}
                  className="block font-serif text-lg font-bold text-white hover:text-gold-300 transition-colors"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-surface-400">
                  Metal: <span className="text-surface-200">{item.selectedMetal}</span>
                </p>
                <p className="text-sm font-bold text-white pt-1">
                  ${item.price.toLocaleString()}
                </p>
              </div>

              {/* Quantity Stepper & Remove */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                <div className="flex items-center bg-surface-950 border border-surface-800 rounded-lg px-2 py-1 text-white">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-surface-400 hover:text-white"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-surface-400 hover:text-white"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-surface-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="bg-surface-900/60 rounded-3xl border border-surface-800 p-6 sm:p-8 space-y-6">
          <h3 className="font-serif text-xl font-bold text-white border-b border-surface-800 pb-4">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-surface-400">
              <span>Subtotal</span>
              <span className="text-white font-medium">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-surface-400">
              <span>Insured Courier Shipping</span>
              <span className="text-gold-400 font-medium">
                {shipping === 0 ? 'Complimentary' : `$${shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-surface-400">
              <span>Estimated Sales Tax</span>
              <span className="text-white font-medium">${tax.toLocaleString()}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>VIP Privilege ({discountPercent}%)</span>
                <span>-${discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-surface-800 pt-3 flex justify-between text-base font-bold text-white">
              <span>Total</span>
              <span className="text-xl text-gold-300 font-serif">
                ${finalTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Promo Code Form */}
          <form onSubmit={applyPromo} className="space-y-2 pt-2">
            <label className="block text-xs uppercase tracking-wider font-semibold text-surface-400">
              Privilege / Promotional Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Try 'WELCOME10'"
                className="bg-surface-950 border border-surface-800 text-white text-xs rounded-xl px-3 py-2.5 flex-1 focus:outline-none focus:border-gold-500 uppercase tracking-wider"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-gold-300 hover:text-white border border-surface-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Checkout CTA */}
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="btn-gold w-full flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider py-3.5"
          >
            {isCheckingOut ? (
              <div className="w-5 h-5 border-2 border-surface-950/30 border-t-surface-950 rounded-full animate-spin" />
            ) : (
              <>
                <HiOutlineLockClosed className="w-5 h-5" />
                <span>Proceed to Secure Checkout</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-surface-400 text-center">
            <HiOutlineShieldCheck className="w-4 h-4 text-gold-400 flex-shrink-0" />
            <span>256-bit Encrypted Checkout • Full Transit Insurance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
