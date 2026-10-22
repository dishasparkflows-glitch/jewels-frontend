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
  getAll: (params) => getOnce('/users', { params }),
  getById: (id) => getOnce(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getMe: () => getOnce('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

// ─── Appointments ─────────────────────────────────
export const appointmentsAPI = {
  create: (data) => api.post('/appointments', data),
  getAll: (params) => getOnce('/appointments', { params }),
  getById: (id) => getOnce(`/appointments/${id}`),
};

// ─── Notifications ────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => getOnce('/notifications', { params }),
  getUnreadCount: () => getOnce('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ─── Upload ───────────────────────────────────────
export const uploadAPI = {
  single: (formData, folder) => api.post(`/upload/single?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  multiple: (formData, folder) => api.post(`/upload/multiple?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (filepath) => api.delete('/upload', { data: { filepath } }),
};

// ─── Banners ──────────────────────────────────────
const activeBannersRequests = new Map();
export const bannersAPI = {
  getAll: (params) => getOnce('/banners', { params }),
  getActive: (params = {}) => {
    const platform = ['web', 'mobile'].includes(params.platform) ? params.platform : 'web';
    if (!activeBannersRequests.has(platform)) {
      activeBannersRequests.set(platform, getOnce('/banners/lookup', { params: { platform } }).catch((error) => {
        activeBannersRequests.delete(platform);
        throw error;
      }));
    }
    return activeBannersRequests.get(platform);
  },
};

// ─── Store settings ───────────────────────────────
let storeSettingsRequest;
export const settingsAPI = {
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

// ─── Checkout ──────────────────────────────────────
export const checkoutAPI = {
  validateCoupon: (code, cartAmount) => api.post('/coupons/validate', { code, cartAmount }),
  calculateCodFee: (amount) => getOnce('/cod-sequences/calculate', { params: { amount } }),
  getAddresses: () => getOnce('/addresses'),
};

// ─── Featured / Celebrate / Gifts ─────────────────
export const featuredAPI = {
  getAll: (params) => getOnce('/featured', { params }),
  getCelebrate: () => getOnce('/featured?placement=Celebrate&status=active'),
  getGifts: () => getOnce('/featured?placement=Gifts&status=active'),
};

// ─── Products ─────────────────────────────────────
export const productsAPI = {
  getAll: (params) => getOnce('/products', { params }),
  getHomeProducts: (params) => getOnce('/product/home', { params }),
  getById: (id) => getOnce(`/products/${id}`),
};

// ─── Reviews ──────────────────────────────────────
export const reviewsAPI = {
  getAll: (params) => getOnce('/reviews', { params }),
  getApproved: () => getOnce('/reviews?status=approved'),
};

// ─── Instagram Posts ──────────────────────────────
export const instagramAPI = {
  getAll: (params) => getOnce('/instagram-posts', { params }),
};

// ─── Footer Settings ──────────────────────────────
export const footerAPI = {
  get: () => getOnce('/footer-settings'),
};

// ─── Wishlist ─────────────────────────────────────
export const wishlistAPI = {
  get: () => getOnce('/wishlist'),
  toggle: (productData) => api.post('/wishlist/toggle', productData),
  add: (productData) => api.post('/wishlist/add', productData),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  clear: () => api.delete('/wishlist'),
};

// ─── Cart ─────────────────────────────────────────
export const cartAPI = {
  get: () => getOnce('/cart'),
  add: (productData, quantity = 1, options = {}) =>
    api.post('/cart/add', { product: productData, quantity, options }),
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

