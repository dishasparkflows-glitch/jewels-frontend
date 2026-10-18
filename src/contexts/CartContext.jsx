import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { cartAPI } from '../api/services';

/* eslint-disable react/prop-types, react-refresh/only-export-components */
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('jewels_cart');
      return saved ? JSON.parse(saved) : [];
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
    try {
      setLoading(true);
      const res = await cartAPI.get();
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
          selectedMetal: i.selectedMetal || '',
          selectedSize: i.selectedSize || '',
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
      console.warn('Failed to load cart from API, using local fallback:', err);
      setCartTotals(calculateTotals(cart));
    } finally {
      setLoading(false);
    }
  }, [calculateTotals, cart]);

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add item to cart with backend API call & optimistic update
  const addToCart = async (product, quantity = 1, options = {}) => {
    if (!product) return;

    const productId = String(product.id || product._id || product.productId || '').trim();
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const selectedMetal = options.selectedMetal || product.selectedMetal || '';
    const title = product.title || product.name || '';
    const price = Number(product.price) || 0;
    const image = product.image?.url || product.image || (product.images?.[0]?.url || product.images?.[0]) || '';

    // 1. Optimistic local update
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => String(item.id) === productId && (item.selectedMetal || '') === selectedMetal
      );

      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex].quantity += parsedQty;
      } else {
        updated = [
          ...prev,
          {
            id: productId,
            productId,
            name: title,
            title,
            price,
            originalPrice: product.originalPrice || null,
            image,
            category: product.category || '',
            quantity: parsedQty,
            selectedMetal,
            selectedSize: options.selectedSize || '',
          },
        ];
      }
      localStorage.setItem('jewels_cart', JSON.stringify(updated));
      setCartTotals(calculateTotals(updated));
      return updated;
    });

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
        title,
        price,
        originalPrice: product.originalPrice || null,
        image,
        category: product.category || '',
        quantity: parsedQty,
        selectedMetal,
        selectedSize: options.selectedSize || '',
      };

      const res = await cartAPI.add(payload, parsedQty, options);
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
          selectedMetal: i.selectedMetal || '',
          selectedSize: i.selectedSize || '',
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
