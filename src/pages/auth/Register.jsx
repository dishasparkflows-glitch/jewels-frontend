import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import toast from 'react-hot-toast';
import {
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineUser,
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';
import Modal from '../../components/common/Modal';
import PhoneInput from '../../components/common/PhoneInput';
import OtpVerificationModal from '../../components/store/OtpVerificationModal';
import { authAPI, otpAPI } from '../../api/services';

const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const { settings, brandName } = useStoreSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const logoUrl = getImageUrl(settings.logoImage?.url || settings.mobileLogoImage?.url);
  const authBannerUrl = getImageUrl(settings?.loginModalImage?.url);
  const returnTo = location.state?.from;

  const destination = returnTo
    ? (typeof returnTo === 'string' ? returnTo : `${returnTo.pathname || '/'}${returnTo.search || ''}${returnTo.hash || ''}`)
    : '/';

  const isProtectedPath = useCallback((target) => {
    if (!target) return true;
    const path = typeof target === 'string' ? target : target.pathname || '';
    return (
      path === '/login' ||
      path === '/register' ||
      path === '/forgot-password' ||
      path === '/reset-password' ||
      path.startsWith('/wishlist') ||
      path.startsWith('/profile') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/checkout')
    );
  }, []);

  const closeModal = useCallback(() => {
    if (!returnTo || isProtectedPath(returnTo)) {
      navigate('/', { replace: true });
    } else {
      navigate(destination, { replace: true });
    }
  }, [destination, isProtectedPath, navigate, returnTo]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    if (!nameParts.length) {
      toast.error('Please enter your full name');
      return;
    }

    const email = form.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const rawPhone = (form.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!form.password || form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Check if Registration OTP verification is dynamically enabled by admin in settings
    const isRegistrationOtpEnabled = settings?.otpSettings?.enableRegistrationOtp !== false;

    if (!isRegistrationOtpEnabled) {
      // Direct registration without OTP pop-up
      setLoading(true);
      const toastId = toast.loading('Creating your account...');
      try {
        // Verify availability of email and phone first
        await authAPI.checkAvailability({ email, phone: cleanPhone });

        const formattedCountryCode = (countryCode || '+91').trim().startsWith('+')
          ? (countryCode || '+91').trim()
          : `+${(countryCode || '91').trim()}`;

        await register({
          profile: {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || 'Customer',
            phone: cleanPhone,
            countryCode: formattedCountryCode,
            isPhoneVerified: false,
          },
          auth: {
            email,
            password: form.password,
          },
        });
        toast.success(`Welcome to ${brandName}!`, { id: toastId, icon: '✨' });
        navigate(destination, { replace: true });
      } catch (error) {
        const msg = error.response?.data?.message || 'Registration failed';
        setErrorMessage(msg);
        toast.error(msg, { id: toastId });
      } finally {
        setLoading(false);
      }
      return;
    }

    setSendingOtp(true);
    const toastId = toast.loading('Sending verification code...');
    try {
      // 1. Verify availability of email and phone before sending SMS
      await authAPI.checkAvailability({ email, phone: cleanPhone });

      // 2. Send OTP via SMS service
      const formattedCountryCode = (countryCode || '+91').trim().startsWith('+')
        ? (countryCode || '+91').trim()
        : `+${(countryCode || '91').trim()}`;
      const otpResp = await otpAPI.send({
        phone: cleanPhone,
        countryCode: formattedCountryCode,
        purpose: 'registration',
      });
      const resData = otpResp?.data?.data || otpResp?.data;
      if (resData?.devOtp) {
        setDevOtp(resData.devOtp);
      }
      toast.success(`OTP sent to mobile number`, { id: toastId });
      setShowOtpModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Could not send verification code';
      setErrorMessage(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpVerified = async (verifyData) => {
    setShowOtpModal(false);
    setLoading(true);
    setErrorMessage('');

    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    const rawPhone = (form.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const formattedCountryCode = (countryCode || '+91').trim().startsWith('+')
      ? (countryCode || '+91').trim()
      : `+${(countryCode || '91').trim()}`;

    try {
      await register({
        profile: {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || 'Customer',
          phone: cleanPhone,
          countryCode: formattedCountryCode,
          isPhoneVerified: true,
        },
        auth: {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
        verificationToken: verifyData?.verificationToken,
      });
      toast.success(`Welcome to ${brandName}!`, { icon: '✨' });
      navigate(destination, { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      try {
        if (!googleInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async ({ credential }) => {
              setGoogleLoading(true);
              try {
                await loginWithGoogle(credential);
                toast.success(`Welcome to ${brandName}!`, { icon: '✨' });
                navigate(destination, { replace: true });
              } catch (error) {
                toast.error(error.response?.data?.message || 'Google sign-up failed');
              } finally {
                setGoogleLoading(false);
              }
            },
          });
          googleInitializedRef.current = true;
        }

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: Math.max(220, Math.floor(googleButtonRef.current.clientWidth || 320)),
        });
        setTimeout(() => {
          if (googleButtonRef.current && (googleButtonRef.current.querySelector('iframe') || googleButtonRef.current.children.length > 0)) {
            setGoogleReady(true);
          }
        }, 200);
      } catch (err) {
        console.warn('Google Sign-up failed to render button:', err);
      }
    };

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderGoogleButton);
    renderGoogleButton();
    return () => script.removeEventListener('load', renderGoogleButton);
  }, [destination, loginWithGoogle, navigate]);

  return (
    <Modal open onClose={closeModal} label={`Create your ${brandName} account`} className="p-0 border-0 bg-transparent shadow-none">
      <SEO title={`Create Account | ${brandName}`} noindex={true} />
      <div className="relative grid max-h-[calc(100dvh-2rem)] w-[min(860px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-100 md:grid-cols-[1.1fr_0.9fr]">
        {/* Close Button - positioned in top right (over image on desktop, over form on mobile) */}
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close create account"
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 shadow-xs transition hover:bg-stone-200 hover:text-stone-900 md:right-5 md:top-5 md:bg-white/90 md:text-stone-700 md:backdrop-blur-xs md:hover:bg-white cursor-pointer"
        >
          <span aria-hidden="true" className="text-xl leading-none">×</span>
        </button>

        {/* Left Column: Form Section */}
        <section className="flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-9 overflow-y-auto luxury-scrollbar">
          {/* Brand Logo Header */}
          <div className="mb-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-7 max-w-32 object-contain object-left" />
            ) : (
              <div>
                <span className="font-serif text-lg tracking-[0.2em] font-semibold text-stone-900 block leading-tight uppercase">{brandName}</span>
                <span className="text-[8px] uppercase tracking-[0.28em] text-stone-400 block font-light">SHINE YOUR WAY</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">Create Account</h1>
            <p className="mt-1 text-xs text-stone-500">Join thousands who trust {brandName} for timeless jewellery.</p>
          </div>

          <div
            ref={googleButtonRef}
            className={`mt-5 flex min-h-11 justify-center ${googleReady ? '' : 'hidden'}`}
            aria-label="Sign up with Google"
          />
          {!googleReady && (
            <button
              type="button"
              onClick={() => {
                try {
                  if (window.google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                    window.google.accounts.id.prompt();
                  }
                } catch (err) {
                  console.warn('Google sign-up prompt error:', err);
                }
              }}
              className="mt-5 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 text-xs sm:text-sm font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <FcGoogle className="h-5 w-5 shrink-0" />
              <span>Continue with Google</span>
            </button>
          )}
          {googleLoading && <p className="mt-1.5 text-center text-xs text-stone-500">Creating account with Google…</p>}

          <div className="my-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-widest text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="flex-1 font-medium">{errorMessage}</span>
              </div>
            )}
            <label className="sr-only" htmlFor="register-full-name">Full name</label>
            <div className="relative">
              <HiOutlineUser className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="register-full-name"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={updateField('fullName')}
                placeholder="Full Name"
                className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 input-theme-focus"
                required
              />
            </div>

            <label className="sr-only" htmlFor="register-email">Email address</label>
            <div className="relative">
              <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="Email Address"
                className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 input-theme-focus"
                required
              />
            </div>

            <PhoneInput
              id="register-phone"
              value={form.phone}
              onChange={(val) => updateField('phone')({ target: { value: val } })}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              placeholder="Mobile Number"
              required
              size="md"
            />

            <label className="sr-only" htmlFor="register-password">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={updateField('password')}
                placeholder="Password"
                className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-10 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 input-theme-focus"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || sendingOtp}
              className="!mt-4 flex h-11 w-full items-center justify-center rounded-xl btn-theme-primary text-sm font-medium shadow-sm transition disabled:cursor-wait disabled:opacity-60 cursor-pointer"
            >
              {sendingOtp ? 'Sending OTP…' : loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-stone-500">
            Already have an account?{' '}
            <Link to="/login" state={{ from: returnTo }} className="font-semibold text-stone-800 link-theme-hover transition-colors">
              Sign In
            </Link>
          </p>
        </section>

        {/* Right Column: Attractive Luxury Jewellery Image */}
        <section className="relative hidden md:block overflow-hidden bg-stone-900 select-none">
          <img
            src={authBannerUrl}
            alt={`${brandName} Fine Jewellery`}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
          <div className="absolute inset-x-8 bottom-8 text-white">
            <p className="font-serif text-2xl sm:text-[28px] font-normal leading-snug tracking-tight drop-shadow-sm">
              More than<br />
              Jewellery<br />
              <span className="italic font-light">It’s a Feeling</span>
            </p>
            <div className="mt-3.5 h-0.5 w-12 bg-white/70" />
          </div>
        </section>
      </div>

      {showOtpModal && (
        <OtpVerificationModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          phone={(form.phone || '').trim().replace(/\D/g, '')}
          countryCode={countryCode || '+91'}
          purpose="registration"
          title="Verify Your Mobile Number"
          caption="Required for your security before account creation."
          onVerified={handleOtpVerified}
          initialDevOtp={devOtp}
        />
      )}
    </Modal>
  );
};

export default Register;
