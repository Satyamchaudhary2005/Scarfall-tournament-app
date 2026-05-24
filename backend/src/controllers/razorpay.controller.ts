import { Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { prisma } from '../config/database';

const RZP_API = 'https://api.razorpay.com/v1';
const auth = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');

async function razorpayPost(path: string, body: any): Promise<any> {
  const res = await fetch(`${RZP_API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error?.description || `Razorpay API error: ${res.status}`);
  }
  return res.json();
}

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      res.status(400).json({ error: 'Amount must be at least 100 paise (₹1)' });
      return;
    }

    const order = await razorpayPost('/orders', {
      amount: Math.round(amount),
      currency: 'INR',
      receipt: `receipt_${req.user!.id}_${Date.now()}`,
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      res.status(400).json({ error: 'Missing payment details' });
      return;
    }

    const generatedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      res.status(400).json({ error: 'Payment verification failed - signature mismatch' });
      return;
    }

    const orderRes = await fetch(`${RZP_API}/orders/${razorpay_order_id}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!orderRes.ok) {
      res.status(500).json({ error: 'Failed to fetch order details' });
      return;
    }
    const orderData: any = await orderRes.json();
    const amountPaise = orderData.amount_paid || orderData.amount;

    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: req.user!.id } });
    }

    const amountRupees = amountPaise / 100;

    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amountRupees } },
      }),
      prisma.transaction.create({
        data: {
          type: 'DEPOSIT',
          amount: amountRupees,
          description: `Deposited ₹${amountRupees} via Razorpay`,
          status: 'COMPLETED',
          walletId: wallet.id,
        },
      }),
    ]);

    res.json({ message: 'Payment verified and wallet credited', wallet: updatedWallet });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
