import { lazy, Suspense } from 'react';
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

// Lazy-loaded route pages for code-splitting & performance
const Home = lazy(() => import('./pages/store/Home'));
const Shop = lazy(() => import('./pages/store/Shop'));
const ProductDetail = lazy(() => import('./pages/store/ProductDetail'));
const Cart = lazy(() => import('./pages/store/Cart'));
const Checkout = lazy(() => import('./pages/store/Checkout'));
const Wishlist = lazy(() => import('./pages/store/Wishlist'));
const BlogList = lazy(() => import('./pages/store/BlogList'));
const BlogDetail = lazy(() => import('./pages/store/BlogDetail'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Profile = lazy(() => import('./pages/user/Profile'));
const StaticPageView = lazy(() => import('./pages/store/StaticPageView'));
const DynamicSlugView = lazy(() => import('./pages/store/DynamicSlugView'));
const OrderSuccess = lazy(() => import('./pages/store/OrderSuccess'));
const OrderFailed = lazy(() => import('./pages/store/OrderFailed'));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-stone-200 border-t-[#8b6f4e] rounded-full animate-spin" />
  </div>
);

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

            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
        </WishlistProvider>
      </CartProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
