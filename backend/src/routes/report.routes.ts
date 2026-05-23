import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { createReportSchema } from '../utils/validators';
import { Request, Response } from 'express';

const router = Router();

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createReportSchema.parse(req.body);

    if (data.reportedId === req.user!.id) {
      res.status(400).json({ error: 'Cannot report yourself' });
      return;
    }

    const reportedUser = await prisma.user.findUnique({
      where: { id: data.reportedId },
    });
    if (!reportedUser) {
      res.status(404).json({ error: 'User to report not found' });
      return;
    }

    const report = await prisma.report.create({
      data: {
        reason: data.reason,
        description: data.description,
        reporterId: req.user!.id,
        reportedId: data.reportedId,
      },
      include: {
        reported: { select: { id: true, username: true } },
      },
    });

    res.status(201).json({ message: 'Report submitted', report });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
