import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { config } from './config';
import { initializeSocket } from './services/socket';
import { runCleanup } from './controllers/tournament.controller';
import { startDailyFreeTournamentScheduler } from './services/dailyFreeTournaments';

// Route imports
import authRoutes from './routes/auth.routes';
import tournamentRoutes from './routes/tournament.routes';
import clanRoutes from './routes/clan.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import walletRoutes from './routes/wallet.routes';
import stageRoutes from './routes/stage.routes';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const normalizeUrl = (url: string) => url.replace(/[.\/\s]+$/, '');
    const allowed = normalizeUrl(config.frontendUrl);
    if (!origin || normalizeUrl(origin) === allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.isDev) {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', stageRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Validate required env vars
if (!config.razorpay.keyId || !config.razorpay.keySecret) {
  console.warn('\n⚠️  WARNING: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not set.');
  console.warn('   Wallet deposits via Razorpay will fail with 500 errors.\n');
}

// Start server
httpServer.listen(config.port, () => {
  console.log(`\n🎮 ScarFall Esports API Server`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Frontend URL: ${config.frontendUrl}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);
});

// Auto-cleanup completed tournaments every hour
runCleanup().catch((err) => console.error('Initial cleanup error:', err));
setInterval(() => {
  runCleanup().catch((err) => console.error('Auto cleanup error:', err));
}, 60 * 60 * 1000);

// Daily free tournament scheduler (marketing)
startDailyFreeTournamentScheduler().catch((err) =>
  console.error('[DailyFreeTournaments] Scheduler init error:', err)
);

export default app;
