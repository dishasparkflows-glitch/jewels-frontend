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
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const isFetchingCartRef = useRef(false);
  const isFetchingCountsRef = useRef(false);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('jewels_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ({
        ...item,
        selectedMetal: resolveMetalName(item.selectedMetal),
        selectedSize: cleanAttribute(item.selectedSize),
      }));
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [cartTotals, setCartTotals] = useState({
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });

  // Calculate local fallback totals if needed
  const calculateTotals = useCallback((items) => {
    const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
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
            category: i.category,
            quantity: i.quantity,
            selectedMetal: resolveMetalName(i.selectedMetal, i.product),
            selectedSize: cleanAttribute(i.selectedSize),
          };
        });
        setCart(formattedItems);
        setCartTotals({
          totalItems: data.totalItems ?? formattedItems.length,
          subtotal: data.subtotal ?? 0,
          shipping: data.shipping ?? 0,
          tax: data.tax ?? 0,
          total: data.total ?? 0,
        });
        localStorage.setItem('jewels_cart', JSON.stringify(formattedItems));
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
  const addToCart = async (product, quantity = 1, options = {}) => {
    if (!product) return;

    // Cart writes require an authenticated customer. Keep the attempted page so
    // the user can return after signing in; the axios client attaches this token.
    const accessToken = token || localStorage.getItem('token');
    if (!accessToken) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const productId = String(product.id || product._id || product.productId || '').trim();
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const selectedMetal = resolveMetalName(options.selectedMetal || product.selectedMetal || '', product);
    const selectedSize = cleanAttribute(options.selectedSize || product.selectedSize || '');
    const title = product.title || product.name || '';
    const price = Number(product.price) || 0;
    const image = product.image?.url || product.image || getPrimaryProductImage(product);

    const totalItemPrice = options.totalItemPrice || product.totalItemPrice || (price * parsedQty);
    const addedAt = options.addedAt || product.addedAt || new Date().toISOString();
      const selectedAttributes = options.selectedAttributes || product.selectedAttributes || undefined;

    const slug =
      product.basicInfo?.slug ||
      product.slug ||
      product.representative?.basicInfo?.slug ||
      product.representative?.slug ||
      (title
        ? String(title)
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
        : '');

    // 1. Optimistic local update
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => String(item.id) === productId && (item.selectedMetal || '') === selectedMetal
      );

      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex].quantity += parsedQty;
        updated[existingIndex].totalItemPrice = (Number(updated[existingIndex].price) || price) * updated[existingIndex].quantity;
        if (slug) updated[existingIndex].slug = slug;
        if (selectedAttributes) updated[existingIndex].selectedAttributes = selectedAttributes;
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
            category: product.category || '',
            quantity: parsedQty,
            selectedMetal,
            selectedSize,
            selectedAttributes,
            addedAt,
          },
        ];
      }
      localStorage.setItem('jewels_cart', JSON.stringify(updated));
      setCartTotals(calculateTotals(updated));
      return updated;
    });

    trackAddToCart(product, parsedQty);

    toast.success(`Added "${title}" to your bag!`, {
      icon: '🛍️',
      style: {
        background: '#22201e',
        color: '#f5f0eb',
        border: '1px solid rgba(198, 145, 60, 0.4)',
      },
    });

    // 2. Call backend Cart API
    try {
      const payload = {
        productId,
        quantity: parsedQty,
        price,
        totalItemPrice,
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
      const data = res?.data?.data || res?.data || {};

      if (Array.isArray(data.items)) {
        const formattedItems = data.items.map((i) => ({
          id: i.productId || i._id,
          productId: i.productId,
          _id: i._id,
          name: i.title,
          title: i.title,
          price: i.price,
          originalPrice: i.originalPrice,
          image: i.image?.url || i.image || '',
          category: i.category,
          quantity: i.quantity,
          selectedMetal: resolveMetalName(i.selectedMetal, i.product),
          selectedSize: cleanAttribute(i.selectedSize),
        }));
        setCart(formattedItems);
        setCartTotals({
          totalItems: data.totalItems ?? formattedItems.length,
          subtotal: data.subtotal ?? 0,
          shipping: data.shipping ?? 0,
          tax: data.tax ?? 0,
          total: data.total ?? 0,
        });
        localStorage.setItem('jewels_cart', JSON.stringify(formattedItems));
      }
    } catch (err) {
      console.warn('Backend cart sync error:', err);
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: location }, replace: true });
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
    cartTotals.totalItems || cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
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
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
