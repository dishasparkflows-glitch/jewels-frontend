import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import WishlistProductCard from '../../components/product/WishlistProductCard';
import { addressesAPI, ordersAPI, reviewsAPI } from '../../api/services';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/common/Dropdown';
import PhoneInput from '../../components/common/PhoneInput';
import { FaStar } from 'react-icons/fa6';
import {
  HiOutlineUser,
  HiUser,
  HiOutlineHeart,
  HiHeart,
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
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { HiOutlineSquare3Stack3D } from 'react-icons/hi2';
import { getImageUrl } from '../../utils/imageUrl';
import CustomerTrackingModal from '../../components/common/CustomerTrackingModal';
import { getItemSpecs } from '../../utils/productSpecs';
import ItemSpecsDisplay from '../../components/common/ItemSpecsDisplay';

// In-memory module cache for user orders to eliminate loading latency and tab-switch flashing
const userOrdersCache = new Map();
const ordersInFlightMap = new Map();

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
  const prod = item?.refId;
  if (!prod) return '';
  if (prod.image?.url) return prod.image.url;
  if (typeof prod.image === 'string' && prod.image) return prod.image;
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
  const isDiamond = item?.itemType === 'diamond';
  const refDoc = item?.refId && typeof item.refId === 'object' ? item.refId : null;
  const slug =
    refDoc?.basicInfo?.slug ||
    refDoc?.slug ||
    refDoc?.sku ||
    (isDiamond ? item?.sku : null) ||
    item?.slug;
  if (slug) {
    return isDiamond ? `/diamond/${encodeURIComponent(slug)}` : `/product/${encodeURIComponent(slug)}`;
  }

  const id =
    refDoc?._id ||
    (typeof item?.refId === 'string' ? item.refId : null) ||
    item?.id;
  if (id) {
    return isDiamond ? `/diamond/${encodeURIComponent(id)}` : `/product/${encodeURIComponent(id)}`;
  }

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
          <HiOutlineCheck className="w-[18px] h-[18px] stroke-[2.5]" />
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
          <HiOutlineTruck className="w-[18px] h-[18px]" />
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
          <HiOutlineX className="w-[18px] h-[18px] stroke-[2.5]" />
        </div>
      ),
    };
  }
  return {
    title: status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : 'Processing',
    description: 'Your order has been placed and is being prepared.',
    icon: (
      <div className="w-8 h-8 rounded-full bg-[#a36829] text-white flex items-center justify-center shrink-0 shadow-xs">
        <HiOutlineClock className="w-[18px] h-[18px]" />
      </div>
    ),
  };
};

