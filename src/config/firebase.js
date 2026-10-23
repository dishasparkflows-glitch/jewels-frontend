import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAnalytics,
  isSupported,
  logEvent as firebaseLogEvent,
  setUserId,
  setUserProperties,
} from 'firebase/analytics';

/**
 * Firebase Configuration
 * Read directly from Vite environment variables (VITE_FIREBASE_*)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if basic required config exists
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app = null;
let analyticsInstance = null;
let initPromise = null;

/**
 * Safely initialize Firebase App & Analytics
 */
export async function initFirebaseAnalytics() {
  if (analyticsInstance) return analyticsInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isFirebaseConfigured) {
      if (import.meta.env.DEV) {
        console.info(
          '[Firebase Analytics] Not configured. Set VITE_FIREBASE_* environment variables to activate tracking.'
        );
      }
      return null;
    }

    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

      const supported = await isSupported();
      if (supported) {
        analyticsInstance = getAnalytics(app);
        if (import.meta.env.DEV) {
          console.info('[Firebase Analytics] Successfully initialized.');
        }
        return analyticsInstance;
      } else {
        console.warn('[Firebase Analytics] Analytics is not supported in this browser environment.');
        return null;
      }
    } catch (err) {
      console.error('[Firebase Analytics] Failed to initialize:', err);
      return null;
    }
  })();

  return initPromise;
}

/**
 * Generic event logger that safely no-ops if Firebase is unconfigured
 */
export async function logAnalyticsEvent(eventName, eventParams = {}) {
  try {
    const analytics = await initFirebaseAnalytics();
    if (!analytics) return;

    firebaseLogEvent(analytics, eventName, {
      ...eventParams,
      timestamp: new Date().toISOString(),
    });

    if (import.meta.env.DEV) {
      console.debug(`[Firebase Event] ${eventName}:`, eventParams);
    }
  } catch (err) {
    console.warn(`[Firebase Analytics] Error logging event "${eventName}":`, err);
  }
}

/**
 * Track Page Views
 */
export function trackPageView(pagePath, pageTitle) {
  const path = pagePath || window.location.pathname + window.location.search;
  const title = pageTitle || document.title;
  return logAnalyticsEvent('page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}

/**
 * Track Product Views (view_item)
 */
export function trackProductView(product) {
  if (!product) return;
  const id = product.id || product._id || '';
  const name = product.basicInfo?.title || product.title || product.name || '';
  const price = Number(product.pricing?.salePrice || product.pricing?.mrp || product.price || 0);

  return logAnalyticsEvent('view_item', {
    currency: 'INR',
    value: price,
    items: [
      {
        item_id: String(id),
        item_name: name,
        price,
        item_category: product.productType || product.category || 'Jewellery',
      },
    ],
  });
}

/**
 * Track Add to Cart
 */
export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  const id = product.id || product._id || '';
  const name = product.basicInfo?.title || product.title || product.name || '';
  const price = Number(product.pricing?.salePrice || product.pricing?.mrp || product.price || 0);

  return logAnalyticsEvent('add_to_cart', {
    currency: 'INR',
    value: price * quantity,
    items: [
      {
        item_id: String(id),
        item_name: name,
        price,
        quantity,
      },
    ],
  });
}

/**
 * Track Remove from Cart
 */
export function trackRemoveFromCart(product, quantity = 1) {
  if (!product) return;
  const id = product.id || product._id || '';
  const name = product.basicInfo?.title || product.title || product.name || '';
  const price = Number(product.pricing?.salePrice || product.pricing?.mrp || product.price || 0);

  return logAnalyticsEvent('remove_from_cart', {
    currency: 'INR',
    value: price * quantity,
    items: [
      {
        item_id: String(id),
        item_name: name,
        price,
        quantity,
      },
    ],
  });
}

/**
 * Track Add to Wishlist
 */
export function trackAddToWishlist(product) {
  if (!product) return;
  const id = product.id || product._id || '';
  const name = product.basicInfo?.title || product.title || product.name || '';
  const price = Number(product.pricing?.salePrice || product.pricing?.mrp || product.price || 0);

  return logAnalyticsEvent('add_to_wishlist', {
    currency: 'INR',
    value: price,
    items: [
      {
        item_id: String(id),
        item_name: name,
        price,
      },
    ],
  });
}

/**
 * Track Begin Checkout
 */
export function trackBeginCheckout(items = [], totalValue = 0) {
  return logAnalyticsEvent('begin_checkout', {
    currency: 'INR',
    value: Number(totalValue) || 0,
    items: items.map((item) => ({
      item_id: String(item.id || item._id || ''),
      item_name: item.title || item.name || '',
      price: Number(item.price || item.salePrice || 0),
      quantity: Number(item.quantity || 1),
    })),
  });
}

/**
 * Track Purchase
 */
export function trackPurchase(orderId, items = [], totalValue = 0) {
  return logAnalyticsEvent('purchase', {
    transaction_id: String(orderId),
    currency: 'INR',
    value: Number(totalValue) || 0,
    items: items.map((item) => ({
      item_id: String(item.id || item._id || ''),
      item_name: item.title || item.name || '',
      price: Number(item.price || item.salePrice || 0),
      quantity: Number(item.quantity || 1),
    })),
  });
}

/**
 * Associate User with Analytics Session
 */
export async function setAnalyticsUser(userId, properties = {}) {
  try {
    const analytics = await initFirebaseAnalytics();
    if (!analytics) return;

    if (userId) {
      setUserId(analytics, String(userId));
    }
    if (Object.keys(properties).length > 0) {
      setUserProperties(analytics, properties);
    }
  } catch (err) {
    console.warn('[Firebase Analytics] Error setting user:', err);
  }
}
