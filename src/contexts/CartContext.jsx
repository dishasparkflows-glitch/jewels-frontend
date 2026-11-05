import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartAPI } from '../api/services';
import { getPrimaryProductImage } from '../utils/productImages';
import { trackAddToCart, trackRemoveFromCart } from '../config/firebase';
import { useAuth } from './AuthContext';
import { resolveMetalName, cleanAttribute } from '../utils/metalColors';
import { joinUserSocketRooms, onCartCountUpdate } from '../services/socket';

/* eslint-disable react/prop-types, react-refresh/only-export-components */
const defaultCartValue = {
  cart: [],
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  totalItems: 0,
  subtotal: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  loading: false,
  cartDrawerOpen: false,
  setCartDrawerOpen: () => {},
  openCartDrawer: () => {},
  closeCartDrawer: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {},
  fetchCounts: async () => {},
  refreshCart: async () => {},
};

const CartContext = createContext(defaultCartValue);

/**
 * Deduplicates and consolidates cart items by product ID.
 * Ensures the same product always increments quantity on a single card.
 */
const consolidateItems = (items) => {
  if (!Array.isArray(items)) return [];
  const map = new Map();
  for (const item of items) {
    const pId = String(item.productId || item.id || item._id || '');
    if (!pId) continue;
    if (map.has(pId)) {
      const existing = map.get(pId);
      const combinedQty = (Number(existing.quantity) || 0) + (Number(item.quantity) || 1);
      const unitPrice = Number(item.price) || Number(existing.price) || 0;
      map.set(pId, {
        ...existing,
        ...item,
        quantity: combinedQty,
        price: unitPrice,
        totalItemPrice: unitPrice * combinedQty,
        selectedMetal: item.selectedMetal || existing.selectedMetal,
        selectedSize: item.selectedSize || existing.selectedSize,
        selectedAttributes: item.selectedAttributes || existing.selectedAttributes,
      });
    } else {
      map.set(pId, { ...item });
    }
  }
  return Array.from(map.values());
};

