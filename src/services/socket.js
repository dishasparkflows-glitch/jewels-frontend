import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9900/api';
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
    });
  }
  return socketInstance;
}

/**
 * Join user and session socket rooms for instant multi-tab & cross-device updates
 */
export function joinUserSocketRooms({ userId, sessionId }) {
  const socket = getSocket();
  const sid = sessionId || localStorage.getItem('neirah_session_id');
  const uid = userId || (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?._id || null;
    } catch {
      return null;
    }
  })();

  if (socket.connected) {
    socket.emit('join_user', { userId: uid, sessionId: sid });
  } else {
    socket.once('connect', () => {
      socket.emit('join_user', { userId: uid, sessionId: sid });
    });
  }
}

/**
 * Listen for realtime wishlist updates from server
 */
export function onWishlistCountUpdate(callback) {
  const socket = getSocket();
  socket.on('wishlist_count_updated', callback);
  return () => socket.off('wishlist_count_updated', callback);
}

/**
 * Listen for realtime cart updates from server
 */
export function onCartCountUpdate(callback) {
  const socket = getSocket();
  socket.on('cart_count_updated', callback);
  return () => socket.off('cart_count_updated', callback);
}
