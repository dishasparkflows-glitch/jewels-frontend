import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../api/services';
import { toast } from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineX,
} from 'react-icons/hi';

// Default mock values if user address data is empty in MongoDB
const DEFAULT_BILLING = {
  fullName: 'Disha Radadiya',
  addressLine: '1160/2, Near Gayatri Mandir, Sector 3D, GH Road',
  city: 'Gandhinagar',
  state: 'Gujarat',
  pincode: '382006',
  phone: '9825032534',
};

const DEFAULT_SHIPPING = {
  fullName: 'Disha Radadiya',
  addressLine: '1160/2, Near Gayatri Mandir, Sector 3D, GH Road',
  city: 'Gandhinagar',
  state: 'Gujarat',
  pincode: '382006',
  phone: '9825032534',
};

const DEFAULT_ADDITIONAL = [
  {
    id: 'addr-1',
    title: 'ADDRESS 1',
    fullName: 'Harsh Ramani',
    addressLine: '1160/2, Near Gayatri Mandir, Sector 3D, GH Road',
    city: 'Gandhinagar',
    state: 'Gujarat',
    pincode: '382006',
    phone: '9904860505',
  },
];

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders' | 'returns' | 'addresses'
  
  // Profile edit state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
  });

  // Address edit state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalType, setAddressModalType] = useState('billing'); // 'billing' | 'shipping' | 'edit-additional' | 'add-additional'
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);

  // Sync profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '917600993282',
        location: user.location || 'Not added',
        bio: user.bio || 'No bio available',
      });
    }
  }, [user]);

  // Handle outside click for modals
  useEffect(() => {
    const handleOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setEditProfileOpen(false);
        setAddressModalOpen(false);
      }
    };
    if (editProfileOpen || addressModalOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [editProfileOpen, addressModalOpen]);

  // Current effective addresses
  const billingAddress = user?.billingAddress?.fullName ? user.billingAddress : DEFAULT_BILLING;
  const shippingAddress = user?.shippingAddress?.fullName ? user.shippingAddress : DEFAULT_SHIPPING;
  const additionalAddresses =
    user?.addresses && user.addresses.length > 0 ? user.addresses : DEFAULT_ADDITIONAL;

  // ─── Save Profile Updates to API ───────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await usersAPI.updateMe({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        location: profileForm.location,
        bio: profileForm.bio,
      });
      const updated = res?.data?.data || res?.data;
      if (updated) {
        updateUser({ ...user, ...updated });
      }
      toast.success('Profile information updated successfully!');
      setEditProfileOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ─── Open Address Modal ─────────────────────────────────────────
  const openAddressModal = (type, index = null) => {
    setAddressModalType(type);
    setEditingAddressIndex(index);

    if (type === 'billing') {
      setAddressForm({ ...billingAddress });
    } else if (type === 'shipping') {
      setAddressForm({ ...shippingAddress });
    } else if (type === 'edit-additional' && index !== null) {
      setAddressForm({ ...additionalAddresses[index] });
    } else {
      setAddressForm({
        fullName: '',
        addressLine: '',
        city: 'Gandhinagar',
        state: 'Gujarat',
        pincode: '382006',
        phone: '',
      });
    }
    setAddressModalOpen(true);
  };

  // ─── Save Address Updates to API ───────────────────────────────
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let payload = {};

      if (addressModalType === 'billing') {
        payload = { billingAddress: { ...addressForm } };
      } else if (addressModalType === 'shipping') {
        payload = { shippingAddress: { ...addressForm } };
      } else if (addressModalType === 'edit-additional' && editingAddressIndex !== null) {
        const nextList = [...additionalAddresses];
        nextList[editingAddressIndex] = { ...addressForm, title: `ADDRESS ${editingAddressIndex + 1}` };
        payload = { addresses: nextList };
      } else if (addressModalType === 'add-additional') {
        const nextList = [
          ...additionalAddresses,
          { ...addressForm, title: `ADDRESS ${additionalAddresses.length + 1}` },
        ];
        payload = { addresses: nextList };
      }

      const res = await usersAPI.updateMe(payload);
      const updated = res?.data?.data || res?.data;
      if (updated) {
        updateUser({ ...user, ...updated });
      } else {
        // Fallback update in state
        updateUser({ ...user, ...payload });
      }
      toast.success('Address saved successfully!');
      setAddressModalOpen(false);
    } catch (err) {
      console.error('Failed to update address:', err);
      toast.error(err.response?.data?.message || 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Address ─────────────────────────────────────────────
  const handleDeleteAddress = async (index) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const nextList = additionalAddresses.filter((_, i) => i !== index);
      const res = await usersAPI.updateMe({ addresses: nextList });
      const updated = res?.data?.data || res?.data;
      if (updated) {
        updateUser({ ...user, ...updated });
      } else {
        updateUser({ ...user, addresses: nextList });
      }
      toast.success('Address deleted successfully!');
    } catch (err) {
      console.error('Failed to delete address:', err);
      toast.error('Failed to delete address');
    }
  };

  // Page title matching screenshots
  const pageTitle = activeTab === 'addresses' ? 'Address Book' : 'My Dashboard';

  return (
    <div className="bg-[#fcfbfa] min-h-screen text-[#22201e] font-sans antialiased py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header: Title and Logout Button */}
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-2xl sm:text-3xl font-medium text-[#22201e] tracking-tight">
            {pageTitle}
          </h1>
          <button
            onClick={logout}
            className="bg-black hover:bg-stone-800 text-white text-xs font-medium px-5 py-2 rounded shadow-sm transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Dashboard Layout: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar (4 cols on lg) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <nav className="flex flex-col text-xs sm:text-sm font-normal">
              {/* Profile Tab */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  activeTab === 'profile'
                    ? 'border-l-4 border-black bg-stone-50 font-semibold text-black'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineUser className="w-4 h-4 text-stone-500" />
                <span>Profile</span>
              </button>

              {/* Orders Tab */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  activeTab === 'orders'
                    ? 'border-l-4 border-black bg-stone-50 font-semibold text-black'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineCube className="w-4 h-4 text-stone-500" />
                <span>Orders</span>
              </button>

              {/* Returns Tab */}
              <button
                onClick={() => setActiveTab('returns')}
                className={`flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  activeTab === 'returns'
                    ? 'border-l-4 border-black bg-stone-50 font-semibold text-black'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineRefresh className="w-4 h-4 text-stone-500" />
                <span>Returns</span>
              </button>

              {/* Address Book Tab */}
              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  activeTab === 'addresses'
                    ? 'border-l-4 border-black bg-stone-50 font-semibold text-black'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineLocationMarker className="w-4 h-4 text-stone-500" />
                <span>Address Book</span>
              </button>
            </nav>
          </div>

          {/* Main Content Area (9 cols on lg) */}
          <div className="lg:col-span-9 space-y-6">
            {/* ─── TAB 1: PROFILE ───────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* 1. PROFILE INFORMATION CARD */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      PROFILE INFORMATION
                    </span>
                    <button
                      onClick={() => setEditProfileOpen(true)}
                      className="text-xs text-stone-600 hover:text-black hover:underline transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* User summary row */}
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200">
                        <HiOutlineUser className="w-9 h-9" />
                      </div>
                      <div className="space-y-0.5">
                        <h2 className="text-xl sm:text-2xl font-normal text-stone-900">
                          {user?.firstName || 'Disha'} {user?.lastName || 'Radadiya'}
                        </h2>
                        <p className="text-xs text-stone-500">
                          {user?.email || 'disha.sparkflows@gmail.com'}
                        </p>
                      </div>
                    </div>

                    {/* Info sub-cards (Phone, Location, Bio) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div className="border border-stone-200 rounded-xl p-4 flex items-center gap-3.5 bg-white">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <HiOutlinePhone className="w-4 h-4" />
                        </div>
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            PHONE
                          </span>
                          <span className="text-xs sm:text-sm text-stone-800 font-normal">
                            {user?.phone || '917600993282'}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="border border-stone-200 rounded-xl p-4 flex items-center gap-3.5 bg-white">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <HiOutlineLocationMarker className="w-4 h-4" />
                        </div>
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            LOCATION
                          </span>
                          <span className="text-xs sm:text-sm text-stone-800 font-normal">
                            {user?.location || 'Not added'}
                          </span>
                        </div>
                      </div>

                      {/* Bio (full-width on 2-col) */}
                      <div className="sm:col-span-2 border border-stone-200 rounded-xl p-4 flex items-center gap-3.5 bg-white">
                        <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <HiOutlineClock className="w-4 h-4" />
                        </div>
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            BIO
                          </span>
                          <span className="text-xs sm:text-sm text-stone-800 font-normal">
                            {user?.bio || 'No bio available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ADDRESS BOOK CARD (Profile Overview) */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      ADDRESS BOOK
                    </span>
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="text-xs text-stone-600 hover:text-black hover:underline transition-colors"
                    >
                      Manage Addresses
                    </button>
                  </div>

                  {/* Two Address Columns */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Default Billing Address */}
                    <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT BILLING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('billing')}
                          className="text-xs text-stone-500 hover:text-black hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{billingAddress.fullName}</p>
                      <p className="text-stone-600 leading-relaxed">{billingAddress.addressLine}</p>
                      <p className="text-stone-600">
                        {billingAddress.city}, {billingAddress.state} {billingAddress.pincode}
                      </p>
                      <p className="text-stone-600 pt-1">{billingAddress.phone}</p>
                    </div>

                    {/* Default Shipping Address */}
                    <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT SHIPPING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('shipping')}
                          className="text-xs text-stone-500 hover:text-black hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{shippingAddress.fullName}</p>
                      <p className="text-stone-600 leading-relaxed">{shippingAddress.addressLine}</p>
                      <p className="text-stone-600">
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                      </p>
                      <p className="text-stone-600 pt-1">{shippingAddress.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: ADDRESS BOOK (Screenshot 3) ────────────────── */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                {/* Section 1: Default Addresses */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-stone-100">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      DEFAULT ADDRESSES
                    </span>
                  </div>
                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Default Billing Address */}
                    <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT BILLING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('billing')}
                          className="text-xs text-stone-500 hover:text-black hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{billingAddress.fullName}</p>
                      <p className="text-stone-600 leading-relaxed">{billingAddress.addressLine}</p>
                      <p className="text-stone-600">
                        {billingAddress.city}, {billingAddress.state} {billingAddress.pincode}
                      </p>
                      <p className="text-stone-600 pt-1">{billingAddress.phone}</p>
                    </div>

                    {/* Default Shipping Address */}
                    <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT SHIPPING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('shipping')}
                          className="text-xs text-stone-500 hover:text-black hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{shippingAddress.fullName}</p>
                      <p className="text-stone-600 leading-relaxed">{shippingAddress.addressLine}</p>
                      <p className="text-stone-600">
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                      </p>
                      <p className="text-stone-600 pt-1">{shippingAddress.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Additional Address Entries */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-stone-100">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      ADDITIONAL ADDRESS ENTRIES
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    {additionalAddresses.length === 0 ? (
                      <p className="text-xs text-stone-500 py-4">No additional addresses saved yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {additionalAddresses.map((addr, idx) => (
                          <div
                            key={addr.id || idx}
                            className="border border-stone-200 rounded-xl p-5 space-y-2 text-xs sm:text-sm text-stone-700 bg-white"
                          >
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              {addr.title || `ADDRESS ${idx + 1}`}
                            </span>
                            <p className="font-normal text-stone-900">{addr.fullName}</p>
                            <p className="text-stone-600 text-xs leading-relaxed">{addr.addressLine}</p>
                            <p className="text-stone-600 text-xs">
                              {addr.city}, {addr.state} {addr.pincode}
                            </p>
                            <p className="text-stone-600 text-xs pt-1">{addr.phone}</p>

                            <div className="flex items-center gap-4 pt-3 border-t border-stone-100 text-xs">
                              <button
                                onClick={() => openAddressModal('edit-additional', idx)}
                                className="text-stone-600 hover:text-black hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(idx)}
                                className="text-red-500 hover:text-red-700 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Add New Address and Back */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => openAddressModal('add-additional')}
                    className="bg-black hover:bg-stone-800 text-white text-xs font-medium px-6 py-2.5 rounded shadow-sm transition-colors"
                  >
                    Add New Address
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black"
                  >
                    BACK
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 3: ORDERS ────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                  <HiOutlineCube className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-normal text-stone-800">Your Orders</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  You have no pending orders. Explore our exquisite jewelry collections and certified solitaires.
                </p>
                <div className="pt-2">
                  <a
                    href="/shop"
                    className="inline-block bg-black hover:bg-stone-800 text-white text-xs uppercase tracking-wider px-6 py-2.5 rounded"
                  >
                    Shop Collection
                  </a>
                </div>
              </div>
            )}

            {/* ─── TAB 4: RETURNS ───────────────────────────────────── */}
            {activeTab === 'returns' && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                  <HiOutlineRefresh className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-normal text-stone-800">Returns & Exchanges</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  No active return requests found. We offer 30-day hassle-free returns and lifetime exchange.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── EDIT PROFILE MODAL ─────────────────────────────────────── */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
          >
            <div className="bg-[#22201e] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-cinzel text-base tracking-wider uppercase text-white">
                Edit Profile Information
              </h3>
              <button
                onClick={() => setEditProfileOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    required
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    required
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="e.g. 917600993282"
                  className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Location
                </label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="e.g. Gandhinagar, Gujarat"
                  className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about your jewellery preferences..."
                  className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-black hover:bg-stone-800 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT / ADD ADDRESS MODAL ───────────────────────────────── */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
          >
            <div className="bg-[#22201e] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-cinzel text-base tracking-wider uppercase text-white">
                {addressModalType === 'billing' && 'Edit Default Billing Address'}
                {addressModalType === 'shipping' && 'Edit Default Shipping Address'}
                {addressModalType === 'edit-additional' && 'Edit Address Entry'}
                {addressModalType === 'add-additional' && 'Add New Address'}
              </h3>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  required
                  placeholder="Full recipient name"
                  className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  required
                  placeholder="Flat/House no., Street, Area"
                  className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                    placeholder="City"
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                    placeholder="State"
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    required
                    placeholder="382006"
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                    placeholder="9825032534"
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-black hover:bg-stone-800 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
