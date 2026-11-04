import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineCreditCard,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineX,
  HiX,
  HiSparkles,
} from 'react-icons/hi';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { checkoutAPI, addressesAPI } from '../../api/services';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { trackBeginCheckout } from '../../config/firebase';
import { resolveMetalName, cleanAttribute } from '../../utils/metalColors';
import Dropdown from '../../components/common/Dropdown';
import PhoneInput from '../../components/common/PhoneInput';
import { formatPriceWithDecimals as formatPrice } from '../../utils/currency';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
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

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const submitCCAvenueForm = ({ gatewayUrl, accessCode, encRequest }) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gatewayUrl;
  form.style.display = 'none';

  const encInput = document.createElement('input');
  encInput.name = 'encRequest';
  encInput.value = encRequest;
  form.appendChild(encInput);

  const accessInput = document.createElement('input');
  accessInput.name = 'access_code';
  accessInput.value = accessCode;
  form.appendChild(accessInput);

  document.body.appendChild(form);
  form.submit();
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, updateQuantity, clearCart, subtotal, shipping, tax, total } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(() => ({
    ...emptyAddress,
    email: user?.auth?.email || '',
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
  }));
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentProvider, setPaymentProvider] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [codFee, setCodFee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState('shipping');

  useEffect(() => {
    if (cart && cart.length > 0) {
      trackBeginCheckout(cart, total);
    }
  }, []);

  useEffect(() => {
    checkoutAPI.getPaymentConfig()
      .then((response) => {
        const config = unwrapResponse(response);
        if (config?.defaultProvider) {
          setPaymentProvider(config.defaultProvider);
        }
      })
      .catch((err) => {
        console.warn('Could not load payment configuration:', err);
      });
  }, []);

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        email: current.email || user.auth?.email || '',
        firstName: current.firstName || user.profile?.firstName || '',
        lastName: current.lastName || user.profile?.lastName || '',
        phone: current.phone || user.profile?.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    const hasAuth = isAuthenticated || Boolean(user) || Boolean(localStorage.getItem('token'));
    if (!hasAuth) return undefined;
    let active = true;
    checkoutAPI.getAddresses()
      .then((response) => {
        const data = unwrapResponse(response);
        const savedAddresses = Array.isArray(data) ? data : data?.items || [];
        if (!active || !savedAddresses.length) return;
        setAddresses(savedAddresses);
        const preferred = savedAddresses.find((address) => address.defaults?.isShippingDefault || address.defaults?.isDefault || address.isShippingDefault || address.isDefault) || savedAddresses[0];
        if (preferred) {
          setSelectedAddressId(String(preferred._id));
        }
        const pAddr = preferred?.address || preferred || {};
        setForm((current) => ({
          ...current,
          firstName: current.firstName || preferred?.firstName || user?.profile?.firstName || '',
          lastName: current.lastName || preferred?.lastName || user?.profile?.lastName || '',
          addressLine: current.addressLine || pAddr.addressLine || pAddr.street || '',
          apartment: current.apartment || pAddr.street || '',
          city: current.city || pAddr.city || '',
          state: current.state || pAddr.state || '',
          postalCode: current.postalCode || pAddr.pincode || pAddr.postalCode || '',
          phone: current.phone || pAddr.phone || '',
          country: current.country || pAddr.country || 'India',
        }));
      })
      .catch(() => {
        // Guest checkout stays available if saved addresses are not accessible.
      });
    return () => { active = false; };
  }, [isAuthenticated, user]);

  const handleSaveNewAddress = async () => {
    if (!form.addressLine || !form.city || !form.state || !form.postalCode) {
      toast.error('Please enter complete address line, city, state and PIN code');
      return;
    }
    setSavingAddress(true);
    try {
      const payload = {
        address: {
          type: 'home',
          phone: form.phone || '',
          addressLine: form.addressLine,
          street: form.apartment || '',
          city: form.city,
          state: form.state,
          pincode: form.postalCode,
          country: form.country || 'India',
        },
        defaults: {
          isDefault: addresses.length === 0,
          isShippingDefault: addresses.length === 0,
        },
      };
      await addressesAPI.create(payload);
      const res = await addressesAPI.getAll();
      const data = unwrapResponse(res);
      const updated = Array.isArray(data) ? data : data?.items || [];
      setAddresses(updated);
      if (updated.length > 0) {
        setSelectedAddressId(String(updated[0]._id));
      }
      setIsAddingNewAddress(false);
      toast.success('Address saved to your address book!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  };

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
    if (event?.preventDefault) event.preventDefault();
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

  const loadCodFee = useCallback(async (silent = false) => {
    try {
      const data = unwrapResponse(await checkoutAPI.calculateCodFee(paymentAmount));
      if (!data?.isAvailable) {
        setCodFee(null);
        if (!silent) {
          setPaymentMethod('online');
          toast.error(data?.message || 'Cash on delivery is not available for this order.');
        }
        return;
      }
      setCodFee(data);
    } catch (error) {
      setCodFee(null);
      if (!silent) {
        setPaymentMethod('online');
        toast.error(error.response?.data?.message || 'Could not check cash on delivery availability.');
      }
    }
  }, [paymentAmount]);

  useEffect(() => {
    if (paymentAmount > 0) {
      loadCodFee(true);
    }
  }, [paymentAmount, loadCodFee]);

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    if (method === 'cod' && !codFee) loadCodFee(false);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.loading('Detecting location...', { id: 'loc' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const addr = data.address || {};
          setForm((prev) => ({
            ...prev,
            addressLine: [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || prev.addressLine,
            city: addr.city || addr.town || addr.village || addr.county || prev.city,
            state: addr.state || prev.state,
            postalCode: addr.postcode || prev.postalCode,
          }));
          setIsAddingNewAddress(true);
          toast.success('Location updated', { id: 'loc' });
        } catch {
          toast.dismiss('loc');
          toast.error('Could not auto-fill address from location', { id: 'loc' });
        }
      },
      () => {
        toast.error('Please allow location access to auto-fill address', { id: 'loc' });
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.phone || !form.addressLine || !form.city || !form.state || !form.postalCode) {
      toast.error('Please fill in all required shipping and contact details.');
      setActiveStep('shipping');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Creating your order...');

    try {
      const orderPayload = {
        shippingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          countryCode: form.countryCode || '+91',
          addressLine: form.addressLine,
          apartment: form.apartment,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country || 'India',
        },
        couponCode: appliedCoupon?.coupon?.code || couponCode.trim() || undefined,
        paymentMethod,
        paymentProvider,
        items: cart.map((item) => ({
          productId: item.productId || item.id,
          title: item.title || item.name,
          price: item.price,
          quantity: item.quantity,
          totalItemPrice: (Number(item.price) || 0) * (Number(item.quantity) || 1),
          image: item.image,
          category: item.category,
          selectedMetal: item.selectedMetal,
          selectedSize: item.selectedSize,
          selectedAttributes: item.selectedAttributes,
        })),
      };

      const response = await checkoutAPI.createOrder(orderPayload);
      const data = unwrapResponse(response);
      const order = data?.order;
      const payment = data?.payment;

      if (!order) {
        throw new Error('Could not create order.');
      }

      if (!payment || (paymentMethod === 'cod' && codDueNow === 0)) {
        toast.success('Order placed successfully!', { id: toastId });
        if (clearCart) clearCart();
        navigate(`/order-success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
        return;
      }

      if (payment.provider === 'ccavenue') {
        toast.loading('Redirecting to CCAvenue secure gateway...', { id: toastId });
        submitCCAvenueForm({
          gatewayUrl: payment.gatewayUrl,
          accessCode: payment.accessCode,
          encRequest: payment.encRequest,
        });
        return;
      }

      if (payment.provider === 'razorpay') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          toast.error('Unable to load Razorpay checkout SDK. Please verify your connection.', { id: toastId });
          setSubmitting(false);
          return;
        }

        toast.dismiss(toastId);

        const rzp = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amount,
          currency: payment.currency || 'INR',
          name: 'Neirah Jewels',
          description: `Order ${order.orderNumber}`,
          order_id: payment.gatewayOrderId,
          prefill: {
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            contact: `${form.countryCode || '+91'}${form.phone}`.replace(/[^0-9]/g, ''),
          },
          theme: {
            color: '#8c6536',
          },
          handler: async (resp) => {
            const verifyToast = toast.loading('Confirming payment...');
            try {
              await checkoutAPI.verifyRazorpay({
                orderId: order._id,
                orderNumber: order.orderNumber,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              });
              toast.success('Payment verified successfully!', { id: verifyToast });
              if (clearCart) clearCart();
              navigate(`/order-success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed', { id: verifyToast });
              navigate(`/order-failed?orderId=${order._id}&orderNumber=${order.orderNumber}&error=verification_failed`);
            }
          },
          modal: {
            ondismiss: () => {
              toast.error('Payment was cancelled.');
              setSubmitting(false);
            },
          },
        });

        rzp.open();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to place order. Please try again.', { id: toastId });
      setSubmitting(false);
    }
  };

  const applySavedAddress = (address) => {
    const addr = address.address || address;
    const [firstName = '', ...lastNameParts] = (address.fullName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`).trim().split(/\s+/);
    setForm((current) => ({
      ...current,
      firstName: address.firstName || firstName,
      lastName: address.lastName || lastNameParts.join(' '),
      addressLine: addr.addressLine || addr.street || '',
      apartment: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.pincode || addr.postalCode || '',
      phone: addr.phone || current.phone,
      country: addr.country || current.country || 'India',
    }));
  };

  if (!cart.length) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center font-sans">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f8f5f0] text-[#8c6536]">
          <HiOutlineLockClosed className="h-7 w-7" />
        </div>
        <h1 className="font-serif text-3xl font-normal text-stone-900">Your bag is empty</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">
          Add something beautiful to your bag before continuing to checkout.
        </p>
        <Link
          to="/shop"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#8c6536] px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#75522b]"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Stepper Progress */}
        <nav aria-label="Checkout progress" className="mx-auto mb-8 flex max-w-lg items-center justify-between">
          {[
            { id: 'shipping', label: 'Shipping', number: 1 },
            { id: 'payment', label: 'Payment', number: 2 },
            { id: 'review', label: 'Review', number: 3 },
          ].map((step, index, steps) => (
            <div key={step.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => setActiveStep(step.id)}
                aria-current={activeStep === step.id ? 'step' : undefined}
                className="flex items-center gap-2.5 whitespace-nowrap text-xs cursor-pointer"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    activeStep === step.id || (step.number === 1 && activeStep === 'shipping')
                      ? 'bg-[#8c6536] text-white'
                      : steps.findIndex((entry) => entry.id === activeStep) >= index
                      ? 'bg-[#8c6536] text-white'
                      : 'border border-stone-300 bg-white text-stone-400'
                  }`}
                >
                  {steps.findIndex((entry) => entry.id === activeStep) > index ? (
                    <HiOutlineCheck className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </span>
                <span
                  className={`text-xs ${
                    activeStep === step.id ? 'font-bold text-stone-900' : 'font-medium text-stone-500'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span className="mx-4 h-px flex-1 bg-[#ebd9c8]" />
              )}
            </div>
          ))}
        </nav>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)] xl:gap-8">
          {/* Left Column: Form Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-7">
            {/* 1. Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbf5ee] border border-[#ebd9c8] text-[#8c6536]">
                  <HiOutlineUser className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-stone-900">Contact Information</h2>
                  <p className="text-xs text-stone-500">We&apos;ll use this email to send order updates.</p>
                </div>
              </div>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Email Address *"
                  value={form.email}
                  onChange={updateField('email')}
                  required
                  className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8c6536] focus:ring-1 focus:ring-[#8c6536]"
                />
              </div>
            </section>

            {/* 2. Delivery */}
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbf5ee] border border-[#ebd9c8] text-[#8c6536]">
                    <HiOutlineTruck className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold text-stone-900">Delivery</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#ebd9c8] bg-[#fdfbf9] text-xs font-medium text-[#8c6536] hover:bg-[#fbf5ee] transition cursor-pointer"
                  >
                    <HiOutlineLocationMarker className="h-3.5 w-3.5 text-[#8c6536]" />
                    <span>Use Current Location</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAddingNewAddress) {
                        setIsAddingNewAddress(false);
                        if (addresses.length > 0) {
                          const sel = addresses.find((a) => String(a._id) === selectedAddressId) || addresses[0];
                          if (sel) applySavedAddress(sel);
                        }
                      } else {
                        setIsAddingNewAddress(true);
                        setForm((prev) => ({
                          ...prev,
                          addressLine: '',
                          apartment: '',
                          city: '',
                          state: '',
                          postalCode: '',
                        }));
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#8c6536] bg-[#8c6536] hover:bg-[#75522b] text-xs font-semibold text-white transition cursor-pointer shadow-2xs"
                  >
                    {isAddingNewAddress && addresses.length > 0 ? (
                      <>
                        <HiOutlineHome className="h-3.5 w-3.5" />
                        <span>Saved Addresses</span>
                      </>
                    ) : (
                      <span>+ Add New</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Saved Address Cards or Address Inputs */}
              {addresses.length > 0 && !isAddingNewAddress ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {addresses.map((addressItem) => {
                    const isSelected = selectedAddressId === String(addressItem._id);
                    const addr = addressItem.address || addressItem;
                    const fullName = addressItem.fullName || `${addressItem.firstName || user?.profile?.firstName || ''} ${addressItem.lastName || user?.profile?.lastName || ''}`.trim() || 'Saved Address';
                    const addressLines = [addr.addressLine, addr.street].filter(Boolean).join(', ');
                    const cityStatePin = [addr.city, addr.state, addr.pincode || addr.postalCode].filter(Boolean).join(' ');

                    return (
                      <div
                        key={addressItem._id}
                        onClick={() => {
                          setSelectedAddressId(String(addressItem._id));
                          applySavedAddress(addressItem);
                        }}
                        className={`relative rounded-xl p-4 transition cursor-pointer border ${
                          isSelected
                            ? 'border-2 border-[#8c6536] bg-[#faf6f0]'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 text-xs text-stone-600">
                            <p className="font-bold text-sm text-stone-900 capitalize">{fullName}</p>
                            <p className="leading-relaxed line-clamp-2">{addressLines}</p>
                            <p>{cityStatePin}</p>
                            <p className="pt-1 font-medium text-stone-800">Ph: {addr.phone || form.phone}</p>
                          </div>
                          <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#8c6536]' : 'border-stone-300'
                          }`}>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-[#8c6536]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <HiOutlineUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8c6536] focus:ring-1 focus:ring-[#8c6536]"
                        autoComplete="given-name"
                        placeholder="First Name *"
                        value={form.firstName}
                        onChange={updateField('firstName')}
                        required
                      />
                    </div>
                    <div className="relative">
                      <HiOutlineUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8c6536] focus:ring-1 focus:ring-[#8c6536]"
                        autoComplete="family-name"
                        placeholder="Last Name *"
                        value={form.lastName}
                        onChange={updateField('lastName')}
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Address line */}
                  <div className="relative">
                    <HiOutlineHome className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8c6536] focus:ring-1 focus:ring-[#8c6536]"
                      autoComplete="address-line1"
                      placeholder="Address (House no, Street, Landmark) *"
                      value={form.addressLine}
                      onChange={updateField('addressLine')}
                      required
                    />
                  </div>

                  {/* Row 3: City, State, PIN code */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <HiOutlineOfficeBuilding className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8c6536] focus:ring-1 focus:ring-[#8c6536]"
                        autoComplete="address-level2"
                        placeholder="City *"
                        value={form.city}
                        onChange={updateField('city')}
                        required
                      />
                    </div>

                    <div className="relative">
                      <Dropdown
                        value={form.state}
                        onChange={(val) => setForm((prev) => ({ ...prev, state: val }))}
                        options={indianStates.map((st) => ({ value: st, label: st }))}
                        placeholder="State *"
                        searchable={true}
                        searchPlaceholder="Search state..."
                        buttonClassName="h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-xs sm:text-sm text-stone-900 outline-none transition hover:border-stone-300 flex items-center justify-between"
                        menuClassName="z-[50]"
                      />
                    </div>

                    <div className="relative">
                      <HiOutlineLocationMarker className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8c6536] focus:ring-1 focus:ring-[#8c6536]"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        placeholder="PIN Code *"
                        value={form.postalCode}
                        onChange={updateField('postalCode')}
                        required
                      />
                    </div>
                  </div>

                  {/* Row 4: Phone */}
                  <div>
                    <PhoneInput
                      value={form.phone}
                      onChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                      countryCode={form.countryCode}
                      onCountryCodeChange={(code) => setForm((prev) => ({ ...prev, countryCode: code }))}
                      placeholder="Mobile Number *"
                      required
                      size="md"
                      variant="default"
                      className="rounded-xl border border-stone-200"
                    />
                  </div>

                  {/* Actions when adding new address */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewAddress(false);
                          const sel = addresses.find((a) => String(a._id) === selectedAddressId) || addresses[0];
                          if (sel) applySavedAddress(sel);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold tracking-wide transition shadow-2xs hover:border-stone-300 cursor-pointer"
                      >
                        <HiOutlineArrowLeft className="h-3.5 w-3.5 text-stone-500" />
                        <span>Cancel & Use Saved Address</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveNewAddress}
                      disabled={savingAddress}
                      className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8c6536] hover:bg-[#75522b] text-white text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer disabled:opacity-60"
                    >
                      <HiOutlineCheck className="h-3.5 w-3.5" />
                      <span>{savingAddress ? 'Saving...' : 'Save & Use This Address'}</span>
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Payment Method */}
            <section className="space-y-4 pt-2">
              <div className="flex items-center gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbf5ee] border border-[#ebd9c8] text-[#8c6536]">
                  <HiOutlineCreditCard className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-stone-900">Payment Method</h2>
                  <p className="text-xs text-stone-500">Choose how you&apos;d like to pay for your order.</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {/* Online Payment (Full) */}
                <div
                  onClick={() => handlePaymentChange('online')}
                  className={`rounded-xl p-4 sm:p-4.5 transition cursor-pointer border ${
                    paymentMethod === 'online'
                      ? 'border-2 border-[#8c6536] bg-[#faf6f0]'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#f0e8dc] text-[#8c6536]">
                        <HiOutlineCreditCard className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <span className="block text-xs font-bold text-stone-900 sm:text-sm">
                          Online Payment (Full)
                        </span>
                        <span className="mt-0.5 block text-[11px] sm:text-xs text-stone-500 leading-snug">
                          Pay 100% securely with UPI, Credit/Debit Cards, Net Banking
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-stone-900 sm:text-sm">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery (Partial) */}
                <div
                  onClick={() => handlePaymentChange('cod')}
                  className={`rounded-xl p-4 sm:p-4.5 transition cursor-pointer border ${
                    paymentMethod === 'cod'
                      ? 'border-2 border-[#8c6536] bg-[#faf6f0]'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#f0e8dc] text-[#8c6536]">
                        <HiOutlineCube className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <span className="block text-xs font-bold text-stone-900 sm:text-sm">
                          Cash on Delivery (Partial)
                        </span>
                        <div className="mt-1 space-y-0.5 text-[11px] sm:text-xs text-stone-500 leading-snug">
                          <p>Pay {formatPrice(codDueNow)} advance online to confirm order.</p>
                          <p>Pay remaining {formatPrice(codRemaining)} upon delivery.</p>
                          <p className="text-[10px] text-stone-400">
                            Your advance is part of the order total. No extra COD fee.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block rounded bg-[#fbf5ee] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8c6536]">
                        Due Now
                      </span>
                      <span className="block mt-1 text-xs font-bold text-stone-900 sm:text-sm">
                        {formatPrice(codDueNow)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Row / Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-stone-100">
              <p className="flex items-center gap-1.5 text-xs text-stone-500">
                <HiOutlineLockClosed className="h-4 w-4 shrink-0 text-[#8c6536]" />
                <span>Your information is secure and encrypted</span>
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#8c6536] px-8 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#75522b] disabled:opacity-60 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                <span>
                  {submitting
                    ? 'Processing Order...'
                    : paymentMethod === 'cod' && codFee
                    ? `Pay ${formatPrice(codDueNow)} & Confirm`
                    : `Pay ${formatPrice(finalTotal)}`}
                </span>
                <HiOutlineArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <aside className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 lg:sticky lg:top-24">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="text-[#8c6536]">
                  <HiOutlineShoppingBag className="h-5 w-5" />
                </span>
                <h2 className="text-base font-bold text-stone-900">Order Summary</h2>
              </div>
              <span className="text-xs font-medium text-stone-500">
                {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {/* Items List */}
            <div className="max-h-[340px] space-y-4 overflow-y-auto pr-1">
              {cart.map((item) => {
                const image = item.image && !isOrnateImage(item.image) ? item.image : getPrimaryProductImage(item);
                const cleanMetal = resolveMetalName(item.selectedMetal);
                const cleanSize = cleanAttribute(item.selectedSize);
                return (
                  <article
                    key={`${item.id}-${item.selectedMetal || ''}-${item.selectedSize || ''}`}
                    className="flex gap-3.5"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-100 bg-[#f7f3ee] p-1.5 flex items-center justify-center">
                      {image && (
                        <img
                          src={image}
                          alt={item.name || item.title || 'Jewellery item'}
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-semibold uppercase leading-snug text-stone-900">
                            {item.name || item.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-[#fbf5ee] px-2 py-0.5 text-[9px] font-medium text-[#8c6536]">
                              Premium
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-stone-900">
                          {formatPrice(Number(item.price) * Number(item.quantity || 1))}
                        </span>
                      </div>
                      {(cleanMetal || cleanSize) && (
                        <p className="mt-1 text-[11px] text-stone-500">
                          {[cleanMetal, cleanSize && `Size: ${cleanSize}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <div className="mt-2 inline-flex items-center rounded-lg border border-stone-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          disabled={(item.quantity || 1) <= 1}
                          className="flex h-6 w-6 items-center justify-center text-xs font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={`Decrease quantity of ${item.name || item.title}`}
                        >
                          −
                        </button>
                        <span className="min-w-[24px] px-1 text-center text-xs font-bold text-stone-900">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="flex h-6 w-6 items-center justify-center text-xs font-semibold text-stone-600 transition hover:bg-stone-100"
                          aria-label={`Increase quantity of ${item.name || item.title}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Coupon Code */}
            <div className="border-t border-stone-100 pt-4">
              {appliedCoupon ? (
                <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-[#f2f9f4] via-[#f7fbf8] to-[#edf7f1] p-3.5 shadow-[0_2px_12px_rgba(16,185,129,0.06)] transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-2xs">
                        <HiSparkles className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
                      </div>
                      <div className="space-y-1">
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
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                        toast.success('Coupon removed');
                      }}
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
                  <div className="flex">
                    <input
                      className="h-10 min-w-0 flex-1 rounded-l-xl border border-r-0 border-stone-200 bg-white px-3.5 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#8c6536] transition"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
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
                      className="h-10 rounded-r-xl border border-l-0 border-[#ebd9c8] bg-[#f0e3d2] px-5 text-xs font-semibold text-[#704d23] transition hover:bg-[#e6d5c0] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {couponLoading ? 'Verifying...' : 'Apply'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 border-t border-stone-100 pt-4 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineTag className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Coupon Savings ({appliedCoupon.coupon?.code || couponCode})</span>
                  </span>
                  <span className="font-bold text-emerald-700">−{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span className="flex items-center gap-1">
                  Shipping <span className="text-stone-400" title="Free standard delivery">ⓘ</span>
                </span>
                <span className="font-semibold text-stone-900">
                  {shipping === 0 ? 'Free Shipping' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated GST (3%)</span>
                <span className="font-semibold text-stone-900">{formatPrice(tax)}</span>
              </div>
              {paymentMethod === 'cod' && codFee && (
                <div className="flex justify-between text-stone-600">
                  <span>COD advance due now</span>
                  <span className="font-semibold text-stone-900">{formatPrice(codDueNow)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-stone-100 pt-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">Total</h3>
                <p className="text-[11px] text-stone-400">Inclusive of all taxes</p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-bold font-sans text-stone-900">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
