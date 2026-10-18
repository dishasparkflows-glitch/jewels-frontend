import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import { HiOutlineLockClosed } from 'react-icons/hi';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings } = useStoreSettings();
  const brandLogo = {
    desktop: getImageUrl(settings.logoImage?.url),
    mobile: getImageUrl(settings.mobileLogoImage?.url),
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword: password });
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'This reset link is invalid or expired.');
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
          <h1 className="font-serif text-2xl text-stone-900 sm:text-3xl">Reset password</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">Choose a new password for your account.</p>
        </div>

        {token ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[['New password', password, setPassword], ['Confirm password', confirmPassword, setConfirmPassword]].map(([label, value, setter]) => (
              <label key={label} className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                {label}
                <span className="relative mt-2 block">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-11 pr-4 text-sm font-normal normal-case tracking-normal text-stone-900 outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                  />
                </span>
              </label>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#8f6d43] py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7b5b33] disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-stone-600">This reset link is missing or invalid. Request a new one from the login page.</p>
        )}

        <Link to="/login" className="mt-6 block text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#8f6d43] hover:text-[#735530]">
          Back to login
        </Link>
      </section>
    </main>
  );
};

export default ResetPassword;
