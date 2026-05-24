import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createTournamentSchema, updateTournamentSchema, clanTournamentRegistrationSchema } from '../utils/validators';
import { paginate } from '../utils/helpers';

export const getTournaments = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const mode = req.query.mode as string | undefined;
    const search = req.query.search as string | undefined;
    const pageStr = req.query.page as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr) : 1,
      Math.min(limitStr ? parseInt(limitStr) : 20, 50)
    );

    const where: any = {};

    if (status && status !== 'ALL') where.status = status;
    if (mode && mode !== 'ALL') where.mode = mode;
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
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
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

    const tournament = await prisma.tournament.create({
      data: {
        ...data,
        startsAt: new Date(data.startsAt),
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
        ...data,
        ...(data.startsAt && { startsAt: new Date(data.startsAt) }),
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

    const existingRegistration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: req.user!.id,
        },
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

    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: req.user!.id,
        },
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
    const id = req.params.id;

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
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const oldTournaments = await prisma.tournament.findMany({
      where: {
        status: 'COMPLETED',
        endsAt: { lt: twoDaysAgo },
      },
      select: { id: true, title: true },
    });

    const ids = oldTournaments.map((t) => t.id);

    if (ids.length > 0) {
      await prisma.tournamentRegistration.deleteMany({
        where: { tournamentId: { in: ids } },
      });
      await prisma.tournament.deleteMany({
        where: { id: { in: ids } },
      });
    }

    res.json({
      message: `Cleaned up ${ids.length} old tournament(s)`,
      deleted: oldTournaments.map((t) => t.title),
    });
  } catch (error) {
    console.error('Cleanup old tournaments error:', error);
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