export const CartProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, openLoginModal } = useAuth();
  const isFetchingCartRef = useRef(false);
  const isFetchingCountsRef = useRef(false);
  const cartReqIdRef = useRef(0);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('jewels_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const mapped = parsed.map((item) => ({
        ...item,
        category: (item.category && !/^[0-9a-fA-F]{24}$/.test(String(item.category).trim())) ? item.category : '',
        selectedMetal: resolveMetalName(item.selectedMetal),
        selectedSize: cleanAttribute(item.selectedSize),
      }));
      return consolidateItems(mapped);
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const openCartDrawer = useCallback(() => setCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setCartDrawerOpen(false), []);

  const [cartTotals, setCartTotals] = useState({
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });

  // Calculate local fallback totals if needed
  const calculateTotals = useCallback((items) => {
    const totalItems = items.length;
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 250;
    const tax = Math.round(subtotal * 0.03); // 3% GST
    const total = subtotal + shipping + tax;
    return { totalItems, subtotal, shipping, tax, total };
  }, []);

  // Fetch cart from backend API
  const fetchCart = useCallback(async () => {
    if (isFetchingCartRef.current) return;
    isFetchingCartRef.current = true;
    try {
      setLoading(true);
      const res = await cartAPI.get();
      const data = res?.data?.data || res?.data || {};
      if (Array.isArray(data.items)) {
        const formattedItems = data.items.map((i) => {
          const itemSlug =
            i.slug ||
            i.basicInfo?.slug ||
            (i.title
              ? String(i.title)
                  .toLowerCase()
                  .trim()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')
              : '');
          return {
            id: i.productId || i._id,
            productId: i.productId,
            _id: i._id,
            slug: itemSlug,
            name: i.title,
            title: i.title,
            price: i.price,
            originalPrice: i.originalPrice,
            image: i.image?.url || i.image || '',
            category: (i.category && !/^[0-9a-fA-F]{24}$/.test(String(i.category).trim())) ? i.category : '',
            quantity: i.quantity,
            selectedMetal: resolveMetalName(i.selectedMetal, i.productId),
            selectedSize: cleanAttribute(i.selectedSize),
            selectedAttributes: i.selectedAttributes || undefined,
          };
        });
        const consolidated = consolidateItems(formattedItems);
        setCart(consolidated);
        setCartTotals({
          totalItems: data.totalItems ?? consolidated.length,
          subtotal: data.subtotal ?? calculateTotals(consolidated).subtotal,
          shipping: data.shipping ?? 0,
          tax: data.tax ?? 0,
          total: data.total ?? calculateTotals(consolidated).total,
        });
        localStorage.setItem('jewels_cart', JSON.stringify(consolidated));
      }
    } catch (err) {
      console.warn('Failed to load cart from API, using local fallback:', err);
      setCart((currentCart) => {
        setCartTotals(calculateTotals(currentCart));
        return currentCart;
      });
    } finally {
      setLoading(false);
      isFetchingCartRef.current = false;
    }
  }, [calculateTotals]);

  // Fast counts fetcher (only asks for badge counts, never full cart)
  const fetchCounts = useCallback(async () => {
    if (isFetchingCountsRef.current) return null;
    isFetchingCountsRef.current = true;
    try {
      const res = await cartAPI.getCounts();
      const data = res?.data?.data || res?.data || {};
      const count = Number(data.cartCount ?? data.totalItems ?? 0);
      setCartTotals((prev) => ({
        ...prev,
        totalItems: count,
      }));
      return data;
    } catch (err) {
      console.warn('Failed to fetch badge counts:', err);
      return null;
    } finally {
      isFetchingCountsRef.current = false;
    }
  }, []);

  // Realtime Socket.IO synchronization for instant cart counts across tabs and devices
  useEffect(() => {
    joinUserSocketRooms({ userId: user?._id || user?.id });

    const unsubscribe = onCartCountUpdate((data) => {
      const count = Number(data?.cartCount ?? data?.totalItems ?? 0);
      setCartTotals((prev) => ({
        ...prev,
        totalItems: count,
      }));
    });

    return () => unsubscribe();
  }, [user]);

  // On mount or user/route change: fetch lightweight counts, only fetch full cart on cart/checkout pages
  useEffect(() => {
    fetchCounts();
    if (location.pathname === '/cart' || location.pathname === '/checkout') {
      fetchCart();
    }
  }, [user, location.pathname, fetchCounts, fetchCart]);

  // Add item to cart with backend API call & optimistic update
  const addToCart = async (product, quantity = 1, options = {}, explicitUser = null) => {
    if (!product) return;

    // Check authentication: user must be logged in to add to cart
    const accessToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    const currentUser = explicitUser || user || (() => {
      try {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    })();

    if (!accessToken || !currentUser) {
      setCartDrawerOpen(false);
      if (typeof openLoginModal === 'function') {
        openLoginModal(async (authedUser) => {
          await addToCart(product, quantity, options, authedUser);
        });
      } else {
        navigate('/login', { state: { from: location } });
      }
      return;
    }

    const productId = String(product.id || product._id || product.productId || '').trim();
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const selectedMetal = resolveMetalName(options.selectedMetal || product.selectedMetal || '', product);
    const selectedSize = cleanAttribute(options.selectedSize || product.selectedSize || '');
    const title = product.basicInfo?.title || product.title || '';
    const price = Number(product.price) || 0;
    const image = product.image?.url || product.image || getPrimaryProductImage(product);

    const totalItemPrice = options.totalItemPrice || product.totalItemPrice || (price * parsedQty);
    const addedAt = options.addedAt || product.addedAt || new Date().toISOString();
      const selectedAttributes = options.selectedAttributes || product.selectedAttributes || undefined;

    const slug =
      product.basicInfo?.slug ||
      product.slug ||
      product.representative?.basicInfo?.slug ||
      (title
        ? String(title)
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
        : '');

    // Increment request ID to track racing async requests
    const reqId = ++cartReqIdRef.current;

    // 1. Optimistic local update
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => String(item.productId || item.id) === productId || String(item._id) === productId
      );

      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        const nextQty = (Number(updated[existingIndex].quantity) || 0) + parsedQty;
        const currentUnitPrice = Number(price) || Number(updated[existingIndex].price) || 0;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: nextQty,
          price: currentUnitPrice,
          totalItemPrice: currentUnitPrice * nextQty,
          slug: slug || updated[existingIndex].slug,
          selectedMetal: selectedMetal || updated[existingIndex].selectedMetal,
          selectedSize: cleanAttribute(selectedSize) || updated[existingIndex].selectedSize,
          selectedAttributes: selectedAttributes || updated[existingIndex].selectedAttributes,
        };
      } else {
        updated = [
          ...prev,
          {
            id: productId,
            productId,
            slug,
            name: title,
            title,
            price,
            totalItemPrice,
            originalPrice: product.originalPrice || null,
            image,
            category: (product.category && !/^[0-9a-fA-F]{24}$/.test(String(product.category).trim())) ? product.category : '',
            quantity: parsedQty,
            selectedMetal,
            selectedSize: cleanAttribute(selectedSize),
            selectedAttributes,
            addedAt,
          },
        ];
      }
      const consolidated = consolidateItems(updated);
      localStorage.setItem('jewels_cart', JSON.stringify(consolidated));
      setCartTotals(calculateTotals(consolidated));
      return consolidated;
    });

    if (location.pathname !== '/cart' && location.pathname !== '/checkout') {
      setCartDrawerOpen(true);
    }

    trackAddToCart(product, parsedQty, { shopperId: user?._id || user?.id });

    // 2. Call backend Cart API
    try {
      const payload = {
        productId,
        quantity: parsedQty,
        price,
        totalItemPrice,
        userId: currentUser?._id || currentUser?.id,
      };

      if (selectedMetal) {
        payload.selectedMetal = selectedMetal;
      }
      if (selectedSize) {
        payload.selectedSize = selectedSize;
      }

      // Only attach selectedAttributes if it contains meaningful non-null values
      if (selectedAttributes && typeof selectedAttributes === 'object') {
        const validEntries = Object.entries(selectedAttributes).filter(
          ([, val]) => val !== null && val !== undefined && val !== ''
        );
        if (validEntries.length > 0) {
          payload.selectedAttributes = Object.fromEntries(validEntries);
        }
      }

      const res = await cartAPI.add(payload);
      // If a newer add/update request has already been initiated, ignore this stale response
      if (reqId !== cartReqIdRef.current) {
        return;
      }
      const data = res?.data?.data || res?.data || {};

      // Show success toast only AFTER backend confirms
      toast.success(`Added "${title}" to your bag!`, {
        icon: '🛍️',
        style: {
          background: '#22201e',
          color: '#f5f0eb',
          border: '1px solid rgba(198, 145, 60, 0.4)',
        },
      });

      if (Array.isArray(data.items)) {
        const formattedItems = data.items.map((i) => {
          const itemSlug =
            i.slug ||
            i.basicInfo?.slug ||
            (i.title
              ? String(i.title)
                  .toLowerCase()
                  .trim()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')
              : '');
          return {
            id: String(i.productId?._id || i.productId || i.id || i._id),
            productId: String(i.productId?._id || i.productId || i.id || i._id),
            _id: i._id,
            slug: itemSlug,
            name: i.title,
            title: i.title,
            price: i.price,
            originalPrice: i.originalPrice,
            image: i.image?.url || i.image || '',
            category: (i.category && !/^[0-9a-fA-F]{24}$/.test(String(i.category).trim())) ? i.category : '',
            quantity: i.quantity,
            selectedMetal: resolveMetalName(i.selectedMetal, i.productId),
            selectedSize: cleanAttribute(i.selectedSize),
            selectedAttributes: i.selectedAttributes || selectedAttributes || undefined,
          };
        });
        const consolidated = consolidateItems(formattedItems);
        setCart(consolidated);
        setCartTotals({
          totalItems: data.totalItems ?? consolidated.length,
          subtotal: data.subtotal ?? calculateTotals(consolidated).subtotal,
          shipping: data.shipping ?? 0,
          tax: data.tax ?? 0,
          total: data.total ?? calculateTotals(consolidated).total,
        });
        localStorage.setItem('jewels_cart', JSON.stringify(consolidated));
      }
    } catch (err) {
      console.warn('Backend cart sync error:', err);
      // Revert the optimistic update
      fetchCart();
      if (err.response?.status === 401) {
        setCartDrawerOpen(false);
        if (typeof openLoginModal === 'function') {
          openLoginModal(async () => {
            await addToCart(product, quantity, options);
          });
        }
      }
    }
  };

  // Update item quantity
  const updateQuantity = async (id, quantity) => {
    const parsedQty = parseInt(quantity, 10);
    if (parsedQty <= 0) {
      removeFromCart(id);
      return;
    }

    // Optimistic
    setCart((prev) => {
      const updated = prev.map((item) =>
        String(item.id) === String(id) || String(item.productId) === String(id)
          ? { ...item, quantity: parsedQty }
          : item
      );
      localStorage.setItem('jewels_cart', JSON.stringify(updated));
      setCartTotals(calculateTotals(updated));
      return updated;
    });

    // API call
    try {
      const res = await cartAPI.updateQuantity(id, parsedQty);
      const data = res?.data?.data || res?.data;
      if (data && Array.isArray(data.items)) {
        setCartTotals({
          totalItems: data.totalItems,
          subtotal: data.subtotal,
          shipping: data.shipping,
          tax: data.tax,
          total: data.total,
        });
      }
    } catch (err) {
      console.warn('Backend update quantity error:', err);
    }
  };

  // Remove item from cart
  const removeFromCart = async (id) => {
    const targetItem = cart.find(
      (item) => String(item.id) === String(id) || String(item.productId) === String(id)
    );
    if (targetItem) {
      trackRemoveFromCart(targetItem, targetItem.quantity || 1);
    }

    // Optimistic
    setCart((prev) => {
      const updated = prev.filter(
        (item) => String(item.id) !== String(id) && String(item.productId) !== String(id)
      );
      localStorage.setItem('jewels_cart', JSON.stringify(updated));
      setCartTotals(calculateTotals(updated));
      return updated;
    });

    toast('Item removed from shopping bag', {
      icon: '🗑️',
      style: {
        background: '#22201e',
        color: '#f5f0eb',
      },
    });

    // API call
    try {
      await cartAPI.remove(id);
    } catch (err) {
      console.warn('Backend remove item error:', err);
    }
  };

  // Clear cart
  const clearCart = async () => {
    setCart([]);
    setCartTotals({
      totalItems: 0,
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
    });
    localStorage.removeItem('jewels_cart');

    try {
      await cartAPI.clear();
    } catch (err) {
      console.warn('Backend clear cart error:', err);
    }
  };

  const totalItems =
    cartTotals.totalItems || cart.length;
  const subtotal =
    cartTotals.subtotal ||
    cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const shipping = cartTotals.shipping || (subtotal > 5000 || subtotal === 0 ? 0 : 250);
  const tax = cartTotals.tax || Math.round(subtotal * 0.03);
  const total = cartTotals.total || subtotal + shipping + tax;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        tax,
        total,
        loading,
        cartDrawerOpen,
        setCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        isCartOpen: cartDrawerOpen,
        setIsCartOpen: setCartDrawerOpen,
        fetchCounts,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  return context || defaultCartValue;
};

export default CartContext;
