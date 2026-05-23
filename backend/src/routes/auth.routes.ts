import { Router } from 'express';
import {
  signup,
  login,
  googleAuth,
  discordAuth,
  supabaseAuth,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/supabase', supabaseAuth);
router.post('/oauth/google', googleAuth);
router.post('/oauth/discord', discordAuth);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);

export default router;
