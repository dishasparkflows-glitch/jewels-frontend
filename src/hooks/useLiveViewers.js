import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9900/api';
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const MIN_VIEWERS = 25;
const MAX_VIEWERS = 60;

// Shared socket instance across the application
let sharedSocket = null;
function getSharedSocket() {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return sharedSocket;
}

/**
 * Generate a deterministic seed from productId in range 28-45
 */
function getDeterministicSeed(productId) {
  if (!productId) return 32;
  const str = String(productId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return MIN_VIEWERS + 3 + (Math.abs(hash) % 18);
}

/**
 * Calculate natural, realistic step (e.g. 25 -> 32 -> 30 -> 40 -> 35 -> 50)
 */
function getNextNaturalCount(current) {
  let delta = 0;
  if (current <= 28) {
    delta = Math.floor(Math.random() * 7) + 3; // +3 to +9
  } else if (current >= 56) {
    delta = -(Math.floor(Math.random() * 6) + 3); // -3 to -8
  } else {
    const jumps = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    delta = jumps[Math.floor(Math.random() * jumps.length)];
  }

  let next = current + delta;
  if (next < MIN_VIEWERS) next = MIN_VIEWERS + Math.floor(Math.random() * 4);
  if (next > MAX_VIEWERS) next = MAX_VIEWERS - Math.floor(Math.random() * 4);
  return next;
}

/**
 * Custom hook for live viewing counter on product pages
 * Uses real-time Socket.IO synchronization with automatic organic fallback
 */
export function useLiveViewers(productId) {
  const pid = productId ? String(productId).trim() : '';

  const [count, setCount] = useState(() => {
    if (!pid) return 32;
    try {
      const cached = sessionStorage.getItem(`live_viewers_${pid}`);
      if (cached) {
        const parsed = parseInt(cached, 10);
        if (!isNaN(parsed) && parsed >= MIN_VIEWERS && parsed <= MAX_VIEWERS) {
          return parsed;
        }
      }
    } catch {
      // sessionStorage might be restricted in private browsing
    }
    return getDeterministicSeed(pid);
  });

  const [hasUpdated, setHasUpdated] = useState(false);
  const lastSocketUpdateRef = useRef(Date.now());
  const localTimerRef = useRef(null);

  useEffect(() => {
    if (!pid) return;

    // Initialize or retrieve initial seed for new pid
    let initialCount = getDeterministicSeed(pid);
    try {
      const cached = sessionStorage.getItem(`live_viewers_${pid}`);
      if (cached) {
        const parsed = parseInt(cached, 10);
        if (!isNaN(parsed) && parsed >= MIN_VIEWERS && parsed <= MAX_VIEWERS) {
          initialCount = parsed;
        }
      }
    } catch {}

    setCount(initialCount);
    lastSocketUpdateRef.current = Date.now();

    // 1. Connect and join room via Socket.IO
    let socket = null;
    try {
      socket = getSharedSocket();
      if (!socket.connected) {
        socket.connect();
      }

      const handleUpdate = (data) => {
        if (!data || String(data.productId).trim() !== pid) return;
        const newCount = Number(data.count);
        if (!isNaN(newCount) && newCount >= MIN_VIEWERS && newCount <= MAX_VIEWERS) {
          lastSocketUpdateRef.current = Date.now();
          setCount(newCount);
          setHasUpdated(true);
          try {
            sessionStorage.setItem(`live_viewers_${pid}`, String(newCount));
          } catch {}
        }
      };

      socket.on('live_viewers_update', handleUpdate);
      socket.emit('join_product', { productId: pid });

      // 2. Fallback / supplementary organic ticker
      // If socket stops transmitting or network disconnects, continue smooth realistic random walk
      const scheduleLocalTick = () => {
        const delay = Math.floor(4500 + Math.random() * 3500); // 4.5s - 8s
        localTimerRef.current = setTimeout(() => {
          const timeSinceSocket = Date.now() - lastSocketUpdateRef.current;
          // Only step locally if socket hasn't reported in over 8 seconds
          if (timeSinceSocket >= 8000) {
            setCount((prev) => {
              const next = getNextNaturalCount(prev);
              try {
                sessionStorage.setItem(`live_viewers_${pid}`, String(next));
              } catch {}
              setHasUpdated(true);
              return next;
            });
          }
          scheduleLocalTick();
        }, delay);
      };

      scheduleLocalTick();

      return () => {
        if (socket) {
          socket.off('live_viewers_update', handleUpdate);
          socket.emit('leave_product', { productId: pid });
        }
        if (localTimerRef.current) {
          clearTimeout(localTimerRef.current);
        }
      };
    } catch (err) {
      console.warn('Socket connection error, running local viewer simulation:', err);
      // Run local simulation completely
      const interval = setInterval(() => {
        setCount((prev) => {
          const next = getNextNaturalCount(prev);
          setHasUpdated(true);
          return next;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [pid]);

  // Flash highlight animation reset
  useEffect(() => {
    if (!hasUpdated) return;
    const t = setTimeout(() => setHasUpdated(false), 800);
    return () => clearTimeout(t);
  }, [hasUpdated, count]);

  return { count, hasUpdated };
}
