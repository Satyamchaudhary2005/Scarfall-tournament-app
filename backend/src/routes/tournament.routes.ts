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
  createRound,
  updateRoundStatus,
  updateRoundScores,
  getScoreboard,
  deleteRound,
  manualRegisterParticipant,
  removeParticipant,
} from '../controllers/tournament.controller';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getTournaments);
router.get('/live', getLiveTournaments);
router.get('/my-registrations', authenticate, getMyRegistrations);
router.get('/my-tournaments', authenticate, requireRole('ORGANIZER', 'ADMIN'), getMyTournaments);
router.get('/:id', optionalAuth, getTournament);
router.get('/:id/scoreboard', optionalAuth, getScoreboard);
router.post('/', authenticate, requireRole('ORGANIZER', 'ADMIN'), createTournament);
router.patch('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateTournament);
router.delete('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), deleteHostedTournament);
router.post('/:id/register', authenticate, registerForTournament);
router.post('/:id/clan-register', authenticate, registerClanForTournament);
router.delete('/:id/register', authenticate, unregisterFromTournament);
router.post('/:id/participants/manual', authenticate, requireRole('ORGANIZER', 'ADMIN'), manualRegisterParticipant);
router.delete('/:id/participants/:registrationId', authenticate, requireRole('ORGANIZER', 'ADMIN'), removeParticipant);
router.patch('/:id/room', authenticate, requireRole('ORGANIZER', 'ADMIN'), setRoomCredentials);
router.post('/:id/rounds', authenticate, requireRole('ORGANIZER', 'ADMIN'), createRound);
router.patch('/:id/rounds/:roundId/status', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateRoundStatus);
router.patch('/:id/rounds/:roundId/scores', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateRoundScores);
router.delete('/:id/rounds/:roundId', authenticate, requireRole('ORGANIZER', 'ADMIN'), deleteRound);
router.post('/cleanup/old', authenticate, requireRole('ORGANIZER', 'ADMIN'), cleanupOldTournaments);

export default router;
