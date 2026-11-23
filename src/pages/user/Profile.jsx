import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { usersAPI, addressesAPI, ordersAPI, reviewsAPI } from '../../api/services';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/common/Dropdown';
import PhoneInput from '../../components/common/PhoneInput';
import { FaStar } from 'react-icons/fa6';
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
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineShoppingCart,
  HiOutlineArrowLeft,
  HiOutlineDotsVertical,
} from 'react-icons/hi';
import { HiOutlineSquare3Stack3D } from 'react-icons/hi2';
import { getImageUrl } from '../../utils/imageUrl';
import CustomerTrackingModal from '../../components/common/CustomerTrackingModal';
import { getItemSpecs } from '../../utils/productSpecs';
import ItemSpecsDisplay from '../../components/common/ItemSpecsDisplay';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const getAddressTypeIcon = (type) => {
  const t = (type || 'home').toLowerCase();
  if (t === 'office') return <HiOutlineOfficeBuilding className="w-4 h-4 text-stone-400" />;
  if (t === 'other') return <HiOutlineLocationMarker className="w-4 h-4 text-stone-400" />;
  return <HiOutlineHome className="w-4 h-4 text-stone-400" />;
};

const formatOrderDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

const resolveItemImage = (item) => {
  if (item?.image) return item.image;
  if (item?.thumbnail) return item.thumbnail;
  const prod = item?.productId;
  if (!prod) return '';
  if (Array.isArray(prod.ornate?.ornateImages) && prod.ornate.ornateImages.length > 0) {
    const found = prod.ornate.ornateImages.find((img) => img?.url);
    if (found?.url) return found.url;
  }
  if (Array.isArray(prod.colorImages) && prod.colorImages.length > 0) {
    for (const ci of prod.colorImages) {
      if (Array.isArray(ci.images)) {
        const found = ci.images.find((img) => img?.url && (img.mediaType === 'image' || !/\.(webm|mp4|mov)$/i.test(img.url)));
        if (found?.url) return found.url;
      }
    }
  }
  if (Array.isArray(prod.media) && prod.media.length > 0) {
    const found = prod.media.find((m) => m?.url);
    if (found?.url) return found.url;
  }
  if (Array.isArray(prod.basicInfo?.images) && prod.basicInfo.images.length > 0) {
    return prod.basicInfo.images[0];
  }
  if (prod.assets?.thumbnail) return prod.assets.thumbnail;
  return '';
};

const resolveProductLink = (item) => {
  const prod = item?.productId;
  const slug =
    prod?.basicInfo?.slug ||
    prod?.slug ||
    item?.slug;
  if (slug) return `/product/${encodeURIComponent(slug)}`;

  const id =
    prod?._id ||
    (typeof prod === 'string' ? prod : null) ||
    item?.id;
  if (id) return `/product/${encodeURIComponent(id)}`;

  return null;
};

const renderStatusBadge = (status = '') => {
  const s = String(status).toLowerCase();
  if (['delivered', 'completed'].includes(s)) {
    return (
      <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#eaf7ee] text-[#1b7a3a] border border-[#c4e8ce]/80 inline-flex items-center gap-1.5 shadow-2xs">
        <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Delivered</span>
      </span>
    );
  }
  if (['shipped', 'out_for_delivery'].includes(s)) {
    return (
      <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#e8f7fa] text-[#117688] border border-[#bee7ee]/80 inline-flex items-center gap-1.5 shadow-2xs">
        <HiOutlineTruck className="w-3.5 h-3.5 text-[#117688]" />
        <span className="capitalize">{s === 'out_for_delivery' ? 'Out for Delivery' : 'Shipped'}</span>
      </span>
    );
  }
  if (['processing', 'confirmed'].includes(s)) {
    return (
      <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#eaf1fb] text-[#1e58a7] border border-[#c7dcf7]/80 inline-flex items-center gap-1.5 shadow-2xs">
        <HiOutlineClock className="w-3.5 h-3.5 text-[#1e58a7]" />
        <span className="capitalize">{s}</span>
      </span>
    );
  }
  if (['cancelled', 'rejected'].includes(s)) {
    return (
      <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#fdeeed] text-[#9e2724] border border-[#f7c9c7]/80 inline-flex items-center gap-1.5 shadow-2xs">
        <HiOutlineX className="w-3.5 h-3.5" />
        <span className="capitalize">Cancelled</span>
      </span>
    );
  }
  return (
    <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#fdeee0] text-[#935418] border border-[#f3d7bc]/80 inline-flex items-center gap-1.5 shadow-2xs">
      <HiOutlineClock className="w-3.5 h-3.5 text-[#935418]" />
      <span className="capitalize">{status || 'Pending'}</span>
    </span>
  );
};

