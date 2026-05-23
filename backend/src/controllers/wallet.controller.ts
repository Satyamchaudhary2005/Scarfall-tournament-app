import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: req.user!.id },
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
      });
    }

    res.json({ wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: req.user!.id } });
    }

    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          type: 'DEPOSIT',
          amount,
          description: `Deposited ₹${amount}`,
          status: 'COMPLETED',
          walletId: wallet.id,
        },
      }),
    ]);

    res.json({ message: 'Deposit successful', wallet: updatedWallet });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const withdraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet || wallet.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.transaction.create({
        data: {
          type: 'WITHDRAW',
          amount,
          description: `Withdrew ₹${amount}`,
          status: 'COMPLETED',
          walletId: wallet.id,
        },
      }),
    ]);

    res.json({ message: 'Withdrawal successful', wallet: updatedWallet });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      res.json({ transactions: [] });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
