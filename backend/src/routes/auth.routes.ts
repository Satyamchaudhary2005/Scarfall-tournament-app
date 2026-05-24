import { Router } from 'express';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  googleAuth,
  discordAuth,
  discordTokenProfile,
  supabaseAuth,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/supabase', supabaseAuth);
router.post('/oauth/google', googleAuth);
router.post('/oauth/discord', discordAuth);
router.post('/discord/profile', discordTokenProfile);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);

export default router;
