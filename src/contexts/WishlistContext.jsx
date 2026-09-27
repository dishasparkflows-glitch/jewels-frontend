import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { wishlistAPI } from '../api/services';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistMap, setWishlistMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch wishlist from backend
  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await wishlistAPI.get();
      const data = res?.data?.data || res?.data || {};
      const items = Array.isArray(data.items) ? data.items : [];

      setWishlistItems(items);
      const map = {};
      items.forEach((item) => {
        if (item.productId) map[String(item.productId)] = true;
        if (item._id) map[String(item._id)] = true;
      });
      setWishlistMap(map);
    } catch (err) {
      console.warn('Failed to fetch wishlist from API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount or when user changes
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist, user]);

  // Check if a specific product is wishlisted
  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      return !!wishlistMap[String(productId)];
    },
    [wishlistMap]
  );

  // Toggle item in wishlist with optimistic UI update & API sync
  const toggleWishlist = async (product) => {
    if (!product) return;

    const productId = String(product.id || product._id || product.productId || '').trim();
    if (!productId) return;

    const wasWishlisted = !!wishlistMap[productId];
    const willBeWishlisted = !wasWishlisted;

    // Optimistic UI update
    setWishlistMap((prev) => {
      const next = { ...prev };
      if (willBeWishlisted) {
        next[productId] = true;
      } else {
        delete next[productId];
      }
      return next;
    });

    // Normalized payload for backend
    const payload = {
      productId,
      title: product.title || product.name || 'Fine Jewellery Piece',
      price: product.price || 0,
      originalPrice: product.originalPrice || null,
      image:
        product.image ||
        (product.images?.[0]?.url || product.images?.[0]) ||
        '',
      category: product.category || 'Collection',
      slug: product.slug || '',
    };

    try {
      const res = await wishlistAPI.toggle(payload);
      const result = res?.data?.data || {};

      if (result.items && Array.isArray(result.items)) {
        setWishlistItems(result.items);
      } else {
        // Re-fetch to get populated fields
        fetchWishlist();
      }

      if (willBeWishlisted) {
        toast.success(`Saved "${payload.title}" to your wishlist ❤️`, {
          icon: '💎',
          style: {
            background: '#22201e',
            color: '#f5f0eb',
            border: '1px solid rgba(212, 175, 55, 0.4)',
          },
        });
      } else {
        toast('Removed from your wishlist', {
          icon: '🤍',
          style: {
            background: '#22201e',
            color: '#f5f0eb',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        });
      }

      return result.isWishlisted;
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      // Revert optimistic update
      setWishlistMap((prev) => ({
        ...prev,
        [productId]: wasWishlisted,
      }));
      toast.error('Could not update wishlist. Please try again.');
      return wasWishlisted;
    }
  };

  // Remove item by productId
  const removeFromWishlist = async (productId) => {
    if (!productId) return;
    const strId = String(productId);

    try {
      await wishlistAPI.remove(strId);
      setWishlistMap((prev) => {
        const next = { ...prev };
        delete next[strId];
        return next;
      });
      setWishlistItems((prev) =>
        prev.filter((i) => String(i.productId) !== strId && String(i._id) !== strId)
      );
      toast('Item removed from wishlist', {
        icon: '🤍',
        style: {
          background: '#22201e',
          color: '#f5f0eb',
        },
      });
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove item');
    }
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    try {
      await wishlistAPI.clear();
      setWishlistItems([]);
      setWishlistMap({});
      toast.success('Wishlist cleared');
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      toast.error('Failed to clear wishlist');
    }
  };

  const wishlistCount = Object.keys(wishlistMap).length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistMap,
        wishlistCount,
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
