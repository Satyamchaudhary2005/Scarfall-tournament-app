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
  getLiveTournaments,
} from '../controllers/tournament.controller';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getTournaments);
router.get('/live', getLiveTournaments);
router.get('/my-registrations', authenticate, getMyRegistrations);
router.get('/:id', optionalAuth, getTournament);
router.post('/', authenticate, requireRole('ADMIN', 'MODERATOR'), createTournament);
router.patch('/:id', authenticate, requireRole('ADMIN', 'MODERATOR'), updateTournament);
router.post('/:id/register', authenticate, registerForTournament);
router.post('/:id/clan-register', authenticate, registerClanForTournament);
router.delete('/:id/register', authenticate, unregisterFromTournament);

export default router;
