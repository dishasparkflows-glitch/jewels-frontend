import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageUrl';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineDeviceMobile } from 'react-icons/hi';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brandLogo, setBrandLogo] = useState({ desktop: '', mobile: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const settings = data?.data || {};
      setBrandLogo({ desktop: getImageUrl(settings.logoImage?.url), mobile: getImageUrl(settings.mobileLogoImage?.url) });
    }).catch(() => {});
  }, []);

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
            toast.success(`Welcome back, ${data.user.firstName}!`, { icon: '✨' });
            navigate('/');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: Math.max(220, Math.floor(googleButtonRef.current.clientWidth)),
      });
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
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.identifier.trim(), form.password);
      toast.success(`Welcome back, ${data.user.firstName}!`, { icon: '✨' });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 shadow-[0_8px_35px_rgba(82,65,43,0.10)] relative">
        <div className="text-center space-y-2 mb-8">
          <div className="w-40 sm:w-48 h-14 rounded-xl bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center mx-auto mb-3 shadow-sm overflow-hidden">
            {brandLogo.desktop ? (
              <picture className="w-full h-full flex items-center justify-center">
                {brandLogo.mobile && <source media="(max-width: 639px)" srcSet={brandLogo.mobile} />}
                <img src={brandLogo.desktop} alt="Neirah Jewellers" className="w-full h-full object-contain p-2" />
              </picture>
            ) : <span className="font-serif text-2xl font-bold text-[#8b6f4e]">N</span>}
          </div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#8b6f4e] font-semibold">
            Neirah Jewellers
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Welcome back
          </h2>
          <p className="text-xs text-stone-500">
            Sign in to access your bespoke orders, wishlist, and VIP privileges
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
              Email or Mobile Number
            </label>
            <div className="relative">
              {form.identifier.includes('@') ? <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" /> : <HiOutlineDeviceMobile className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />}
              <input
                type="text"
                autoComplete="username"
                inputMode={form.identifier.includes('@') ? 'email' : 'tel'}
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                placeholder="Email address or mobile number"
                className="w-full bg-white border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-white border border-stone-300 rounded-xl pl-11 pr-11 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-stone-500">
              <input type="checkbox" className="rounded bg-white border-stone-300 text-[#8f6d43] focus:ring-0" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-[#8f6d43] hover:text-[#735530]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#8f6d43] hover:bg-[#7b5b33] text-white font-semibold transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider py-3.5 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In to Account'
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          <span>Or continue with</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <div ref={googleButtonRef} className="flex justify-center min-h-10" aria-label="Sign in with Google" />
        {googleLoading && <p className="mt-2 text-center text-xs text-stone-500">Signing in with Google…</p>}
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <p className="mt-2 text-center text-xs text-stone-400">Google sign-in is not configured.</p>
        )}

        <p className="text-center mt-6 text-xs text-stone-500">
          Not yet registered with Neirah Jewellers?{' '}
          <Link to="/register" className="text-[#8f6d43] hover:text-[#735530] font-semibold">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
