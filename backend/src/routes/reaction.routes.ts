import { Router } from 'express';
import { getLatestReaction } from '../controllers/reaction.controller';

const router = Router();

router.get('/latest', getLatestReaction);

export default router;
