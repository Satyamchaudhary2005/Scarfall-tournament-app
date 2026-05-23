import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { paginate, calculateKdRatio } from '../utils/helpers';

export const getGlobalLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page: pageStr, limit: limitStr } = req.query;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr as string) : 1,
      Math.min(limitStr ? parseInt(limitStr as string) : 50, 100)
    );

    const where: any = {};
    if (search) {
      where.username = { contains: search as string, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { points: 'desc' },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          points: true,
          kills: true,
          deaths: true,
          wins: true,
          matchesPlayed: true,
          clan: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const ranked = users.map((user, index) => ({
      rank: skip + index + 1,
      username: user.username,
      avatarUrl: user.avatarUrl,
      clan: user.clan ? { id: user.clan.id, name: user.clan.name, tag: user.clan.tag } : null,
      points: user.points,
      kills: user.kills,
      deaths: user.deaths,
      wins: user.wins,
      matchesPlayed: user.matchesPlayed,
      kdRatio: calculateKdRatio(user.kills, user.deaths),
    }));

    res.json({
      leaderboard: ranked,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSeasonalLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { season, search, page: pageStr, limit: limitStr } = req.query;
    const currentSeason = season || 'SEASON_1';
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr as string) : 1,
      Math.min(limitStr ? parseInt(limitStr as string) : 50, 100)
    );

    const where: any = {
      type: 'SEASONAL',
      season: currentSeason as string,
    };

    if (search) {
      where.user = {
        username: { contains: search as string, mode: 'insensitive' },
      };
    }

    const [entries, total] = await Promise.all([
      prisma.leaderboardEntry.findMany({
        where,
        skip,
        take,
        orderBy: { score: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              clan: {
                select: { id: true, name: true, tag: true },
              },
            },
          },
        },
      }),
      prisma.leaderboardEntry.count({ where }),
    ]);

    const ranked = entries.map((entry, index) => ({
      rank: skip + index + 1,
      username: entry.user.username,
      avatarUrl: entry.user.avatarUrl,
      clan: entry.user.clan,
      points: entry.score,
      kills: entry.kills,
      deaths: entry.deaths,
      wins: entry.wins,
      matchesPlayed: entry.matchesPlayed,
      kdRatio: calculateKdRatio(entry.kills, entry.deaths),
    }));

    res.json({
      season: currentSeason,
      leaderboard: ranked,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get seasonal leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClanLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page: pageStr, limit: limitStr } = req.query;
    const { skip, take, page, limit } = paginate(
      pageStr ? parseInt(pageStr as string) : 1,
      Math.min(limitStr ? parseInt(limitStr as string) : 50, 100)
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
        orderBy: { points: 'desc' },
        select: {
          id: true,
          name: true,
          tag: true,
          logoUrl: true,
          color: true,
          points: true,
          wins: true,
          matchesPlayed: true,
          _count: { select: { members: true } },
          leader: {
            select: { id: true, username: true },
          },
        },
      }),
      prisma.clan.count({ where }),
    ]);

    const ranked = clans.map((clan, index) => ({
      rank: skip + index + 1,
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      logoUrl: clan.logoUrl,
      color: clan.color,
      points: clan.points,
      wins: clan.wins,
      matchesPlayed: clan.matchesPlayed,
      memberCount: clan._count.members,
      leader: clan.leader,
    }));

    res.json({
      leaderboard: ranked,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get clan leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