const Profile = () => {
  const { user, logout } = useAuth();
  const { brandName } = useStoreSettings();
  const { addToCart, openCartDrawer, orderCount, returnOrderCount } = useCart();
  const {
    wishlistItems,
    wishlistCount,
    loading: wishlistLoading,
    isInitialLoaded: wishlistLoaded,
    removeFromWishlist,
    clearWishlist,
    refreshWishlist,
  } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs = ['profile', 'orders', 'returns', 'wishlist', 'addresses'];
  const [activeTab, setActiveTab] = useState(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'profile'
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === 'wishlist') {
      refreshWishlist({ silent: true });
    }
  }, [activeTab, refreshWishlist]);

  // Orders state & pagination
  const [orders, setOrders] = useState(() => {
    const defaultKey = user?._id ? `${user._id}_p1_l10` : null;
    if (defaultKey && userOrdersCache.has(defaultKey)) {
      return userOrdersCache.get(defaultKey)?.items || [];
    }
    if (user?._id && userOrdersCache.has(user._id)) {
      const legacy = userOrdersCache.get(user._id);
      return Array.isArray(legacy) ? legacy : legacy?.items || [];
    }
    return [];
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(10);
  const [orderPagination, setOrderPagination] = useState(() => {
    const defaultKey = user?._id ? `${user._id}_p1_l10` : null;
    if (defaultKey && userOrdersCache.has(defaultKey)) {
      return userOrdersCache.get(defaultKey)?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalDocs: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
    return {
      currentPage: 1,
      totalPages: 1,
      totalDocs: 0,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
    };
  });
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
      const brandPrefix = (brandName || 'Jewels').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase() || 'JEWELS';
      link.setAttribute('download', `${brandPrefix}_INVOICE_${safeOrderNum}.pdf`);
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

  const getPageNumbers = (current, total) => {
    if (!total || total <= 1) return [1];
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  };

  const handleOrderPageChange = (newPage) => {
    if (newPage < 1 || (orderPagination.totalPages && newPage > orderPagination.totalPages) || newPage === orderPage) {
      return;
    }
    setOrderPage(newPage);
    fetchOrders(false, newPage, orderLimit);
    scrollToTop();
  };

  const handleOrderLimitChange = (newLimit) => {
    const numLimit = Number(newLimit) || 10;
    setOrderLimit(numLimit);
    setOrderPage(1);
    fetchOrders(false, 1, numLimit);
    scrollToTop();
  };

  // Load orders from API (with silent background prefetching & SWR)
  const fetchOrders = async (silent = false, targetPage = orderPage, targetLimit = orderLimit) => {
    const flightKey = `${user?._id || 'anon'}_p${targetPage}_l${targetLimit}`;
    if (ordersInFlightMap.has(flightKey)) {
      return ordersInFlightMap.get(flightKey);
    }

    try {
      const cacheKey = user?._id ? `${user._id}_p${targetPage}_l${targetLimit}` : null;
      if (cacheKey && userOrdersCache.has(cacheKey)) {
        const cached = userOrdersCache.get(cacheKey);
        if (Array.isArray(cached?.items)) {
          setOrders(cached.items);
        }
        if (cached?.pagination) {
          setOrderPagination(cached.pagination);
        }
      } else if (!silent) {
        setOrdersLoading(true);
      }

      const promise = ordersAPI.getMyOrders({ page: targetPage, limit: targetLimit });
      ordersInFlightMap.set(flightKey, promise);

      const res = await promise;
      const list = res?.data?.data?.items || res?.data?.items || res?.data?.data || res?.data || [];
      const validList = Array.isArray(list) ? list : [];
      const paginationMeta = res?.data?.data?.pagination || res?.data?.pagination || {
        currentPage: targetPage,
        totalPages: Math.max(1, Math.ceil((validList.length || 1) / targetLimit)),
        totalDocs: validList.length,
        limit: targetLimit,
        hasNextPage: false,
        hasPrevPage: targetPage > 1,
      };

      setOrders(validList);
      setOrderPagination(paginationMeta);
      setOrderPage(paginationMeta.currentPage || targetPage);

      if (cacheKey) {
        userOrdersCache.set(cacheKey, { items: validList, pagination: paginationMeta });
      }

      // Preload primary images of all ordered items in the background
      if (typeof window !== 'undefined') {
        validList.forEach((order) => {
          if (Array.isArray(order.items)) {
            order.items.forEach((it) => {
              const imgUrl = it.productId?.images?.[0]?.url || it.image;
              if (imgUrl) {
                const img = new Image();
                img.src = imgUrl;
              }
            });
          }
        });
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      ordersInFlightMap.delete(flightKey);
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
      // Silently prefetch orders in background so clicking the Orders tab is instantaneous
      fetchOrders(true, 1, orderLimit);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id && activeTab === 'orders') {
      fetchOrders(orders.length > 0, orderPage, orderLimit);
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
        setAddressModalOpen(false);
      }
    };
    if (addressModalOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [addressModalOpen]);

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
  const [deleteAddressId, setDeleteAddressId] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  const confirmDeleteAddress = async () => {
    if (!deleteAddressId) return;
    try {
      setDeletingAddress(true);
      await addressesAPI.delete(deleteAddressId);
      await fetchAddresses();
      toast.success('Address deleted successfully!');
      setDeleteAddressId(null);
    } catch (err) {
      console.error('Failed to delete address:', err);
      toast.error(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeletingAddress(false);
    }
  };

  // Page title matching screenshots
  const pageTitle =
    activeTab === 'addresses'
      ? 'Address Book'
      : activeTab === 'wishlist'
        ? 'My Wishlist'
        : 'My Dashboard';
  const greetingFirstName =
    user?.profile?.firstName || userFullName?.split(' ')[0] || 'Guest';

  return (
    <div className="bg-[#fcfbfa] min-h-screen text-[#22201e] font-sans antialiased py-6 sm:py-8 px-3 sm:px-5 lg:px-6">
      <SEO title="My Account & Orders" noindex={true} />
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5">
              Manage your profile, orders, returns, wishlist and addresses all in one place.
            </p>
          </div>
        </div>

        {/* Dashboard Layout: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* Left Navigation Sidebar (3 cols on lg) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            {/* User Greeting Header */}
            <div className="px-4 py-4 border-b border-stone-100 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                style={{
                  backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                  color: 'var(--btn-primary-text, #ffffff)',
                }}
              >
                <HiUser className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 leading-tight truncate">
                  Hello, {greetingFirstName}
                </p>
                {user?.auth?.email && (
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    {user.auth.email}
                  </p>
                )}
              </div>
            </div>

            <nav className="flex flex-col py-2 text-xs sm:text-[13px] font-medium">
              {/* My Profile */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={
                  activeTab === 'profile'
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 12%, #ffffff)',
                        boxShadow: 'inset 4px 0 0 var(--btn-primary-bg, #8c6536)',
                      }
                    : undefined
                }
                className={`relative flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'text-stone-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <HiOutlineUser className={`w-[18px] h-[18px] shrink-0 ${activeTab === 'profile' ? 'text-stone-900' : 'text-stone-500'}`} />
                <span>My Profile</span>
              </button>

              {/* My Orders */}
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                onMouseEnter={() => {
                  if (orders.length === 0) fetchOrders(true, 1, orderLimit);
                }}
                onTouchStart={() => {
                  if (orders.length === 0) fetchOrders(true, 1, orderLimit);
                }}
                style={
                  activeTab === 'orders'
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 12%, #ffffff)',
                        boxShadow: 'inset 4px 0 0 var(--btn-primary-bg, #8c6536)',
                      }
                    : undefined
                }
                className={`relative flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                  activeTab === 'orders'
                    ? 'text-stone-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HiOutlineCube className={`w-[18px] h-[18px] shrink-0 ${activeTab === 'orders' ? 'text-stone-900' : 'text-stone-500'}`} />
                  <span>My Orders</span>
                </div>
                {(orders.length > 0 || (orderPagination.totalDocs || orderCount || 0) > 0) && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 14%, #ffffff)',
                      color: 'var(--btn-primary-bg, #8c6536)',
                    }}
                  >
                    ({orderPagination.totalDocs || orders.length || orderCount})
                  </span>
                )}
              </button>

              {/* Returns & Refunds */}
              <button
                type="button"
                onClick={() => setActiveTab('returns')}
                style={
                  activeTab === 'returns'
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 12%, #ffffff)',
                        boxShadow: 'inset 4px 0 0 var(--btn-primary-bg, #8c6536)',
                      }
                    : undefined
                }
                className={`relative flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                  activeTab === 'returns'
                    ? 'text-stone-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HiOutlineRefresh className={`w-[18px] h-[18px] shrink-0 ${activeTab === 'returns' ? 'text-stone-900' : 'text-stone-500'}`} />
                  <span>Returns &amp; Refunds</span>
                </div>
                {(returnOrderCount || 0) > 0 && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 14%, #ffffff)',
                      color: 'var(--btn-primary-bg, #8c6536)',
                    }}
                  >
                    ({returnOrderCount})
                  </span>
                )}
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                style={
                  activeTab === 'wishlist'
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 12%, #ffffff)',
                        boxShadow: 'inset 4px 0 0 var(--btn-primary-bg, #8c6536)',
                      }
                    : undefined
                }
                className={`relative flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                  activeTab === 'wishlist'
                    ? 'text-stone-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <HiOutlineHeart className={`w-[18px] h-[18px] shrink-0 ${activeTab === 'wishlist' ? 'text-stone-900' : 'text-stone-500'}`} />
                <span>Wishlist</span>
              </button>

              {/* Address Book */}
              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                style={
                  activeTab === 'addresses'
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 12%, #ffffff)',
                        boxShadow: 'inset 4px 0 0 var(--btn-primary-bg, #8c6536)',
                      }
                    : undefined
                }
                className={`relative flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'text-stone-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <HiOutlineLocationMarker className={`w-[18px] h-[18px] shrink-0 ${activeTab === 'addresses' ? 'text-stone-900' : 'text-stone-500'}`} />
                <span>Address Book</span>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={logout}
                className="relative flex items-center gap-3 px-4 py-3 text-left text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <HiOutlineLogout className="w-[18px] h-[18px] shrink-0 text-stone-500" />
                <span>Logout</span>
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
                  </div>

                  {/* Card Body: single horizontal row matching screenshot */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-6">
                      
                      {/* 1. Avatar + Name & Email */}
                      <div className="flex items-center gap-3.5 shrink-0 min-w-0">
                        <div
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)',
                            color: 'var(--btn-primary-bg, #8b6f4e)',
                            borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 28%, white)',
                          }}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full font-serif text-xl sm:text-2xl font-medium flex items-center justify-center shrink-0 border"
                        >
                          {(userFullName?.[0] || user?.profile?.firstName?.[0] || 'D').toUpperCase()}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h2 className="text-base sm:text-lg font-medium text-stone-900 leading-tight truncate max-w-[200px] sm:max-w-none" title={userFullName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim()}>
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
                      style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
                      className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <span>Manage Addresses</span>
                      <HiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Two Address Columns */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Default Billing Address Box */}
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-stone-300 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)',
                              color: 'var(--btn-primary-bg, #8b6f4e)',
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-normal select-none"
                          >
                            Default Billing Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('billing')}
                            className="p-1 text-stone-500 link-theme-hover hover:bg-stone-50 rounded transition-colors cursor-pointer"
                            title="Edit billing address"
                            aria-label="Edit billing address"
                          >
                            <HiOutlinePencilAlt className="w-4 h-4" />
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
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-stone-300 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)',
                              color: 'var(--btn-primary-bg, #8b6f4e)',
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-normal select-none"
                          >
                            Default Shipping Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('shipping')}
                            className="p-1 text-stone-500 link-theme-hover hover:bg-stone-50 rounded transition-colors cursor-pointer"
                            title="Edit shipping address"
                            aria-label="Edit shipping address"
                          >
                            <HiOutlinePencilAlt className="w-4 h-4" />
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
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-stone-300 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)',
                              color: 'var(--btn-primary-bg, #8b6f4e)',
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-normal select-none"
                          >
                            Default Billing Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('billing')}
                            className="p-1 text-stone-500 link-theme-hover hover:bg-stone-50 rounded transition-colors cursor-pointer"
                            title="Edit billing address"
                            aria-label="Edit billing address"
                          >
                            <HiOutlinePencilAlt className="w-4 h-4" />
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
                    <div className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:border-stone-300 transition-colors">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <HiOutlineHome className="w-5 h-5 text-stone-700 shrink-0" />
                          <span
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)',
                              color: 'var(--btn-primary-bg, #8b6f4e)',
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-normal select-none"
                          >
                            Default Shipping Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddressModal('shipping')}
                            className="p-1 text-stone-500 link-theme-hover hover:bg-stone-50 rounded transition-colors cursor-pointer"
                            title="Edit shipping address"
                            aria-label="Edit shipping address"
                          >
                            <HiOutlinePencilAlt className="w-4 h-4" />
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
                      style={{
                        backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                        color: 'var(--btn-primary-text, #ffffff)',
                      }}
                      className="hover:opacity-90 text-xs font-semibold px-4 py-2 rounded-lg shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
                                    onClick={() => setDeleteAddressId(addrItem._id)}
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
              <div className="space-y-4 transition-opacity duration-200 ease-out animate-fadeIn">
                {ordersLoading && orders.length === 0 ? (
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
                        style={{
                          backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                          color: 'var(--btn-primary-text, #ffffff)',
                        }}
                        className="inline-block btn-theme-primary hover:opacity-90 text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-sm hover:shadow transition-all"
                      >
                        Shop Collection
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FAF7F2] rounded-2xl border border-[#EFE8DD] p-3 sm:p-4 space-y-3 sm:space-y-3.5">
                    <div className="flex items-center justify-center text-center pb-0.5">
                      <h2
                        id="orders-section-heading"
                        style={{
                          fontFamily: '"Cormorant Garamond", Georgia, serif',
                          fontVariantNumeric: 'lining-nums',
                          fontFeatureSettings: '"lnum" 1',
                        }}
                        className="text-lg sm:text-xl font-medium sm:font-semibold text-[#1c1917] tracking-normal leading-tight lining-nums"
                      >
                        Order History ({orderPagination.totalDocs || orders.length})
                      </h2>
                    </div>

                    <div className={`space-y-3.5 transition-opacity duration-200 ${ordersLoading ? 'opacity-60 pointer-events-none' : ''}`}>
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
                            className="bg-white rounded-2xl border border-[#EFE8DD] p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all hover:shadow-xs"
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
                                                      Product Code: {itemSku}
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
                            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-2.5 pt-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(order)}
                                disabled={downloadingOrderId === (order._id || order.id)}
                                style={{
                                  borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 30%, transparent)',
                                  backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 6%, white)',
                                  color: 'var(--btn-primary-bg, #8b6f4e)',
                                }}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border hover:opacity-90 text-xs font-medium transition-all inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap disabled:opacity-50"
                                title="Download Official Tax Invoice (PDF)"
                              >
                                <HiOutlineDocumentText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>{downloadingOrderId === (order._id || order.id) ? 'Downloading...' : 'Download Invoice'}</span>
                              </button>
                              {Boolean(order.shiprocketInfo?.awbCode) && (
                                <button
                                  type="button"
                                  onClick={() => setTrackingOrder(order)}
                                  style={{
                                    borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 30%, transparent)',
                                    backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 6%, white)',
                                    color: 'var(--btn-primary-bg, #8b6f4e)',
                                  }}
                                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border hover:opacity-90 text-xs font-medium transition-all inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                                >
                                  <HiOutlineCube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                                  style={{
                                    borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 30%, transparent)',
                                    backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 6%, white)',
                                    color: 'var(--btn-primary-bg, #8b6f4e)',
                                  }}
                                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border hover:opacity-90 text-xs font-medium transition-all inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                                >
                                  <FaStar className="w-3.5 h-3.5" />
                                  <span>Write Review</span>
                                </button>
                              )}
                              {['delivered', 'completed'].includes(status) && (
                                <button
                                  type="button"
                                  disabled={reorderingId === (order._id || order.id)}
                                  onClick={() => handleBuyAgain(order)}
                                  style={{
                                    backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                                    color: 'var(--btn-primary-text, #ffffff)',
                                    borderColor: 'var(--btn-primary-bg, #8c6536)',
                                  }}
                                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl border hover:opacity-90 text-xs font-semibold transition-all inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60 whitespace-nowrap"
                                >
                                  <HiOutlineShoppingCart
                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white ${
                                      reorderingId === (order._id || order.id) ? 'animate-spin' : ''
                                    }`}
                                  />
                                  <span>{reorderingId === (order._id || order.id) ? 'Adding…' : 'Buy Again'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-all inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                              >
                                <HiOutlineEye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600" />
                                <span>View Details</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {orderPagination.totalPages > 1 && (
                      <nav
                        aria-label="Order history pagination"
                        className="mt-6 pt-5 border-t border-[#EFE8DD] flex flex-col items-center gap-4"
                      >
                        {/* Desktop View (Single unified row) */}
                        <div className="hidden sm:flex items-center justify-between w-full">
                          {/* Count Summary */}
                          <div className="text-xs sm:text-sm text-stone-500 font-medium">
                            Showing{' '}
                            <span className="font-semibold text-stone-800">
                              {Math.min((orderPage - 1) * orderLimit + 1, orderPagination.totalDocs || orders.length)}
                            </span>
                            {' '}–{' '}
                            <span className="font-semibold text-stone-800">
                              {Math.min(orderPage * orderLimit, orderPagination.totalDocs || orders.length)}
                            </span>
                            {' '}of{' '}
                            <span className="font-semibold text-stone-800">
                              {orderPagination.totalDocs || orders.length}
                            </span>
                            {' '}{(orderPagination.totalDocs || orders.length) === 1 ? 'order' : 'orders'}
                          </div>

                          {/* Page Buttons */}
                          <div className="flex items-center gap-1.5">
                            {/* Previous Page Button */}
                            <button
                              type="button"
                              disabled={orderPage <= 1 || ordersLoading}
                              onClick={() => handleOrderPageChange(orderPage - 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#EFE8DD] bg-white text-stone-700 hover:bg-[#FAF7F2] hover:border-[#8b6f4e] hover:text-[#8b6f4e] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#EFE8DD] disabled:hover:text-stone-700 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shadow-2xs"
                              aria-label="Previous page"
                              title="Previous page"
                            >
                              <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Numbered Page Buttons */}
                            {getPageNumbers(orderPage, orderPagination.totalPages).map((pageNum, idx) => {
                              if (pageNum === '...') {
                                return (
                                  <span
                                    key={`ellipsis-${idx}`}
                                    className="px-2 py-1 text-xs sm:text-sm text-stone-400 select-none"
                                  >
                                    …
                                  </span>
                                );
                              }
                              const isActive = pageNum === orderPage;
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  disabled={ordersLoading}
                                  onClick={() => handleOrderPageChange(pageNum)}
                                  aria-current={isActive ? 'page' : undefined}
                                  style={
                                    isActive
                                      ? {
                                          backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                                          color: 'var(--btn-primary-text, #ffffff)',
                                          borderColor: 'var(--btn-primary-bg, #8c6536)',
                                        }
                                      : undefined
                                  }
                                  className={`min-w-[36px] h-9 px-3 flex items-center justify-center text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer ${
                                    isActive
                                      ? 'border shadow-2xs font-semibold'
                                      : 'bg-white text-stone-700 border border-[#EFE8DD] hover:bg-[#FAF7F2]'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}

                            {/* Next Page Button */}
                            <button
                              type="button"
                              disabled={orderPage >= orderPagination.totalPages || ordersLoading}
                              onClick={() => handleOrderPageChange(orderPage + 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#EFE8DD] bg-white text-stone-700 hover:bg-[#FAF7F2] hover:border-[#8b6f4e] hover:text-[#8b6f4e] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#EFE8DD] disabled:hover:text-stone-700 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shadow-2xs"
                              aria-label="Next page"
                              title="Next page"
                            >
                              <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Per Page Dropdown Selector */}
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                            <span>Per page:</span>
                            <Dropdown
                              value={orderLimit}
                              onChange={handleOrderLimitChange}
                              options={[
                                { value: 5, label: '5' },
                                { value: 10, label: '10' },
                                { value: 20, label: '20' },
                              ]}
                              size="sm"
                              direction="up"
                              className="w-20 text-xs"
                              menuClassName="min-w-[5rem]"
                              showDivider={false}
                            />
                          </div>
                        </div>

                        {/* Mobile View (Clean 2-row layout) */}
                        <div className="flex sm:hidden flex-col items-center w-full gap-3">
                          {/* Page Buttons - Centered */}
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={orderPage <= 1 || ordersLoading}
                              onClick={() => handleOrderPageChange(orderPage - 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#EFE8DD] bg-white text-stone-700 active:bg-[#FAF7F2] active:border-[#8b6f4e] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                              aria-label="Previous page"
                            >
                              <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>

                            {getPageNumbers(orderPage, orderPagination.totalPages).map((pageNum, idx) => {
                              if (pageNum === '...') {
                                return (
                                  <span
                                    key={`ellipsis-${idx}`}
                                    className="px-1 text-xs text-stone-400 select-none"
                                  >
                                    …
                                  </span>
                                );
                              }
                              const isActive = pageNum === orderPage;
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  disabled={ordersLoading}
                                  onClick={() => handleOrderPageChange(pageNum)}
                                  aria-current={isActive ? 'page' : undefined}
                                  style={
                                    isActive
                                      ? {
                                          backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                                          color: 'var(--btn-primary-text, #ffffff)',
                                          borderColor: 'var(--btn-primary-bg, #8c6536)',
                                        }
                                      : undefined
                                  }
                                  className={`min-w-[36px] h-9 px-3 flex items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                                    isActive
                                      ? 'border shadow-xs'
                                      : 'bg-white text-stone-700 border border-[#EFE8DD] active:bg-[#FAF7F2]'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              disabled={orderPage >= orderPagination.totalPages || ordersLoading}
                              onClick={() => handleOrderPageChange(orderPage + 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#EFE8DD] bg-white text-stone-700 active:bg-[#FAF7F2] active:border-[#8b6f4e] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                              aria-label="Next page"
                            >
                              <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Summary & Per Page Bar */}
                          <div className="flex items-center justify-between w-full pt-3 border-t border-stone-150 text-[11px] text-stone-500">
                            <div>
                              Showing{' '}
                              <span className="font-semibold text-stone-800">
                                {Math.min((orderPage - 1) * orderLimit + 1, orderPagination.totalDocs || orders.length)}–{Math.min(orderPage * orderLimit, orderPagination.totalDocs || orders.length)}
                              </span>
                              {' '}of{' '}
                              <span className="font-semibold text-stone-800">
                                {orderPagination.totalDocs || orders.length}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-400">Show:</span>
                              <Dropdown
                                value={orderLimit}
                                onChange={handleOrderLimitChange}
                                options={[
                                  { value: 5, label: '5' },
                                  { value: 10, label: '10' },
                                  { value: 20, label: '20' },
                                ]}
                                size="sm"
                                direction="up"
                                className="w-20 text-xs"
                                menuClassName="min-w-[5rem]"
                                showDivider={false}
                              />
                            </div>
                          </div>
                        </div>
                      </nav>
                    )}
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
                <h3 className="font-serif text-xl font-normal text-stone-800">Returns &amp; Exchanges</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  No active return requests found.
                </p>
              </div>
            )}

            {/* ─── TAB 5: WISHLIST ──────────────────────────────────── */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-stone-100 pb-4">
                  <div aria-hidden="true" />
                  <div className="text-center">
                    <h3
                      style={{
                        fontFamily: '"Cormorant Garamond", Georgia, serif',
                        fontVariantNumeric: 'lining-nums',
                        fontFeatureSettings: '"lnum" 1',
                      }}
                      className="text-lg sm:text-xl font-medium sm:font-semibold text-[#1c1917] tracking-normal leading-tight lining-nums"
                    >
                      My Wishlist ({wishlistCount})
                    </h3>
                  </div>
                  <div className="justify-self-end">
                    {wishlistCount > 0 && (
                      <button
                        type="button"
                        onClick={clearWishlist}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border btn-theme-outline text-xs font-medium transition-colors cursor-pointer"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>
                </div>

                {(!wishlistLoaded || wishlistLoading) && wishlistItems.length === 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }, (_, idx) => (
                      <div key={idx} className="animate-pulse space-y-2">
                        <div className="aspect-square rounded-xl bg-stone-100" />
                        <div className="h-3.5 w-3/4 bg-stone-100 rounded" />
                        <div className="h-3 w-1/3 bg-stone-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
                    {wishlistItems.map((item) => (
                      <WishlistProductCard
                        key={item.refId || item._id}
                        item={item}
                        onRemove={removeFromWishlist}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <HiHeart className="mx-auto w-9 h-9 text-stone-300" />
                    <h4 className="font-serif text-lg text-stone-800">Your wishlist is empty</h4>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      Save the pieces you love and find them here whenever you return.
                    </p>
                    <Link
                      to="/shop"
                      style={{
                        backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                        color: 'var(--btn-primary-text, #ffffff)',
                      }}
                      className="inline-flex items-center gap-2 btn-theme-primary hover:opacity-90 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      <span>Explore Jewellery</span>
                      <HiArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── EDIT / ADD ADDRESS MODAL ───────────────────────────────── */}
      {addressModalOpen && (
        <div
          onClick={() => setAddressModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={addressModalType === 'add-additional' ? 'Add New Address' : 'Address Form'}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[540px] rounded-2xl shadow-2xl overflow-visible animate-scale-in my-auto relative cursor-default"
          >
            {/* Dark Header */}
            <div className="bg-[#262320] text-white px-5 sm:px-7 py-4 sm:py-5 rounded-t-2xl flex items-center justify-between">
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

            <form onSubmit={handleSaveAddress} className="bg-white rounded-b-2xl p-5 sm:p-7 space-y-4">
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
                      style={
                        (addressForm.type || 'home') === t
                          ? {
                              backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                              color: 'var(--btn-primary-text, #ffffff)',
                              borderColor: 'var(--btn-primary-bg, #8c6536)',
                            }
                          : undefined
                      }
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all cursor-pointer ${
                        (addressForm.type || 'home') === t
                          ? ''
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
                    style={{ accentColor: 'var(--btn-primary-bg, #9e7a46)' }}
                    className="w-4 h-4 rounded border-stone-300 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-medium text-stone-800">
                    Set as default address
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[#d6cfc2] hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                    color: 'var(--btn-primary-text, #ffffff)',
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl btn-theme-primary hover:opacity-90 text-xs sm:text-sm font-medium transition shadow-sm disabled:opacity-50 cursor-pointer text-center"
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
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl lg:max-w-3xl bg-[#fdfbf7] rounded-2xl shadow-2xl overflow-hidden animate-scale-in my-auto sm:my-4 max-h-[92vh] flex flex-col cursor-default border border-[#e8ded0]"
            >
              {/* Modal Header */}
              <div className="bg-[#291e16] text-white px-4 sm:px-7 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <HiOutlineCube className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#d5c7b3]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-sm sm:text-lg font-medium text-white leading-tight">
                      Order Details
                    </h3>
                    <p className="font-mono text-xs sm:text-sm font-semibold text-stone-300 tracking-wider truncate mt-0.5">
                      #{selectedOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
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
                                      Product Code: {itemSku}
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
              <div className="p-3.5 sm:p-5 sm:px-7 bg-[#fcfbfa] border-t border-[#ebe1d3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 rounded-b-2xl">
                <Link
                  to={`/order-success?orderId=${selectedOrder._id || selectedOrder.id}&orderNumber=${encodeURIComponent(selectedOrder.orderNumber)}`}
                  className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm text-[#8b6f4e] hover:text-[#755c3e] font-medium transition-colors cursor-pointer py-0.5 sm:py-0"
                >
                  <HiOutlineDocumentText className="w-4 h-4 shrink-0" />
                  <span>View Order Receipt →</span>
                </Link>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                  {selectedOrder.shiprocketInfo?.awbCode && (
                    <button
                      type="button"
                      onClick={() => setTrackingOrder(selectedOrder)}
                      className="px-3 sm:px-4 py-2 sm:py-2 rounded-xl border border-[#dcc8b0] bg-[#faf6f0] hover:bg-[#f3eadf] text-[#7a5b3a] text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                    >
                      <HiOutlineCube className="w-4 h-4 text-[#7a5b3a] shrink-0" />
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
                      className="px-3 sm:px-4 py-2 sm:py-2 rounded-xl border border-[#dcc8b0] bg-[#faf6f0] hover:bg-[#f3eadf] text-[#7a5b3a] text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                    >
                      <FaStar className="w-3.5 h-3.5 text-[#a4784a] shrink-0" />
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
                      style={{
                        backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                        color: 'var(--btn-primary-text, #ffffff)',
                        borderColor: 'var(--btn-primary-bg, #8c6536)',
                      }}
                      className="px-3.5 sm:px-5 py-2 sm:py-2 rounded-xl border hover:opacity-90 text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait shadow-2xs whitespace-nowrap active:scale-95"
                    >
                      <HiOutlineShoppingCart className={`w-4 h-4 shrink-0 ${reorderingId === (selectedOrder._id || selectedOrder.id) ? 'animate-spin' : ''}`} />
                      <span>{reorderingId === (selectedOrder._id || selectedOrder.id) ? 'Adding…' : 'Buy Again'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 sm:px-5 py-2 sm:py-2 rounded-xl border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shadow-2xs inline-flex items-center justify-center active:scale-95 col-span-1 [&:only-child]:col-span-2 [&:nth-child(3):last-child]:col-span-2 sm:col-auto sm:[&:only-child]:col-auto sm:[&:nth-child(3):last-child]:col-auto"
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
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in my-6 cursor-default"
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

            <form onSubmit={handleReviewSubmit} className="bg-white p-6 space-y-4 text-xs">
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
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-stone-100">
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
                  style={{
                    backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                    color: 'var(--btn-primary-text, #ffffff)',
                  }}
                  className="px-6 py-2.5 rounded-xl btn-theme-primary hover:opacity-90 font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ─── SIMPLE DELETE ADDRESS CONFIRMATION MODAL ─── */}
      {deleteAddressId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !deletingAddress && setDeleteAddressId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <HiOutlineTrash className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 mb-1">
              Delete Address
            </h3>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              Are you sure you want to delete this address?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={deletingAddress}
                onClick={() => setDeleteAddressId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAddress}
                onClick={confirmDeleteAddress}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {deletingAddress ? (
                  <>
                    <HiOutlineRefresh className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
