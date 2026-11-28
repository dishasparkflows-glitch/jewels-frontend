import { useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import { HiOutlineMail } from 'react-icons/hi';
import AuthLuxuryCard from '../../components/auth/AuthLuxuryCard';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

const ForgotPassword = () => {
  const { brandName } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.requestPasswordReset({ email: email.trim() });
      setSent(true);
      toast.success(data?.message || 'Check your email for a reset link.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send a reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLuxuryCard
      seoTitle={`Forgot Password | ${brandName}`}
      title="Forgot Password?"
      subtitle={
        sent
          ? 'If an account exists for that email, you will receive a secure password reset link shortly.'
          : "Enter your registered email address and we'll send you a secure link to reset your password."
      }
    >
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold tracking-[0.1em] text-stone-800 uppercase mb-1.5 text-left">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-stone-200/90 bg-white py-3 pl-11 pr-4 text-sm text-stone-900 placeholder-stone-400 outline-none transition-all input-theme-focus"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                  color: 'var(--btn-primary-text, #ffffff)',
                }}
                className="w-full rounded-xl btn-theme-primary active:scale-[0.99] py-3.5 px-4 text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-xs hover:opacity-90 hover:shadow-md disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 -rotate-45 stroke-[2] fill-none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    <span>SEND RESET LINK</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-2 space-y-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-2xs"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, #ffffff)',
                  color: 'var(--btn-primary-bg, #8b6f4e)',
                }}
              >
                <HiOutlineMail className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                We sent a link to <strong className="text-stone-900">{email}</strong>. Check your inbox and spam folder.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
                className="text-xs font-semibold hover:underline cursor-pointer block mx-auto"
              >
                Didn&apos;t receive the email? Try again
              </button>
            </div>
          )}
    </AuthLuxuryCard>
  );
};

export default ForgotPassword;
