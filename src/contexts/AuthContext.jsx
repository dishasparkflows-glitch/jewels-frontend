import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

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
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data;
  };

  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await authAPI.googleLogin(credential);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data;
  }, []);

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
