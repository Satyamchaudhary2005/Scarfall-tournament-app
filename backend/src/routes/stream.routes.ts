import { Router } from 'express';
import { saveScenes, getScenes } from '../controllers/stream.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getScenes);
router.post('/', authenticate, requireRole('ADMIN'), saveScenes);

export default router;
