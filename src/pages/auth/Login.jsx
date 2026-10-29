import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineDeviceMobile, HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed, HiOutlineMail } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';
import Modal from '../../components/common/Modal';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);
  const logoUrl = getImageUrl(settings.logoImage?.url || settings.mobileLogoImage?.url);
  const returnTo = location.state?.from;

  const getDestination = useCallback((target) => {
    if (!target) return '/';
    if (typeof target === 'string') return target;
    return `${target.pathname || '/'}${target.search || ''}${target.hash || ''}`;
  }, []);

  const closeModal = useCallback(() => {
    navigate(getDestination(returnTo), { replace: true });
  }, [navigate, returnTo, getDestination]);

  const finishLogin = useCallback((user) => {
    toast.success(`Welcome back${user?.firstName ? `, ${user.firstName}` : ''}!`);
    navigate(getDestination(returnTo), { replace: true });
  }, [navigate, returnTo, getDestination]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
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
      try {
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
    try {
      const data = await login(identifier.trim(), password);
      finishLogin(data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={closeModal} label="Sign in to your Neirah account" className="p-0 border-0 bg-transparent shadow-none">
      <div className="relative w-[min(420px,calc(100vw-2rem))] overflow-visible rounded-3xl bg-white p-7 sm:p-9 shadow-2xl border border-stone-100">
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close sign in"
          className="absolute right-5 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 cursor-pointer"
        >
          <span aria-hidden="true" className="text-xl leading-none">×</span>
        </button>

        <div className="text-center">
          <h1 className="font-serif text-2xl sm:text-[26px] font-bold tracking-tight text-stone-900">Welcome Back</h1>
          <p className="mt-1 text-xs text-stone-500">Sign in to access your Neirah account</p>
        </div>

        <div
          ref={googleButtonRef}
          className={`mt-6 flex min-h-11 justify-center ${googleReady ? '' : 'hidden'}`}
          aria-label="Sign in with Google"
        />
        {!googleReady && (
          <button
            type="button"
            onClick={() => {
              if (window.google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                window.google.accounts.id.prompt();
              }
            }}
            className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 text-xs sm:text-sm font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <FcGoogle className="h-5 w-5 shrink-0" />
            <span>Continue with Google</span>
          </button>
        )}
        {googleLoading && <p className="mt-1.5 text-center text-xs text-stone-500">Signing in with Google…</p>}

        <div className="my-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-widest text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="sr-only" htmlFor="login-identifier">Mobile number or email</label>
          <div className="relative">
            <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              inputMode={identifier.includes('@') ? 'email' : 'tel'}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email or Mobile Number"
              className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#8c6b45] focus:ring-2 focus:ring-[#8c6b45]/15"
              required
            />
          </div>

          <label className="sr-only" htmlFor="login-password">Password</label>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-10 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#8c6b45] focus:ring-2 focus:ring-[#8c6b45]/15"
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

          <div className="flex justify-end pt-0.5">
            <Link to="/forgot-password" className="text-xs text-[#8c6b45] hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="!mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#8c6b45] text-sm font-medium text-white shadow-sm transition hover:bg-[#785b39] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-stone-500">
          Don’t have an account?{' '}
          <Link to="/register" state={{ from: returnTo }} className="font-semibold text-stone-800 hover:text-[#8c6b45] transition-colors">
            Create Account
          </Link>
        </p>
      </div>
    </Modal>
  );
};

export default Login;
