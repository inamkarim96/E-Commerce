import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith('/api')
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  : (import.meta.env.VITE_API_URL || '');

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect if there's a user, or we could connect anonymously
    // But since events are mostly user/admin specific, connecting always is fine too
    socketRef.current = io(BASE_URL, {
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      
      if (user) {
        socket.emit('join', {
          userId: user.id || user.uid,
          role: user.role
        });
      }
    });

    socket.on('NEW_ORDER', (data) => {
      toast.success(`📦 ${data.message}`, {
        duration: 5000,
        position: 'top-right',
      });
      // Optionally trigger a refetch or update a store here
    });

    socket.on('ORDER_STATUS_UPDATE', (data) => {
      toast.success(`🔄 ${data.message}`, {
        duration: 5000,
        position: 'top-right',
      });
      // Optionally trigger a refetch or update a store here
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  return socketRef.current;
};

export default useSocket;
