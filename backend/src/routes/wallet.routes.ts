import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWallet, deposit, withdraw, getTransactions } from '../controllers/wallet.controller';

const router = Router();

router.use(authenticate);

router.get('/', getWallet);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.get('/transactions', getTransactions);

export default router;
