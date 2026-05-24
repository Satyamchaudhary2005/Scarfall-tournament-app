import { Request, Response } from 'express';
import { prisma } from '../config/database';

// Stage presets configuration — designed after official Free Fire (FFWS) & BGMI tournament formats
// Free Fire uses 12 teams/lobby, BGMI uses 16 teams/lobby
export const STAGE_PRESETS = [
  {
    id: '1-stage',
    name: '🏆 Single Match Cup',
    description: 'One-stage tournament — winner takes all',
    stages: [
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 16 },
    ],
    recommendedTeams: '8–100',
    complexity: 'Beginner',
  },
  {
    id: '2-stage-ff',
    name: '🔥 Free Fire Standard',
    description: 'Qualifier → Grand Finals (12 teams/lobby) — classic Free Fire format',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '24–120',
    complexity: 'Easy',
  },
  {
    id: '2-stage-bgmi',
    name: '🔫 BGMI Standard',
    description: 'Qualifier → Grand Finals (16 teams/lobby) — classic BGMI format',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 16, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 16 },
    ],
    recommendedTeams: '32–200',
    complexity: 'Easy',
  },
  {
    id: '3-stage-ff',
    name: '🔥 Free Fire Pro Circuit',
    description: 'Qualifier → Semi Finals → Grand Finals — 3-stage with semi-finals',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 24, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '48–300',
    complexity: 'Moderate',
  },
  {
    id: '3-stage-bgmi',
    name: '🔫 BGMI Pro Circuit',
    description: 'Qualifier → Semi Finals → Grand Finals — competitive BGMI bracket',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 32, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 16, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 16 },
    ],
    recommendedTeams: '64–500',
    complexity: 'Moderate',
  },
  {
    id: '4-stage-ff',
    name: '🔥 Free Fire Championship',
    description: 'Round 1 → Round 2 → Semi Finals → Grand Finals — full FFWS-style circuit',
    stages: [
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 36, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Round 2', type: 'ROUND_2', teamsCount: 0, qualifyingTeams: 18, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '72–500',
    complexity: 'Advanced',
  },
  {
    id: '4-stage-bgmi',
    name: '🔫 BGMI Championship',
    description: 'Round 1 → Round 2 → Semi Finals → Grand Finals — BGIS-style bracket',
    stages: [
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Round 2', type: 'ROUND_2', teamsCount: 0, qualifyingTeams: 32, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 16, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 16 },
    ],
    recommendedTeams: '128–1000',
    complexity: 'Advanced',
  },
  {
    id: '5-stage-wildcard',
    name: '🃏 Wildcard Pro Circuit',
    description: 'Open Qualifier → Round 1 → Round 2 → Wildcard → Grand Finals — includes last-chance survival round',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 24, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Round 2', type: 'ROUND_2', teamsCount: 0, qualifyingTeams: 16, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Wildcard', type: 'WILDCARD', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 16 },
    ],
    recommendedTeams: '128–2000',
    complexity: 'Advanced',
  },
  {
    id: '6-stage-esports',
    name: '🏅 Esports League Circuit',
    description: 'In-Game Qualifier → League Stage → Survival Stage → Playoffs → Semi Finals → Grand Finals — full professional league format',
    stages: [
      { name: 'In-Game Qualifier', type: 'IN_GAME_QUALIFIER', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'League Stage', type: 'LEAGUE_STAGE', teamsCount: 0, qualifyingTeams: 24, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Survival Stage', type: 'SURVIVAL_STAGE', teamsCount: 0, qualifyingTeams: 16, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Playoffs', type: 'PLAYOFFS', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 6, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '96–1000',
    complexity: 'Professional',
  },
  {
    id: '7-stage-pro',
    name: '👑 Ultimate Pro League',
    description: 'In-Game Qualifier → Online Qualifier → Round 1 → Round 2 → Wildcard → Semi Finals → Grand Finals — maximum competitive depth',
    stages: [
      { name: 'In-Game Qualifier', type: 'IN_GAME_QUALIFIER', teamsCount: 0, qualifyingTeams: 128, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Online Qualifier', type: 'ONLINE_QUALIFIER', teamsCount: 0, qualifyingTeams: 64, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 32, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Round 2', type: 'ROUND_2', teamsCount: 0, qualifyingTeams: 16, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Wildcard', type: 'WILDCARD', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 6, eliminationCount: 0, teamsPerLobby: 16 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 16 },
    ],
    recommendedTeams: '256–5000+',
    complexity: 'Professional',
  },
];

// Stage type metadata
export const STAGE_TYPES = [
  { value: 'IN_GAME_QUALIFIER', label: 'In-Game Qualifier', icon: '🎮', description: 'Qualification based on in-game rank/performance' },
  { value: 'OPEN_QUALIFIER', label: 'Open Qualifier', icon: '🔓', description: 'Open to all registered teams' },
  { value: 'ONLINE_QUALIFIER', label: 'Online Qualifier', icon: '🌐', description: 'Online qualification round' },
  { value: 'KNOCKOUT', label: 'Knockout', icon: '💀', description: 'Single-elimination knockout' },
  { value: 'ROUND_1', label: 'Round 1', icon: '1️⃣', description: 'First elimination round' },
  { value: 'ROUND_2', label: 'Round 2', icon: '2️⃣', description: 'Second elimination round' },
  { value: 'ROUND_3', label: 'Round 3', icon: '3️⃣', description: 'Third elimination round' },
  { value: 'WILDCARD', label: 'Wildcard', icon: '🃏', description: 'Wildcard survival round for runner-ups' },
  { value: 'SURVIVAL_STAGE', label: 'Survival Stage', icon: '⚔️', description: 'Survival/group stage' },
  { value: 'LEAGUE_STAGE', label: 'League Stage', icon: '🏆', description: 'League/group stage with round-robin' },
  { value: 'PLAYOFFS', label: 'Playoffs', icon: '🔱', description: 'Playoff bracket' },
  { value: 'SEMI_FINALS', label: 'Semi Finals', icon: '4️⃣', description: 'Semi-final round (top 4)' },
  { value: 'GRAND_FINALS', label: 'Grand Finals', icon: '👑', description: 'Grand championship finals' },
  { value: 'LAST_CHANCE_QUALIFIER', label: 'Last Chance Qualifier', icon: '💫', description: 'Last chance to qualify for finals' },
];

// GET /api/tournaments/:id/stages
export const getStages = async (req: Request, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    const stages = await prisma.tournamentStage.findMany({
      where: { tournamentId },
      orderBy: { stageNumber: 'asc' },
    });

    // Parse JSON fields
    const parsedStages = stages.map((s) => ({
      ...s,
      scoringRules: s.scoringRules ? JSON.parse(s.scoringRules) : null,
      mapRotation: s.mapRotation ? JSON.parse(s.mapRotation) : null,
      roomSettings: s.roomSettings ? JSON.parse(s.roomSettings) : null,
    }));

    res.json({ stages: parsedStages });
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/tournaments/:id/stages - Replace all stages with a new config
export const saveStages = async (req: Request, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;
    const { stages, totalRegisteredTeams } = req.body;

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      res.status(400).json({ error: 'At least 1 stage is required' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // Delete existing stages
    await prisma.tournamentStage.deleteMany({ where: { tournamentId } });

    // Create new stages
    const createdStages = await Promise.all(
      stages.map((stage: any, index: number) =>
        prisma.tournamentStage.create({
          data: {
            tournamentId,
            stageNumber: index + 1,
            name: stage.name,
            type: stage.type,
            status: index === 0 ? 'ACTIVE' : 'PENDING',
            teamsCount: stage.teamsCount || 0,
            qualifyingTeams: stage.qualifyingTeams || 0,
            eliminationCount: stage.eliminationCount || 0,
            lobbyCount: stage.lobbyCount || 0,
            teamsPerLobby: stage.teamsPerLobby || 16,
            matchesCount: stage.matchesCount || 0,
            formatType: stage.formatType || 'STANDARD',
            scoringRules: stage.scoringRules ? JSON.stringify(stage.scoringRules) : undefined,
            mapRotation: stage.mapRotation ? JSON.stringify(stage.mapRotation) : undefined,
            roomSettings: stage.roomSettings ? JSON.stringify(stage.roomSettings) : undefined,
            startDate: stage.startDate ? new Date(stage.startDate) : undefined,
            endDate: stage.endDate ? new Date(stage.endDate) : undefined,
          },
        })
      )
    );

    // Update tournament format and stage config
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        format: 'MULTI_STAGE',
        totalRegisteredTeams: totalRegisteredTeams || null,
        stageConfig: JSON.stringify({
          totalRegisteredTeams: totalRegisteredTeams || null,
          stageTypes: stages.map((s: any) => s.type),
        }),
      },
    });

    res.json({ message: 'Stages saved', stages: createdStages });
  } catch (error) {
    console.error('Save stages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/tournaments/stages/presets
export const getPresets = async (_req: Request, res: Response): Promise<void> => {
  res.json({ presets: STAGE_PRESETS });
};

// GET /api/tournaments/stages/types
export const getStageTypes = async (_req: Request, res: Response): Promise<void> => {
  res.json({ stageTypes: STAGE_TYPES });
};

// POST /api/tournaments/:id/stages/generate - Auto-generate tournament matches from stages
export const generateFromStages = async (req: Request, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        stages: { orderBy: { stageNumber: 'asc' } },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (tournament.format !== 'MULTI_STAGE') {
      res.status(400).json({ error: 'Tournament is not a multi-stage format' });
      return;
    }

    const stages = tournament.stages;
    if (stages.length === 0) {
      res.status(400).json({ error: 'No stages configured' });
      return;
    }

    // Auto-calculate team flow through stages (Free Fire & BGMI style progression)
    const generated = stages.map((stage, index) => {
      const prevStage = index > 0 ? stages[index - 1] : null;
      const incomingTeams = prevStage ? prevStage.qualifyingTeams : (tournament.totalRegisteredTeams || 0);
      const isLastStage = index === stages.length - 1;

      // Teams per lobby (default 16 for BGMI, 12 for Free Fire)
      const teamsPerLobby = stage.teamsPerLobby || 16;
      const lobbyCount = Math.max(1, Math.ceil(incomingTeams / teamsPerLobby));

      // Calculate how many teams advance to the next stage
      let qualifyingTeams: number;
      if (isLastStage) {
        // Grand Finals: 1 champion is crowned from match scores
        // The number of teams IN the finals = incomingTeams (from previous stage's qualifyingTeams)
        qualifyingTeams = 1;
      } else {
        // Use preset qualifying count (e.g., 12 for FF finals, 16 for BGMI finals)
        // or auto-calculate ~25% reduction each stage
        qualifyingTeams = stage.qualifyingTeams || Math.max(1, Math.round(incomingTeams * 0.25));
        // Ensure we never claim more teams advance than entered
        qualifyingTeams = Math.min(qualifyingTeams, incomingTeams);
      }

      // Calculate eliminations
      const eliminationCount = Math.max(0, incomingTeams - qualifyingTeams);

      return {
        id: stage.id,
        stageNumber: stage.stageNumber,
        name: stage.name,
        type: stage.type,
        incomingTeams,
        lobbyCount,
        teamsPerLobby,
        matchesCount: lobbyCount,
        qualifyingTeams,
        eliminationCount,
        formatType: stage.formatType,
      };
    });

    // Update stages with calculated values
    for (const gen of generated) {
      await prisma.tournamentStage.update({
        where: { id: gen.id },
        data: {
          teamsCount: gen.incomingTeams,
          lobbyCount: gen.lobbyCount,
          matchesCount: gen.matchesCount,
          qualifyingTeams: gen.qualifyingTeams,
          eliminationCount: gen.eliminationCount,
          teamsPerLobby: gen.teamsPerLobby,
        },
      });
    }

    // Update total teams on tournament
    const firstStage = generated[0];
    if (firstStage) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { totalRegisteredTeams: firstStage.incomingTeams },
      });
    }

    res.json({
      message: 'Tournament generated from stages',
      stages: generated,
      totalTeams: firstStage?.incomingTeams || 0,
      progression: generated.map((g) => ({
        from: g.name,
        incoming: g.incomingTeams,
        lobbies: g.lobbyCount,
        matches: g.matchesCount,
        qualify: g.qualifyingTeams,
        eliminated: g.eliminationCount,
      })),
    });
  } catch (error) {
    console.error('Generate from stages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/tournaments/:tournamentId/stages/:stageId
export const updateStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId, stageId } = req.params;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const data = req.body;
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.teamsCount !== undefined) updateData.teamsCount = data.teamsCount;
    if (data.qualifyingTeams !== undefined) updateData.qualifyingTeams = data.qualifyingTeams;
    if (data.eliminationCount !== undefined) updateData.eliminationCount = data.eliminationCount;
    if (data.lobbyCount !== undefined) updateData.lobbyCount = data.lobbyCount;
    if (data.teamsPerLobby !== undefined) updateData.teamsPerLobby = data.teamsPerLobby;
    if (data.matchesCount !== undefined) updateData.matchesCount = data.matchesCount;
    if (data.formatType !== undefined) updateData.formatType = data.formatType;
    if (data.scoringRules !== undefined) updateData.scoringRules = JSON.stringify(data.scoringRules);
    if (data.mapRotation !== undefined) updateData.mapRotation = JSON.stringify(data.mapRotation);
    if (data.roomSettings !== undefined) updateData.roomSettings = JSON.stringify(data.roomSettings);
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const updated = await prisma.tournamentStage.update({
      where: { id: stageId },
      data: updateData,
    });

    res.json({ message: 'Stage updated', stage: updated });
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/tournaments/:tournamentId/stages/:stageId
export const deleteStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId, stageId } = req.params;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    if (tournament.hostId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.tournamentStage.delete({ where: { id: stageId } });

    // Re-number remaining stages
    const remaining = await prisma.tournamentStage.findMany({
      where: { tournamentId },
      orderBy: { stageNumber: 'asc' },
    });

    await Promise.all(
      remaining.map((stage, index) =>
        prisma.tournamentStage.update({
          where: { id: stage.id },
          data: { stageNumber: index + 1 },
        })
      )
    );

    res.json({ message: 'Stage deleted' });
  } catch (error) {
    console.error('Delete stage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
