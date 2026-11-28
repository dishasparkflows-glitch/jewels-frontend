import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed, HiOutlineMail } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';
import Modal from '../../components/common/Modal';

const Login = () => {
  const { login, loginWithGoogle, user } = useAuth();
  const { settings, brandName } = useStoreSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const authBannerUrl = getImageUrl(settings?.loginModalImage?.url);
  const returnTo = location.state?.from;

  const getDestination = useCallback((target) => {
    if (!target) return '/';
    if (typeof target === 'string') return target;
    return `${target.pathname || '/'}${target.search || ''}${target.hash || ''}`;
  }, []);

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
    // If the return path is protected (e.g. user clicked Wishlist without logging in),
    // navigate to home ('/') to avoid bouncing back to /login in an infinite redirect loop
    if (!returnTo || isProtectedPath(returnTo)) {
      navigate('/', { replace: true });
    } else {
      navigate(getDestination(returnTo), { replace: true });
    }
  }, [navigate, returnTo, getDestination, isProtectedPath]);

  const finishLogin = useCallback((user) => {
    toast.success(`Welcome back${user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}!`);
    navigate(getDestination(returnTo), { replace: true });
  }, [navigate, returnTo, getDestination]);

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
                const data = await loginWithGoogle(credential);
                finishLogin(data.user);
              } catch (error) {
                toast.error(error.response?.data?.message || 'Google sign-in failed');
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
        console.warn('Google Sign-in failed to render button:', err);
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
  }, [finishLogin, loginWithGoogle]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await login(identifier.trim(), password);
      finishLogin(data.user);
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid email/mobile number or password';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={closeModal} label={`Sign in to your ${brandName} account`} className="p-0 border-0 bg-transparent shadow-none">
      <SEO title={`Sign In | ${brandName}`} noindex={true} />
      <div className="relative grid max-h-[calc(100dvh-2rem)] w-[min(860px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-100 md:grid-cols-[1.1fr_0.9fr]">
        {/* Close Button - positioned in top right (over image on desktop, over form on mobile) */}
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close sign in"
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 shadow-xs transition hover:bg-stone-200 hover:text-stone-900 md:right-5 md:top-5 md:bg-white/90 md:text-stone-700 md:backdrop-blur-xs md:hover:bg-white cursor-pointer"
        >
          <span aria-hidden="true" className="text-xl leading-none">×</span>
        </button>

        {/* Left Column: Form Section */}
        <section className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 overflow-y-auto">
          <div>
            <h1 className="font-serif text-[26px] sm:text-[28px] font-bold tracking-tight text-[#4A3525] leading-tight">
              Welcome Back
            </h1>
            <p className="mt-1.5 text-xs sm:text-[13px] text-[#6B635B] font-normal">
              Sign in to access your wishlist, cart & orders.
            </p>
          </div>

          <div className="relative mt-5">
            <button
              type="button"
              onClick={() => {
                try {
                  if (window.google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                    window.google.accounts.id.prompt();
                  }
                } catch (err) {
                  console.warn('Google sign-in prompt error:', err);
                }
              }}
              className="flex h-11 sm:h-12 w-full items-center justify-center gap-3 rounded-xl border border-stone-200/90 bg-white px-4 text-xs sm:text-[13.5px] font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <FcGoogle className="h-5 w-5 shrink-0" />
              <span>Continue with Google</span>
            </button>
            <div
              ref={googleButtonRef}
              className={`absolute inset-0 opacity-0 overflow-hidden cursor-pointer flex items-center justify-center [&>div]:scale-x-125 [&_iframe]:scale-x-125 ${googleReady ? '' : 'pointer-events-none'}`}
              aria-label="Sign in with Google"
            />
          </div>
          {googleLoading && <p className="mt-1.5 text-center text-xs text-stone-500">Signing in with Google…</p>}

          <div className="my-4 sm:my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            <span>OR</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="flex-1 font-medium">{errorMessage}</span>
              </div>
            )}
            <label className="sr-only" htmlFor="login-identifier">Mobile number or email</label>
            <div className="relative">
              <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-600" />
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                inputMode={identifier.includes('@') ? 'email' : 'tel'}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Email or Mobile Number"
                className="h-11 sm:h-12 w-full rounded-xl border border-stone-200/90 bg-[#F8F7F5] pl-11 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:bg-white input-theme-focus autofill-neutral"
                required
              />
            </div>

            <label className="sr-only" htmlFor="login-password">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-600" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-11 sm:h-12 w-full rounded-xl border border-stone-200/90 bg-[#F8F7F5] pl-11 pr-11 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:bg-white input-theme-focus autofill-neutral"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex justify-end pt-0.5">
              <Link to="/forgot-password" className="text-xs sm:text-[13px] font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                color: 'var(--btn-primary-text, #ffffff)',
              }}
              className="!mt-4 flex h-11 sm:h-12 w-full items-center justify-center rounded-xl hover:opacity-90 text-sm sm:text-[15px] font-semibold tracking-wide shadow-xs transition-all active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 sm:mt-5 text-center text-xs sm:text-[13px] text-stone-500 font-normal">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              state={{ from: returnTo }}
              style={{ color: 'var(--btn-primary-bg, #8c6536)' }}
              className="font-bold hover:opacity-80 transition-opacity ml-0.5"
            >
              Create Account
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
    </Modal>
  );
};

export default Login;
