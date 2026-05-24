import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWallet, deposit, withdraw, getTransactions } from '../controllers/wallet.controller';
import { createOrder, verifyPayment } from '../controllers/razorpay.controller';

const router = Router();

router.use(authenticate);

router.get('/', getWallet);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.get('/transactions', getTransactions);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

export default router;
