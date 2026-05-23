'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { connectSocket, disconnectSocket } from '@/services/socket';
import toast from 'react-hot-toast';

export function useSocket() {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      const socket = connectSocket(token);

      socket.on('notification:new', (notification: any) => {
        toast(notification.title || notification.message, {
          icon: '🔔',
          duration: 5000,
        });
      });

      socket.on('tournament:status', (data: any) => {
        toast(`Tournament status updated: ${data.status}`, {
          icon: '🏆',
        });
      });

      return () => {
        socket.off('notification:new');
        socket.off('tournament:status');
      };
    } else {
      disconnectSocket();
    }
  }, [token]);

  import { getSocket } from '@/services/socket';

const emit = useCallback((event: string, data?: any) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  return { emit };
}
