import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createClanSchema, sendInviteSchema } from '../utils/validators';
import { paginate } from '../utils/helpers';
import { emitNotification } from '../services/socket';

// ─── Activity Log Helper ──────────────────────────────────────────────────────

async function createActivityLog(params: {
  clanId: string;
  action: string;
  actorId: string;
  targetId?: string;
  details?: string;
}) {
  return prisma.clanActivityLog.create({
    data: params,
  });
}

export const getClans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page: pageStr, limit: limitStr } = req.query;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr as string) : 1,
      Math.min(limitStr ? parseInt(limitStr as string) : 20, 50)
    );

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { tag: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [clans, total] = await Promise.all([
      prisma.clan.findMany({
        where,
        skip,
        take,
        orderBy: { points: 'desc' },
        include: {
          leader: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.clan.count({ where }),
    ]);

    res.json({
      clans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get clans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        leader: {
          select: { id: true, username: true, avatarUrl: true, clanRole: true },
        },
        members: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            clanRole: true,
            points: true,
            kills: true,
            deaths: true,
            wins: true,
          },
          orderBy: { points: 'desc' },
        },
      },
    });

    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    res.json({ clan });
  } catch (error) {
    console.error('Get clan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createClan = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createClanSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { clanId: true },
    });

    if (user?.clanId) {
      res.status(400).json({ error: 'You are already in a clan. Leave it first to create a new one.' });
      return;
    }

    // Check if the user is already the leader of another clan (data inconsistency guard)
    const existingAsLeader = await prisma.clan.findUnique({
      where: { leaderId: req.user!.id },
      select: { id: true, name: true },
    });
    if (existingAsLeader) {
      res.status(400).json({
        error: 'You are already the leader of another clan. Leave or disband it first.',
      });
      return;
    }

    const existingName = await prisma.clan.findUnique({
      where: { name: data.name },
    });
    if (existingName) {
      res.status(409).json({ error: 'A clan with this name already exists' });
      return;
    }

    const existingTag = await prisma.clan.findUnique({
      where: { tag: data.tag },
    });
    if (existingTag) {
      res.status(409).json({ error: 'A clan with this tag already exists' });
      return;
    }

    const clan = await prisma.clan.create({
      data: {
        ...data,
        leaderId: req.user!.id,
      },
    });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        clanId: clan.id,
        clanRole: 'LEADER',
      },
    });

    res.status(201).json({ message: 'Clan created successfully', clan });

    // Log clan creation
    try {
      await createActivityLog({
        clanId: clan.id,
        action: 'CLAN_CREATED',
        actorId: req.user!.id,
        details: JSON.stringify({ clanName: clan.name, clanTag: clan.tag }),
      });
    } catch {
      // Non-critical
    }
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    // Log Prisma error codes for better diagnostics
    if (error?.code && error?.code.startsWith('P')) {
      console.error('Create clan Prisma error:', error.code, error?.meta);
    } else {
      console.error('Create clan error:', error);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinClan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { clanId: true },
    });

    if (user?.clanId) {
      res.status(400).json({ error: 'You are already in a clan' });
      return;
    }

    // Check for an accepted invite — this endpoint only works via an accepted invite now
    const acceptedInvite = await prisma.clanInvite.findFirst({
      where: {
        clanId: id,
        inviteeId: req.user!.id,
        status: 'ACCEPTED',
      },
    });

    if (!acceptedInvite) {
      res.status(403).json({ error: 'You must be invited to join this clan. Ask a clan leader to send you an invite.' });
      return;
    }

    // Enforce max members limit
    const maxMembers = clan.maxMembers || 15;
    const memberCount = (clan as any)._count?.members || 0;
    if (memberCount >= maxMembers) {
      res.status(400).json({ error: `Clan is full (max ${maxMembers} members)` });
      return;
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        clanId: id,
        clanRole: 'MEMBER',
      },
    });

    res.json({ message: `Joined clan ${clan.name}` });
  } catch (error) {
    console.error('Join clan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaveClan = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { clanId: true, clanRole: true, username: true },
    });

    if (!user?.clanId) {
      res.status(400).json({ error: 'You are not in a clan' });
      return;
    }

    const clanId = user.clanId;

    if (user.clanRole === 'LEADER') {
      const memberCount = await prisma.user.count({
        where: { clanId },
      });

      if (memberCount > 1) {
        res.status(400).json({
          error: 'Transfer leadership before leaving, or disband the clan',
        });
        return;
      }

      // Log disband before deletion
      try {
        const clan = await prisma.clan.findUnique({ where: { id: clanId }, select: { name: true, tag: true } });
        if (clan) {
          await createActivityLog({
            clanId,
            action: 'CLAN_DISBANDED',
            actorId: req.user!.id,
            details: JSON.stringify({ username: user.username, clanName: clan.name }),
          });
        }
      } catch {
        // Non-critical
      }

      await prisma.clan.delete({ where: { id: clanId } });
    } else {
      // Log member leaving
      try {
        await createActivityLog({
          clanId,
          action: 'MEMBER_LEFT',
          actorId: req.user!.id,
          details: JSON.stringify({ username: user.username }),
        });
      } catch {
        // Non-critical
      }
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { clanId: null, clanRole: null },
    });

    res.json({ message: 'Left clan successfully' });
  } catch (error) {
    console.error('Leave clan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateClan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, tag, description, logoUrl, bannerUrl, color } = req.body;

    const clan = await prisma.clan.findUnique({ where: { id } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (clan.leaderId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only clan leader can update clan settings' });
      return;
    }

    // Check name uniqueness if being changed
    if (name !== undefined && name !== clan.name) {
      const existingName = await prisma.clan.findUnique({ where: { name } });
      if (existingName) {
        res.status(409).json({ error: 'A clan with this name already exists' });
        return;
      }
    }

    // Check tag uniqueness if being changed
    if (tag !== undefined && tag !== clan.tag) {
      const existingTag = await prisma.clan.findUnique({ where: { tag } });
      if (existingTag) {
        res.status(409).json({ error: 'A clan with this tag already exists' });
        return;
      }
    }

    const updated = await prisma.clan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(tag !== undefined && { tag }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(color !== undefined && { color }),
      },
    });

    res.json({ message: 'Clan updated', clan: updated });
  } catch (error) {
    console.error('Update clan error:', error);
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

    if (clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can delete the clan' });
      return;
    }

    // Remove all members' clan references
    await prisma.user.updateMany({
      where: { clanId: id },
      data: { clanId: null, clanRole: null },
    });

    // Delete clan invites
    await prisma.clanInvite.deleteMany({
      where: { clanId: id },
    });

    // Delete tournament registrations linked to this clan
    await prisma.tournamentRegistration.deleteMany({
      where: { clanId: id },
    });

    // Delete the clan
    await prisma.clan.delete({ where: { id } });

    res.json({ message: 'Clan deleted successfully' });
  } catch (error) {
    console.error('Delete clan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const transferLeadership = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newLeaderId } = req.body;

    if (!newLeaderId) {
      res.status(400).json({ error: 'New leader ID is required' });
      return;
    }

    const clan = await prisma.clan.findUnique({ where: { id } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only the clan leader can transfer leadership' });
      return;
    }

    // Check that the new leader is a member of the clan
    const newLeader = await prisma.user.findUnique({ where: { id: newLeaderId } });
    if (!newLeader || newLeader.clanId !== id) {
      res.status(400).json({ error: 'Selected user is not a member of this clan' });
      return;
    }

    // Transfer leadership
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user!.id },
        data: { clanRole: 'MEMBER' },
      }),
      prisma.user.update({
        where: { id: newLeaderId },
        data: { clanRole: 'LEADER' },
      }),
      prisma.clan.update({
        where: { id },
        data: { leaderId: newLeaderId },
      }),
    ]);

    // Log leadership transfer
    try {
      const targetUser = await prisma.user.findUnique({ where: { id: newLeaderId }, select: { username: true } });
      await createActivityLog({
        clanId: id,
        action: 'LEADERSHIP_TRANSFERRED',
        actorId: req.user!.id,
        targetId: newLeaderId,
        details: JSON.stringify({ oldLeader: req.user!.username, newLeader: targetUser?.username || 'Unknown' }),
      });
    } catch {
      // Non-critical
    }

    res.json({ message: 'Leadership transferred successfully' });
  } catch (error) {
    console.error('Transfer leadership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const kickMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clanId, userId } = req.params;

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can kick members' });
      return;
    }

    if (userId === clan.leaderId) {
      res.status(400).json({ error: 'Cannot kick yourself. Use leave clan instead.' });
      return;
    }

    const kickedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!kickedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { clanId: null, clanRole: null },
    });

    // Notify the kicked user
    const notification = await prisma.notification.create({
      data: {
        type: 'CLAN_INVITE',
        title: 'Kicked from Clan',
        message: `${req.user!.username} kicked you from ${clan.name} [${clan.tag}]`,
        link: `/clans`,
        recipientId: userId,
        senderId: req.user!.id,
      },
    });

    try {
      emitNotification(userId, notification);
    } catch {
      // Socket may not be initialized
    }

    // Log the kick
    try {
      await createActivityLog({
        clanId,
        action: 'MEMBER_KICKED',
        actorId: req.user!.id,
        targetId: userId,
        details: JSON.stringify({ kickedUsername: kickedUser.username, kickedById: req.user!.id, kickedByUsername: req.user!.username }),
      });
    } catch {
      // Non-critical
    }

    res.json({ message: 'Member kicked from clan' });
  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClanLeaderboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const clans = await prisma.clan.findMany({
      orderBy: { points: 'desc' },
      take: 100,
      include: {
        leader: { select: { id: true, username: true } },
        _count: { select: { members: true } },
      },
    });

    const ranked = clans.map((clan, index) => ({
      ...clan,
      rank: index + 1,
    }));

    res.json({ clans: ranked });
  } catch (error) {
    console.error('Get clan leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Join Request System ───────────────────────────────────────────────────────

// User applies to join a clan
export const applyToJoin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clanId } = req.params;

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { clanId: true },
    });

    if (user?.clanId) {
      res.status(400).json({ error: 'You are already in a clan' });
      return;
    }

    // Check max members
    const memberCount = await prisma.user.count({
      where: { clanId },
    });
    if (memberCount >= (clan.maxMembers || 15)) {
      res.status(400).json({ error: `Clan is full (max ${clan.maxMembers || 15} members)` });
      return;
    }

    // Check for existing request
    const existingRequest = await prisma.clanJoinRequest.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId: req.user!.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        res.status(400).json({ error: 'You already have a pending request to join this clan' });
        return;
      }
      if (existingRequest.status === 'APPROVED') {
        res.status(400).json({ error: 'Your request was already approved. Join the clan to become a member.' });
        return;
      }
      // If rejected, allow re-applying by updating status back to PENDING
      await prisma.clanJoinRequest.update({
        where: { id: existingRequest.id },
        data: { status: 'PENDING' },
      });
    } else {
      await prisma.clanJoinRequest.create({
        data: {
          clanId,
          userId: req.user!.id,
        },
      });
    }

    // Notify the clan leader
    const notification = await prisma.notification.create({
      data: {
        type: 'CLAN_INVITE',
        title: 'Join Request',
        message: `${req.user!.username} wants to join ${clan.name}`,
        link: `/clans/${clanId}`,
        recipientId: clan.leaderId,
      },
    });

    try {
      emitNotification(clan.leaderId, notification);
    } catch {
      // Socket may not be initialized
    }

    res.json({ message: 'Join request sent!' });
  } catch (error) {
    console.error('Apply to join error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get join requests for a clan (leader only)
export const getJoinRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clanId } = req.params;

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can view join requests' });
      return;
    }

    const requests = await prisma.clanJoinRequest.findMany({
      where: { clanId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            points: true,
            kills: true,
            deaths: true,
            wins: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve a join request (leader only)
export const approveJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    const request = await prisma.clanJoinRequest.findUnique({
      where: { id: requestId },
      include: { clan: true, user: { select: { username: true } } },
    }) as any;

    if (!request) {
      res.status(404).json({ error: 'Join request not found' });
      return;
    }

    if (request.clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can approve join requests' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}` });
      return;
    }

    // Check max members
    const memberCount = await prisma.user.count({
      where: { clanId: request.clanId },
    });
    if (memberCount >= (request.clan.maxMembers || 15)) {
      res.status(400).json({ error: `Clan is full (max ${request.clan.maxMembers || 15} members)` });
      return;
    }

    // Approve request and add user to clan
    await prisma.$transaction([
      prisma.clanJoinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      }),
      prisma.user.update({
        where: { id: request.userId },
        data: {
          clanId: request.clanId,
          clanRole: 'MEMBER',
        },
      }),
    ]);

    // Notify the applicant
    const notification = await prisma.notification.create({
      data: {
        type: 'CLAN_INVITE',
        title: 'Request Approved',
        message: `Your request to join ${request.clan.name} has been approved!`,
        recipientId: request.userId,
      },
    });

    try {
      emitNotification(request.userId, notification);
    } catch {
      // Socket may not be initialized
    }

    // Log the approval
    try {
      await createActivityLog({
        clanId: request.clanId,
        action: 'JOIN_REQUEST_APPROVED',
        actorId: req.user!.id,
        targetId: request.userId,
        details: JSON.stringify({ username: request.user.username }),
      });
    } catch {
      // Non-critical
    }

    res.json({ message: `${request.user.username} has been added to the clan` });
  } catch (error) {
    console.error('Approve join request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reject a join request (leader only)
export const rejectJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    const request = await prisma.clanJoinRequest.findUnique({
      where: { id: requestId },
      include: { clan: { select: { leaderId: true } } },
    });

    if (!request) {
      res.status(404).json({ error: 'Join request not found' });
      return;
    }

    if (request.clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can reject join requests' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}` });
      return;
    }

    await prisma.clanJoinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    res.json({ message: 'Join request rejected' });
  } catch (error) {
    console.error('Reject join request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const getClanActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clanId } = req.params;

    const clan = await prisma.clan.findUnique({ where: { id: clanId }, select: { id: true } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    const logs = await prisma.clanActivityLog.findMany({
      where: { clanId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get clan activity logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Invite System ───────────────────────────────────────────────────────────

// Search users by username (for leader to find players to invite)
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q as string, mode: 'insensitive' },
        clanId: null, // Only show users without a clan
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
      take: 10,
    });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send a clan invite (leader only)
export const sendInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clanId } = req.params;
    const { username } = sendInviteSchema.parse(req.body);

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can send invites' });
      return;
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, clanId: true },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.clanId) {
      res.status(400).json({ error: 'User is already in a clan' });
      return;
    }

    if (targetUser.id === req.user!.id) {
      res.status(400).json({ error: 'You cannot invite yourself' });
      return;
    }

    // Check for existing pending invite
    const existingInvite = await prisma.clanInvite.findUnique({
      where: {
        clanId_inviteeId: {
          clanId,
          inviteeId: targetUser.id,
        },
      },
    });

    if (existingInvite) {
      if (existingInvite.status === 'PENDING') {
        res.status(400).json({ error: 'An invite has already been sent to this user' });
        return;
      }
      if (existingInvite.status === 'ACCEPTED') {
        res.status(400).json({ error: 'User is already a member of this clan' });
        return;
      }
      // If declined or cancelled, reactivate
      await prisma.clanInvite.update({
        where: { id: existingInvite.id },
        data: { status: 'PENDING' },
      });
    } else {
      // Create new invite
      await prisma.clanInvite.create({
        data: {
          clanId,
          inviterId: req.user!.id,
          inviteeId: targetUser.id,
        },
      });
    }

    // Create notification for the invitee
    const notification = await prisma.notification.create({
      data: {
        type: 'CLAN_INVITE',
        title: `Clan Invite: ${clan.name}`,
        message: `${req.user!.username} invited you to join ${clan.name} [${clan.tag}]`,
        link: `/clans/invites`,
        recipientId: targetUser.id,
        senderId: req.user!.id,
      },
    });

    // Emit real-time notification
    try {
      emitNotification(targetUser.id, notification);
    } catch {
      // Socket may not be initialized
    }

    res.json({ message: `Invite sent to ${username}` });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Send invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all pending invites for the current user
export const getMyInvites = async (req: Request, res: Response): Promise<void> => {
  try {
    const invites = await prisma.clanInvite.findMany({
      where: {
        inviteeId: req.user!.id,
        status: 'PENDING',
      },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            logoUrl: true,
            color: true,
            points: true,
            _count: { select: { members: true } },
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ invites });
  } catch (error) {
    console.error('Get my invites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all invites for a clan (leader only)
export const getClanInvites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clanId } = req.params;

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can view invites' });
      return;
    }

    const invites = await prisma.clanInvite.findMany({
      where: { clanId },
      include: {
        invitee: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ invites });
  } catch (error) {
    console.error('Get clan invites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept a clan invite
export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inviteId } = req.params;

    const invite = await prisma.clanInvite.findUnique({
      where: { id: inviteId },
      include: { clan: { include: { _count: { select: { members: true } } } } },
    }) as any;

    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }

    if (invite.inviteeId !== req.user!.id) {
      res.status(403).json({ error: 'This invite is not for you' });
      return;
    }

    if (invite.status !== 'PENDING') {
      res.status(400).json({ error: `Invite is already ${invite.status.toLowerCase()}` });
      return;
    }

    // Check if user already in a clan
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { clanId: true },
    });
    if (user?.clanId) {
      res.status(400).json({ error: 'You are already in a clan. Leave it first.' });
      return;
    }

    // Check max members
    const maxMembers = invite.clan.maxMembers || 15;
    const memberCount = invite.clan._count?.members || 0;
    if (memberCount >= maxMembers) {
      res.status(400).json({ error: `Clan is full (max ${maxMembers} members)` });
      return;
    }

    // Accept invite - mark as accepted and update user
    await prisma.$transaction([
      prisma.clanInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' },
      }),
      prisma.user.update({
        where: { id: req.user!.id },
        data: {
          clanId: invite.clanId,
          clanRole: 'MEMBER',
        },
      }),
    ]);

    // Notify the clan leader
    const notification = await prisma.notification.create({
      data: {
        type: 'CLAN_INVITE',
        title: 'Invite Accepted',
        message: `${req.user!.username} has joined ${invite.clan.name}`,
        recipientId: invite.clan.leaderId,
      },
    });

    try {
      emitNotification(invite.clan.leaderId, notification);
    } catch {
      // Socket may not be initialized
    }

    // Log joining the clan
    try {
      await createActivityLog({
        clanId: invite.clanId,
        action: 'MEMBER_JOINED',
        actorId: req.user!.id,
        details: JSON.stringify({ username: req.user!.username }),
      });
    } catch {
      // Non-critical
    }

    res.json({ message: `You have joined ${invite.clan.name}` });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Decline a clan invite
