import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { wishlistAPI } from '../api/services';
import { useAuth } from './AuthContext';
import { getPrimaryProductImage } from '../utils/productImages';
import { joinUserSocketRooms, onWishlistCountUpdate } from '../services/socket';

/* eslint-disable react/prop-types, react-refresh/only-export-components */
const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem('jewels_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistMap, setWishlistMap] = useState(() => {
    try {
      const saved = localStorage.getItem('jewels_wishlist');
      const list = saved ? JSON.parse(saved) : [];
      const map = {};
      list.forEach((item) => {
        const id = String(item._id || item.productId || item.id || '');
        if (id) map[id] = true;
      });
      return map;
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);

  // Fetch wishlist from backend
  const fetchWishlist = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token && !user) {
      return;
    }

    try {
      setLoading(true);
      const res = await wishlistAPI.get();
      const data = res?.data?.data || res?.data || {};
      const rawProductList = Array.isArray(data.productIds) ? data.productIds : (Array.isArray(data.items) ? data.items : []);
      const items = rawProductList.filter((item) => item && typeof item === 'object');

      setWishlistItems(items);
      try {
        localStorage.setItem('jewels_wishlist', JSON.stringify(items));
      } catch {}

      const map = {};
      if (Array.isArray(data.productIds)) {
        data.productIds.forEach((id) => {
          if (id) map[String(id._id || id)] = true;
        });
      }
      items.forEach((item) => {
        if (item.productId) map[String(item.productId)] = true;
        if (item._id) map[String(item._id)] = true;
      });
      setWishlistMap(map);
      setWishlistCount(items.length);
    } catch (err) {
      console.warn('Failed to fetch wishlist from API:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const [wishlistCount, setWishlistCount] = useState(() => {
    try {
      const saved = localStorage.getItem('jewels_wishlist');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  });

  // Fast counts fetcher (only asks for badge counts, never full wishlist)
  const fetchWishlistCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token && !user) return;
    try {
      const res = await wishlistAPI.getCounts();
      const data = res?.data?.data || res?.data || {};
      if (data.wishlistCount !== undefined) {
        setWishlistCount(Number(data.wishlistCount));
      }
    } catch (err) {
      console.warn('Failed to fetch wishlist count:', err);
    }
  }, [user]);

  // Realtime Socket.IO synchronization for instant counts across tabs and devices
  useEffect(() => {
    joinUserSocketRooms({ userId: user?._id || user?.id });

    const unsubscribe = onWishlistCountUpdate((data) => {
      if (data?.wishlistCount !== undefined) {
        setWishlistCount(Number(data.wishlistCount));
      }
      if (data?.productId) {
        setWishlistMap((prev) => ({
          ...prev,
          [String(data.productId)]: Boolean(data.isWishlisted),
        }));
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Sync count on mount or user/route change: only fetch full wishlist if directly on /wishlist page
  useEffect(() => {
    fetchWishlistCount();
    if (location.pathname === '/wishlist') {
      fetchWishlist();
    }
  }, [fetchWishlistCount, fetchWishlist, user, location.pathname]);

  // Check if a specific product is wishlisted
  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      return !!wishlistMap[String(productId)];
    },
    [wishlistMap]
  );

  // Toggle item in wishlist with instant optimistic UI update & API sync
  const toggleWishlist = async (product, isCurrentlyWished = null) => {
    if (!product) return false;

    const productId = String(product.id || product._id || product.productId || '').trim();
    if (!productId) return false;

    // Determine actual current status accurately
    const wasWishlisted =
      isCurrentlyWished !== null
        ? Boolean(isCurrentlyWished)
        : wishlistMap[productId] !== undefined
        ? Boolean(wishlistMap[productId])
        : Boolean(product.inWishlist);

    const willBeWishlisted = !wasWishlisted;

    // Instant optimistic UI update
    setWishlistMap((prev) => ({
      ...prev,
      [productId]: willBeWishlisted,
    }));

    setWishlistItems((prev) => {
      let next;
      if (willBeWishlisted) {
        const exists = prev.some((i) => String(i._id || i.productId || i.id) === productId);
        next = exists ? prev : [product, ...prev];
      } else {
        next = prev.filter((i) => String(i._id || i.productId || i.id) !== productId);
      }
      try {
        localStorage.setItem('jewels_wishlist', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Instantly increment / decrement count!
    setWishlistCount((prev) => (willBeWishlisted ? prev + 1 : Math.max(0, prev - 1)));

    if (willBeWishlisted) {
      toast.success('Added to wishlist', {
        icon: '❤️',
        style: {
          background: '#22201e',
          color: '#f5f0eb',
          border: '1px solid rgba(225, 29, 72, 0.4)',
        },
      });
    } else {
      toast('Removed from wishlist', {
        icon: '🤍',
        style: {
          background: '#22201e',
          color: '#f5f0eb',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    }

    const token = localStorage.getItem('token');
    if (token || user) {
      try {
        const res = await wishlistAPI.toggle({ productId });
        const result = res?.data?.data || {};

        if (result.items && Array.isArray(result.items)) {
          setWishlistItems(result.items);
          localStorage.setItem('jewels_wishlist', JSON.stringify(result.items));
        }
        if (Array.isArray(result.productIds)) {
          const nextMap = {};
          result.productIds.forEach((id) => {
            if (id) nextMap[String(id._id || id)] = true;
          });
          setWishlistMap(nextMap);
          setWishlistCount(result.productIds.length);
        } else if (result.wishlistCount !== undefined) {
          setWishlistCount(Number(result.wishlistCount));
        }
      } catch (err) {
        console.error('Error syncing wishlist with backend:', err);
      }
    }

    return willBeWishlisted;
  };

  // Remove item by productId
  const removeFromWishlist = async (productId) => {
    if (!productId) return;
    const strId = String(productId);

    setWishlistMap((prev) => {
      const next = { ...prev };
      delete next[strId];
      return next;
    });
    setWishlistCount((prev) => Math.max(0, prev - 1));
    setWishlistItems((prev) => {
      const next = prev.filter((i) => String(i.productId) !== strId && String(i._id) !== strId && String(i.id) !== strId);
      try {
        localStorage.setItem('jewels_wishlist', JSON.stringify(next));
      } catch {}
      return next;
    });
    toast('Item removed from wishlist', {
      icon: '🤍',
      style: {
        background: '#22201e',
        color: '#f5f0eb',
      },
    });

    const token = localStorage.getItem('token');
    if (token || user) {
      try {
        await wishlistAPI.remove(strId);
      } catch (err) {
        console.error('Error removing from backend wishlist:', err);
      }
    }
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    setWishlistItems([]);
    setWishlistMap({});
    setWishlistCount(0);
    try {
      localStorage.removeItem('jewels_wishlist');
    } catch {}
    toast.success('Wishlist cleared');

    const token = localStorage.getItem('token');
    if (token || user) {
      try {
        await wishlistAPI.clear();
      } catch (err) {
        console.error('Error clearing backend wishlist:', err);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistMap,
        wishlistCount,
        fetchWishlistCount,
        loading,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
