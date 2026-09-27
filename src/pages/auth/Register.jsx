import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

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
        password: form.password,
      });
      toast.success('Welcome to Maison Jewels!', { icon: '✨' });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-surface-900/60 border border-surface-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gold-500/20">
            <span className="font-serif text-2xl font-bold text-surface-950">J</span>
          </div>
          <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
            Maison Jewels
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Client Registration
          </h2>
          <p className="text-xs text-surface-400">
            Create your account to unlock private previews, insured delivery, and atelier access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-surface-300 mb-1.5">
                First Name
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Eleanor"
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-surface-300 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Vanderbilt"
                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>

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
                placeholder="eleanor@maison.com"
                className="w-full bg-surface-950 border border-surface-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-surface-300 mb-1.5">
                Confirm
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 text-xs uppercase tracking-wider py-3.5 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-surface-950/30 border-t-surface-950 rounded-full animate-spin" />
            ) : (
              'Create Client Account'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="text-gold-400 hover:text-gold-300 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
