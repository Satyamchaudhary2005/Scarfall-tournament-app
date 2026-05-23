import { Router } from 'express';
import {
  getGlobalLeaderboard,
  getSeasonalLeaderboard,
  getClanLeaderboard,
} from '../controllers/leaderboard.controller';

const router = Router();

router.get('/global', getGlobalLeaderboard);
router.get('/seasonal', getSeasonalLeaderboard);
router.get('/clan', getClanLeaderboard);

export default router;
