import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineLocationMarker,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header Profile Summary */}
      <div className="bg-surface-900/50 border border-surface-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center font-serif text-2xl font-bold text-surface-950 shadow-xl shadow-gold-500/20">
            {user?.firstName?.[0] || 'C'}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-[10px] font-semibold uppercase tracking-wider mb-1">
              <span>Privé Member</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs text-surface-400 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <Link to="/shop" className="btn-gold text-xs uppercase tracking-wider">
          Explore New Arrivals
        </Link>
      </div>

      {/* Profile Details & Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="bg-surface-900/40 border border-surface-800 rounded-2xl p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gold-500/10 text-gold-300 font-semibold text-xs tracking-wider uppercase text-left">
            <HiOutlineShoppingBag className="w-4 h-4" />
            <span>Order History</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/60 font-semibold text-xs tracking-wider uppercase text-left transition-colors">
            <HiOutlineUser className="w-4 h-4" />
            <span>Account Details</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/60 font-semibold text-xs tracking-wider uppercase text-left transition-colors">
            <HiOutlineLocationMarker className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/60 font-semibold text-xs tracking-wider uppercase text-left transition-colors">
            <HiOutlineShieldCheck className="w-4 h-4" />
            <span>Certificates & Appraisals</span>
          </button>
        </div>

        {/* Orders List View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-900/40 border border-surface-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="font-serif text-xl font-bold text-white">
              Recent Order History
            </h3>

            <div className="border border-surface-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-950/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-white">#JW-892401</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Delivered & Insured
                  </span>
                </div>
                <p className="text-xs text-surface-400">
                  Celestial Oval Solitaire Ring (1.50 ct, 18K Yellow Gold)
                </p>
                <p className="text-xs text-surface-500">Ordered on Sept 14, 2026</p>
              </div>

              <div className="text-right">
                <p className="text-base font-bold text-white">$3,450</p>
                <span className="text-[11px] text-gold-400 hover:underline cursor-pointer">
                  View GIA Dossier
                </span>
              </div>
            </div>

            <div className="text-center py-6 text-xs text-surface-500">
              Showing 1 of 1 completed orders
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
