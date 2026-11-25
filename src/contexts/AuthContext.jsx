import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI, cartAPI, wishlistAPI } from '../api/services';
import { setAnalyticsUser } from '../config/firebase';

const readGuestItems = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/* eslint-disable react/prop-types, react-refresh/only-export-components */
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const loginSuccessCallbackRef = useRef(null);

  const openLoginModal = useCallback((onSuccess) => {
    loginSuccessCallbackRef.current = typeof onSuccess === 'function' ? onSuccess : null;
    setLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
    loginSuccessCallbackRef.current = null;
  }, []);

  const onLoginSuccess = useCallback((loggedInUser) => {
    setLoginModalOpen(false);
    const cb = loginSuccessCallbackRef.current;
    loginSuccessCallbackRef.current = null;
    if (cb) {
      setTimeout(() => {
        try {
          cb(loggedInUser);
        } catch (err) {
          console.warn('Error running post-login callback:', err);
        }
      }, 100);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('jewels_cart');
      localStorage.removeItem('jewels_wishlist');
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      if (data?.data) {
        setUser(data.data);
        try {
          localStorage.setItem('user', JSON.stringify(data.data));
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      // Only logout and clear credentials if server explicitly returns 401 Unauthorized
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) fetchUser();
    else setLoading(false);
  }, [token, fetchUser]);

  useEffect(() => {
    if (user?._id || user?.id) {
      setAnalyticsUser(user._id || user.id, {
        role: user.role || 'customer',
      });
    }
  }, [user]);

  /**
   * Persists auth credentials, merges any guest cart/wishlist items into the
   * authenticated account, and notifies storefront contexts to refresh.
   */
  const completeAuthSession = useCallback(async (authData) => {
    const receivedToken = authData?.token;
    const receivedUser = authData?.user;
    if (!receivedToken || !receivedUser) return authData;

    const guestCart = readGuestItems('jewels_cart');
    const guestWishlist = readGuestItems('jewels_wishlist');

    try {
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
    } catch {
      /* ignore */
    }

    const mergeTasks = [];
    if (guestCart.length > 0) {
      mergeTasks.push(
        cartAPI.merge(guestCart).then((res) => {
          const mergedItems = res?.data?.data?.items;
          if (Array.isArray(mergedItems)) {
            try {
              localStorage.setItem('jewels_cart', JSON.stringify(mergedItems));
            } catch {
              /* ignore */
            }
          }
        })
      );
    }
    if (guestWishlist.length > 0) {
      mergeTasks.push(
        wishlistAPI.merge(guestWishlist).then((res) => {
          const mergedItems = res?.data?.data?.items;
          if (Array.isArray(mergedItems)) {
            try {
              localStorage.setItem('jewels_wishlist', JSON.stringify(mergedItems));
            } catch {
              /* ignore */
            }
          }
        })
      );
    }

    if (mergeTasks.length > 0) {
      await Promise.allSettled(mergeTasks);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:merged'));
      }
    }

    setToken(receivedToken);
    setUser(receivedUser);
    return authData;
  }, []);

  const login = async (identifier, password) => {
    const { data } = await authAPI.login({ identifier, password });
    return completeAuthSession(data.data);
  };

  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await authAPI.googleLogin(credential);
    return completeAuthSession(data.data);
  }, [completeAuthSession]);

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    return completeAuthSession(data.data);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        fetchUser,
        updateUser: (updatedUser) => {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        },
        isAuthenticated: !!token && !!user,
        isAdmin,
        isSuperAdmin,
        loginModalOpen,
        openLoginModal,
        closeLoginModal,
        onLoginSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
