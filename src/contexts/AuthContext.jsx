import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../api/services';
import { setAnalyticsUser } from '../config/firebase';

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
    } catch {}
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
        } catch {}
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

  const login = async (identifier, password) => {
    const { data } = await authAPI.login({ identifier, password });
    const receivedToken = data.data.token;
    const receivedUser = data.data.user;
    try {
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
    } catch {}
    setToken(receivedToken);
    setUser(receivedUser);
    return data.data;
  };

  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await authAPI.googleLogin(credential);
    const receivedToken = data.data.token;
    const receivedUser = data.data.user;
    try {
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
    } catch {}
    setToken(receivedToken);
    setUser(receivedUser);
    return data.data;
  }, []);

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    const receivedToken = data.data.token;
    const receivedUser = data.data.user;
    try {
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
    } catch {}
    setToken(receivedToken);
    setUser(receivedUser);
    return data.data;
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
