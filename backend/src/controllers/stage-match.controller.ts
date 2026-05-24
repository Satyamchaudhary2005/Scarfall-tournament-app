import { Request, Response } from 'express';
import { prisma } from '../config/database';

// GET /api/tournaments/:id/stages/:stageId/matches
export const getStageMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId } = req.params;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    const stage = await prisma.tournamentStage.findUnique({ where: { id: stageId } });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    const matches = await prisma.stageMatch.findMany({
      where: { stageId },
      orderBy: { matchNumber: 'asc' },
      include: {
        teams: { orderBy: { placement: 'asc' } },
      },
    });

    res.json({ matches });
  } catch (error) {
    console.error('Get stage matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/tournaments/:id/stages/:stageId/matches
export const createStageMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId } = req.params;
    const { name, startDate } = req.body;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const stage = await prisma.tournamentStage.findUnique({ where: { id: stageId } });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Get next match number
    const lastMatch = await prisma.stageMatch.findFirst({
      where: { stageId },
      orderBy: { matchNumber: 'desc' },
    });
    const matchNumber = (lastMatch?.matchNumber || 0) + 1;

    const match = await prisma.stageMatch.create({
      data: {
        stageId,
        tournamentId: id,
        matchNumber,
        name: name || `Match ${matchNumber}`,
        startDate: startDate ? new Date(startDate) : undefined,
      },
      include: { teams: true },
    });

    res.status(201).json({ message: 'Match created', match });
  } catch (error) {
    console.error('Create stage match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/tournaments/:id/stages/:stageId/matches/generate
export const generateStageMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { registrations: true },
    });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const stage = await prisma.tournamentStage.findUnique({ where: { id: stageId } });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Determine which teams enter this stage
    let incomingTeams: { teamId: string; teamName: string }[] = [];

    if (stage.stageNumber === 1) {
      // First stage: all registered teams
      const regs = tournament.registrations;
      if (tournament.mode === 'SOLO') {
        incomingTeams = regs.map((r) => ({
          teamId: r.userId,
          teamName: r.user.ign || r.user.username,
        }));
      } else {
        // Group by clan/team
        const teamMap = new Map<string, string>();
        for (const r of regs) {
          const tid = r.clanId || r.teamName || r.userId;
          if (!teamMap.has(tid)) {
            teamMap.set(tid, r.clan?.name || r.teamName || r.user.username);
          }
        }
        incomingTeams = Array.from(teamMap.entries()).map(([id, name]) => ({
          teamId: id,
          teamName: name,
        }));
      }
    } else {
      // Later stages: teams that qualified from previous stage
      const prevStage = await prisma.tournamentStage.findFirst({
        where: { tournamentId: id, stageNumber: stage.stageNumber - 1 },
      });
      if (!prevStage) {
        res.status(400).json({ error: 'Previous stage not found' });
        return;
      }

      const prevMatches = await prisma.stageMatch.findMany({
        where: { stageId: prevStage.id },
        include: { teams: { where: { qualified: true } } },
      });

      for (const match of prevMatches) {
        for (const team of match.teams) {
          incomingTeams.push({ teamId: team.teamId, teamName: team.teamName });
        }
      }
    }

    if (incomingTeams.length === 0) {
      res.status(400).json({ error: 'No teams available for this stage' });
      return;
    }

    // Delete existing matches for this stage
    await prisma.stageMatchTeam.deleteMany({ where: { match: { stageId } } });
    await prisma.stageMatch.deleteMany({ where: { stageId } });

    // Distribute teams into lobbies
    const teamsPerLobby = stage.teamsPerLobby || 16;
    const lobbyCount = Math.max(1, Math.ceil(incomingTeams.length / teamsPerLobby));
    const shuffled = [...incomingTeams].sort(() => Math.random() - 0.5);

    const matches = [];
    for (let i = 0; i < lobbyCount; i++) {
      const start = i * teamsPerLobby;
      const end = start + teamsPerLobby;
      const lobbyTeams = shuffled.slice(start, end);

      const match = await prisma.stageMatch.create({
        data: {
          stageId,
          tournamentId: id,
          matchNumber: i + 1,
          name: `Lobby ${String.fromCharCode(65 + i)}`,
          teamsCount: lobbyTeams.length,
          teams: {
            create: lobbyTeams.map((t) => ({
              teamId: t.teamId,
              teamName: t.teamName,
            })),
          },
        },
        include: { teams: true },
      });
      matches.push(match);
    }

    // Update stage with actual counts
    await prisma.tournamentStage.update({
      where: { id: stageId },
      data: {
        teamsCount: incomingTeams.length,
        lobbyCount: matches.length,
        matchesCount: matches.length,
        status: 'ACTIVE',
      },
    });

    res.json({ message: 'Matches generated', matches, totalTeams: incomingTeams.length });
  } catch (error) {
    console.error('Generate stage matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/tournaments/:id/stages/:stageId/matches/:matchId
export const updateStageMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId, matchId } = req.params;
    const data = req.body;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.roomId !== undefined) updateData.roomId = data.roomId;
    if (data.roomPassword !== undefined) updateData.roomPassword = data.roomPassword;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const match = await prisma.stageMatch.update({
      where: { id: matchId },
      data: updateData,
      include: { teams: { orderBy: { placement: 'asc' } } },
    });

    res.json({ message: 'Match updated', match });
  } catch (error) {
    console.error('Update stage match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/tournaments/:id/stages/:stageId/matches/:matchId
export const deleteStageMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId, matchId } = req.params;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.stageMatchTeam.deleteMany({ where: { matchId } });
    await prisma.stageMatch.delete({ where: { id: matchId } });

    res.json({ message: 'Match deleted' });
  } catch (error) {
    console.error('Delete stage match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/tournaments/:id/stages/:stageId/matches/:matchId/scores
export const updateStageScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId, matchId } = req.params;
    const { scores } = req.body; // Array of { teamId, placement, kills }

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const stage = await prisma.tournamentStage.findUnique({ where: { id: stageId } });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Get scoring rules
    const scoringRules = stage.scoringRules
      ? JSON.parse(stage.scoringRules)
      : { killPoints: 1, placementPoints: [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0] };

    const killPts = scoringRules.killPoints || 1;
    const placementPts = scoringRules.placementPoints || [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0];

    // Get qualification info
    const qualifyingTeams = stage.qualifyingTeams || Math.max(1, Math.floor(stage.teamsCount * 0.25));

    // Update each team's score
    for (const score of scores) {
      const placementIndex = Math.min(score.placement - 1, placementPts.length - 1);
      const placementPtsValue = placementPts[placementIndex] || 0;
      const totalPts = placementPtsValue + (score.kills * killPts);
      const qualified = score.placement > 0 && score.placement <= qualifyingTeams;

      await prisma.stageMatchTeam.update({
        where: { matchId_teamId: { matchId, teamId: score.teamId } },
        data: {
          placement: score.placement || 0,
          kills: score.kills || 0,
          points: totalPts,
          qualified,
          eliminated: !qualified,
          confirmed: true,
        },
      });
    }

    // Check if all matches in this stage are done, then auto-complete stage
    const allMatches = await prisma.stageMatch.findMany({
      where: { stageId },
      include: { teams: true },
    });

    const allCompleted = allMatches.every((m) => m.status === 'COMPLETED' || m.teams.every((t) => t.confirmed));
    if (allCompleted) {
      await prisma.tournamentStage.update({
        where: { id: stageId },
        data: { status: 'COMPLETED' },
      });
    }

    const updatedMatch = await prisma.stageMatch.findUnique({
      where: { id: matchId },
      include: { teams: { orderBy: { placement: 'asc' } } },
    });

    res.json({ message: 'Scores updated', match: updatedMatch, stageCompleted: allCompleted });
  } catch (error) {
    console.error('Update stage scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/tournaments/:id/stages/:stageId/bracket
export const getStageBracket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { stageNumber: 'asc' } },
      },
    });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Build bracket data across all stages
    const allStages = await prisma.tournamentStage.findMany({
      where: { tournamentId: id },
      orderBy: { stageNumber: 'asc' },
      include: {
        matches: {
          include: { teams: { orderBy: { placement: 'asc' } } },
          orderBy: { matchNumber: 'asc' },
        },
      },
    });

    const bracket = allStages.map((s) => ({
      id: s.id,
      stageNumber: s.stageNumber,
      name: s.name,
      type: s.type,
      status: s.status,
      teamsCount: s.teamsCount,
      qualifyingTeams: s.qualifyingTeams,
      eliminationCount: s.eliminationCount,
      lobbyCount: s.lobbyCount,
      matches: s.matches.map((m) => ({
        id: m.id,
        matchNumber: m.matchNumber,
        name: m.name,
        status: m.status,
        teams: m.teams.map((t) => ({
          teamId: t.teamId,
          teamName: t.teamName,
          placement: t.placement,
          kills: t.kills,
          points: t.points,
          qualified: t.qualified,
          eliminated: t.eliminated,
        })),
      })),
    }));

    res.json({ bracket });
  } catch (error) {
    console.error('Get stage bracket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/tournaments/:id/stages/:stageId/advance
export const advanceTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stageId } = req.params;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const stage = await prisma.tournamentStage.findUnique({
      where: { id: stageId },
      include: {
        matches: {
          include: { teams: { where: { qualified: true } } },
        },
      },
    });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Calculate qualified teams from this stage
    const qualifiedTeams: { teamId: string; teamName: string }[] = [];
    for (const match of stage.matches) {
      for (const team of match.teams) {
        if (team.qualified) {
          qualifiedTeams.push({ teamId: team.teamId, teamName: team.teamName });
        }
      }
    }

    // Auto-generate matches for next stage
    const nextStage = await prisma.tournamentStage.findFirst({
      where: { tournamentId: id, stageNumber: stage.stageNumber + 1 },
    });

    if (!nextStage) {
      res.status(400).json({ error: 'No next stage configured' });
      return;
    }

    // Delete existing matches in next stage
    await prisma.stageMatchTeam.deleteMany({ where: { match: { stageId: nextStage.id } } });
    await prisma.stageMatch.deleteMany({ where: { stageId: nextStage.id } });

    // Create new matches for next stage
    const teamsPerLobby = nextStage.teamsPerLobby || 16;
    const lobbyCount = Math.max(1, Math.ceil(qualifiedTeams.length / teamsPerLobby));
    const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5);

    const matches = [];
    for (let i = 0; i < lobbyCount; i++) {
      const start = i * teamsPerLobby;
      const end = start + teamsPerLobby;
      const lobbyTeams = shuffled.slice(start, end);

      const match = await prisma.stageMatch.create({
        data: {
          stageId: nextStage.id,
          tournamentId: id,
          matchNumber: i + 1,
          name: `Lobby ${String.fromCharCode(65 + i)}`,
          teamsCount: lobbyTeams.length,
          teams: {
            create: lobbyTeams.map((t) => ({
              teamId: t.teamId,
              teamName: t.teamName,
            })),
          },
        },
        include: { teams: true },
      });
      matches.push(match);
    }

    // Update next stage
    await prisma.tournamentStage.update({
      where: { id: nextStage.id },
      data: {
        teamsCount: qualifiedTeams.length,
        lobbyCount: matches.length,
        matchesCount: matches.length,
        status: 'ACTIVE',
      },
    });

    res.json({
      message: `${qualifiedTeams.length} teams advanced to ${nextStage.name}`,
      advancedTeams: qualifiedTeams,
      nextStage: { id: nextStage.id, name: nextStage.name, matches },
    });
  } catch (error) {
    console.error('Advance teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
