import api, { getOnce } from './axios';

// ─── Auth ─────────────────────────────────────────
export const authAPI = {
  checkAvailability: (data) => api.post('/auth/check-availability', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  requestPasswordReset: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => getOnce('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── Users ────────────────────────────────────────
export const usersAPI = {
  getById: (id) => getOnce(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  getMe: () => getOnce('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

// ─── Appointments ─────────────────────────────────
export const appointmentsAPI = {
  create: (data) => api.post('/appointments', data),
};

// ─── Custom Inquiries ────────────────────────────
export const customInquiryAPI = {
  create: (data) => api.post('/custom-inquiries', data),
};

// ─── Banners ──────────────────────────────────────
export const bannersAPI = {
  getAll: (params) => getOnce('/banners', { params }),
  getActive: (params = {}) => {
    const platform = ['web', 'mobile'].includes(params.platform) ? params.platform : 'web';
    return getOnce('/banners/lookup', { params: { platform } });
  },
  getCategoryDisplay: (params = {}) => getOnce('/banners/category-display', { params }),
};

// ─── Store settings ───────────────────────────────
let storeSettingsRequest;
let commonSettingsRequest;
export const settingsAPI = {
  getCommonSettings: (options = {}) => {
    if (options?.fresh) {
      return api.get('/settings/common');
    }
    if (!commonSettingsRequest) {
      commonSettingsRequest = getOnce('/settings/common').catch((error) => {
        commonSettingsRequest = null;
        throw error;
      });
    }
    return commonSettingsRequest;
  },
  getStoreSettings: (options = {}) => {
    if (options?.fresh) {
      return api.get('/settings');
    }
    if (!storeSettingsRequest) {
      storeSettingsRequest = getOnce('/settings').catch((error) => {
        storeSettingsRequest = null;
        throw error;
      });
    }
    return storeSettingsRequest;
  },
};

// ─── Common Storefront Bootstrap (Navigation, Settings, Announcement, WebsiteConfig) ───
export const commonAPI = {
  getBootstrap: (options = {}) => {
    if (options?.fresh) {
      return api.get('/common/bootstrap');
    }
    return getOnce('/common/bootstrap');
  },
  getRevision: () => api.get('/common/revision'),
};

// Public, revisioned storefront presentation configuration.
export const websiteAPI = {
  getConfig: () => api.get('/website/config'),
};

// ─── Categories ───────────────────────────────────
export const categoriesAPI = {
  getNavigation: () => getOnce('/categories/navigation'),
  getAll: (params) => getOnce('/categories', { params }),
  getLookup: (params) => getOnce('/categories/lookup', { params }),
};

export const sizesAPI = {
  getLookup: (params) => getOnce('/sizes/lookup', { params }),
};

// ─── Coupons ───────────────────────────────────────
export const couponsAPI = {
  getLookup: (params) => getOnce('/coupons/lookup', { params }),
  validate: (code, cartAmount) => api.post('/coupons/validate', { code, cartAmount }),
};

// ─── Addresses ─────────────────────────────────────
export const addressesAPI = {
  getAll: () => api.get('/addresses'),
  getById: (id) => getOnce(`/addresses/${id}`),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id, type = 'both') => api.patch(`/addresses/${id}/default`, { type }),
};

// ─── Checkout ──────────────────────────────────────
export const checkoutAPI = {
  validateCoupon: (code, cartAmount) => couponsAPI.validate(code, cartAmount),
  calculateCodFee: (amount) => getOnce('/cod-sequences/calculate', { params: { amount } }),
  getAddresses: () => addressesAPI.getAll(),
  getPaymentConfig: () => paymentsAPI.getConfig(),
  createOrder: (orderData) => ordersAPI.create(orderData),
  verifyRazorpay: (data) => paymentsAPI.verifyRazorpay(data),
  sendOtp: (phone, purpose, countryCode = '+91') =>
    otpAPI.send(typeof phone === 'object' ? phone : { phone, purpose, countryCode }),
  verifyOtp: (phone, otp, purpose, countryCode = '+91') =>
    otpAPI.verify(typeof phone === 'object' ? phone : { phone, otp, purpose, countryCode }),
};

// ─── OTP (Mobile Verification) ─────────────────────────
export const otpAPI = {
  send: (data) => api.post('/otp/send', data),
  verify: (data) => api.post('/otp/verify', data),
};

// ─── Orders ─────────────────────────────────────────
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByNumber: (orderNumber) => api.get(`/orders/lookup/${encodeURIComponent(orderNumber)}`),
  downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
};

// ─── Payments ───────────────────────────────────────
export const paymentsAPI = {
  getConfig: () => getOnce('/payments/config'),
  initiate: (data) => api.post('/payments/initiate', data),
  verifyRazorpay: (data) => api.post('/payments/razorpay/verify', data),
};

// ─── Featured / Celebrate / Gifts ─────────────────
export const featuredAPI = {
  getAll: (params) => getOnce('/featured', { params }),
  getLookup: (params) => getOnce('/featured/lookup', { params }),
  getCelebrate: () => getOnce('/featured/lookup?type=Celebrate&status=active'),
  getGifts: () => getOnce('/featured/lookup?type=Gifts&status=active'),
};

// ─── Products ─────────────────────────────────────
export const productsAPI = {
  getAll: (params) => getOnce('/products/storefront', { params: { forweb: true, ...params } }),
  getStorefront: (params) => productsAPI.getAll(params),
  getSearchStorefront: (params) => api.get('/products/search/storefront', { params: { forweb: true, ...params } }),
  getHomeProducts: (params) => getOnce('/products/home', { params: { forweb: true, ...params } }),
  getHomeStorefront: (params) => productsAPI.getHomeProducts(params),
  getHomeSections: (params) => getOnce('/products/home-sections', { params: { forweb: true, ...params } }),
  getMostLiked: (params) => api.get('/products/most-liked', { params: { forweb: true, ...params } }),
  getById: (id) => getOnce(`/products/${id}`),
  getBySku: (code) => getOnce(`/products/sku/${encodeURIComponent(code)}`),
  getSimilar: (id, params) => api.get(`/products/${id}/similar`, { params: { forweb: true, ...params } }),
};

// ─── Diamonds ─────────────────────────────────────
export const diamondsAPI = {
  getAll: (params) => getOnce('/diamonds', { params: { forweb: true, status: 'active', ...params } }),
  getAttributes: () => getOnce('/diamonds/attributes'),
  getLookup: (params) => getOnce('/diamonds/lookup', { params }),
  getById: (id) => getOnce(`/diamonds/${encodeURIComponent(id)}`),
  getBySku: (sku) => getOnce(`/diamonds/sku/${encodeURIComponent(sku)}`),
};

// ─── Reviews ──────────────────────────────────────
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getApproved: (params = {}) => api.get('/reviews', { params: { ...params, status: 'approved' } }),
  create: (data) => api.post('/reviews', data),
};

// ─── Instagram Posts ──────────────────────────────
export const instagramAPI = {
  getAll: (params) => getOnce('/instagram-posts', { params }),
  getLookup: (params) => getOnce('/instagram-posts/lookup', { params }),
};

// ─── Footer Settings ──────────────────────────────
export const footerAPI = {
  get: () => getOnce('/footer-settings'),
};

// ─── Wishlist ─────────────────────────────────────
export const wishlistAPI = {
  get: () => getOnce('/wishlist'),
  getCounts: () => getOnce('/cart/counts'),
  toggle: ({ refId, itemType = 'product' }) => api.post('/wishlist/toggle', { refId, itemType }),
  add: ({ refId, itemType = 'product' }) => api.post('/wishlist/add', { refId, itemType }),
  remove: (refId) => api.delete(`/wishlist/${refId}`),
  clear: () => api.delete('/wishlist'),
};

// ─── Cart ─────────────────────────────────────────
export const cartAPI = {
  get: () => getOnce('/cart'),
  getCounts: () => getOnce('/cart/counts'),
  add: (payload) =>
    api.post('/cart/add', {
      refId: payload?.refId,
      itemType: payload?.itemType || 'product',
      quantity: Number(payload?.quantity) || 1,
      price: Number(payload?.price) || 0,
      totalItemPrice: Number(payload?.totalItemPrice) || Number(payload?.price) || 0,
      ...(payload?.selectedMetal ? { selectedMetal: payload.selectedMetal } : {}),
      ...(payload?.selectedSize ? { selectedSize: payload.selectedSize } : {}),
      ...(payload?.selectedAttributes ? { selectedAttributes: payload.selectedAttributes } : {}),
      ...(payload?.userId ? { userId: payload.userId } : {}),
    }),
  updateQuantity: (refId, quantity) =>
    api.put('/cart/quantity', { refId, quantity }),
  remove: (refId) => api.delete(`/cart/${refId}`),
  clear: () => api.delete('/cart'),
};

// ─── Blogs & Categories ───────────────────────────
export const blogCategoriesAPI = {
  getAll: (params) => getOnce('/blog-categories', { params }),
  getLookup: () => getOnce('/blog-categories/lookup'),
  getBySlug: (slug) => getOnce(`/blog-categories/slug/${slug}`),
};

export const blogsAPI = {
  getAll: (params, config = {}) => getOnce('/blogs', { params, ...config }),
  getBySlug: (slug, config = {}) => getOnce(`/blogs/slug/${slug}`, config),
  getRecent: (limit = 4, config = {}) => getOnce(`/blogs/recent?limit=${limit}`, config),
};

// ─── Static Pages ─────────────────────────────────
export const staticPagesAPI = {
  getAll: (params) => getOnce('/static-pages', { params }),
  getBySlug: (slug) => getOnce(`/static-pages/slug/${slug}`),
};

// ─── Shiprocket Logistics ──────────────────────────
export const shiprocketAPI = {
  checkServiceability: (params) => api.get('/shiprocket/serviceability', { params }),
  trackByAwb: (awb) => api.get(`/shiprocket/track/awb/${awb}`),
  trackByOrderId: (orderId) => api.get(`/shiprocket/track/order/${orderId}`),
};

// ─── Birthstones ────────────────────────────────────
export const birthstoneAPI = {
  getAll: (params) => getOnce('/birthstones', { params }),
  getLookup: () => getOnce('/birthstones/lookup'),
  getByMonth: (month) => getOnce(`/birthstones/month/${month}`),
};



