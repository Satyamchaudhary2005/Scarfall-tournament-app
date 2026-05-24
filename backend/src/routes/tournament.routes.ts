import { Router } from 'express';
import {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  registerForTournament,
  registerClanForTournament,
  unregisterFromTournament,
  getMyRegistrations,
  getMyTournaments,
  deleteHostedTournament,
  cleanupOldTournaments,
  getLiveTournaments,
  setRoomCredentials,
} from '../controllers/tournament.controller';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getTournaments);
router.get('/live', getLiveTournaments);
router.get('/my-registrations', authenticate, getMyRegistrations);
router.get('/my-tournaments', authenticate, requireRole('ORGANIZER', 'ADMIN'), getMyTournaments);
router.get('/:id', optionalAuth, getTournament);
router.post('/', authenticate, requireRole('ORGANIZER', 'ADMIN'), createTournament);
router.patch('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateTournament);
router.delete('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), deleteHostedTournament);
router.post('/:id/register', authenticate, registerForTournament);
router.post('/:id/clan-register', authenticate, registerClanForTournament);
router.delete('/:id/register', authenticate, unregisterFromTournament);
router.patch('/:id/room', authenticate, requireRole('ORGANIZER', 'ADMIN'), setRoomCredentials);
router.post('/cleanup/old', authenticate, requireRole('ORGANIZER', 'ADMIN'), cleanupOldTournaments);

export default router;
