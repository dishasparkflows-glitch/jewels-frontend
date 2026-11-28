import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed } from 'react-icons/hi';
import AuthLuxuryCard from '../../components/auth/AuthLuxuryCard';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

const ResetPassword = () => {
  const { brandName } = useStoreSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <AuthLuxuryCard
      seoTitle={`Reset Password | ${brandName}`}
      title="Reset Password"
      subtitle="Choose a strong new password to protect your account."
    >
          {token ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold tracking-[0.1em] text-stone-800 uppercase mb-1.5 text-left">
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
                    className="h-11 sm:h-12 w-full rounded-xl border border-stone-200/90 bg-[#F8F7F5] pl-11 pr-11 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:bg-white input-theme-focus autofill-neutral"
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
                <label className="block text-[10.5px] font-bold tracking-[0.1em] text-stone-800 uppercase mb-1.5 text-left">
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
                    className="h-11 sm:h-12 w-full rounded-xl border border-stone-200/90 bg-[#F8F7F5] pl-11 pr-11 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:bg-white input-theme-focus autofill-neutral"
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
                style={{
                  backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                  color: 'var(--btn-primary-text, #ffffff)',
                }}
                className="w-full rounded-xl hover:opacity-90 active:scale-[0.99] h-11 sm:h-12 px-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] transition-all shadow-xs hover:shadow-md disabled:cursor-wait disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
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
              <p className="text-xs text-stone-600 leading-relaxed">
                This reset link is missing or invalid. Please request a new link from the login page.
              </p>
            </div>
          )}
    </AuthLuxuryCard>
  );
};

export default ResetPassword;
