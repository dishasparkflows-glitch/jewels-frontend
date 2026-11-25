import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed } from 'react-icons/hi';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings } = useStoreSettings();
  const brandLogo = {
    desktop: getImageUrl(settings?.logoImage?.url),
    mobile: getImageUrl(settings?.mobileLogoImage?.url),
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword: password });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'This reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[75vh] bg-[#fbf9f6] px-4 py-12 sm:py-16 flex items-center justify-center font-sans">
      <SEO title="Reset Password | Neirah Jewels" noindex={true} />
      <section className="relative w-full max-w-[420px] overflow-hidden rounded-[26px] border border-[#ebdcc8] bg-[#faf6f0] p-7 sm:p-9 shadow-[0_12px_45px_rgba(70,50,30,0.08)]">
        {/* Subtle decorative floral/lace watermark in bottom-right corner */}
        <svg
          className="absolute -bottom-3 -right-3 w-32 h-32 text-[#ebdcc8]/50 pointer-events-none select-none"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <circle cx="120" cy="120" r="100" strokeDasharray="3 3" />
          <circle cx="120" cy="120" r="80" />
          <circle cx="120" cy="120" r="60" strokeDasharray="2 2" />
          <circle cx="120" cy="120" r="40" />
          <path d="M120,30 Q80,80 30,120" />
          <path d="M120,50 Q95,95 50,120" />
          <path d="M120,70 Q105,105 70,120" />
          <path d="M85,120 C85,95 95,85 120,85" />
          <path d="M60,120 C60,75 75,60 120,60" />
        </svg>

        {/* Brand Header */}
        <div className="text-center relative z-10 mb-2">
          {brandLogo.desktop ? (
            <div className="mx-auto mb-3 flex h-10 w-44 items-center justify-center">
              <img
                src={brandLogo.desktop}
                alt={settings?.storeName || 'Neirah'}
                className="max-h-9 max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="mb-3">
              <span className="font-serif text-[28px] sm:text-[30px] tracking-[0.14em] text-[#2c241d] font-normal leading-none block">
                NEIRAH<sup className="text-[10px] ml-0.5 font-sans font-light text-[#8b6f4e]">™</sup>
              </span>
              <span className="block text-[8px] sm:text-[9px] tracking-[0.3em] uppercase text-[#8b6f4e] font-medium mt-1">
                — SHINE YOUR WAY —
              </span>
            </div>
          )}

          {/* Heading */}
          <h1 className="font-serif text-[24px] sm:text-[26px] text-[#221a14] font-normal tracking-tight mt-1">
            Reset Password
          </h1>

          {/* Decorative Divider with Heart */}
          <div className="my-2.5 flex items-center justify-center gap-3">
            <div className="h-[1px] w-12 bg-[#dfd1bf]" />
            <svg
              className="w-3.5 h-3.5 text-[#8b6f4e]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            <div className="h-[1px] w-12 bg-[#dfd1bf]" />
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] leading-relaxed text-[#75685c] max-w-xs mx-auto">
            Choose a strong new password to protect your account.
          </p>
        </div>

        {/* Form */}
        <div className="relative z-10 mt-5">
          {token ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold tracking-[0.1em] text-[#3e352d] uppercase mb-1.5 text-left">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-11 sm:h-12 w-full rounded-xl border border-stone-200/90 bg-[#F8F7F5] pl-11 pr-11 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#7A5B3E] focus:bg-white focus:ring-2 focus:ring-[#7A5B3E]/15 autofill-neutral"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold tracking-[0.1em] text-[#3e352d] uppercase mb-1.5 text-left">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-600" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-11 sm:h-12 w-full rounded-xl border border-stone-200/90 bg-[#F8F7F5] pl-11 pr-11 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#7A5B3E] focus:bg-white focus:ring-2 focus:ring-[#7A5B3E]/15 autofill-neutral"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    {showConfirmPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#715538] hover:bg-[#5f472e] active:scale-[0.99] h-11 sm:h-12 px-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all shadow-xs hover:shadow-md disabled:cursor-wait disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>SAVE NEW PASSWORD</span>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-2 space-y-3">
              <p className="text-xs text-[#75685c] leading-relaxed">
                This reset link is missing or invalid. Please request a new link from the login page.
              </p>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a4838] hover:text-[#2d2319] transition-colors cursor-pointer"
            >
              <span className="text-sm leading-none">←</span>
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
