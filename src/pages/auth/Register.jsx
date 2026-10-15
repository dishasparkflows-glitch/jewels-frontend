import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineDeviceMobile } from 'react-icons/hi';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageUrl';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [brandLogo, setBrandLogo] = useState({ desktop: '', mobile: '' });

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const settings = data?.data || {};
      setBrandLogo({ desktop: getImageUrl(settings.logoImage?.url), mobile: getImageUrl(settings.mobileLogoImage?.url) });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success('Welcome to Neirah Jewellers!', { icon: '✨' });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10 sm:py-16 bg-[#fbfaf8]">
      <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-[0_14px_45px_rgba(65,48,29,0.10)] relative">
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
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900">
            Create your account
          </h2>
          <p className="text-xs text-stone-500">
            Save your favourites and enjoy a more personal shopping experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                First Name
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Eleanor"
                  className="w-full bg-white border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Vanderbilt"
                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-white border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <HiOutlineDeviceMobile className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Confirm
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#8f6d43] hover:bg-[#7b5b33] text-white font-semibold transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider py-3.5 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              'Create my account'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#8f6d43] hover:text-[#735530] font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
