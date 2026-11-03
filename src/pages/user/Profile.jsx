import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, addressesAPI } from '../../api/services';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/common/Dropdown';
import PhoneInput from '../../components/common/PhoneInput';
import {
  HiOutlineUser,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineX,
  HiOutlinePencilAlt,
  HiOutlineLogout,
  HiOutlineDocumentText,
  HiArrowRight,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineMap,
  HiOutlineViewGrid,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
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
    countryCode: '+91',
    location: '',
    bio: '',
  });

  // Dedicated Address state
  const [addresses, setAddresses] = useState([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalType, setAddressModalType] = useState('billing'); // 'billing' | 'shipping' | 'edit-additional' | 'add-additional'
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    addressLine: '',
    city: 'Gandhinagar',
    state: 'Gujarat',
    pincode: '382006',
    phone: '',
    countryCode: '+91',
    isDefault: false,
  });

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const modalRef = useRef(null);

  // Sync profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        location: user.profile?.location || '',
        bio: user.profile?.bio || '',
      });
    }
  }, [user]);

  // Load addresses from dedicated Address model
  const fetchAddresses = async () => {
    try {
      const res = await addressesAPI.getAll();
      const list = res?.data?.data || res?.data || [];
      setAddresses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchAddresses();
    }
  }, [user?._id]);

  // Handle outside click for modals
  useEffect(() => {
    const handleOutside = (e) => {
      // Do not close modal if interaction occurred inside a dropdown listbox or popover
      if (e.target?.closest?.('[role="listbox"], [role="option"], .luxury-scrollbar')) {
        return;
      }
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

  // User display name helper
  const userFullName = useMemo(() => {
    if (!user) return '';
    return [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || '';
  }, [user]);

  // Current effective addresses from dedicated addresses table
  const billingAddress = useMemo(() => {
    return addresses.find((a) => a.defaults?.isBillingDefault || a.isBillingDefault) || addresses.find((a) => a.defaults?.isDefault || a.isDefault) || addresses[0] || {};
  }, [addresses]);

  const shippingAddress = useMemo(() => {
    return addresses.find((a) => a.defaults?.isShippingDefault || a.isShippingDefault) || addresses.find((a) => a.defaults?.isDefault || a.isDefault) || addresses[0] || {};
  }, [addresses]);

  const bAddr = useMemo(() => billingAddress?.address || billingAddress || {}, [billingAddress]);
  const sAddr = useMemo(() => shippingAddress?.address || shippingAddress || {}, [shippingAddress]);

  const additionalAddresses = useMemo(() => {
    return addresses.filter((a) => a._id !== billingAddress?._id && a._id !== shippingAddress?._id);
  }, [addresses, billingAddress?._id, shippingAddress?._id]);

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
  const openAddressModal = (type, addr = null) => {
    setAddressModalType(type);

    const target = type === 'billing' ? billingAddress : type === 'shipping' ? shippingAddress : addr;
    const aData = target?.address || target || {};
    const aDefs = target?.defaults || target || {};

    if (target?._id) {
      setSelectedAddressId(target._id);
      setAddressForm({
        type: aData.type || 'home',
        phone: aData.phone || user?.profile?.phone || '',
        addressLine: aData.addressLine || '',
        street: aData.street || '',
        city: aData.city || 'Gandhinagar',
        state: aData.state || 'Gujarat',
        pincode: aData.pincode || '382006',
        country: aData.country || 'India',
        isDefault: Boolean(aDefs.isDefault || aDefs.isShippingDefault || aDefs.isBillingDefault),
      });
    } else {
      setSelectedAddressId(null);
      setAddressForm({
        type: 'home',
        phone: user?.profile?.phone || '',
        addressLine: '',
        street: '',
        city: 'Gandhinagar',
        state: 'Gujarat',
        pincode: '382006',
        country: 'India',
        isDefault: false,
      });
    }
    setAddressModalOpen(true);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          lat: String(coords.latitude),
          lon: String(coords.longitude),
          addressdetails: '1',
          'accept-language': 'en',
          zoom: '18',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
        if (!response.ok) throw new Error('Could not look up this location');
        const result = await response.json();
        const place = result.address || {};
        const street = [place.house_number, place.road || place.pedestrian || place.footway]
          .filter(Boolean)
          .join(' ');
        const area = place.neighbourhood || place.suburb || place.residential || place.quarter;
        const city = place.city || place.town || place.village || place.municipality || place.county;
        setAddressForm((current) => ({
          ...current,
          addressLine: [street, area && area !== city ? area : ''].filter(Boolean).join(', '),
          city: city || '',
          state: place.state || '',
          pincode: place.postcode || '',
        }));
        if (!street && !area) {
          toast('Location found, but this map point has no street details. Please enter the house and street manually.');
        } else {
          toast.success('Street, area and address details filled from your location');
        }
      } catch (error) {
        toast.error(error.message || 'Could not find your address');
      } finally {
        setLocating(false);
      }
    }, (error) => {
      setLocating(false);
      toast.error(error.code === error.PERMISSION_DENIED ? 'Location permission was denied' : 'Could not get your location');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  };

  // ─── Save Address Updates to Dedicated Address API ────────────
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const isShipping = addressModalType === 'shipping' || Boolean(addressForm.isDefault);
      const isBilling = addressModalType === 'billing';

      const payload = {
        address: {
          type: addressForm.type || 'home',
          phone: addressForm.phone,
          addressLine: addressForm.addressLine,
          street: addressForm.street || '',
          city: addressForm.city,
          state: addressForm.state,
          pincode: addressForm.pincode,
          country: addressForm.country || 'India',
        },
        defaults: {
          isDefault: Boolean(addressForm.isDefault),
          isBillingDefault: Boolean(isBilling),
          isShippingDefault: Boolean(isShipping),
        },
      };

      if (selectedAddressId) {
        await addressesAPI.update(selectedAddressId, payload);
      } else {
        await addressesAPI.create(payload);
      }

      await fetchAddresses();
      toast.success('Address saved successfully!');
      setAddressModalOpen(false);
    } catch (err) {
      console.error('Failed to update address:', err);
      toast.error(err.response?.data?.message || 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Address via Dedicated Address API ──────────────────
  const handleDeleteAddress = async (addressId) => {
    if (!addressId) return;
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressesAPI.delete(addressId);
      await fetchAddresses();
      toast.success('Address deleted successfully!');
    } catch (err) {
      console.error('Failed to delete address:', err);
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
  };

  // Page title matching screenshots
  const pageTitle = activeTab === 'addresses' ? 'Address Book' : 'My Dashboard';

  return (
    <div className="bg-[#fcfbfa] min-h-screen text-[#22201e] font-sans antialiased py-6 sm:py-8 px-3 sm:px-5 lg:px-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Header: Title and Logout Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5">
              Manage your profile, orders, returns and addresses all in one place.
            </p>
          </div>
          <button
            onClick={logout}
            className="border border-[#d6c7b2] rounded-lg px-4 py-2 text-xs font-medium text-[#8b6f4e] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5"
          >
            <HiOutlineLogout className="w-4 h-4 text-[#8b6f4e]" />
            <span>Logout</span>
          </button>
        </div>

        {/* Dashboard Layout: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* Left Navigation Sidebar (3 cols on lg) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
            <nav className="flex flex-col text-xs sm:text-sm font-normal">
              {/* Profile Tab */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  activeTab === 'profile'
                    ? 'border-l-4 border-[#8b6f4e] bg-[#FAF7F2] font-medium text-[#8b6f4e]'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineUser className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#8b6f4e]' : 'text-stone-500'}`} />
                <span>Profile</span>
              </button>

              {/* Orders Tab */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  activeTab === 'orders'
                    ? 'border-l-4 border-[#8b6f4e] bg-[#FAF7F2] font-medium text-[#8b6f4e]'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineCube className={`w-4 h-4 ${activeTab === 'orders' ? 'text-[#8b6f4e]' : 'text-stone-500'}`} />
                <span>Orders</span>
              </button>

              {/* Returns Tab */}
              <button
                onClick={() => setActiveTab('returns')}
                className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  activeTab === 'returns'
                    ? 'border-l-4 border-[#8b6f4e] bg-[#FAF7F2] font-medium text-[#8b6f4e]'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineRefresh className={`w-4 h-4 ${activeTab === 'returns' ? 'text-[#8b6f4e]' : 'text-stone-500'}`} />
                <span>Returns</span>
              </button>

              {/* Address Book Tab */}
              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  activeTab === 'addresses'
                    ? 'border-l-4 border-[#8b6f4e] bg-[#FAF7F2] font-medium text-[#8b6f4e]'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <HiOutlineLocationMarker className={`w-4 h-4 ${activeTab === 'addresses' ? 'text-[#8b6f4e]' : 'text-stone-500'}`} />
                <span>Address Book</span>
              </button>
            </nav>
          </div>

          {/* Main Content Area (9 cols on lg) */}
          <div className="lg:col-span-9 space-y-4">
            {/* ─── TAB 1: PROFILE ───────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* 1. PROFILE INFORMATION CARD */}
                <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
                  {/* Card Header */}
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      PROFILE INFORMATION
                    </span>
                    <button
                      onClick={() => setEditProfileOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#8b6f4e] hover:text-[#745735] font-medium transition-colors"
                    >
                      <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  {/* Card Body: single horizontal row matching screenshot */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-6">
                      
                      {/* 1. Avatar + Name & Email */}
                      <div className="flex items-center gap-3.5 shrink-0 min-w-0">
                        <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#f4ebe1] text-[#8b6f4e] font-serif text-xl sm:text-2xl font-medium flex items-center justify-center shrink-0 border border-[#e8dfd5]">
                          {(userFullName?.[0] || user?.profile?.firstName?.[0] || 'D').toUpperCase()}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h2 className="text-base sm:text-lg font-medium text-stone-900 leading-tight whitespace-nowrap" title={userFullName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim()}>
                            {userFullName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Disha Customer'}
                          </h2>
                          <p className="text-xs text-stone-500 font-normal truncate max-w-[180px]" title={user?.auth?.email}>
                            {user?.auth?.email || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden lg:block h-10 w-px bg-stone-200 shrink-0 self-center" />

                      {/* 2. Phone */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                          <HiOutlinePhone className="w-4 h-4" />
                        </div>
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            PHONE
                          </span>
                          <span className="text-xs sm:text-sm text-stone-900 font-medium whitespace-nowrap">
                            {user?.profile?.phone ? (user.profile.phone.startsWith('+') ? user.profile.phone : `+91 ${user.profile.phone}`) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden lg:block h-10 w-px bg-stone-200 shrink-0 self-center" />

                      {/* 3. Location */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0">
                          <HiOutlineLocationMarker className="w-4 h-4" />
                        </div>
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            LOCATION
                          </span>
                          <span className="text-xs sm:text-sm text-stone-900 font-medium whitespace-nowrap" title={user?.profile?.location}>
                            {user?.profile?.location || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden lg:block h-10 w-px bg-stone-200 shrink-0 self-center" />

                      {/* 4. Bio */}
                      <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                        <div className="w-9 h-9 rounded-full bg-[#f5f3ff] text-[#8b5cf6] flex items-center justify-center shrink-0">
                          <HiOutlineDocumentText className="w-4 h-4" />
                        </div>
                        <div className="leading-tight min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            BIO
                          </span>
                          <span
                            className="text-xs sm:text-sm text-stone-900 font-medium block break-words"
                            title={user?.profile?.bio || ''}
                          >
                            {user?.profile?.bio || '—'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 2. ADDRESS BOOK CARD (Profile Overview) */}
                <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
                  {/* Card Header */}
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      ADDRESS BOOK
                    </span>
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="inline-flex items-center gap-1 text-xs text-[#8b6f4e] hover:text-[#745735] font-medium transition-colors"
                    >
                      <span>Manage Addresses</span>
                      <HiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Two Address Columns */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Default Billing Address */}
                    <div className="space-y-1.5 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT BILLING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('billing')}
                          className="inline-flex items-center gap-1 text-xs text-[#8b6f4e] hover:text-[#745735] font-medium transition-colors"
                        >
                          <span>Edit</span>
                          <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{billingAddress.fullName || userFullName || 'Disha Customer'}</p>
                      <p className="text-stone-600 leading-relaxed">{bAddr.addressLine || 'No address set'}</p>
                      {bAddr.city && (
                        <p className="text-stone-600">
                          {[bAddr.city, bAddr.state, bAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {bAddr.phone && <p className="text-stone-600 pt-1">{bAddr.phone}</p>}
                    </div>

                    {/* Default Shipping Address */}
                    <div className="space-y-1.5 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT SHIPPING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('shipping')}
                          className="inline-flex items-center gap-1 text-xs text-[#8b6f4e] hover:text-[#745735] font-medium transition-colors"
                        >
                          <span>Edit</span>
                          <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{shippingAddress.fullName || userFullName || 'Disha Customer'}</p>
                      <p className="text-stone-600 leading-relaxed">{sAddr.addressLine || 'No address set'}</p>
                      {sAddr.city && (
                        <p className="text-stone-600">
                          {[sAddr.city, sAddr.state, sAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {sAddr.phone && <p className="text-stone-600 pt-1">{sAddr.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: ADDRESS BOOK (Screenshot 3) ────────────────── */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                {/* Section 1: Default Addresses */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      DEFAULT ADDRESSES
                    </span>
                  </div>
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Default Billing Address */}
                    <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT BILLING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('billing')}
                          className="inline-flex items-center gap-1 text-xs text-[#8b6f4e] hover:text-[#745735] font-medium transition-colors"
                        >
                          <span>Edit</span>
                          <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{billingAddress.fullName || userFullName || 'Disha Customer'}</p>
                      <p className="text-stone-600 leading-relaxed">{bAddr.addressLine || 'No address set'}</p>
                      {bAddr.city && (
                        <p className="text-stone-600">
                          {[bAddr.city, bAddr.state, bAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {bAddr.phone && <p className="text-stone-600 pt-1">{bAddr.phone}</p>}
                    </div>

                    {/* Default Shipping Address */}
                    <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                          DEFAULT SHIPPING ADDRESS
                        </span>
                        <button
                          onClick={() => openAddressModal('shipping')}
                          className="inline-flex items-center gap-1 text-xs text-[#8b6f4e] hover:text-[#745735] font-medium transition-colors"
                        >
                          <span>Edit</span>
                          <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-normal text-stone-900">{shippingAddress.fullName || userFullName || 'Disha Customer'}</p>
                      <p className="text-stone-600 leading-relaxed">{sAddr.addressLine || 'No address set'}</p>
                      {sAddr.city && (
                        <p className="text-stone-600">
                          {[sAddr.city, sAddr.state, sAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {sAddr.phone && <p className="text-stone-600 pt-1">{sAddr.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Additional Address Entries */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-stone-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-stone-800">
                      ADDITIONAL ADDRESS ENTRIES
                    </span>
                    <button
                      type="button"
                      onClick={() => openAddressModal('add-additional')}
                      className="bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add New Address</span>
                    </button>
                  </div>
                  <div className="p-4 sm:p-5">
                    {additionalAddresses.length === 0 ? (
                      <p className="text-xs text-stone-500 py-4">No additional addresses saved yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {additionalAddresses.map((addrItem, idx) => {
                          const addr = addrItem.address || addrItem;
                          return (
                            <div
                              key={addrItem._id || idx}
                              className="border border-stone-200 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-stone-700 bg-white"
                            >
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                {addr.type ? addr.type.toUpperCase() : `ADDRESS ${idx + 1}`}
                              </span>
                              <p className="font-normal text-stone-900">{userFullName}</p>
                              <p className="text-stone-600 text-xs leading-relaxed">{addr.addressLine}</p>
                              <p className="text-stone-600 text-xs">
                                {addr.city}, {addr.state} {addr.pincode}
                              </p>
                              <p className="text-stone-600 text-xs pt-1">{addr.phone}</p>

                              <div className="flex items-center gap-4 pt-3 border-t border-stone-100 text-xs">
                                <button
                                  type="button"
                                  onClick={() => openAddressModal('edit-additional', addrItem)}
                                  className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#8b6f4e] font-medium transition-colors"
                                  title="Edit address"
                                >
                                  <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addrItem._id)}
                                  className="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 font-medium transition-colors"
                                  title="Delete address"
                                >
                                  <HiOutlineTrash className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Back */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-[#8b6f4e] transition-colors cursor-pointer"
                  >
                    BACK
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 3: ORDERS ────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                  <HiOutlineCube className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-normal text-stone-800">Your Orders</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  You have no pending orders. Explore our exquisite jewelry collections and certified solitaires.
                </p>
                <div className="pt-2">
                  <Link
                    to="/shop"
                    className="inline-block btn-theme-primary bg-[#8b6f4e] hover:bg-[#755c3e] text-white text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-sm hover:shadow transition-all"
                  >
                    Shop Collection
                  </Link>
                </div>
              </div>
            )}

            {/* ─── TAB 4: RETURNS ───────────────────────────────────── */}
            {activeTab === 'returns' && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                  <HiOutlineRefresh className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-normal text-stone-800">Returns & Exchanges</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  No active return requests found.
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
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-900"
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
                    className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Phone Number
                </label>
                <PhoneInput
                  value={profileForm.phone}
                  onChange={(val) => setProfileForm({ ...profileForm, phone: val })}
                  countryCode={profileForm.countryCode}
                  onCountryCodeChange={(code) => setProfileForm({ ...profileForm, countryCode: code })}
                  placeholder="Enter phone number"
                  size="md"
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
                  className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-900"
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
                  className="w-full border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-900"
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
                  className="px-6 py-2 btn-theme-primary bg-[#8b6f4e] hover:bg-[#755c3e] text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            ref={modalRef}
            className="w-full max-w-[540px] bg-white rounded-2xl shadow-2xl animate-scale-in my-6 relative"
          >
            {/* Dark Header */}
            <div className="bg-[#262320] text-white px-7 py-5 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-serif text-2xl font-normal text-white tracking-wide">
                {addressModalType === 'add-additional' && 'Add New Address'}
                {addressModalType === 'edit-additional' && 'Edit Address'}
                {addressModalType === 'billing' && 'Edit Default Billing Address'}
                {addressModalType === 'shipping' && 'Edit Default Shipping Address'}
              </h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="text-stone-300 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Close"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-7 space-y-4">
              {/* Use My Location button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d6cfc2] bg-white hover:bg-[#faf7f2] px-4 py-2 text-xs font-semibold text-stone-800 transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  <HiOutlineLocationMarker className="w-4 h-4 text-stone-700" />
                  <span>{locating ? 'Finding location…' : 'Use My Location'}</span>
                </button>
              </div>

              {/* Address Type */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Address Type
                </label>
                <div className="flex gap-2">
                  {['home', 'office', 'other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, type: t })}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all cursor-pointer ${
                        (addressForm.type || 'home') === t
                          ? 'bg-[#8b6f4e] text-white border-[#8b6f4e]'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Address Line <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-start rounded-xl border border-[#e5ded5] hover:border-[#bdae99] focus-within:border-[#9e7a46] focus-within:ring-2 focus-within:ring-[#9e7a46]/10 transition-all bg-white shadow-2xs">
                  <HiOutlineHome className="w-4 h-4 text-stone-600 ml-3.5 mt-3 shrink-0" />
                  <textarea
                    rows={2}
                    value={addressForm.addressLine}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                    required
                    placeholder="Flat/House no., Building, Area"
                    className="w-full pl-3 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* Street / Landmark */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Street / Landmark <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="relative flex items-center rounded-xl border border-[#e5ded5] hover:border-[#bdae99] focus-within:border-[#9e7a46] focus-within:ring-2 focus-within:ring-[#9e7a46]/10 transition-all bg-white shadow-2xs">
                  <input
                    type="text"
                    value={addressForm.street || ''}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="Street, landmark, suite, etc."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center rounded-xl border border-[#e5ded5] hover:border-[#bdae99] focus-within:border-[#9e7a46] focus-within:ring-2 focus-within:ring-[#9e7a46]/10 transition-all bg-white shadow-2xs">
                    <HiOutlineOfficeBuilding className="w-4 h-4 text-stone-600 ml-3.5 shrink-0" />
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                      placeholder="City"
                      className="w-full pl-3 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    value={addressForm.state}
                    onChange={(val) => setAddressForm((prev) => ({ ...prev, state: val }))}
                    options={INDIAN_STATES.map((st) => ({ value: st, label: st }))}
                    placeholder="Select State"
                    searchable={true}
                    searchPlaceholder="Search state..."
                    prefixIcon={<HiOutlineMap className="w-4 h-4 text-stone-600" />}
                    buttonClassName="w-full flex items-center justify-between gap-2 pl-3.5 pr-4 py-2.5 rounded-xl border border-[#e5ded5] bg-white text-xs sm:text-sm text-stone-900 hover:border-[#bdae99] focus:outline-none focus:border-[#9e7a46] focus:ring-2 focus:ring-[#9e7a46]/10 transition-all cursor-pointer shadow-2xs"
                    menuClassName="z-[100] shadow-xl border border-stone-200"
                  />
                </div>
              </div>

              {/* Pincode & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center rounded-xl border border-[#e5ded5] hover:border-[#bdae99] focus-within:border-[#9e7a46] focus-within:ring-2 focus-within:ring-[#9e7a46]/10 transition-all bg-white shadow-2xs">
                    <HiOutlineViewGrid className="w-4 h-4 text-stone-600 ml-3.5 shrink-0" />
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      required
                      placeholder="382006"
                      className="w-full pl-3 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    value={addressForm.phone}
                    onChange={(val) => setAddressForm({ ...addressForm, phone: val })}
                    countryCode={addressForm.countryCode}
                    onCountryCodeChange={(code) => setAddressForm({ ...addressForm, countryCode: code })}
                    placeholder="9825032534"
                    required
                    size="lg"
                    variant="profile"
                  />
                </div>
              </div>

              {/* Set as default address checkbox */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(addressForm.isDefault)}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-[#9e7a46] focus:ring-[#9e7a46] border-stone-300 accent-[#9e7a46] cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-medium text-stone-800">
                    Set as default address
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-[#d6cfc2] hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl btn-theme-primary bg-[#8b6f4e] hover:bg-[#755c3e] text-white text-xs sm:text-sm font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
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
