import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineMap,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineUser,
} from 'react-icons/hi';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { checkoutAPI } from '../../api/services';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';

const inputClassName = 'h-12 w-full rounded-md border border-[#e6e0d8] bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#a77e4e] focus:ring-2 focus:ring-[#a77e4e]/10';
const fieldClassName = 'relative block';
const iconClassName = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7b69]';
const selectClassName = `${inputClassName} appearance-none pr-9`;
const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

const emptyAddress = {
  email: '',
  firstName: '',
  lastName: '',
  addressLine: '',
  apartment: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  countryCode: '+91',
  country: 'India',
};

const unwrapResponse = (response) => response?.data?.data ?? response?.data;

export default function Checkout() {
  const { cart, updateQuantity, subtotal, shipping, tax, total } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(() => ({
    ...emptyAddress,
    email: user?.email || user?.auth?.email || '',
    firstName: user?.firstName || user?.profile?.firstName || '',
    lastName: user?.lastName || user?.profile?.lastName || '',
    phone: user?.phone || user?.profile?.phone || '',
  }));
  const [addresses, setAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [codFee, setCodFee] = useState(null);
  const [codLoading, setCodLoading] = useState(false);
  const [activeStep, setActiveStep] = useState('shipping');

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        email: current.email || user.email || user.auth?.email || '',
        firstName: current.firstName || user.firstName || user.profile?.firstName || '',
        lastName: current.lastName || user.lastName || user.profile?.lastName || '',
        phone: current.phone || user.phone || user.profile?.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    checkoutAPI.getAddresses()
      .then((response) => {
        const data = unwrapResponse(response);
        const savedAddresses = Array.isArray(data) ? data : data?.items || [];
        if (!active || !savedAddresses.length) return;
        setAddresses(savedAddresses);
        const preferred = savedAddresses.find((address) => address.isShippingDefault || address.isDefault) || savedAddresses[0];
        setForm((current) => ({
          ...current,
          firstName: current.firstName || preferred.firstName || preferred.fullName?.split(/\s+/)[0] || '',
          lastName: current.lastName || preferred.lastName || preferred.fullName?.split(/\s+/).slice(1).join(' ') || '',
          addressLine: current.addressLine || preferred.addressLine || preferred.street || '',
          city: current.city || preferred.city || '',
          state: current.state || preferred.state || '',
          postalCode: current.postalCode || preferred.pincode || preferred.postalCode || '',
          phone: current.phone || preferred.phone || '',
          country: current.country || preferred.country || 'India',
        }));
      })
      .catch(() => {
        // Guest checkout stays available if saved addresses are not accessible.
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const finalTotal = Math.max(0, Number(total || subtotal + shipping + tax) - discountAmount);
  const totalQuantity = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const codDueNow = Math.min(finalTotal, Number(codFee?.calculatedCharge || 0));
  const codRemaining = Math.max(0, finalTotal - codDueNow);

  const paymentAmount = useMemo(() => Math.round(finalTotal * 100) / 100, [finalTotal]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleApplyCoupon = async (event) => {
    event.preventDefault();
    const code = couponCode.trim();
    if (!code) {
      toast.error('Enter a coupon code first.');
      return;
    }

    setCouponLoading(true);
    try {
      const data = unwrapResponse(await checkoutAPI.validateCoupon(code, subtotal));
      setAppliedCoupon(data);
      setCouponCode(data?.coupon?.code || code.toUpperCase());
      toast.success('Coupon applied successfully.');
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || 'This coupon could not be applied.');
    } finally {
      setCouponLoading(false);
    }
  };

  const loadCodFee = useCallback(async () => {
    setCodLoading(true);
    try {
      const data = unwrapResponse(await checkoutAPI.calculateCodFee(paymentAmount));
      if (!data?.isAvailable) {
        setCodFee(null);
        setPaymentMethod('online');
        toast.error(data?.message || 'Cash on delivery is not available for this order.');
        return;
      }
      setCodFee(data);
    } catch (error) {
      setCodFee(null);
      setPaymentMethod('online');
      toast.error(error.response?.data?.message || 'Could not check cash on delivery availability.');
    } finally {
      setCodLoading(false);
    }
  }, [paymentAmount]);

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    if (method === 'cod') loadCodFee();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.error('The backend does not currently expose an order or payment creation API.');
  };

  const applySavedAddress = (address) => {
    const [firstName = '', ...lastNameParts] = (address.fullName || '').trim().split(/\s+/);
    setForm((current) => ({
      ...current,
      firstName: address.firstName || firstName,
      lastName: address.lastName || lastNameParts.join(' '),
      addressLine: address.addressLine || address.street || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.pincode || address.postalCode || '',
      phone: address.phone || current.phone,
    }));
  };

  if (!cart.length) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f8f5f0] text-[#92704e]"><HiOutlineLockClosed className="h-7 w-7" /></div>
        <h1 className="font-serif text-3xl font-normal text-stone-900">Your bag is empty</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">Add something beautiful to your bag before continuing to checkout.</p>
        <Link to="/shop" className="mt-7 inline-flex h-12 items-center justify-center bg-stone-900 px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#92704e]">Continue shopping</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] text-stone-900">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <nav aria-label="Checkout progress" className="mx-auto mb-5 flex max-w-[820px] items-center justify-center sm:mb-7">
          {[
            { id: 'shipping', label: 'Shipping', number: 1 },
            { id: 'payment', label: 'Payment', number: 2 },
            { id: 'review', label: 'Review', number: 3 },
          ].map((step, index, steps) => (
            <div key={step.id} className="flex flex-1 items-center last:flex-none">
              <button type="button" onClick={() => setActiveStep(step.id)} aria-current={activeStep === step.id ? 'step' : undefined} className="flex items-center gap-2 whitespace-nowrap text-xs sm:gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${activeStep === step.id || steps.findIndex((entry) => entry.id === activeStep) > index ? 'border-[#956b3a] bg-[#956b3a] text-white' : 'border-stone-300 bg-white text-stone-500'}`}>{steps.findIndex((entry) => entry.id === activeStep) > index ? <HiOutlineCheck className="h-4 w-4" /> : step.number}</span>
                <span className={activeStep === step.id ? 'font-semibold text-stone-900' : 'text-stone-500'}>{step.label}</span>
              </button>
              {index < steps.length - 1 && <span className="mx-3 h-px flex-1 bg-[#d9c6aa] sm:mx-6" />}
            </div>
          ))}
        </nav>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.95fr)] xl:gap-5">
          <div className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-[0_8px_30px_rgba(48,37,27,0.03)]">
            <section className="p-5 sm:px-10 sm:py-6">
              <div className="mb-4 flex items-center gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#bd9462] text-sm font-semibold text-white">1</span>
                <div>
                  <h1 className="text-lg font-semibold">Contact Information</h1>
                  <p className="mt-0.5 text-xs text-stone-500">We’ll use this email to send order updates.</p>
                </div>
              </div>
              <label className={`${fieldClassName} sm:ml-[60px]`}>
                <span className="sr-only">Email address</span>
                <HiOutlineMail className={iconClassName} />
                <input className={`${inputClassName} pl-11`} type="email" autoComplete="email" placeholder="Email Address *" value={form.email} onChange={updateField('email')} required />
              </label>
            </section>

            <section className="p-5 sm:px-10 sm:py-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#bd9462] text-sm font-semibold text-white">2</span>
                  <div>
                    <h2 className="text-lg font-semibold">Delivery Address</h2>
                    <p className="mt-0.5 text-xs text-stone-500">Enter your delivery details to receive your order.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 sm:mr-1"><HiOutlineLocationMarker className="h-4 w-4 text-[#bd9462]" /> Delivering to {form.country}<span aria-hidden="true">⌄</span></span>
              </div>

              {addresses.length > 1 && <label className="mb-4 block sm:ml-[60px]">
                <span className="mb-1.5 block text-xs font-medium text-stone-600">Use a saved address</span>
                <select className={selectClassName} defaultValue="" onChange={(event) => { const address = addresses.find((entry) => String(entry._id) === event.target.value); if (address) applySavedAddress(address); }}>
                  <option value="">Enter a new delivery address</option>
                  {addresses.map((address) => <option key={address._id} value={address._id}>{address.fullName || address.addressLine}, {address.city}</option>)}
                </select>
              </label>}

              <div className="grid grid-cols-1 gap-3.5 sm:ml-[60px] sm:grid-cols-6">
                <label className="relative sm:col-span-3"><span className="sr-only">First name</span><HiOutlineUser className={iconClassName} /><input className={`${inputClassName} pl-11`} autoComplete="given-name" placeholder="First Name *" value={form.firstName} onChange={updateField('firstName')} required /></label>
                <label className="relative sm:col-span-3"><span className="sr-only">Last name</span><HiOutlineUser className={iconClassName} /><input className={`${inputClassName} pl-11`} autoComplete="family-name" placeholder="Last Name *" value={form.lastName} onChange={updateField('lastName')} required /></label>
                <label className="relative sm:col-span-4"><span className="sr-only">Street address</span><HiOutlineHome className={iconClassName} /><input className={`${inputClassName} pl-11`} autoComplete="address-line1" placeholder="Address *" value={form.addressLine} onChange={updateField('addressLine')} required /></label>
                <label className="sm:col-span-2"><span className="sr-only">Apartment, suite, etc.</span><input className={inputClassName} autoComplete="address-line2" placeholder="Apartment, suite, etc. (optional)" value={form.apartment} onChange={updateField('apartment')} /></label>
                <label className="relative sm:col-span-2"><span className="sr-only">City</span><HiOutlineMap className={iconClassName} /><input className={`${inputClassName} pl-11`} autoComplete="address-level2" placeholder="City *" value={form.city} onChange={updateField('city')} required /></label>
                <label className="relative sm:col-span-2"><span className="sr-only">State</span><select className={`${selectClassName} pl-3.5`} autoComplete="address-level1" value={form.state} onChange={updateField('state')} required><option value="">State *</option>{indianStates.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
                <label className="relative sm:col-span-2"><span className="sr-only">PIN code</span><HiOutlineLocationMarker className={iconClassName} /><input className={`${inputClassName} pl-11`} autoComplete="postal-code" inputMode="numeric" placeholder="PIN Code *" value={form.postalCode} onChange={updateField('postalCode')} required /></label>
                <div className="flex gap-3 sm:col-span-6">
                  <label className="w-[110px] shrink-0"><span className="sr-only">Country calling code</span><select className={selectClassName} aria-label="Country calling code" value={form.countryCode} onChange={updateField('countryCode')}><option value="+91">🇮🇳 +91</option><option value="+1">🇺🇸 +1</option><option value="+44">🇬🇧 +44</option><option value="+61">🇦🇺 +61</option></select></label>
                  <label className="relative flex-1"><span className="sr-only">Mobile number</span><HiOutlinePhone className={iconClassName} /><input className={`${inputClassName} pl-11`} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Mobile Number *" value={form.phone} onChange={updateField('phone')} required /></label>
                </div>
              </div>
            </section>

            <section className="p-5 sm:px-10 sm:py-6">
              <div className="mb-4 flex items-center gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#bd9462] text-sm font-semibold text-white">3</span>
                <div>
                  <h2 className="text-lg font-semibold">Payment Method</h2>
                  <p className="mt-0.5 text-xs text-stone-500">Choose how you’d like to pay for your order.</p>
                </div>
              </div>
              <div className="space-y-2 sm:ml-[60px]">
                <label className={`flex cursor-pointer items-center gap-3 rounded-md border p-3.5 transition ${paymentMethod === 'online' ? 'border-[#bd9462] bg-[#fffdf9]' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => handlePaymentChange('online')} className="h-4 w-4 accent-[#a77e4e]" />
                  <HiOutlineCreditCard className="h-7 w-7 shrink-0 text-stone-800" />
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold sm:text-sm">Online Payment (Full)</span><span className="mt-1 block text-[10px] leading-4 text-stone-500 sm:text-[11px]">Pay 100% online securely with UPI, Credit/Debit Cards, Net Banking</span></span>
                  <span className="hidden gap-2 text-[10px] font-bold italic text-stone-700 sm:flex">UPI&nbsp; VISA&nbsp; ●●</span>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-md border p-3.5 transition ${paymentMethod === 'cod' ? 'border-[#bd9462] bg-[#fffdf9]' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} disabled={codLoading} onChange={() => handlePaymentChange('cod')} className="h-4 w-4 accent-[#a77e4e]" />
                  <HiOutlineTruck className="h-7 w-7 shrink-0 text-stone-800" />
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold sm:text-sm">Cash on Delivery (Partial)</span><span className="mt-1 block text-[10px] leading-4 text-stone-500 sm:text-[11px]">{codLoading ? 'Checking availability…' : codFee ? `Pay ${formatPrice(codDueNow)} advance online to confirm order. Pay remaining ${formatPrice(codRemaining)} upon delivery.` : 'Pay a small advance online to confirm your order. Remaining balance is due on delivery.'}</span></span>
                  {codFee && <span className="shrink-0 text-right"><span className="block text-[9px] uppercase text-stone-400">Due now</span><span className="text-xs font-semibold">{formatPrice(codDueNow)}</span></span>}
                </label>
              </div>
            </section>

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-10 sm:py-5">
              <p className="flex items-center gap-2 text-[11px] text-stone-500"><HiOutlineLockClosed className="h-4 w-4 shrink-0 text-[#bd9462]" />Your information is secure and encrypted</p>
              <span className="hidden h-px flex-1 bg-stone-200 sm:block" />
              <button type="submit" className="flex h-13 min-h-13 items-center justify-center gap-3 rounded-md bg-[#171613] px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#80603d] sm:min-w-[300px]">
                {paymentMethod === 'cod' && codFee ? `Pay ${formatPrice(codDueNow)}` : `Pay ${formatPrice(finalTotal)}`} <HiOutlineArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(48,37,27,0.03)] sm:p-7 lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <span className="text-xs font-medium">{totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}</span>
            </div>

            <div className="max-h-[330px] space-y-4 overflow-y-auto pb-4">
              {cart.map((item) => {
                const image = item.image && !isOrnateImage(item.image) ? item.image : getPrimaryProductImage(item);
                return <article key={`${item.id}-${item.selectedMetal || ''}-${item.selectedSize || ''}`} className="flex gap-3">
                  <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg border border-stone-100 bg-[#f8f6f3] p-1.5">
                    {image && <img src={image} alt={item.name || item.title || 'Jewellery item'} className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[11px] font-semibold uppercase leading-[1.4] text-stone-900">{item.name || item.title}</p>
                        {item.category && <span className="mt-1 inline-block rounded bg-[#f4eee5] px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-[#80603d]">{item.category}</span>}
                      </div>
                      <span className="shrink-0 text-xs font-semibold">{formatPrice(Number(item.price) * Number(item.quantity || 1))}</span>
                    </div>
                    {(item.selectedMetal || item.selectedSize) && <p className="mt-1 text-[10px] text-stone-500">{[item.selectedMetal, item.selectedSize && `Size: ${item.selectedSize}`].filter(Boolean).join('　|　')}</p>}
                    <label className="mt-2 inline-flex items-center gap-1.5 rounded border border-stone-200 px-2 py-1 text-[10px] text-stone-700"><span>Qty:</span><select className="bg-transparent font-medium outline-none" aria-label={`Quantity for ${item.name || item.title}`} value={item.quantity} onChange={(event) => updateQuantity(item.id, Number(event.target.value))}>{Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select></label>
                  </div>
                </article>;
              })}
            </div>

            <div className="border-y border-stone-100 py-4">
              <form onSubmit={handleApplyCoupon}>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold"><HiOutlineTag className="h-4 w-4 text-[#bd9462]" />Apply Coupon Code</label>
                <div className="flex overflow-hidden rounded-md border border-stone-200">
                  <input className="min-w-0 flex-1 px-3 py-3 text-xs outline-none placeholder:text-stone-400 focus:ring-1 focus:ring-inset focus:ring-[#bd9462]" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter coupon code or gift card" aria-label="Coupon code or gift card" />
                  <button type="submit" disabled={couponLoading} className="min-w-[78px] bg-[#f4eadb] px-4 text-[10px] font-semibold uppercase tracking-wide text-[#80603d] transition hover:bg-[#ead9c2] disabled:opacity-60">{couponLoading ? '…' : appliedCoupon ? 'Applied' : 'Apply'}</button>
                </div>
                {appliedCoupon && <p className="mt-2 text-[11px] text-emerald-700">{appliedCoupon.coupon?.code || couponCode} applied · You saved {formatPrice(discountAmount)} <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="ml-1 underline">Remove</button></p>}
              </form>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
              {appliedCoupon && <div className="flex justify-between text-emerald-700"><span>Discount ({appliedCoupon.coupon?.code || couponCode})</span><span>−{formatPrice(discountAmount)}</span></div>}
              <div className="flex justify-between text-stone-500"><span className="flex items-center gap-1.5">Shipping <span title="Shipping charges based on delivery location">ⓘ</span></span><span>{shipping === 0 ? 'Free Shipping' : formatPrice(shipping)}</span></div>
              <div className="flex justify-between"><span>Estimated GST (3%)</span><span className="font-semibold">{formatPrice(tax)}</span></div>
              {paymentMethod === 'cod' && codFee && <div className="flex justify-between text-stone-500"><span>COD advance due now</span><span>{formatPrice(codDueNow)}</span></div>}
            </div>

            <div className="flex items-center justify-between border-t border-stone-100 pt-4">
              <div><h3 className="text-lg font-semibold">Total</h3><p className="mt-0.5 text-[10px] text-stone-500">Inclusive of all taxes</p></div>
              <div className="text-right"><span className="block text-[9px] uppercase text-stone-500">INR</span><span className="font-serif text-2xl font-semibold">{formatPrice(finalTotal)}</span></div>
            </div>

            <div className="mt-5 grid grid-cols-4 divide-x divide-[#e9dfd3] rounded-lg border border-[#f0e6d7] bg-[#fcf8f1] py-4 text-center">
              {[
                { icon: HiOutlineTruck, label: 'Free Shipping' },
                { icon: HiOutlineShieldCheck, label: 'Secure Payments' },
                { icon: HiOutlineCheck, label: 'Easy Returns' },
                { icon: HiOutlineTag, label: 'Certified Jewellery' },
              ].map(({ icon: Icon, label }) => <div key={label} className="flex flex-col items-center gap-1.5 px-1 text-[9px] leading-3 text-stone-700"><Icon className="h-6 w-6 text-[#80603d]" /><span>{label}</span></div>)}
            </div>

            <a href="tel:+919726237723" className="mt-4 flex items-center gap-3 rounded-lg bg-[#f7efea] p-4 transition hover:bg-[#f1e4dc]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ead7c7] text-[#bd9462]"><HiOutlinePhone className="h-5 w-5" /></span>
              <span className="flex-1"><span className="block text-sm font-semibold">Need Help?</span><span className="mt-0.5 block text-[10px] text-stone-500">Our team is here to assist you</span></span>
              <HiOutlineArrowRight className="h-4 w-4 text-stone-700" />
            </a>
          </aside>
        </form>
      </div>
    </main>
  );
}
