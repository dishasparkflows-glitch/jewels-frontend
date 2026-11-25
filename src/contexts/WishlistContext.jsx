import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { wishlistAPI } from '../api/services';
import { useAuth } from './AuthContext';
import { joinUserSocketRooms, onWishlistCountUpdate } from '../services/socket';
import { trackAddToWishlist } from '../config/firebase';

/* eslint-disable react/prop-types, react-refresh/only-export-components */
const defaultWishlistValue = {
  wishlist: [],
  wishlistItems: [],
  wishlistMap: {},
  wishlistCount: 0,
  loading: false,
  isInitialLoaded: false,
  isWishlisted: () => false,
  toggleWishlist: async () => {},
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  refreshWishlist: async () => {},
};

const WishlistContext = createContext(defaultWishlistValue);

export const WishlistProvider = ({ children }) => {
  const { user, token: authToken, openLoginModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const inFlightPromiseRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const wishlistItemsRef = useRef([]);

  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem('jewels_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    wishlistItemsRef.current = wishlistItems;
  }, [wishlistItems]);

  const [isInitialLoaded, setIsInitialLoaded] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return true;
    try {
      const saved = localStorage.getItem('jewels_wishlist');
      return Boolean(saved && JSON.parse(saved).length > 0);
    } catch {
      return false;
    }
  });

  const [wishlistMap, setWishlistMap] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return {};
    try {
      const saved = localStorage.getItem('jewels_wishlist');
      const list = saved ? JSON.parse(saved) : [];
      const map = {};
      list.forEach((item) => {
        const id = String(item.refId || item._id || item.id || '');
        if (id) map[id] = true;
      });
      return map;
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);

  // Fetch wishlist from backend with silent Stale-While-Revalidate caching
  const fetchWishlist = useCallback(async (options = {}) => {
    const { force = false, silent = false } = typeof options === 'boolean' ? { silent: options } : options;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && !user) {
      setIsInitialLoaded(true);
      return [];
    }

    const now = Date.now();
    // Throttle duplicate calls within 15s unless forced
    if (!force && lastFetchTimeRef.current && (now - lastFetchTimeRef.current < 15000)) {
      if (inFlightPromiseRef.current) return inFlightPromiseRef.current;
      return wishlistItemsRef.current;
    }

    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const fetchPromise = (async () => {
      // Never block or show full-screen skeletons if we already have items in memory
      if (!silent && wishlistItemsRef.current.length === 0) {
        setLoading(true);
      }
      try {
        const res = await wishlistAPI.get();
        const data = res?.data?.data || res?.data || {};
        const items = (Array.isArray(data.items) ? data.items : []).filter(
          (item) => item && typeof item === 'object'
        );

        setWishlistItems((prev) => {
          const prevKey = prev.map((i) => String(i.refId || i._id || i.id || '')).sort().join(',');
          const newKey = items.map((i) => String(i.refId || i._id || i.id || '')).sort().join(',');
          if (prevKey === newKey && prev.length === items.length && prev.length > 0) {
            return prev;
          }
          try {
            localStorage.setItem('jewels_wishlist', JSON.stringify(items));
          } catch {
            /* ignore */
          }
          return items;
        });

        const map = {};
        items.forEach((item) => {
          const id = String(item.refId || item._id || item.id || '');
          if (id) map[id] = true;
        });
        setWishlistMap(map);
        setWishlistCount(items.length);
        lastFetchTimeRef.current = Date.now();
        setIsInitialLoaded(true);
        return items;
      } catch (err) {
        console.warn('Failed to fetch wishlist from API:', err);
        return wishlistItemsRef.current;
      } finally {
        setLoading(false);
        inFlightPromiseRef.current = null;
      }
    })();

    inFlightPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [user]);

  const [wishlistCount, setWishlistCount] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return 0;
    try {
      const saved = localStorage.getItem('jewels_wishlist');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  });

  // Fast counts fetcher (only asks for badge counts, never full wishlist)
  const fetchWishlistCount = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && !user) {
      setWishlistCount(0);
      return;
    }
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
    if (!user) return;
    joinUserSocketRooms({ userId: user?._id || user?.id });

    const unsubscribe = onWishlistCountUpdate((data) => {
      if (data?.wishlistCount !== undefined) {
        setWishlistCount(Number(data.wishlistCount));
      }
      if (data?.refId) {
        setWishlistMap((prev) => ({
          ...prev,
          [String(data.refId)]: Boolean(data.isWishlisted),
        }));
      }
    });

    return () => unsubscribe();
  }, [user?._id, user?.id]);

  const userId = user?._id || user?.id;

  // Sync count & prefetch wishlist in the background on mount or user change
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && !userId) {
      setWishlistItems([]);
      setWishlistMap({});
      setWishlistCount(0);
      setIsInitialLoaded(true);
      return;
    }
    fetchWishlistCount();
    // Silent prefetch so data is already loaded in memory before user clicks the heart icon!
    fetchWishlist({ silent: true });
  }, [userId, fetchWishlistCount, fetchWishlist]);

  // Refresh wishlist immediately after guest-to-authenticated merge completes
  useEffect(() => {
    const handleAuthMerged = () => {
      fetchWishlist({ force: true, silent: true });
      fetchWishlistCount();
    };
    window.addEventListener('auth:merged', handleAuthMerged);
    return () => window.removeEventListener('auth:merged', handleAuthMerged);
  }, [fetchWishlist, fetchWishlistCount]);

  // When navigating directly to /wishlist, perform silent background revalidation
  useEffect(() => {
    if (location.pathname === '/wishlist') {
      fetchWishlist({ silent: true });
    }
  }, [location.pathname, fetchWishlist]);

  // Check if a specific product is wishlisted
  const isWishlisted = useCallback(
    (productId) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token && !user) return false;
      if (!productId) return false;
      return !!wishlistMap[String(productId)];
    },
    [wishlistMap, user]
  );

  // Toggle item in wishlist with instant optimistic UI update & API sync
  const toggleWishlist = async (product, isCurrentlyWished = null, explicitUser = null) => {
    if (!product) return false;

    const accessToken = authToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    const currentUser = explicitUser || user || (() => {
      try {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    })();

    if (!accessToken || !currentUser) {
      if (typeof openLoginModal === 'function') {
        openLoginModal(async (authedUser) => {
          await toggleWishlist(product, isCurrentlyWished, authedUser);
        });
      } else {
        navigate('/login', { state: { from: location } });
      }
      return false;
    }

    const refId = String(product.refId || product._id || product.id || '').trim();
    if (!refId) return false;

    const itemType =
      String(product.itemType || '').toLowerCase() === 'diamond' ||
      product.productType === 'diamond'
        ? 'diamond'
        : 'product';

    // Determine actual current status accurately
    const wasWishlisted =
      isCurrentlyWished !== null
        ? Boolean(isCurrentlyWished)
        : wishlistMap[refId] !== undefined
        ? Boolean(wishlistMap[refId])
        : Boolean(product.inWishlist);

    const willBeWishlisted = !wasWishlisted;

    // Instant optimistic UI update
    setWishlistMap((prev) => ({
      ...prev,
      [refId]: willBeWishlisted,
    }));

    setWishlistItems((prev) => {
      let next;
      if (willBeWishlisted) {
        const exists = prev.some((i) => String(i.refId || i._id || i.id) === refId);
        next = exists ? prev : [{ ...product, refId, itemType }, ...prev];
      } else {
        next = prev.filter((i) => String(i.refId || i._id || i.id) !== refId);
      }
      try {
        localStorage.setItem('jewels_wishlist', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

    // Instantly increment / decrement count!
    setWishlistCount((prev) => (willBeWishlisted ? prev + 1 : Math.max(0, prev - 1)));

    if (willBeWishlisted) {
      trackAddToWishlist(product, { shopperId: user?._id || user?.id });
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

    if (accessToken || currentUser) {
      try {
        const res = await wishlistAPI.toggle({ refId, itemType });
        const result = res?.data?.data || {};

        if (result.isWishlisted !== undefined) {
          setWishlistMap((prev) => ({
            ...prev,
            [refId]: Boolean(result.isWishlisted),
          }));
        }

        if (result.items && Array.isArray(result.items)) {
          setWishlistItems(result.items);
          localStorage.setItem('jewels_wishlist', JSON.stringify(result.items));
          const nextMap = {};
          result.items.forEach((entry) => {
            const entryId = String(entry?.refId || entry?._id || entry?.id || '');
            if (entryId) nextMap[entryId] = true;
          });
          setWishlistMap(nextMap);
          setWishlistCount(result.items.length);
        } else if (result.wishlistCount !== undefined) {
          setWishlistCount(Number(result.wishlistCount));
        }
      } catch (err) {
        console.error('Error syncing wishlist with backend:', err);
      }
    }

    return willBeWishlisted;
  };

  // Remove item by refId
  const removeFromWishlist = async (refId) => {
    if (!refId) return;
    const strId = String(refId).trim();

    setWishlistMap((prev) => {
      const next = { ...prev };
      delete next[strId];
      return next;
    });
    setWishlistCount((prev) => Math.max(0, prev - 1));
    setWishlistItems((prev) => {
      const next = prev.filter((i) => String(i.refId || i._id || i.id) !== strId);
      try {
        localStorage.setItem('jewels_wishlist', JSON.stringify(next));
      } catch {
        /* ignore */
      }
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
    } catch {
      /* ignore */
    }
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

  const addToWishlist = async (product) => {
    return toggleWishlist(product, false);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistMap,
        wishlistCount,
        fetchWishlistCount,
        loading,
        isInitialLoaded,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
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
  return context || defaultWishlistValue;
};

export default WishlistContext;
