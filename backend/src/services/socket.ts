import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../middleware/auth';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Auth middleware for socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(token as string, config.jwt.secret) as JwtPayload;
        socket.userId = decoded.userId;
      }
      next();
    } catch {
      // Allow unauthenticated connections (limited features)
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Client connected: ${socket.id}${socket.userId ? ` (user: ${socket.userId})` : ''}`);

    // Join user-specific room for private notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join tournament rooms for live updates
    socket.on('join:tournament', (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on('leave:tournament', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    // Stream setup collaborative editing
    socket.on('stream:join', () => {
      socket.join('stream:setup');
      const count = io.sockets.adapter.rooms.get('stream:setup')?.size || 0;
      console.log(`[stream] Socket ${socket.id} joined stream:setup (${count} users in room)`);
    });

    socket.on('stream:leave', () => {
      socket.leave('stream:setup');
      console.log(`[stream] Socket ${socket.id} left stream:setup`);
    });

    socket.on('stream:state-update', (data: { scenes: any[] }) => {
      const count = io.sockets.adapter.rooms.get('stream:setup')?.size || 0;
      console.log(`[stream] State update from ${socket.id}, broadcasting to ${count - 1} others in room`);
      socket.broadcast.to('stream:setup').emit('stream:state-update', data);
    });

    // Handle reaction triggers from admin
    socket.on('reaction:trigger', (data: { type: string }) => {
      const validTypes = ['confetti', 'fireworks', 'hearts', 'stars', 'emoji_rain'];
      if (validTypes.includes(data.type)) {
        console.log(`Reaction triggered: ${data.type} by ${socket.userId || 'unknown'}`);
        io.emit('reaction:play', { type: data.type, triggeredBy: socket.userId });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit helpers
export const emitTournamentUpdate = (tournamentId: string, data: any) => {
  io.to(`tournament:${tournamentId}`).emit('tournament:update', data);
};

export const emitLeaderboardUpdate = (data: any) => {
  io.emit('leaderboard:update', data);
};

export const emitNotification = (userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

export const emitTournamentStatusChange = (tournamentId: string, status: string) => {
  io.to(`tournament:${tournamentId}`).emit('tournament:status', { tournamentId, status });
};

export const emitReaction = (reaction: { type: string; triggeredBy?: string }) => {
  io.emit('reaction:play', reaction);
};
