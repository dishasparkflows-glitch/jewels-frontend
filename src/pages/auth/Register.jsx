import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineDeviceMobile,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineUser,
} from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';
import Modal from '../../components/common/Modal';

const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const logoUrl = getImageUrl(settings.logoImage?.url || settings.mobileLogoImage?.url);
  const returnTo = location.state?.from;

  const destination = returnTo
    ? (typeof returnTo === 'string' ? returnTo : `${returnTo.pathname || '/'}${returnTo.search || ''}${returnTo.hash || ''}`)
    : '/';
  const closeModal = useCallback(() => {
    navigate(destination, { replace: true });
  }, [destination, navigate]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    if (!nameParts.length) {
      toast.error('Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || 'Customer',
        email: form.email.trim(),
        phone: `${countryCode} ${form.phone.trim()}`,
        password: form.password,
      });
      toast.success('Welcome to Neirah Jewellers!', { icon: '✨' });
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
            await loginWithGoogle(credential);
            toast.success('Welcome to Neirah Jewellers!', { icon: '✨' });
            navigate(destination, { replace: true });
          } catch (error) {
            toast.error(error.response?.data?.message || 'Google sign-up failed');
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
  }, [destination, loginWithGoogle, navigate]);

  return (
    <Modal open onClose={closeModal} label="Create your Neirah account" className="login-dialog">
      <div className="relative grid max-h-[calc(100dvh-2rem)] w-[min(920px,calc(100vw-2rem))] overflow-y-auto rounded-xl bg-white shadow-2xl md:min-h-[680px] md:grid-cols-[0.9fr_1.1fr]">
        <button type="button" onClick={closeModal} aria-label="Close create account" className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:bg-[#92704e]">
          <span aria-hidden="true" className="text-xl leading-none">×</span>
        </button>

        <div className="relative hidden min-h-[680px] overflow-hidden bg-[#171613] md:block">
          <img src="/featured/ring.jpg" alt="Gold jewellery from the Neirah collection" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
          <div className="absolute inset-x-8 bottom-10 text-white">
            {logoUrl ? <img src={logoUrl} alt="Neirah" className="mb-5 h-12 max-w-44 object-contain object-left brightness-0 invert" /> : <p className="mb-4 font-serif text-3xl tracking-[0.2em]">NEIRAH</p>}
            <p className="text-xs uppercase tracking-[0.28em] text-white/80">Shine your way</p>
          </div>
        </div>

        <section className="flex min-h-[620px] flex-col justify-center px-7 py-14 sm:px-12 md:px-14">
          <div className="mx-auto w-full max-w-md">
            {logoUrl && <img src={logoUrl} alt="Neirah" className="mx-auto mb-7 h-12 max-w-48 object-contain md:hidden" />}
            <h1 className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#24211e]">Create account</h1>

            <div ref={googleButtonRef} className="mt-7 flex min-h-12 justify-center" aria-label="Sign up with Google" />
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <button type="button" disabled className="mt-7 flex h-12 w-full items-center justify-center border border-stone-200 text-sm text-stone-500">
                Continue with Google
              </button>
            )}
            {googleLoading && <p className="mt-2 text-center text-xs text-stone-500">Creating account with Google…</p>}

            <div className="my-5 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              <span>Or</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <label className="sr-only" htmlFor="register-full-name">Full name</label>
              <div className="relative">
                <HiOutlineUser className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input id="register-full-name" type="text" autoComplete="name" value={form.fullName} onChange={updateField('fullName')} placeholder="Full Name" className="h-14 w-full border border-[#e9dfd3] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[#92704e] focus:ring-2 focus:ring-[#92704e]/15" required />
              </div>

              <label className="sr-only" htmlFor="register-email">Email address</label>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input id="register-email" type="email" autoComplete="email" value={form.email} onChange={updateField('email')} placeholder="Email Address" className="h-14 w-full border border-[#e9dfd3] bg-[#f4f7ff] pl-12 pr-4 text-sm outline-none transition focus:border-[#92704e] focus:ring-2 focus:ring-[#92704e]/15" required />
              </div>

              <label className="sr-only" htmlFor="register-phone">Mobile number</label>
              <div className="flex h-14 border border-[#e9dfd3] bg-white focus-within:border-[#92704e] focus-within:ring-2 focus-within:ring-[#92704e]/15">
                <HiOutlineDeviceMobile className="ml-4 mt-4 h-5 w-5 shrink-0 text-stone-500" />
                <select aria-label="Country calling code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="ml-2 w-[76px] shrink-0 border-r border-[#e9dfd3] bg-transparent px-1 text-sm text-stone-800 outline-none">
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                </select>
                <input id="register-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={form.phone} onChange={updateField('phone')} placeholder="Mobile Number" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-stone-400" required />
              </div>

              <label className="sr-only" htmlFor="register-password">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={updateField('password')} placeholder="Password" className="h-14 w-full border border-[#e9dfd3] bg-[#f4f7ff] pl-12 pr-12 text-sm outline-none transition focus:border-[#92704e] focus:ring-2 focus:ring-[#92704e]/15" required />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900">
                  {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center bg-black text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#302a24] disabled:cursor-wait disabled:opacity-60">
                {loading ? 'Creating account…' : 'Sign up'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-stone-600">
              Already have an account? <Link to="/login" state={{ from: returnTo }} className="ml-1 font-semibold uppercase text-stone-900 hover:text-[#92704e]">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default Register;