export const declineInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inviteId } = req.params;

    const invite = await prisma.clanInvite.findUnique({ where: { id: inviteId } });
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }

    if (invite.inviteeId !== req.user!.id) {
      res.status(403).json({ error: 'This invite is not for you' });
      return;
    }

    if (invite.status !== 'PENDING') {
      res.status(400).json({ error: `Invite is already ${invite.status.toLowerCase()}` });
      return;
    }

    await prisma.clanInvite.update({
      where: { id: inviteId },
      data: { status: 'DECLINED' },
    });

    res.json({ message: 'Invite declined' });
  } catch (error) {
    console.error('Decline invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel a sent invite (leader only)
export const cancelInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const inviteId = req.params.inviteId as string;

    const invite = await prisma.clanInvite.findUnique({
      where: { id: inviteId },
      include: { clan: { select: { leaderId: true } } },
    }) as any;
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }

    if (invite.clan.leaderId !== req.user!.id) {
      res.status(403).json({ error: 'Only clan leader can cancel invites' });
      return;
    }

    if (invite.status !== 'PENDING') {
      res.status(400).json({ error: `Invite is already ${invite.status.toLowerCase()}` });
      return;
    }

    await prisma.clanInvite.update({
      where: { id: inviteId },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Invite cancelled' });
  } catch (error) {
    console.error('Cancel invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
