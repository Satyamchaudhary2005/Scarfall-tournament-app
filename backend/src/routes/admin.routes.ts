import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  banUser,
  getReports,
  resolveReport,
  getClans,
  deleteClan,
  updateTournamentStatus,
  deleteTournament,
  getTournamentWithRegistrations,
  updateUserRole,
  deleteUser,
  adjustWalletBalance,
  broadcastNotification,
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', getDashboardStats);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Tournament management
router.patch('/tournaments/:id/status', updateTournamentStatus);
router.delete('/tournaments/:id', deleteTournament);
router.get('/tournaments/:id', getTournamentWithRegistrations);

// Clan management
router.get('/clans', getClans);
router.delete('/clans/:id', deleteClan);

// Reports
router.get('/reports', getReports);
router.patch('/reports/:id/resolve', resolveReport);

// Wallet
router.post('/wallet/adjust', adjustWalletBalance);

// Notifications
router.post('/notifications/broadcast', broadcastNotification);

export default router;
