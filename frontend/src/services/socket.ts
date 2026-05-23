import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/utils';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (token: string) => {
  const s = getSocket(token);
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const joinTournamentRoom = (tournamentId: string) => {
  socket?.emit('join:tournament', tournamentId);
};

export const leaveTournamentRoom = (tournamentId: string) => {
  socket?.emit('leave:tournament', tournamentId);
};
