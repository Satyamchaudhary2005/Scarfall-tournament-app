import { Router } from 'express';
import {
  getPresets,
  getStageTypes,
  getStages,
  saveStages,
  generateFromStages,
  updateStage,
  deleteStage,
} from '../controllers/stage.controller';
import {
  getStageMatches,
  createStageMatch,
  generateStageMatches,
  updateStageMatch,
  deleteStageMatch,
  updateStageScores,
  getStageBracket,
  advanceTeams,
} from '../controllers/stage-match.controller';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();

// Public preset/type endpoints
router.get('/presets', getPresets);
router.get('/types', getStageTypes);

// Tournament-specific stage management (authenticated)
router.get('/:id/stages', authenticate, getStages);
router.post('/:id/stages', authenticate, requireRole('ORGANIZER', 'ADMIN'), saveStages);
router.post('/:id/stages/generate', authenticate, requireRole('ORGANIZER', 'ADMIN'), generateFromStages);
router.put('/:tournamentId/stages/:stageId', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateStage);
router.delete('/:tournamentId/stages/:stageId', authenticate, requireRole('ORGANIZER', 'ADMIN'), deleteStage);

// Stage Match Management (must be before the bracket route)
router.get('/:id/stages/:stageId/matches', authenticate, getStageMatches);
router.post('/:id/stages/:stageId/matches', authenticate, requireRole('ORGANIZER', 'ADMIN'), createStageMatch);
router.post('/:id/stages/:stageId/matches/generate', authenticate, requireRole('ORGANIZER', 'ADMIN'), generateStageMatches);
router.patch('/:id/stages/:stageId/matches/:matchId', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateStageMatch);
router.delete('/:id/stages/:stageId/matches/:matchId', authenticate, requireRole('ORGANIZER', 'ADMIN'), deleteStageMatch);
router.patch('/:id/stages/:stageId/matches/:matchId/scores', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateStageScores);

// Stage Bracket & Progression
router.get('/:id/stages/:stageId/bracket', optionalAuth, getStageBracket);
router.post('/:id/stages/:stageId/advance', authenticate, requireRole('ORGANIZER', 'ADMIN'), advanceTeams);

export default router;
