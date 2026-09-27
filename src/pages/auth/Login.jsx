import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
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
      <div className="w-full max-w-md bg-surface-900/60 border border-surface-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gold-500/20">
            <span className="font-serif text-2xl font-bold text-surface-950">J</span>
          </div>
          <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
            Maison Jewels
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Client Authentication
          </h2>
          <p className="text-xs text-surface-400">
            Sign in to access your bespoke orders, wishlist, and VIP privileges
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-surface-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@maison.com"
                className="w-full bg-surface-950 border border-surface-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-surface-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-surface-950 border border-surface-800 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white"
              >
                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-surface-400">
              <input type="checkbox" className="rounded bg-surface-950 border-surface-800 text-gold-500 focus:ring-0" />
              <span>Remember me</span>
            </label>
            <span className="text-gold-400 hover:text-gold-300 cursor-pointer">
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 text-xs uppercase tracking-wider py-3.5 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-surface-950/30 border-t-surface-950 rounded-full animate-spin" />
            ) : (
              'Sign In to Account'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-surface-400">
          Not yet registered with Maison Jewels?{' '}
          <Link to="/register" className="text-gold-400 hover:text-gold-300 font-semibold">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
