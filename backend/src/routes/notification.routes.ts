import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

router.use(authenticate);

// Get all notifications for the current user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: req.user!.id, read: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark single notification as read
router.patch('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: req.user!.id },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user!.id, read: false },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
