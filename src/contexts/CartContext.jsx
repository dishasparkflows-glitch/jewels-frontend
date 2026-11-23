import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartAPI } from '../api/services';
import { getPrimaryProductImage } from '../utils/productImages';
import { trackAddToCart, trackRemoveFromCart } from '../config/firebase';
import { useAuth } from './AuthContext';
import { resolveMetalName } from '../utils/metalColors';
import { joinUserSocketRooms, onCartCountUpdate } from '../services/socket';

/* eslint-disable react/prop-types, react-refresh/only-export-components */
const defaultCartValue = {
  cart: [],
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  totalItems: 0,
  orderCount: 0,
  returnOrderCount: 0,
  countsData: { cartCount: 0, wishlistCount: 0, orderCount: 0, returnOrderCount: 0 },
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

const extractId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  return String(val._id || val.id || val.productId || '').trim();
};

const formatCartItem = (i) => {
  const pId = extractId(i.productId || i.id || i._id);
  return {
    id: pId,
    productId: pId,
    _id: i._id || pId,
    sku: i.sku || '',
    slug: i.slug || '',
    name: i.title || i.name || '',
    title: i.title || i.name || '',
    price: Number(i.price) || 0,
    originalPrice: i.originalPrice || null,
    image: i.image || '',
    category: i.category || '',
    quantity: Number(i.quantity) || 1,
    selectedMetal: i.selectedMetal || '',
    selectedSize: i.selectedSize || '',
    selectedAttributes: i.selectedAttributes || undefined,
  };
};

/**
 * Deduplicates and consolidates cart items by product ID.
 * Ensures the same product always increments quantity on a single card.
 */
const consolidateItems = (items) => {
  if (!Array.isArray(items)) return [];
  const map = new Map();
  for (const item of items) {
    const pId = extractId(item.productId || item.id || item._id);
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
      return Array.isArray(parsed) ? consolidateItems(parsed) : [];
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

  const [countsData, setCountsData] = useState({
    cartCount: 0,
    wishlistCount: 0,
    orderCount: 0,
    returnOrderCount: 0,
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

  const updateCartFromResponse = useCallback((data) => {
    if (!data || !Array.isArray(data.items)) return;
    const consolidated = consolidateItems(data.items.map(formatCartItem));
    setCart(consolidated);
    setCartTotals({
      totalItems: data.totalItems ?? consolidated.length,
      subtotal: data.subtotal ?? calculateTotals(consolidated).subtotal,
      shipping: data.shipping ?? 0,
      tax: data.tax ?? 0,
      total: data.total ?? calculateTotals(consolidated).total,
    });
    localStorage.setItem('jewels_cart', JSON.stringify(consolidated));
  }, [calculateTotals]);

  // Fetch cart from backend API
  const fetchCart = useCallback(async () => {
    if (isFetchingCartRef.current) return;
    isFetchingCartRef.current = true;
    try {
      setLoading(true);
      const res = await cartAPI.get();
      const data = res?.data?.data || res?.data || {};
      updateCartFromResponse(data);
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
  }, [calculateTotals, updateCartFromResponse]);

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
      setCountsData({
        cartCount: count,
        wishlistCount: Number(data.wishlistCount || 0),
        orderCount: Number(data.orderCount || 0),
        returnOrderCount: Number(data.returnOrderCount || 0),
      });
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

    const productId = extractId(product._id || product.id || product.productId);
    if (!productId) {
      console.error('addToCart: Missing or invalid product id', product);
      toast.error('Unable to add item: invalid product information');
      return;
    }
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const selectedMetal = resolveMetalName(options.selectedMetal || product.selectedMetal || '', product);
    const selectedSize = options.selectedSize || product.selectedSize || '';
    const title = product.basicInfo?.title || product.title || '';
    const price = Number(product.price || product.pricing?.salePrice || 0);
    const image = product.image || getPrimaryProductImage(product);
    const totalItemPrice = options.totalItemPrice || (price * parsedQty);
    const addedAt = options.addedAt || new Date().toISOString();
    const selectedAttributes = options.selectedAttributes || product.selectedAttributes || undefined;
    const slug = product.basicInfo?.slug || product.slug || '';

    // Increment request ID to track racing async requests
    const reqId = ++cartReqIdRef.current;

    // 1. Optimistic local update
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === productId || item.id === productId || item._id === productId
      );

      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        const nextQty = (Number(updated[existingIndex].quantity) || 0) + parsedQty;
        const currentUnitPrice = price || Number(updated[existingIndex].price) || 0;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: nextQty,
          price: currentUnitPrice,
          totalItemPrice: currentUnitPrice * nextQty,
          slug: slug || updated[existingIndex].slug,
          selectedMetal: selectedMetal || updated[existingIndex].selectedMetal,
          selectedSize: selectedSize || updated[existingIndex].selectedSize,
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
            originalPrice: product.originalPrice || product.pricing?.mrp || null,
            image,
            category: product.category || '',
            quantity: parsedQty,
            selectedMetal,
            selectedSize,
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

      if (selectedMetal) payload.selectedMetal = selectedMetal;
      if (selectedSize) payload.selectedSize = selectedSize;
      if (selectedAttributes && typeof selectedAttributes === 'object') {
        const validEntries = Object.entries(selectedAttributes).filter(
          ([, val]) => val !== null && val !== undefined && val !== ''
        );
        if (validEntries.length > 0) {
          payload.selectedAttributes = Object.fromEntries(validEntries);
        }
      }

      const res = await cartAPI.add(payload);
      if (reqId !== cartReqIdRef.current) return;
      const data = res?.data?.data || res?.data || {};

      if (!options?.silent) {
        toast.success(`Added "${title}" to your bag!`, {
          icon: '🛍️',
          style: {
            background: '#22201e',
            color: '#f5f0eb',
            border: '1px solid rgba(198, 145, 60, 0.4)',
          },
        });
      }

      updateCartFromResponse(data);
    } catch (err) {
      console.warn('Backend cart sync error:', err);
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
    const targetId = extractId(id);
    if (!targetId) return;

    const parsedQty = parseInt(quantity, 10);
    if (parsedQty <= 0) {
      removeFromCart(targetId);
      return;
    }

    // Optimistic
    setCart((prev) => {
      const updated = prev.map((item) =>
        extractId(item.id) === targetId || extractId(item.productId) === targetId
          ? { ...item, quantity: parsedQty }
          : item
      );
      localStorage.setItem('jewels_cart', JSON.stringify(updated));
      setCartTotals(calculateTotals(updated));
      return updated;
    });

    // API call
    try {
      const res = await cartAPI.updateQuantity(targetId, parsedQty);
      const data = res?.data?.data || res?.data;
      updateCartFromResponse(data);
    } catch (err) {
      console.warn('Backend update quantity error:', err);
    }
  };

  // Remove item from cart
  const removeFromCart = async (id) => {
    const targetId = extractId(id);
    if (!targetId) return;

    const targetItem = cart.find(
      (item) => extractId(item.id) === targetId || extractId(item.productId) === targetId
    );
    if (targetItem) {
      trackRemoveFromCart(targetItem, targetItem.quantity || 1);
    }

    // Optimistic
    setCart((prev) => {
      const updated = prev.filter(
        (item) => extractId(item.id) !== targetId && extractId(item.productId) !== targetId
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

  const totalItems = cartTotals.totalItems || cart.length;
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
        orderCount: countsData.orderCount,
        returnOrderCount: countsData.returnOrderCount,
        countsData,
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