const getStatusBannerInfo = (status = '') => {
  const s = String(status).toLowerCase();
  if (['delivered', 'completed'].includes(s)) {
    return {
      title: 'Delivered',
      description: 'Your order has been delivered successfully.',
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#1b7a3a] text-white flex items-center justify-center shrink-0 shadow-xs">
          <HiOutlineCheck className="w-4.5 h-4.5 stroke-[2.5]" />
        </div>
      ),
    };
  }
  if (['shipped', 'out_for_delivery'].includes(s)) {
    return {
      title: s === 'out_for_delivery' ? 'Out for Delivery' : 'Shipped',
      description: 'Your order is in transit and on its way to you.',
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#117688] text-white flex items-center justify-center shrink-0 shadow-xs">
          <HiOutlineTruck className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }
  if (['cancelled', 'rejected'].includes(s)) {
    return {
      title: 'Cancelled',
      description: 'This order has been cancelled.',
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#9e2724] text-white flex items-center justify-center shrink-0 shadow-xs">
          <HiOutlineX className="w-4.5 h-4.5 stroke-[2.5]" />
        </div>
      ),
    };
  }
  return {
    title: status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : 'Processing',
    description: 'Your order has been placed and is being prepared.',
    icon: (
      <div className="w-8 h-8 rounded-full bg-[#a36829] text-white flex items-center justify-center shrink-0 shadow-xs">
        <HiOutlineClock className="w-4.5 h-4.5" />
      </div>
    ),
  };
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const { addToCart, openCartDrawer, orderCount, returnOrderCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs = ['profile', 'orders', 'returns', 'addresses'];
  const [activeTab, setActiveTab] = useState(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'profile'
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  // Download Invoice Handler
  const handleDownloadInvoice = async (order) => {
    const orderId = order?._id || order?.id;
    if (!orderId) return;
    try {
      setDownloadingOrderId(orderId);
      const res = await ordersAPI.downloadInvoice(orderId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeOrderNum = (order.orderNumber || 'ORD').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `NEIRAH_INVOICE_${safeOrderNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully! 📄');
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Could not download invoice. Please try again.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  // Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [, setReviewedProductIds] = useState(new Set());
  
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
        countryCode: user.profile?.countryCode || '+91',
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

  // Load orders from API
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await ordersAPI.getMyOrders();
      const list = res?.data?.data?.items || res?.data?.items || res?.data?.data || res?.data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleBuyAgain = async (order) => {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
      toast.error('No items found in this order');
      return;
    }

    try {
      setReorderingId(order._id || order.id);
      let count = 0;

      const isMultiItem = Array.isArray(order.items) && order.items.length > 1;

      for (const item of order.items) {
        const prodObj = (typeof item.productId === 'object' && item.productId !== null)
          ? item.productId
          : null;
        const resolvedId = String(
          prodObj?._id ||
          prodObj?.id ||
          (typeof item.productId === 'string' ? item.productId : '') ||
          item._id ||
          item.id ||
          ''
        ).trim();

        if (!resolvedId || resolvedId === '[object Object]') {
          continue;
        }

        const itemThumb = resolveItemImage(item);
        const productPayload = {
          ...(prodObj || {}),
          _id: resolvedId,
          id: resolvedId,
          productId: resolvedId,
          title: item.title || prodObj?.basicInfo?.title || prodObj?.title || '',
          name: item.title || prodObj?.basicInfo?.title || prodObj?.title || '',
          sku: item.sku || prodObj?.basicInfo?.sku || '',
          price: item.price,
          pricing: {
            salePrice: item.price,
            mrp: item.price,
          },
          images: itemThumb ? [itemThumb] : (item.image ? [item.image] : []),
          selectedMetal: item.selectedMetal || '',
          selectedSize: item.selectedSize || '',
          selectedAttributes: item.selectedAttributes || null,
        };

        const options = {
          selectedMetal: item.selectedMetal || '',
          selectedSize: item.selectedSize || '',
          selectedAttributes: item.selectedAttributes || null,
          silent: isMultiItem,
        };

        await addToCart(productPayload, item.quantity || 1, options);
        count += 1;
      }

      if (count > 0) {
        if (count > 1) {
          toast.success(`${count} items added back to your cart!`, {
            icon: '🛍️',
            style: {
              background: '#22201e',
              color: '#f5f0eb',
              border: '1px solid rgba(198, 145, 60, 0.4)',
            },
          });
        }

        if (typeof openCartDrawer === 'function') {
          openCartDrawer();
        } else {
          navigate('/cart');
        }
      } else {
        toast.error('Could not find valid items to reorder.');
      }
    } catch (err) {
      console.error('Failed to reorder items:', err);
      toast.error('Could not add items to cart. Please try again.');
    } finally {
      setReorderingId(null);
    }
  };

  // Open review modal for an item
  const openReviewModal = (item, order) => {
    if (!item) return;
    setReviewOrder(order || null);
    setReviewItem(item);
    setReviewRating(5);
    setReviewHoverRating(0);
    setReviewTitle('');
    setReviewComment('');
    setReviewModalOpen(true);
  };

  // Submit verified customer review
  const handleReviewSubmit = async (e) => {
    e?.preventDefault?.();
    if (!reviewItem) return;

    if (!reviewComment.trim()) {
      toast.error('Please write a comment sharing your thoughts on the product.');
      return;
    }

    try {
      setSubmittingReview(true);
      const prodId = reviewItem.productId?._id || reviewItem.productId;
      const customerName =
        (user?.profile?.firstName || user?.profile?.lastName)
          ? `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
          : (user?.name || reviewOrder?.customer?.firstName || 'Verified Customer');

      const payload = {
        productId: prodId || null,
        customer: {
          name: customerName,
          email: user?.email || reviewOrder?.customer?.email || '',
        },
        review: {
          title: reviewTitle.trim() || 'Verified Purchase Review',
          rating: Number(reviewRating) || 5,
          comment: reviewComment.trim(),
          reviewDate: new Date(),
        },
        status: 'approved',
      };

      await reviewsAPI.create(payload);
      toast.success('Thank you! Your verified review has been submitted successfully.');
      if (prodId) {
        setReviewedProductIds((prev) => new Set([...prev, String(prodId)]));
      }
      setReviewModalOpen(false);
      setReviewItem(null);
      setReviewOrder(null);
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error(err.response?.data?.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Load existing reviews for current customer email
  useEffect(() => {
    if (user?.email) {
      reviewsAPI
        .getAll({ 'customer.email': user.email, limit: 100 })
        .then((res) => {
          const items = res?.data?.data?.items || res?.data?.data || [];
          if (Array.isArray(items)) {
            const ids = items
              .map((r) => String(r.productId?._id || r.productId))
              .filter(Boolean);
            setReviewedProductIds(new Set(ids));
          }
        })
        .catch(() => {});
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?._id) {
      fetchAddresses();
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id && activeTab === 'orders') {
      fetchOrders();
    }
  }, [user?._id, activeTab]);

  useEffect(() => {
    if (!selectedOrder) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedOrder(null);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOrder]);

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
        profile: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          countryCode: profileForm.countryCode || '+91',
          location: profileForm.location,
          bio: profileForm.bio,
        },
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
        countryCode: aData.countryCode || user?.profile?.countryCode || '+91',
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
        countryCode: user?.profile?.countryCode || '+91',
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
          countryCode: addressForm.countryCode || '+91',
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
                className={`flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                  activeTab === 'orders'
                    ? 'border-l-4 border-[#8b6f4e] bg-[#FAF7F2] font-medium text-[#8b6f4e]'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HiOutlineCube className={`w-4 h-4 ${activeTab === 'orders' ? 'text-[#8b6f4e]' : 'text-stone-500'}`} />
                  <span>Orders</span>
                </div>
                {(orders.length > 0 || (orderCount || 0) > 0) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8b6f4e]/10 text-[#8b6f4e]">
                    {orders.length > 0 ? orders.length : orderCount}
                  </span>
                )}
              </button>

              {/* Returns Tab */}
              <button
                onClick={() => setActiveTab('returns')}
                className={`flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                  activeTab === 'returns'
                    ? 'border-l-4 border-[#8b6f4e] bg-[#FAF7F2] font-medium text-[#8b6f4e]'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-black border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HiOutlineRefresh className={`w-4 h-4 ${activeTab === 'returns' ? 'text-[#8b6f4e]' : 'text-stone-500'}`} />
                  <span>Returns</span>
                </div>
                {(returnOrderCount || 0) > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8b6f4e]/10 text-[#8b6f4e]">
                    {returnOrderCount}
                  </span>
                )}
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
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Default Billing Address Box */}
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-[#8b6f4e]/40 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#faf2e5] text-[#5c3715] tracking-normal select-none">
                            Default Billing Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('billing')}
                            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-[#8b6f4e] font-medium transition-colors cursor-pointer"
                          >
                            <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                      <p className="font-bold text-stone-900 text-sm">{billingAddress.fullName || userFullName || 'Disha Radadiya'}</p>
                      <p className="text-stone-600 leading-relaxed">{bAddr.addressLine || 'No address set'}</p>
                      {(bAddr.city || bAddr.state || bAddr.pincode) && (
                        <p className="text-stone-600">
                          {[bAddr.city, bAddr.state ? `${bAddr.state}${bAddr.pincode ? ` – ${bAddr.pincode}` : ''}` : bAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {bAddr.phone && <p className="text-stone-700 font-medium pt-0.5">{bAddr.phone}</p>}
                    </div>

                    {/* Default Shipping Address Box */}
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-[#8b6f4e]/40 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#faf2e5] text-[#5c3715] tracking-normal select-none">
                            Default Shipping Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('shipping')}
                            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-[#8b6f4e] font-medium transition-colors cursor-pointer"
                          >
                            <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                      <p className="font-bold text-stone-900 text-sm">{shippingAddress.fullName || userFullName || 'Disha Radadiya'}</p>
                      <p className="text-stone-600 leading-relaxed">{sAddr.addressLine || 'No address set'}</p>
                      {(sAddr.city || sAddr.state || sAddr.pincode) && (
                        <p className="text-stone-600">
                          {[sAddr.city, sAddr.state ? `${sAddr.state}${sAddr.pincode ? ` – ${sAddr.pincode}` : ''}` : sAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {sAddr.phone && <p className="text-stone-700 font-medium pt-0.5">{sAddr.phone}</p>}
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
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Default Billing Address Box */}
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-[#8b6f4e]/40 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#faf2e5] text-[#5c3715] tracking-normal select-none">
                            Default Billing Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('billing')}
                            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-[#8b6f4e] font-medium transition-colors cursor-pointer"
                          >
                            <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                      <p className="font-bold text-stone-900 text-sm">{billingAddress.fullName || userFullName || 'Disha Radadiya'}</p>
                      <p className="text-stone-600 leading-relaxed">{bAddr.addressLine || 'No address set'}</p>
                      {(bAddr.city || bAddr.state || bAddr.pincode) && (
                        <p className="text-stone-600">
                          {[bAddr.city, bAddr.state ? `${bAddr.state}${bAddr.pincode ? ` – ${bAddr.pincode}` : ''}` : bAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {bAddr.phone && <p className="text-stone-700 font-medium pt-0.5">{bAddr.phone}</p>}
                    </div>

                    {/* Default Shipping Address Box */}
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-[#8b6f4e]/40 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#faf2e5] text-[#5c3715] tracking-normal select-none">
                            Default Shipping Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('shipping')}
                            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-[#8b6f4e] font-medium transition-colors cursor-pointer"
                          >
                            <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                      <p className="font-bold text-stone-900 text-sm">{shippingAddress.fullName || userFullName || 'Disha Radadiya'}</p>
                      <p className="text-stone-600 leading-relaxed">{sAddr.addressLine || 'No address set'}</p>
                      {(sAddr.city || sAddr.state || sAddr.pincode) && (
                        <p className="text-stone-600">
                          {[sAddr.city, sAddr.state ? `${sAddr.state}${sAddr.pincode ? ` – ${sAddr.pincode}` : ''}` : sAddr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {sAddr.phone && <p className="text-stone-700 font-medium pt-0.5">{sAddr.phone}</p>}
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
                              <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                                <div className="flex items-center gap-1.5 text-stone-500">
                                  <span title={addr.type ? addr.type.toUpperCase() : 'HOME'}>
                                    {getAddressTypeIcon(addr.type)}
                                  </span>
                                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                    {addr.type ? addr.type.toUpperCase() : `ADDRESS ${idx + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openAddressModal('edit-additional', addrItem)}
                                    className="p-1 text-stone-500 hover:text-[#8b6f4e] hover:bg-stone-50 rounded transition-colors cursor-pointer"
                                    title="Edit address"
                                    aria-label="Edit address"
                                  >
                                    <HiOutlinePencilAlt className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAddress(addrItem._id)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Delete address"
                                    aria-label="Delete address"
                                  >
                                    <HiOutlineTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="font-normal text-stone-900">{userFullName}</p>
                              <p className="text-stone-600 text-xs leading-relaxed">{addr.addressLine}</p>
                              <p className="text-stone-600 text-xs">
                                {addr.city}, {addr.state} {addr.pincode}
                              </p>
                              <p className="text-stone-600 text-xs pt-1">{addr.phone}</p>
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
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#d6c7b2] bg-white hover:bg-[#FAF7F2] text-[#8b6f4e] hover:text-[#745735] text-xs font-semibold uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <HiOutlineArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 3: ORDERS ────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 animate-pulse">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-stone-200 rounded w-32" />
                          <div className="h-4 bg-stone-200 rounded w-20" />
                        </div>
                        <div className="h-14 bg-stone-100 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#8b6f4e] mx-auto flex items-center justify-center">
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
                ) : (
                  <div className="bg-[#FAF7F2] rounded-2xl border border-[#EFE8DD] p-5 sm:p-7 space-y-5">
                    <div className="flex items-center justify-center gap-2.5 text-center">
                      <HiOutlineCube className="w-5.5 h-5.5 text-[#6d4a27] shrink-0" />
                      <h2
                        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                        className="text-xl sm:text-2xl font-medium sm:font-semibold text-[#1c1917] tracking-normal leading-snug"
                      >
                        Order History ({orders.length})
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {orders.map((order) => {
                        const orderDate = formatOrderDate(order.meta?.createdAt || order.createdAt);
                        const totalAmount = order.pricing?.total ?? order.totalAmount ?? 0;
                        const status = String(order.orderStatus || 'pending').toLowerCase();

                        const orderNumText = order.orderNumber
                          ? order.orderNumber.startsWith('Order')
                            ? order.orderNumber
                            : `Order #${order.orderNumber}`
                          : 'Order';

                        return (
                          <div
                            key={order._id || order.id}
                            className="bg-white rounded-2xl border border-[#EFE8DD] p-5 sm:p-6 space-y-4 shadow-2xs transition-all hover:shadow-xs"
                          >
                            {/* Top Header Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-stone-100">
                              <div className="flex items-center gap-3.5 flex-wrap">
                                <span className="font-mono font-semibold text-xs text-stone-800 bg-[#FAF7F2] border border-[#EFE8DD] px-3.5 py-1 rounded-full">
                                  {orderNumText}
                                </span>
                                {orderDate && (
                                  <span className="text-stone-700 font-normal flex items-center gap-1.5 text-xs">
                                    <HiOutlineCalendar className="w-4 h-4 text-stone-500" />
                                    {orderDate}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                {renderStatusBadge(status)}
                                <span className="font-bold text-stone-900 text-base sm:text-lg ml-1">
                                  ₹{Number(totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Items in Order */}
                            <div className="space-y-4">
                              {Array.isArray(order.items) &&
                                order.items.map((item, idx) => {
                                  const itemThumb = resolveItemImage(item);
                                  const itemSku =
                                    item.sku ||
                                    item.productId?.basicInfo?.sku || '';
                                  const productLink = resolveProductLink(item);

                                  return (
                                    <div
                                      key={item._id || idx}
                                      className="flex items-center justify-between gap-4"
                                    >
                                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        {productLink ? (
                                          <Link
                                            to={productLink}
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#FAF7F2] border border-[#EFE8DD] p-1.5 flex items-center justify-center shrink-0 overflow-hidden hover:border-[#8b6f4e]/50 hover:shadow-2xs transition-all group cursor-pointer"
                                            title="View Product Details"
                                          >
                                            {itemThumb ? (
                                              <img
                                                src={getImageUrl(itemThumb)}
                                                alt={item.title || 'Product'}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                  if (e.currentTarget.parentElement) {
                                                    e.currentTarget.parentElement.innerHTML =
                                                      '<span class="text-xl">💍</span>';
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <span className="text-xl">💍</span>
                                            )}
                                          </Link>
                                        ) : (
                                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#FAF7F2] border border-[#EFE8DD] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                                            {itemThumb ? (
                                              <img
                                                src={getImageUrl(itemThumb)}
                                                alt={item.title || 'Product'}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                  if (e.currentTarget.parentElement) {
                                                    e.currentTarget.parentElement.innerHTML =
                                                      '<span class="text-xl">💍</span>';
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <span className="text-xl">💍</span>
                                            )}
                                          </div>
                                        )}

                                        <div className="min-w-0 flex-1 space-y-1.5">
                                          {productLink ? (
                                            <Link
                                              to={productLink}
                                              className="font-bold text-stone-900 text-xs sm:text-sm leading-snug truncate block hover:text-[#8b6f4e] transition-colors cursor-pointer"
                                              title={item.title || 'Jewellery Item'}
                                            >
                                              {item.title || 'Jewellery Item'}
                                            </Link>
                                          ) : (
                                            <h4
                                              className="font-bold text-stone-900 text-xs sm:text-sm leading-snug truncate"
                                              title={item.title || 'Jewellery Item'}
                                            >
                                              {item.title || 'Jewellery Item'}
                                            </h4>
                                          )}
                                          {/* Attributes Grid & Details */}
                                          {(() => {
                                            const specs = getItemSpecs(item);

                                            return (
                                              <div className="space-y-1 pt-0.5">
                                                <ItemSpecsDisplay specs={specs} />

                                                {/* SKU & Quantity Badges */}
                                                <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                                                  {itemSku && (
                                                    <span className="px-2.5 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EFE8DD] text-stone-700 font-medium text-[11px]">
                                                      SKU: {itemSku}
                                                    </span>
                                                  )}
                                                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EFE8DD] text-stone-700 font-medium text-[11px]">
                                                    Qty: {item.quantity || 1}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <div className="font-bold text-stone-900 text-sm sm:text-base">
                                          ₹{Number(item.totalItemPrice || item.price || 0).toLocaleString('en-IN')}
                                        </div>
                                        {item.quantity > 1 && (
                                          <div className="text-[11px] text-stone-400 mt-0.5">
                                            ₹{Number(item.price || 0).toLocaleString('en-IN')} each
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Card Footer: Actions */}
                            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(order)}
                                disabled={downloadingOrderId === (order._id || order.id)}
                                className="px-4 py-2 rounded-xl border border-[#D5C7B6] bg-[#FAF7F2] hover:bg-[#F4ECE3] text-[#7A5B3A] text-xs font-medium transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                                title="Download Official Tax Invoice (PDF)"
                              >
                                <HiOutlineDocumentText className="w-4 h-4 text-[#7A5B3A]" />
                                <span>{downloadingOrderId === (order._id || order.id) ? 'Downloading...' : 'Download Invoice'}</span>
                              </button>
                              {Boolean(order.shiprocketInfo?.awbCode) && (
                                <button
                                  type="button"
                                  onClick={() => setTrackingOrder(order)}
                                  className="px-4 py-2 rounded-xl border border-[#D5C7B6] bg-[#FAF7F2] hover:bg-[#F4ECE3] text-[#7A5B3A] text-xs font-medium transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                                >
                                  <HiOutlineCube className="w-4 h-4 text-[#7A5B3A]" />
                                  <span>Track Package</span>
                                </button>
                              )}
                              {['delivered', 'completed'].includes(status) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const target = order.items?.[0];
                                    if (target) openReviewModal(target, order);
                                  }}
                                  className="px-4 py-2 rounded-xl border border-[#D5C7B6] bg-[#FAF7F2] hover:bg-[#F4ECE3] text-[#7A5B3A] text-xs font-medium transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                                >
                                  <FaStar className="w-3.5 h-3.5 text-[#B88746]" />
                                  <span>Write Review</span>
                                </button>
                              )}
                              {['delivered', 'completed'].includes(status) && (
                                <button
                                  type="button"
                                  disabled={reorderingId === (order._id || order.id)}
                                  onClick={() => handleBuyAgain(order)}
                                  className="px-5 py-2 rounded-xl border border-[#78552B] bg-[#78552B] hover:bg-[#644621] text-white text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60 whitespace-nowrap"
                                >
                                  <HiOutlineShoppingCart
                                    className={`w-4 h-4 text-white ${
                                      reorderingId === (order._id || order.id) ? 'animate-spin' : ''
                                    }`}
                                  />
                                  <span>{reorderingId === (order._id || order.id) ? 'Adding…' : 'Buy Again'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                              >
                                <HiOutlineEye className="w-4 h-4 text-stone-600" />
                                <span>View Details</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
        <div
          onClick={() => setEditProfileOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in cursor-default"
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
        <div
          onClick={() => setAddressModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[540px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in my-6 relative cursor-default"
          >
            {/* Dark Header */}
            <div className="bg-[#262320] text-white px-7 py-5 flex items-center justify-between">
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

              {/* State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      {/* ─── ORDER DETAILS MODAL ────────────────────────────────────── */}
      {selectedOrder && (() => {
        const statusBanner = getStatusBannerInfo(selectedOrder.orderStatus);
        const orderDateStr = formatOrderDate(selectedOrder.meta?.createdAt || selectedOrder.createdAt);
        return (
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl lg:max-w-3xl bg-[#fdfbf7] rounded-2xl shadow-2xl overflow-hidden animate-scale-in my-4 max-h-[92vh] flex flex-col cursor-default border border-[#e8ded0]"
            >
              {/* Modal Header */}
              <div className="bg-[#291e16] text-white px-6 sm:px-7 py-4.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <HiOutlineCube className="w-5 h-5 sm:w-6 sm:h-6 text-[#d5c7b3]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-medium text-white leading-tight">
                      Order Details
                    </h3>
                    <p className="font-mono text-xs sm:text-sm font-semibold text-stone-300 tracking-wider">
                      #{selectedOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar">
                {/* Status & Date Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] border border-[#ebe1d3] flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
                  {/* Subtle decorative floral watermark */}
                  <svg
                    className="pointer-events-none absolute -right-2 -bottom-4 w-28 h-28 text-[#8b6f4e] opacity-[0.09]"
                    viewBox="0 0 100 100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path d="M10 80 Q 40 40 85 15 M 40 40 Q 60 30 70 18 M 40 40 Q 50 60 70 65 M 25 55 Q 35 70 50 72 M 55 30 Q 70 32 78 22" />
                    <circle cx="85" cy="15" r="2" fill="currentColor" />
                    <circle cx="70" cy="18" r="2" fill="currentColor" />
                    <circle cx="70" cy="65" r="2" fill="currentColor" />
                  </svg>

                  {/* Left: Status info */}
                  <div className="flex items-center gap-3.5 relative z-10">
                    {statusBanner.icon}
                    <div>
                      <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-tight">
                        {statusBanner.title}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                        {statusBanner.description}
                      </p>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-10 w-[1px] bg-stone-200 hidden sm:block relative z-10" />

                  {/* Right: Ordered on */}
                  {orderDateStr && (
                    <div className="flex items-center gap-3 relative z-10">
                      <HiOutlineCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#8b6f4e] shrink-0" />
                      <div>
                        <span className="block text-[11px] text-stone-400 font-medium leading-tight">
                          Ordered On
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 leading-tight">
                          {orderDateStr}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div>
                  <span className="text-xs uppercase font-serif font-bold tracking-wider text-stone-700 block mb-2.5">
                    Items ({selectedOrder.items?.length || 0})
                  </span>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {Array.isArray(selectedOrder.items) &&
                      selectedOrder.items.map((item, idx) => {
                        const itemThumb = resolveItemImage(item);
                        const itemSku =
                          item.sku ||
                          item.productId?.basicInfo?.sku || '';
                        const productLink = resolveProductLink(item);

                        return (
                          <div
                            key={item._id || idx}
                            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#ebe1d3] flex items-center justify-between gap-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              {productLink ? (
                                <Link
                                  to={productLink}
                                  onClick={() => setSelectedOrder(null)}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#faf8f5] border border-stone-200/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden hover:border-[#8b6f4e]/60 transition-colors group cursor-pointer"
                                  title="View Product Details"
                                >
                                  {itemThumb ? (
                                    <img
                                      src={getImageUrl(itemThumb)}
                                      alt={item.title || 'Product'}
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.parentElement) {
                                          e.currentTarget.parentElement.innerHTML =
                                            '<span class="text-base sm:text-xl">💍</span>';
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-base sm:text-xl">💍</span>
                                  )}
                                </Link>
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#faf8f5] border border-stone-200/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                                  {itemThumb ? (
                                    <img
                                      src={getImageUrl(itemThumb)}
                                      alt={item.title || 'Product'}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.parentElement) {
                                          e.currentTarget.parentElement.innerHTML =
                                            '<span class="text-base sm:text-xl">💍</span>';
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-base sm:text-xl">💍</span>
                                  )}
                                </div>
                              )}

                              <div className="min-w-0 flex-1 space-y-1.5">
                                {productLink ? (
                                  <Link
                                    to={productLink}
                                    onClick={() => setSelectedOrder(null)}
                                    className="font-serif font-semibold text-stone-900 text-xs sm:text-sm leading-snug hover:text-[#8b6f4e] transition-colors block line-clamp-2 cursor-pointer"
                                    title={item.title}
                                  >
                                    {item.title}
                                  </Link>
                                ) : (
                                  <p className="font-serif font-semibold text-stone-900 text-xs sm:text-sm leading-snug line-clamp-2">
                                    {item.title}
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                  {item.selectedMetal && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-[#faf8f5] text-stone-700 font-medium border border-[#e5dcd0] text-[11px]">
                                      {item.selectedMetal}
                                    </span>
                                  )}
                                  {itemSku && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-[#faf8f5] text-stone-700 font-medium border border-[#e5dcd0] text-[11px]">
                                      SKU: {itemSku}
                                    </span>
                                  )}
                                  <span className="px-2.5 py-0.5 rounded-md bg-[#faf8f5] text-stone-600 font-medium border border-[#e5dcd0] text-[11px]">
                                    Qty: {item.quantity || 1}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                                ₹{Number(item.totalItemPrice || item.price || 0).toLocaleString('en-IN')}
                              </div>
                              {item.quantity > 1 && (
                                <div className="text-[10px] text-stone-400 mt-0.5">
                                  ₹{Number(item.price || 0).toLocaleString('en-IN')} each
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Delivery Address & Price Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Delivery Address Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] border border-[#ebe1d3] space-y-2.5">
                    <div className="flex items-center gap-2 text-stone-800">
                      <HiOutlineLocationMarker className="w-4 h-4 text-[#8b6f4e]" />
                      <span className="font-serif font-bold text-xs sm:text-sm">Delivery Address</span>
                    </div>

                    {selectedOrder.shippingAddress ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-1.5">
                          <span className="text-stone-400 text-sm mt-[-1px]">📍</span>
                          <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                            {selectedOrder.shippingAddress.fullName || selectedOrder.customer?.firstName}
                          </p>
                        </div>
                        <p className="pl-5 text-stone-600 text-xs leading-relaxed">
                          {[
                            selectedOrder.shippingAddress.addressLine,
                            selectedOrder.shippingAddress.apartment,
                            selectedOrder.shippingAddress.city,
                            selectedOrder.shippingAddress.state,
                            selectedOrder.shippingAddress.postalCode,
                            selectedOrder.shippingAddress.country,
                          ].filter(Boolean).join(', ')}
                        </p>
                        {(selectedOrder.shippingAddress.phone || selectedOrder.customer?.phone) && (
                          <div className="flex items-center gap-2 pt-0.5 text-stone-700 pl-5">
                            <HiOutlinePhone className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                            <span className="text-xs font-medium">
                              {selectedOrder.shippingAddress.phone || selectedOrder.customer?.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic">No delivery address provided.</p>
                    )}
                  </div>

                  {/* Price Breakdown Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] border border-[#ebe1d3] space-y-2">
                    <div className="flex items-center gap-2 text-stone-800 mb-1">
                      <HiOutlineSquare3Stack3D className="w-4 h-4 text-[#8b6f4e]" />
                      <span className="font-serif font-bold text-xs sm:text-sm">Price Breakdown</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600">
                      {selectedOrder.pricing?.subtotal !== undefined && (
                        <div className="flex justify-between items-center">
                          <span>Subtotal</span>
                          <span className="font-medium text-stone-800">₹{Number(selectedOrder.pricing.subtotal).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {(Number(selectedOrder.pricing?.discount) > 0 || selectedOrder.coupon?.code) && (
                        <div className="flex items-center justify-between text-emerald-700">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>Discount</span>
                            {selectedOrder.coupon?.code && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] tracking-wide border border-emerald-300">
                                <HiOutlineTag className="w-3 h-3 text-emerald-600" />
                                <span>{selectedOrder.coupon.code}</span>
                              </span>
                            )}
                          </div>
                          <span className="font-medium">-₹{Number(selectedOrder.pricing?.discount || selectedOrder.coupon?.discountAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {selectedOrder.pricing?.tax !== undefined && (
                        <div className="flex justify-between items-center">
                          <span>Estimated Tax (GST 3%)</span>
                          <span className="font-medium text-stone-800">₹{Number(selectedOrder.pricing.tax).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span>Shipping</span>
                        <span className="text-emerald-700 font-semibold">
                          {selectedOrder.pricing?.shipping === 0 || !selectedOrder.pricing?.shipping ? 'FREE' : `₹${selectedOrder.pricing.shipping}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-[#ebe1d3] mt-2">
                        <span className="font-serif font-bold text-sm text-stone-900">Total Paid</span>
                        <span className="font-serif font-bold text-base sm:text-lg text-[#7a5b3a]">
                          ₹{Number(selectedOrder.pricing?.total ?? selectedOrder.totalAmount ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:px-7 bg-[#fcfbfa] border-t border-[#ebe1d3] flex flex-wrap items-center justify-between gap-3 shrink-0 rounded-b-2xl">
                <Link
                  to={`/order-success?orderId=${selectedOrder._id || selectedOrder.id}&orderNumber=${encodeURIComponent(selectedOrder.orderNumber)}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#8b6f4e] hover:text-[#755c3e] font-medium transition-colors cursor-pointer"
                >
                  <HiOutlineDocumentText className="w-4 h-4" />
                  <span>View Order Receipt →</span>
                </Link>
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  {selectedOrder.shiprocketInfo?.awbCode && (
                    <button
                      type="button"
                      onClick={() => setTrackingOrder(selectedOrder)}
                      className="px-4 py-2 rounded-xl border border-[#dcc8b0] bg-[#faf6f0] hover:bg-[#f3eadf] text-[#7a5b3a] text-xs font-medium transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <HiOutlineCube className="w-4 h-4 text-[#7a5b3a]" />
                      <span>Track Package</span>
                    </button>
                  )}
                  {String(selectedOrder.orderStatus || '').toLowerCase() === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedOrder.items?.[0];
                        if (target) openReviewModal(target, selectedOrder);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#dcc8b0] bg-[#faf6f0] hover:bg-[#f3eadf] text-[#7a5b3a] text-xs font-medium transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <FaStar className="w-3.5 h-3.5 text-[#a4784a]" />
                      <span>Write Review</span>
                    </button>
                  )}
                  {String(selectedOrder.orderStatus || '').toLowerCase() === 'delivered' && (
                    <button
                      type="button"
                      disabled={reorderingId === (selectedOrder._id || selectedOrder.id)}
                      onClick={() => {
                        handleBuyAgain(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="px-4.5 py-2 rounded-xl border border-[#785736] bg-[#785736] hover:bg-[#67492c] text-white text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait shadow-2xs whitespace-nowrap"
                    >
                      <HiOutlineShoppingCart className={`w-4 h-4 ${reorderingId === (selectedOrder._id || selectedOrder.id) ? 'animate-spin' : ''}`} />
                      <span>{reorderingId === (selectedOrder._id || selectedOrder.id) ? 'Adding…' : 'Buy Again'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4.5 py-2 rounded-xl border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── WRITE A CUSTOMER REVIEW MODAL ───────────────────────── */}
      {reviewModalOpen && reviewItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setReviewModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in my-6 cursor-default border border-stone-200"
          >
            {/* Header */}
            <div className="bg-[#22201e] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                  Write a Customer Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="text-stone-400 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Close"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 text-xs">
              {/* If order has multiple items, allow switching */}
              {Array.isArray(reviewOrder?.items) && reviewOrder.items.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                    Item Being Reviewed
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {reviewOrder.items.map((it, idx) => {
                      const isSelected =
                        (reviewItem?._id && it._id && reviewItem._id === it._id) ||
                        (reviewItem?.sku && it.sku && reviewItem.sku === it.sku) ||
                        reviewItem?.title === it.title;
                      return (
                        <button
                          key={it._id || idx}
                          type="button"
                          onClick={() => setReviewItem(it)}
                          className={`px-3 py-1.5 rounded-lg border text-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#8b6f4e] bg-[#FAF7F2] text-[#8b6f4e] font-bold shadow-2xs ring-1 ring-[#8b6f4e]/30'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <span className="truncate max-w-[150px]">{it.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Card Preview */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#8b6f4e]/20 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-lg bg-white border border-stone-200/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                  {resolveItemImage(reviewItem) ? (
                    <img
                      src={getImageUrl(resolveItemImage(reviewItem))}
                      alt={reviewItem.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerHTML = '<span class="text-lg">💍</span>';
                        }
                      }}
                    />
                  ) : (
                    <span className="text-lg">💍</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-bold text-stone-900 text-xs leading-snug truncate" title={reviewItem.title}>
                    {reviewItem.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-500">
                    {reviewItem.selectedMetal && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-stone-700 border border-stone-200">
                        {reviewItem.selectedMetal}
                      </span>
                    )}
                    {reviewOrder?.orderNumber && (
                      <span className="font-mono text-stone-600">
                        Order: {reviewOrder.orderNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Star Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 block">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (reviewHoverRating || reviewRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                          aria-label={`Rate ${star} star`}
                        >
                          <FaStar
                            className={`w-6 h-6 transition-colors ${
                              active ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-[#8b6f4e]">
                    {(reviewHoverRating || reviewRating) === 5 && '5.0 — Excellent / Loved it!'}
                    {(reviewHoverRating || reviewRating) === 4 && '4.0 — Very Good'}
                    {(reviewHoverRating || reviewRating) === 3 && '3.0 — Average'}
                    {(reviewHoverRating || reviewRating) === 2 && '2.0 — Fair'}
                    {(reviewHoverRating || reviewRating) === 1 && '1.0 — Poor'}
                  </span>
                </div>
              </div>

              {/* Review Headline / Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 block">
                  Review Title <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Stunning diamond sparkle, timeless luxury!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all text-xs"
                />
              </div>

              {/* Review Comment / Story */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 block">
                  Detailed Review <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you love about this piece? Share details on the design, diamond brilliance, fit, and packaging to help other customers..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={submittingReview}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="px-6 py-2.5 rounded-xl btn-theme-primary bg-[#8b6f4e] hover:bg-[#785e40] text-white font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? (
                    <>
                      <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Delivery Tracking Modal */}
      <CustomerTrackingModal
        isOpen={Boolean(trackingOrder)}
        onClose={() => setTrackingOrder(null)}
        order={trackingOrder}
      />
    </div>
  );
};

export default Profile;
