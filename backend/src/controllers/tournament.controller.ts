import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createTournamentSchema, updateTournamentSchema, clanTournamentRegistrationSchema, roomCredentialsSchema, createRoundSchema, updateRoundScoreSchema } from '../utils/validators';
import { paginate } from '../utils/helpers';
import { emitNotification, emitTournamentUpdate } from '../services/socket';

export const getTournaments = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const mode = req.query.mode as string | undefined;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;
    const pageStr = req.query.page as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr) : 1,
      Math.min(limitStr ? parseInt(limitStr) : 20, 50)
    );

    const where: any = {};

    if (status && status !== 'ALL') where.status = status;
    if (mode && mode !== 'ALL') where.mode = mode;
    if (type) {
      switch (type) {
        case 'multi':
          where.format = { in: ['MULTI_ROUND', 'MULTI_STAGE'] };
          break;
        case 'single':
          where.format = 'SINGLE';
          break;
        case 'free':
          where.entryFee = 'Free';
          break;
        case 'earn-per-kill':
          where.killPoints = { gt: 0 };
          break;
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip,
        take,
        orderBy: { startsAt: 'asc' },
        include: {
          host: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: {
            select: { registrations: true },
          },
        },
      }),
      prisma.tournament.count({ where }),
    ]);

    res.json({
      tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, username: true, avatarUrl: true },
        },
        registrations: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true, clanId: true, clanRole: true, ign: true },
            },
            clan: {
              select: { id: true, name: true, tag: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            _count: { select: { scores: true } },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Only expose room credentials to the host or registered participants
    const isHost = req.user?.id === tournament.hostId;
    const isRegistered = tournament.registrations?.some(r => r.user?.id === req.user?.id);
    if (!isHost && !isRegistered) {
      (tournament as any).roomId = undefined;
      (tournament as any).roomPassword = undefined;
      if ((tournament as any).rounds) {
        (tournament as any).rounds = (tournament as any).rounds.map((r: any) => {
          const { roomId, roomPassword, ...rest } = r;
          return rest;
        });
      }
    }

    // Parse placementPoints JSON string to array for frontend
    if (tournament.placementPoints) {
      try {
        (tournament as any).placementPoints = JSON.parse(tournament.placementPoints);
      } catch { /* keep as string */ }
    }

    res.json({ tournament });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createTournamentSchema.parse(req.body);
    const { placementPoints: pp, ...rest } = data;

    const tournament = await prisma.tournament.create({
      data: {
        ...rest,
        startsAt: new Date(data.startsAt),
        placementPoints: pp ? JSON.stringify(pp) : undefined,
        registrationStartsAt: data.registrationStartsAt
          ? new Date(data.registrationStartsAt)
          : undefined,
        registrationEndsAt: data.registrationEndsAt
          ? new Date(data.registrationEndsAt)
          : undefined,
        hostId: req.user!.id,
      },
      include: {
        host: {
          select: { id: true, username: true },
        },
      },
    });

    res.status(201).json({ message: 'Tournament created', tournament });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Create tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateTournamentSchema.parse(req.body);
    const { placementPoints: pp, ...rest } = data;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to edit this tournament' });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...rest,
        ...(data.startsAt && { startsAt: new Date(data.startsAt) }),
        ...(pp && { placementPoints: JSON.stringify(pp) }),
        ...(data.registrationStartsAt && { registrationStartsAt: new Date(data.registrationStartsAt) }),
        ...(data.registrationEndsAt && { registrationEndsAt: new Date(data.registrationEndsAt) }),
      },
      include: {
        host: { select: { id: true, username: true } },
      },
    });

    res.json({ message: 'Tournament updated', tournament: updated });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Update tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerForTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { teamName, teamSize } = req.body;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    }) as any;

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.mode !== 'SOLO') {
      res.status(400).json({ error: 'Use clan registration for DUO/SQUAD tournaments' });
      return;
    }

    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'UPCOMING') {
      res.status(400).json({ error: 'Registration is not open for this tournament' });
      return;
    }

    if (tournament._count.registrations >= tournament.slots) {
      res.status(400).json({ error: 'Tournament is full' });
      return;
    }

    const existingRegistration = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId: id,
        userId: req.user!.id,
      },
    });

    if (existingRegistration) {
      res.status(409).json({ error: 'Already registered for this tournament' });
      return;
    }

    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentId: id,
        userId: req.user!.id,
        teamName: teamName || null,
        teamSize: teamSize || 1,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true, ign: true },
        },
        tournament: {
          select: { id: true, title: true },
        },
      },
    });

    res.status(201).json({ message: 'Registered successfully', registration });
  } catch (error) {
    console.error('Register for tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerClanForTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const parsed = clanTournamentRegistrationSchema.parse(req.body);
    const { clanId, playingMembers, substituteMembers, teamName } = parsed;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    }) as any;

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.mode === 'SOLO') {
      res.status(400).json({ error: 'SOLO tournaments do not support clan registration' });
      return;
    }

    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'UPCOMING') {
      res.status(400).json({ error: 'Registration is not open for this tournament' });
      return;
    }

    if (tournament._count.registrations >= tournament.slots) {
      res.status(400).json({ error: 'Tournament is full' });
      return;
    }

    // Verify the user is in the specified clan
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { clanId: true, clanRole: true },
    });

    if (!user?.clanId || user.clanId !== clanId) {
      res.status(400).json({ error: 'You must be a member of the clan to register on its behalf' });
      return;
    }

    // Verify clan exists
    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
    });

    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    // Check if clan already registered for this tournament
    const existingClanRegistration = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId: id,
        clanId: clanId,
      },
    });

    if (existingClanRegistration) {
      res.status(409).json({ error: 'Your clan is already registered for this tournament' });
      return;
    }

    // Validate playing members count based on mode
    const subs = substituteMembers || [];
    if (tournament.mode === 'DUO') {
      if (playingMembers.length !== 2) {
        res.status(400).json({ error: 'DUO mode requires exactly 2 playing members' });
        return;
      }
      if (subs.length > 2) {
        res.status(400).json({ error: 'DUO mode allows maximum 2 substitutes' });
        return;
      }
    } else if (tournament.mode === 'SQUAD') {
      if (playingMembers.length !== 4) {
        res.status(400).json({ error: 'SQUAD mode requires exactly 4 playing members' });
        return;
      }
      if (subs.length > 3) {
        res.status(400).json({ error: 'SQUAD mode allows maximum 3 substitutes' });
        return;
      }
    }

    // Combine all selected members and validate they're all in the clan
    const allMemberIds = [...playingMembers, ...subs];
    const clanMembers = await prisma.user.findMany({
      where: {
        id: { in: allMemberIds },
        clanId: clanId,
      },
      select: { id: true },
    });

    const validMemberIds = new Set(clanMembers.map(m => m.id));
    const invalidMembers = allMemberIds.filter(mId => !validMemberIds.has(mId));

    if (invalidMembers.length > 0) {
      res.status(400).json({ error: 'Some selected members are not in your clan' });
      return;
    }

    // Check if any selected player is already registered individually
    const existingPlayerRegistrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId: id,
        userId: { in: allMemberIds },
      },
      select: { userId: true, user: { select: { username: true } } },
    }) as any[];

    if (existingPlayerRegistrations.length > 0) {
      const names = existingPlayerRegistrations.map(r => r.user.username);
      res.status(409).json({ error: `Already registered: ${names.join(', ')}` });
      return;
    }

    // Award clan XP for participation
    const teamNameFinal = teamName || `Team ${clan.name}`;
    const xpAwarded = tournament.mode === 'DUO' ? 50 : 100;

    // Create registration entries for each selected member
    const registrations = await Promise.all(
      allMemberIds.map(memberId =>
        prisma.tournamentRegistration.create({
          data: {
            tournamentId: id,
            userId: memberId,
            clanId: clanId,
            teamName: teamNameFinal,
            teamSize: allMemberIds.length,
            playingMembers: JSON.stringify(playingMembers),
            substituteMembers: JSON.stringify(subs),
            clanXpAwarded: xpAwarded,
          },
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
            tournament: {
              select: { id: true, title: true },
            },
          },
        })
      )
    );

    // Award clan XP to the clan
    await prisma.clan.update({
      where: { id: clanId },
      data: {
        points: { increment: xpAwarded },
        matchesPlayed: { increment: 1 },
      },
    });

    res.status(201).json({
      message: 'Clan registered successfully',
      clanXpAwarded: xpAwarded,
      registrations,
    });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Register clan for tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unregisterFromTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Check if this is a clan registration - if so, unregister all clan members
    const clanRegistration = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId: id,
        userId: req.user!.id,
        clanId: { not: null },
      },
    });

    if (clanRegistration?.clanId) {
      // Remove all registrations for this clan in this tournament
      await prisma.tournamentRegistration.deleteMany({
        where: {
          tournamentId: id,
          clanId: clanRegistration.clanId,
        },
      });
      res.json({ message: 'Clan unregistered successfully' });
      return;
    }

    const registration = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId: id,
        userId: req.user!.id,
      },
    });

    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }

    await prisma.tournamentRegistration.delete({
      where: { id: registration.id },
    });

    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    console.error('Unregister error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const manualRegisterParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { guestIgn, teamName } = req.body;

    if (!guestIgn || typeof guestIgn !== 'string' || guestIgn.trim().length === 0) {
      res.status(400).json({ error: 'In-game name is required' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Check capacity
    if (tournament._count.registrations >= tournament.slots) {
      res.status(400).json({ error: 'Tournament is full' });
      return;
    }

    // Create registration without a userId link (guest registration)
    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentId: id,
        guestIgn: guestIgn.trim(),
        teamName: teamName?.trim() || null,
      },
    });

    res.status(201).json({ message: 'Participant added successfully', registration });
  } catch (error) {
    console.error('Manual register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkRegisterParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { igns } = req.body;

    if (!igns || typeof igns !== 'string' || igns.trim().length === 0) {
      res.status(400).json({ error: 'List of IGNs is required' });
      return;
    }

    // Parse comma/newline separated IGNs, trim whitespace, filter empty
    const ignList = igns
      .split(/[,\n]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    if (ignList.length === 0) {
      res.status(400).json({ error: 'No valid IGNs found in input' });
      return;
    }

    if (ignList.length > 100) {
      res.status(400).json({ error: 'Maximum 100 participants per bulk import' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Check capacity
    const availableSlots = tournament.slots - tournament._count.registrations;
    if (availableSlots <= 0) {
      res.status(400).json({ error: 'Tournament is full' });
      return;
    }

    // Only add up to available slots
    const toAdd = ignList.slice(0, availableSlots);

    // Create all registrations in a transaction
    const registrations = await prisma.$transaction(
      toAdd.map((ign: string) =>
        prisma.tournamentRegistration.create({
          data: {
            tournamentId: id,
            guestIgn: ign,
          },
        })
      )
    );

    const skipped = ignList.length - toAdd.length;

    res.status(201).json({
      message: `${toAdd.length} participant(s) added successfully${skipped > 0 ? ` (${skipped} skipped — tournament full)` : ''}`,
      added: toAdd.length,
      skipped,
      registrations,
    });
  } catch (error) {
    console.error('Bulk register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;
    const registrationId = req.params.registrationId as string;

    // Verify the tournament exists and the requester is the host or admin
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to remove participants' });
      return;
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration || registration.tournamentId !== tournamentId) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }

    await prisma.tournamentRegistration.delete({
      where: { id: registrationId },
    });

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { userId: req.user!.id },
      include: {
        tournament: {
          include: {
            _count: { select: { registrations: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ registrations });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyTournaments = async (req: Request, res: Response): Promise<void> => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { hostId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    res.json({ tournaments });
  } catch (error) {
    console.error('Get my tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHostedTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to delete this tournament' });
      return;
    }

    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: id } });
    await prisma.tournament.delete({ where: { id } });

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Delete hosted tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cleanupOldTournaments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await runCleanup();
    res.json(result);
  } catch (error) {
    console.error('Cleanup old tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reusable cleanup function for auto-scheduled runs
export async function runCleanup() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const oldTournaments = await prisma.tournament.findMany({
    where: {
      status: 'COMPLETED',
      endsAt: { lt: oneDayAgo },
    },
    select: { id: true, title: true },
  });

  const ids = oldTournaments.map((t) => t.id);

  if (ids.length > 0) {
    await prisma.tournamentRegistration.deleteMany({
      where: { tournamentId: { in: ids } },
    });
    await prisma.roundScore.deleteMany({
      where: {
        round: { tournamentId: { in: ids } },
      },
    });
    await prisma.round.deleteMany({
      where: { tournamentId: { in: ids } },
    });
    await prisma.tournament.deleteMany({
      where: { id: { in: ids } },
    });
  }

  return {
    message: `Cleaned up ${ids.length} old tournament(s)`,
    deleted: oldTournaments.map((t) => t.title),
  };
}

export const setRoomCredentials = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = roomCredentialsSchema.parse(req.body);

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to set room credentials for this tournament' });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        roomId: data.roomId,
        roomPassword: data.roomPassword,
      },
    });

    // Notify all registered participants (skip guests with no userId)
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId: id, userId: { not: null } },
      select: { userId: true },
    });

    await prisma.notification.create({
      data: {
        type: 'ROOM_CREDENTIALS',
        title: 'Room credentials available',
        message: `Room credentials for "${tournament.title}" have been shared. Check the tournament page.`,
        link: `/tournaments/${id}`,
        recipientId: req.user!.id,
      },
    });

    // Create & emit notification for each registered user participant
    for (const reg of registrations) {
      if (!reg.userId) continue;
      const userNotification = await prisma.notification.create({
        data: {
          type: 'ROOM_CREDENTIALS',
          title: 'Room credentials available',
          message: `Room credentials for "${tournament.title}" are now available. Check the tournament page.`,
          link: `/tournaments/${id}`,
          recipientId: reg.userId,
        },
      });
      try {
        emitNotification(reg.userId, userNotification);
      } catch {
        // Socket may not be initialized
      }
    }

    try {
      emitTournamentUpdate(id, { roomId: data.roomId });
    } catch {
      // Socket may not be initialized
    }

    res.json({ message: 'Room credentials saved and participants notified' });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Set room credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLiveTournaments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: { in: ['UPCOMING', 'REGISTRATION_OPEN', 'LIVE'] },
      },
      orderBy: { startsAt: 'asc' },
      take: 5,
      include: {
        host: { select: { id: true, username: true } },
        _count: { select: { registrations: true } },
      },
    });

    res.json({ tournaments });
  } catch (error) {
    console.error('Get live tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== Battle Royale Multi-Round Functions =====

export const createRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = createRoundSchema.parse(req.body);

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (tournament.format !== 'MULTI_ROUND') {
      res.status(400).json({ error: 'Tournament is not a multi-round format' });
      return;
    }

    const lastRound = await prisma.round.findFirst({
      where: { tournamentId: id },
      orderBy: { roundNumber: 'desc' },
    });
    const roundNumber = (lastRound?.roundNumber || 0) + 1;

    if (roundNumber > tournament.totalRounds) {
      res.status(400).json({ error: `Maximum ${tournament.totalRounds} rounds reached` });
      return;
    }

    const round = await prisma.round.create({
      data: {
        tournamentId: id,
        roundNumber,
        title: data.title || `Match ${roundNumber}`,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      },
    });

    res.status(201).json({ message: 'Round created', round });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Create round error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRoundStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const roundId = req.params.roundId as string;
    const { status, roomId, roomPassword } = req.body;

    if (!['UPCOMING', 'LIVE', 'COMPLETED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    if (status === 'LIVE') {
      if (!roomId || !roomPassword) {
        res.status(400).json({ error: 'Room ID and Password are required to start a round' });
        return;
      }
    }

    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) {
      res.status(404).json({ error: 'Round not found' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: round.tournamentId } });
    if (tournament?.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updated = await prisma.round.update({
      where: { id: roundId },
      data: {
        status,
        ...(status === 'LIVE' && { roomId, roomPassword }),
      },
    });

    // If completing a round and auto-calculate scores
    if (status === 'COMPLETED') {
      const scores = await prisma.roundScore.findMany({
        where: { roundId },
      });
      // Calculate points based on placement
      const placementConfig = tournament?.placementPoints
        ? JSON.parse(tournament.placementPoints)
        : [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0];
      const killPts = tournament?.killPoints || 1;

      for (const score of scores) {
        const placementIndex = Math.min(score.placement - 1, placementConfig.length - 1);
        const placementPts = placementConfig[placementIndex] || 0;
        const totalPts = placementPts + (score.kills * killPts);
        await prisma.roundScore.update({
          where: { id: score.id },
          data: { points: totalPts, confirmed: true },
        });
      }
    }

    res.json({ message: 'Round status updated', round: updated });
  } catch (error) {
    console.error('Update round status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRoundScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const roundId = req.params.roundId as string;
    const data = updateRoundScoreSchema.parse(req.body);

    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) {
      res.status(404).json({ error: 'Round not found' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: round.tournamentId } });
    if (tournament?.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // Delete existing scores for this round
    await prisma.roundScore.deleteMany({ where: { roundId } });

    // Calculate points
    const placementConfig = tournament?.placementPoints
      ? JSON.parse(tournament.placementPoints)
      : [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0];
    const killPts = tournament?.killPoints || 1;

    const scores = await Promise.all(
      data.scores.map((s) => {
        const placementIndex = Math.min(s.placement - 1, placementConfig.length - 1);
        const placementPts = placementConfig[placementIndex] || 0;
        const totalPts = placementPts + (s.kills * killPts);
        return prisma.roundScore.create({
          data: {
            roundId,
            teamId: s.teamId,
            teamName: s.teamName,
            placement: s.placement,
            kills: s.kills,
            points: totalPts,
            confirmed: round.status === 'COMPLETED',
          },
        });
      })
    );

    res.json({ message: 'Scores updated', scores });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Update round scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const roundId = req.params.roundId as string;

    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) {
      res.status(404).json({ error: 'Round not found' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: round.tournamentId } });
    if (tournament?.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.roundScore.deleteMany({ where: { roundId } });
    await prisma.round.delete({ where: { id: roundId } });

    res.json({ message: 'Round deleted' });
  } catch (error) {
    console.error('Delete round error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getScoreboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            scores: {
              orderBy: { placement: 'asc' },
            },
          },
        },
        registrations: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, ign: true } },
            clan: { select: { id: true, name: true, tag: true } },
          },
        },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Build cumulative scoreboard
    const teamScores: Record<string, { teamId: string; teamName: string; totalPoints: number; totalKills: number; bestPlacement: number; matchesPlayed: number; roundScores: Record<number, { placement: number; kills: number; points: number }> }> = {};

    // Determine teams from registrations
    if (tournament.mode === 'SOLO') {
      for (const reg of tournament.registrations) {
        const teamId = reg.user?.id || reg.id;
        teamScores[teamId] = {
          teamId,
          teamName: reg.user?.ign || reg.user?.username || reg.guestIgn || 'Unknown',
          totalPoints: 0,
          totalKills: 0,
          bestPlacement: 99,
          matchesPlayed: 0,
          roundScores: {},
        };
      }
    } else {
      // Group registrations by clanId or teamName
      const teamMap: Record<string, { teamId: string; teamName: string }> = {};
      for (const reg of tournament.registrations) {
        const teamId = reg.clanId || reg.teamName || reg.user?.id || reg.id;
        if (!teamMap[teamId]) {
          const clan = reg.clan;
          teamMap[teamId] = {
            teamId,
            teamName: clan?.name || reg.teamName || reg.user?.username || reg.guestIgn || 'Unknown',
          };
        }
      }
      for (const [teamId, info] of Object.entries(teamMap)) {
        teamScores[teamId] = {
          teamId,
          teamName: info.teamName,
          totalPoints: 0,
          totalKills: 0,
          bestPlacement: 99,
          matchesPlayed: 0,
          roundScores: {},
        };
      }
    }

    // Apply round scores
    for (const round of tournament.rounds) {
      for (const score of round.scores) {
        if (teamScores[score.teamId]) {
          teamScores[score.teamId].totalPoints += score.points;
          teamScores[score.teamId].totalKills += score.kills;
          teamScores[score.teamId].bestPlacement = Math.min(teamScores[score.teamId].bestPlacement, score.placement);
          teamScores[score.teamId].matchesPlayed += 1;
          teamScores[score.teamId].roundScores[round.roundNumber] = {
            placement: score.placement,
            kills: score.kills,
            points: score.points,
          };
        }
      }
    }

    // Sort by total points descending
    const sorted = Object.values(teamScores).sort((a, b) => b.totalPoints - a.totalPoints || a.bestPlacement - b.bestPlacement);

    res.json({
      scoreboard: sorted.map((s, i) => ({ ...s, rank: i + 1 })),
      rounds: tournament.rounds,
    });
  } catch (error) {
    console.error('Get scoreboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
