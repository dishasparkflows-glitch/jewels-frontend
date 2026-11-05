import api, { getOnce } from './axios';

// ─── Auth ─────────────────────────────────────────
export const authAPI = {
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
};

// ─── Orders ─────────────────────────────────────────
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByNumber: (orderNumber) => api.get(`/orders/lookup/${orderNumber}`),
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
  getAll: (params) => getOnce('/products/storefront', { params }),
  getStorefront: (params) => productsAPI.getAll(params),
  getSearchStorefront: (params) => api.get('/products/search/storefront', { params }),
  getHomeProducts: (params) => getOnce('/products/home', { params }),
  getHomeStorefront: (params) => productsAPI.getHomeProducts(params),
  getById: (id) => getOnce(`/products/${id}`),
  getBySku: (code) => getOnce(`/products/sku/${encodeURIComponent(code)}`),
};

// ─── Reviews ──────────────────────────────────────
export const reviewsAPI = {
  getAll: (params) => getOnce('/reviews', { params }),
  getApproved: () => getOnce('/reviews?status=approved'),
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
  toggle: (productData) => api.post('/wishlist/toggle', productData),
  add: (productData) => api.post('/wishlist/add', productData),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  clear: () => api.delete('/wishlist'),
};

// ─── Cart ─────────────────────────────────────────
export const cartAPI = {
  get: () => getOnce('/cart'),
  getCounts: () => getOnce('/cart/counts'),
  add: (payload) =>
    api.post('/cart/add', {
      selectedAttributes: payload?.selectedAttributes ?? null,
      selectedMetal: payload?.selectedMetal || payload?.options?.selectedMetal || null,
      selectedSize: payload?.selectedSize || payload?.options?.selectedSize || null,
      productId: payload?.productId || payload?.id || payload?._id,
      price: Number(payload?.price) || 0,
      totalItemPrice: Number(payload?.totalItemPrice) || Number(payload?.price) || 0,
      quantity: payload?.quantity || 1,
      options: payload?.options || {},
      ...(payload?.userId ? { userId: payload.userId } : {}),
    }),
  updateQuantity: (productId, quantity, options = {}) =>
    api.put('/cart/quantity', { productId, quantity, options }),
  remove: (productId) => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart'),
};

// ─── Blogs & Categories ───────────────────────────
export const blogCategoriesAPI = {
  getAll: (params) => getOnce('/blog-categories', { params }),
  getLookup: () => getOnce('/blog-categories/lookup'),
  getBySlug: (slug) => getOnce(`/blog-categories/slug/${slug}`),
};

export const blogsAPI = {
  getAll: (params) => getOnce('/blogs', { params }),
  getBySlug: (slug) => getOnce(`/blogs/slug/${slug}`),
  getRecent: (limit = 4) => getOnce(`/blogs/recent?limit=${limit}`),
};

// ─── Static Pages ─────────────────────────────────
export const staticPagesAPI = {
  getAll: (params) => getOnce('/static-pages', { params }),
  getBySlug: (slug) => getOnce(`/static-pages/slug/${slug}`),
};

