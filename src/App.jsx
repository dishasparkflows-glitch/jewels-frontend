import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { HiOutlineX } from 'react-icons/hi';
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
import StaticPageView from './pages/store/StaticPageView';
import DynamicSlugView from './pages/store/DynamicSlugView';
import OrderSuccess from './pages/store/OrderSuccess';
import OrderFailed from './pages/store/OrderFailed';

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
              containerStyle={{
                top: 20,
                right: 20,
                zIndex: 99999999,
              }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0f172a',
                  color: '#fff',
                  borderRadius: '16px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                },
              }}
            >
              {(t) => (
                <ToastBar toast={t}>
                  {({ icon, message }) => (
                    <div className="flex items-center gap-2 w-full">
                      {icon}
                      <div className="flex-1 text-xs sm:text-[13px] font-medium leading-snug">{message}</div>
                      {t.type !== 'loading' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss(t.id);
                          }}
                          className="ml-1 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                          title="Close"
                          aria-label="Close notification"
                        >
                          <HiOutlineX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </ToastBar>
              )}
            </Toaster>

            <Routes>
              {/* Storefront Layout with Header and Footer */}
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/:categorySlug/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/order-failed" element={<OrderFailed />} />
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
              <Route path="/pages/:slug" element={<StaticPageView />} />
              <Route path="/:slug" element={<DynamicSlugView />} />
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
