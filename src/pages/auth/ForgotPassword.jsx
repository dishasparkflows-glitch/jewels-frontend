import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import { HiOutlineMail } from 'react-icons/hi';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageUrl';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [brandLogo, setBrandLogo] = useState({ desktop: '', mobile: '' });

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const settings = data?.data || {};
      setBrandLogo({ desktop: getImageUrl(settings.logoImage?.url), mobile: getImageUrl(settings.mobileLogoImage?.url) });
    }).catch(() => {});
  }, []);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.requestPasswordReset({ email: email.trim() });
      setSent(true);
      toast.success(data.message || 'Check your email for a reset link.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send a reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-[#fbfaf8] px-4 py-12 sm:py-16 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-[0_14px_45px_rgba(65,48,29,0.10)] sm:p-10">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-44 items-center justify-center overflow-hidden rounded-xl border border-[#e8d9c2] bg-[#faf5ee]">
            {brandLogo.desktop ? (
              <picture className="flex h-full w-full items-center justify-center">
                {brandLogo.mobile && <source media="(max-width: 639px)" srcSet={brandLogo.mobile} />}
                <img src={brandLogo.desktop} alt="Neirah Jewellers" className="h-full w-full object-contain p-2" />
              </picture>
            ) : <span className="font-serif text-2xl tracking-[0.18em] text-[#8b6f4e]">NEIRAH</span>}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8f6d43]">Account security</p>
          <h1 className="font-serif text-2xl text-stone-900 sm:text-3xl">Forgot password?</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            {sent
              ? 'If an account exists for that email, you will receive a password reset link shortly.'
              : 'Enter your account email and we’ll send you a secure reset link.'}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Email address
              <span className="relative mt-2 block">
                <HiOutlineMail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-11 pr-4 text-sm font-normal normal-case tracking-normal text-stone-900 outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#8f6d43] py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7b5b33] disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-6 block text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#8f6d43] hover:text-[#735530]">
          Back to login
        </Link>
      </section>
    </main>
  );
};

export default ForgotPassword;
