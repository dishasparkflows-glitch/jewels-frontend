import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import AnalyticsTracker from './components/common/AnalyticsTracker';
import StoreLayout from './components/layout/StoreLayout';
import Home from './pages/store/Home';
import Shop from './pages/store/Shop';
import ProductDetail from './pages/store/ProductDetail';
import Cart from './pages/store/Cart';
import Checkout from './pages/store/Checkout';
import Wishlist from './pages/store/Wishlist';
import BlogList from './pages/store/BlogList';
import BlogDetail from './pages/store/BlogDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/user/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsTracker />
        <CartProvider>
          <WishlistProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#0f172a',
                  color: '#fff',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  fontSize: '13px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                },
              }}
            />

            <Routes>
              {/* Storefront Layout with Header and Footer */}
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blogs" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WishlistProvider>
      </CartProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
