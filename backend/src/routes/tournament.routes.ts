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
} from '../controllers/tournament.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getTournaments);
router.get('/live', getLiveTournaments);
router.get('/my-registrations', authenticate, getMyRegistrations);
router.get('/my-tournaments', authenticate, getMyTournaments);
router.get('/:id', optionalAuth, getTournament);
router.post('/', authenticate, createTournament);
router.patch('/:id', authenticate, updateTournament);
router.delete('/:id', authenticate, deleteHostedTournament);
router.post('/:id/register', authenticate, registerForTournament);
router.post('/:id/clan-register', authenticate, registerClanForTournament);
router.delete('/:id/register', authenticate, unregisterFromTournament);
router.post('/cleanup/old', authenticate, cleanupOldTournaments);

export default router;
