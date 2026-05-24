import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { paginate } from '../utils/helpers';
import { emitNotification } from '../services/socket';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalClans,
      totalTournaments,
      totalMatches,
      liveTournaments,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.clan.count(),
      prisma.tournament.count(),
      prisma.user.aggregate({ _sum: { matchesPlayed: true } }),
      prisma.tournament.count({ where: { status: 'LIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalClans,
        totalTournaments,
        totalMatches: totalMatches._sum.matchesPlayed || 0,
        liveTournaments,
        pendingReports,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page: pageStr, limit: limitStr } = req.query;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr as string) : 1,
      Math.min(limitStr ? parseInt(limitStr as string) : 20, 50)
    );

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          points: true,
          matchesPlayed: true,
          wins: true,
          createdAt: true,
          clan: { select: { id: true, name: true, tag: true } },
          _count: { select: { reports: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role === 'ADMIN') {
      res.status(400).json({ error: 'Cannot ban another admin' });
      return;
    }

    // Ban by setting to MODERATOR as placeholder for banned status
    // In production, add a 'banned' boolean field
    await prisma.user.update({
      where: { id },
      data: {
        role: user.role === 'USER' ? 'MODERATOR' : 'USER',
      },
    });

    res.json({ message: `User ${user.username} has been ${user.role === 'USER' ? 'suspended' : 'reinstated'}` });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page: pageStr, limit: limitStr } = req.query;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr as string) : 1,
      Math.min(limitStr ? parseInt(limitStr as string) : 20, 50)
    );

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, username: true } },
          reported: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resolveReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, action } = req.body;

    const validStatuses = ['REVIEWED', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status. Use: REVIEWED, RESOLVED, or DISMISSED' });
      return;
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    await prisma.report.update({
      where: { id },
      data: { status },
    });

    if (action === 'BAN' && status === 'RESOLVED') {
      await prisma.user.update({
        where: { id: report.reportedId },
        data: { role: 'MODERATOR' },
      });
    }

    res.json({ message: `Report ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page: pageStr, limit: limitStr } = req.query;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr as string) : 1,
      Math.min(limitStr ? parseInt(limitStr as string) : 20, 50)
    );

    const where: any = {};
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [clans, total] = await Promise.all([
      prisma.clan.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          leader: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
      }),
      prisma.clan.count({ where }),
    ]);

    res.json({
      clans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get admin clans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteClan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const clan = await prisma.clan.findUnique({ where: { id } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    await prisma.user.updateMany({
      where: { clanId: id },
      data: { clanId: null, clanRole: null },
    });

    // Delete related clan data
    await prisma.clanActivityLog.deleteMany({ where: { clanId: id } });
    await prisma.clanInvite.deleteMany({ where: { clanId: id } });
    await prisma.clanJoinRequest.deleteMany({ where: { clanId: id } });
    await prisma.tournamentRegistration.deleteMany({ where: { clanId: id } });

    await prisma.clan.delete({ where: { id } });

    res.json({ message: 'Clan disbanded successfully' });
  } catch (error) {
    console.error('Delete clan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Tournament Admin ──────────────────────────────────────────────────────────

export const updateTournamentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['UPCOMING', 'REGISTRATION_OPEN', 'LIVE', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status. Use: UPCOMING, REGISTRATION_OPEN, LIVE, COMPLETED, or CANCELLED' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        status,
      ...(status === 'COMPLETED' && !tournament.endsAt ? { endsAt: new Date() } : {}),
      },
      include: {
        host: { select: { id: true, username: true } },
        _count: { select: { registrations: true } },
      },
    });

    // Notify all registrants about status change
    if (['LIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId: id },
        select: { userId: true },
      });

      for (const reg of registrations) {
        const notification = await prisma.notification.create({
          data: {
            type: 'TOURNAMENT_UPDATE',
            title: `Tournament ${status.toLowerCase()}`,
            message: `"${tournament.title}" is now ${status.toLowerCase()}`,
            link: `/tournaments/${id}`,
            recipientId: reg.userId,
          },
        });
        try {
          emitNotification(reg.userId, notification);
        } catch {
          // Socket may not be initialized
        }
      }
    }

    res.json({ message: `Tournament status updated to ${status}`, tournament: updated });
  } catch (error) {
    console.error('Update tournament status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Delete registrations first
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: id } });
    await prisma.tournament.delete({ where: { id } });

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTournamentWithRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, username: true, avatarUrl: true } },
        registrations: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, clanId: true, clanRole: true } },
            clan: { select: { id: true, name: true, tag: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    res.json({ tournament });
  } catch (error) {
    console.error('Get admin tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['USER', 'MODERATOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role. Use: USER, MODERATOR, or ADMIN' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent self-demotion from ADMIN
    if (id === req.user!.id && role !== 'ADMIN') {
      res.status(400).json({ error: 'You cannot demote yourself. Ask another admin.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        points: true,
        matchesPlayed: true,
        wins: true,
        createdAt: true,
        clan: { select: { id: true, name: true, tag: true } },
      },
    });

    // Notify user about role change
    const notification = await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Role Updated',
        message: `Your role has been changed to ${role}`,
        recipientId: id,
      },
    });

    try {
      emitNotification(id, notification);
    } catch {
      // Socket may not be initialized
    }

    res.json({ message: `User ${targetUser.username} role updated to ${role}`, user: updated });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      res.status(400).json({ error: 'You cannot delete your own account via admin panel' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.role === 'ADMIN') {
      res.status(400).json({ error: 'Cannot delete another admin' });
      return;
    }

    // Clean up user data
    await prisma.tournamentRegistration.deleteMany({ where: { userId: id } });
    await prisma.clanInvite.deleteMany({
      where: { OR: [{ inviterId: id }, { inviteeId: id }] },
    });
    await prisma.clanJoinRequest.deleteMany({ where: { userId: id } });
    await prisma.clanActivityLog.deleteMany({
      where: { OR: [{ actorId: id }, { targetId: id }] },
    });
    await prisma.notification.deleteMany({
      where: { OR: [{ recipientId: id }, { senderId: id }] },
    });
    await prisma.report.deleteMany({
      where: { OR: [{ reporterId: id }, { reportedId: id }] },
    });
    await prisma.leaderboardEntry.deleteMany({ where: { userId: id } });

    // Remove from clan if in one
    if (targetUser.clanId) {
      const isLeader = targetUser.clanRole === 'LEADER';
      if (isLeader) {
        // Disband the clan
        const clan = await prisma.clan.findUnique({ where: { id: targetUser.clanId } });
        if (clan) {
          await prisma.user.updateMany({
            where: { clanId: targetUser.clanId },
            data: { clanId: null, clanRole: null },
          });
          await prisma.clan.delete({ where: { id: targetUser.clanId } });
        }
      }
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: `User ${targetUser.username} has been deleted` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Wallet Management ────────────────────────────────────────────────────────

export const adjustWalletBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || typeof amount !== 'number' || amount === 0) {
      res.status(400).json({ error: 'userId and a non-zero amount are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Ensure wallet exists
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }

    if (amount < 0 && wallet.balance + amount < 0) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          type: amount > 0 ? 'DEPOSIT' : 'WITHDRAW',
          amount: Math.abs(amount),
          description: description || `Admin ${amount > 0 ? 'deposit' : 'withdrawal'}`,
          status: 'COMPLETED',
          walletId: wallet.id,
        },
      }),
    ]);

    // Notify user
    const notification = await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: amount > 0 ? 'Wallet Deposit' : 'Wallet Withdrawal',
        message: `Admin ${amount > 0 ? 'added' : 'deducted'} ₹${Math.abs(amount).toLocaleString()} ${amount > 0 ? 'to' : 'from'} your wallet${description ? `: ${description}` : ''}`,
        recipientId: userId,
      },
    });
    try {
      const { emitNotification } = await import('../services/socket');
      emitNotification(userId, notification);
    } catch {
      // Socket may not be initialized
    }

    res.json({
      message: `₹${Math.abs(amount).toLocaleString()} ${amount > 0 ? 'added to' : 'deducted from'} ${user.username}'s wallet`,
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error('Adjust wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Broadcast Notifications ──────────────────────────────────────────────────

export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message, type, link } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }

    // Get all user IDs
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    // Create notifications for all users (in batches to avoid performance issues)
    const notificationType = type || 'SYSTEM';
    const notificationData = users.map((user) => ({
      type: notificationType,
      title,
      message,
      link: link || null,
      recipientId: user.id,
      senderId: req.user!.id,
    }));

    // Batch create in chunks of 50
    const batchSize = 50;
    for (let i = 0; i < notificationData.length; i += batchSize) {
      const batch = notificationData.slice(i, i + batchSize);
      await prisma.notification.createMany({ data: batch });
    }

    // Emit real-time to connected users (first 50 to avoid overloading)
    for (const user of users.slice(0, 50)) {
      try {
        emitNotification(user.id, {
          id: '',
          type: notificationType,
          title,
          message,
          link: link || null,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Socket may not be initialized
      }
    }

    res.json({
      message: `Broadcast sent to ${users.length} users`,
      recipientCount: users.length,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
