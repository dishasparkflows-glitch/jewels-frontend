import api from './axios';

// ─── Auth ─────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── Users ────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

// ─── Appointments ─────────────────────────────────
export const appointmentsAPI = {
  create: (data) => api.post('/appointments', data),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
};

// ─── Notifications ────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
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
export const bannersAPI = {
  getAll: (params) => api.get('/banners', { params }),
  getHeroBanners: () => api.get('/banners?type=herobanner&status=active'),
  getCollectionBanners: () => api.get('/banners?type=collectionbanner&status=active'),
  getMobileAppBanner: () => api.get('/banners?type=mobileappbanner&status=active'),
  getBookAppointBanner: () => api.get('/banners?type=bookappointbanner&status=active'),
  getCustomJewelleryBanner: () => api.get('/banners?bannerKey=custom_jewellery&status=active'),
};

// ─── Categories ───────────────────────────────────
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
};

// ─── Featured / Celebrate / Gifts ─────────────────
export const featuredAPI = {
  getAll: (params) => api.get('/featured', { params }),
  getCelebrate: () => api.get('/featured?placement=Celebrate&status=active'),
  getGifts: () => api.get('/featured?placement=Gifts&status=active'),
};

// ─── Products ─────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getHomeProducts: (params) => api.get('/product/home', { params }),
  getById: (id) => api.get(`/products/${id}`),
};

// ─── Reviews ──────────────────────────────────────
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getApproved: () => api.get('/reviews?status=approved'),
};

// ─── Instagram Posts ──────────────────────────────
export const instagramAPI = {
  getAll: (params) => api.get('/instagram-posts', { params }),
};

// ─── Footer Settings ──────────────────────────────
export const footerAPI = {
  get: () => api.get('/footer-settings'),
};

// ─── Wishlist ─────────────────────────────────────
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  toggle: (productData) => api.post('/wishlist/toggle', productData),
  add: (productData) => api.post('/wishlist/add', productData),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  clear: () => api.delete('/wishlist'),
};

// ─── Cart ─────────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (productData, quantity = 1, options = {}) =>
    api.post('/cart/add', { product: productData, quantity, options }),
  updateQuantity: (productId, quantity, options = {}) =>
    api.put('/cart/quantity', { productId, quantity, options }),
  remove: (productId) => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart'),
};

