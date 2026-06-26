import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { clearApiCache } from '../api/axios';
import useNotificationStore from '../store/useNotificationStore';

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith('/api')
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  : (import.meta.env.VITE_API_URL || '');

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

/**
 * SocketProvider lives outside the route tree so that the socket connection
 * is NEVER destroyed by page navigations. The `key={location.pathname}` on
 * <Routes> causes every component inside it to remount on each navigation,
 * which would disconnect and reconnect the socket if useSocket lived there.
 *
 * By putting the socket here (above <Routes>), the connection is stable for
 * the entire session.
 */
export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Initialize the socket exactly once
  useEffect(() => {
    const socket = io(BASE_URL, {
      withCredentials: true,
      // Reconnect automatically if the server restarts
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] connected:', socket.id);
    });

    socket.on('NEW_ORDER', (data) => {
      toast.success(`📦 ${data.message}`, {
        duration: 5000,
        position: 'top-right',
      });
      useNotificationStore.getState().incrementNewOrders();
      clearApiCache();
      window.dispatchEvent(new CustomEvent('socket:order_update', { detail: data }));
    });

    socket.on('ORDER_STATUS_UPDATE', (data) => {
      toast.success(`🔄 ${data.message}`, {
        duration: 5000,
        position: 'top-right',
      });
      clearApiCache();
      window.dispatchEvent(new CustomEvent('socket:order_update', { detail: data }));
    });

    socket.on('disconnect', () => {
      console.log('[Socket] disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []); // ← empty: socket is created once and never recreated

  // Whenever the user changes (login / logout), update which room we're in
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const joinRooms = () => {
      if (!user) return;
      if (user.id) {
        socket.emit('join', { userId: user.id, role: user.role });
      }
      if (user.uid && user.uid !== user.id) {
        socket.emit('join', { userId: user.uid, role: user.role });
      }
    };

    // If already connected, join immediately; otherwise wait for connect event
    if (socket.connected) {
      joinRooms();
    } else {
      socket.once('connect', joinRooms);
    }

    return () => {
      socket.off('connect', joinRooms);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
