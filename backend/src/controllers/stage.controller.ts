import { Request, Response } from 'express';
import { prisma } from '../config/database';

// Stage presets configuration — designed after official Free Fire (FFWS) & BGMI tournament formats
// Free Fire uses 12 teams/lobby, BGMI uses 16 teams/lobby
export const STAGE_PRESETS = [
  // 🔥 FREE FIRE PRESETS 🔥
  {
    id: 'ff-daily-scrim',
    name: '🔥 Daily Scrim',
    description: 'Best for daily practice, clan scrims, and retention events',
    stages: [
      { name: 'Scrim Stage', type: 'SCRIM_STAGE', teamsCount: 0, qualifyingTeams: 0, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Final Standings', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '12–24',
    complexity: 'Beginner',
    features: '3–6 matches • Kill = 1pt • Booyah = 12pts',
  },
  {
    id: 'ff-community-cup',
    name: '🎮 Community Cup',
    description: 'Best for small creators, Discord tournaments, and local communities',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '48–96',
    complexity: 'Easy',
    features: 'Top 12 qualify for Grand Finals',
  },
  {
    id: 'ff-clash-squad',
    name: '⚡ Clash Squad',
    description: 'Best for CS competitive mode and fast tournaments',
    stages: [
      { name: 'Knockout', type: 'KNOCKOUT', teamsCount: 0, qualifyingTeams: 8, eliminationCount: 0, teamsPerLobby: 4 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 4, eliminationCount: 0, teamsPerLobby: 4 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 4 },
    ],
    recommendedTeams: '8–64',
    complexity: 'Easy',
    features: 'Best of 3 matches',
  },
  {
    id: 'ff-mid-tier-esports',
    name: '🏅 Mid-Tier Esports',
    description: 'Inspired by FFMIC style — Open Qualifier → Round 1 → Semi Finals → Grand Finals',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 96, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 24, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '128–512',
    complexity: 'Moderate',
    features: '512 → 96 → 24 → 12 Finals Teams',
  },
  {
    id: 'ff-pro-league',
    name: '👑 Free Fire Pro League',
    description: 'Best for large esports organizers and sponsored events',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 256, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 128, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Round 2', type: 'ROUND_2', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'League Stage', type: 'LEAGUE_STAGE', teamsCount: 0, qualifyingTeams: 18, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '512–2048',
    complexity: 'Advanced',
    features: 'League points • Multi-day standings • MVP leaderboard',
  },
  {
    id: 'ff-world-series',
    name: '🌍 Free Fire World Series',
    description: 'Inspired by FFWS structure — the ultimate Free Fire esports format with Point Rush',
    stages: [
      { name: 'In-Game Qualifier', type: 'IN_GAME_QUALIFIER', teamsCount: 0, qualifyingTeams: 1024, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Online Qualifier', type: 'ONLINE_QUALIFIER', teamsCount: 0, qualifyingTeams: 128, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Knockout Stage', type: 'KNOCKOUT', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'League Stage', type: 'LEAGUE_STAGE', teamsCount: 0, qualifyingTeams: 18, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Point Rush', type: 'POINT_RUSH', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '5000–50000+',
    complexity: 'Professional',
    features: 'Point Rush: bonus points earned • Finals advantages granted',
  },
  {
    id: 'ff-last-chance',
    name: '💫 Last Chance Qualifier',
    description: 'Best for comeback opportunities and creator tournaments',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Wildcard', type: 'WILDCARD', teamsCount: 0, qualifyingTeams: 16, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Last Chance Qualifier', type: 'LAST_CHANCE_QUALIFIER', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '128–1024',
    complexity: 'Advanced',
    features: 'Wildcard survival round • Comeback opportunity',
  },
  {
    id: 'ff-guild-wars',
    name: '⚔️ Guild Wars',
    description: 'Free Fire communities love guild systems — guild rankings with rivalry tracking',
    stages: [
      { name: 'Guild Wars', type: 'GUILD_WARS', teamsCount: 0, qualifyingTeams: 8, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Regional Finals', type: 'REGIONAL_FINALS', teamsCount: 0, qualifyingTeams: 4, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '16–128',
    complexity: 'Moderate',
    features: 'Guild rankings • Rivalry tracking • Seasonal points',
  },
  {
    id: 'ff-creator-cup',
    name: '🎥 Creator Cup',
    description: 'Best for YouTubers, streamers, and influencer events',
    stages: [
      { name: 'Invitational Stage', type: 'INVITATIONAL_STAGE', teamsCount: 0, qualifyingTeams: 0, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '12–48',
    complexity: 'Easy',
    features: 'Invite-only teams • Livestream overlays • Creator branding',
  },
  {
    id: 'ff-hardcore-survival',
    name: '☠️ Hardcore Survival',
    description: 'League Stage → Survival Stage → Grand Finals — bottom teams eliminated after every matchday',
    stages: [
      { name: 'League Stage', type: 'LEAGUE_STAGE', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Survival Stage', type: 'SURVIVAL_STAGE', teamsCount: 0, qualifyingTeams: 6, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '24–96',
    complexity: 'Moderate',
    features: 'Bottom teams eliminated every matchday • Survival pressure',
  },

  // ===== QUICK START TEMPLATES =====
  {
    id: 'ff-beginner-template',
    name: '🌟 Beginner Template',
    description: 'Quick start — Qualifier → Grand Finals. Perfect for first-time organizers',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '24–120',
    complexity: 'Beginner',
    features: 'Free Fire scoring • 12 teams/lobby • Top 12 advance',
  },
  {
    id: 'ff-competitive-template',
    name: '🏅 Competitive Template',
    description: 'Open Qualifier → Round 1 → League Stage → Grand Finals — serious competition',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 24, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'League Stage', type: 'LEAGUE_STAGE', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '128–512',
    complexity: 'Moderate',
    features: 'League standings • Multiple matchdays • Qualification battles',
  },
  {
    id: 'ff-professional-template',
    name: '👑 Professional Template',
    description: 'Open Qualifier → Round 1 → Round 2 → League Stage → Point Rush → Grand Finals — full esports circuit',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 0, qualifyingTeams: 256, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 0, qualifyingTeams: 128, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Round 2', type: 'ROUND_2', teamsCount: 0, qualifyingTeams: 48, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'League Stage', type: 'LEAGUE_STAGE', teamsCount: 0, qualifyingTeams: 18, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Point Rush', type: 'POINT_RUSH', teamsCount: 0, qualifyingTeams: 12, eliminationCount: 0, teamsPerLobby: 12 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 0, qualifyingTeams: 1, eliminationCount: 0, teamsPerLobby: 12 },
    ],
    recommendedTeams: '512–5000+',
    complexity: 'Professional',
    features: 'Full esports circuit • Point Rush bonus • League stage',
  },
];

// Stage type metadata — Free Fire focused
export const STAGE_TYPES = [
  { value: 'IN_GAME_QUALIFIER', label: 'In-Game Qualifier', icon: '🎮', description: 'Qualification based on in-game rank/performance' },
  { value: 'OPEN_QUALIFIER', label: 'Open Qualifier', icon: '🔓', description: 'Open to all registered teams' },
  { value: 'ONLINE_QUALIFIER', label: 'Online Qualifier', icon: '🌐', description: 'Online qualification round' },
  { value: 'SCRIM_STAGE', label: 'Scrim Stage', icon: '🥷', description: 'Practice scrim matches with scoring' },
  { value: 'KNOCKOUT', label: 'Knockout / Knockout Stage', icon: '💀', description: 'Single-elimination knockout bracket' },
  { value: 'ROUND_1', label: 'Round 1', icon: '1️⃣', description: 'First elimination round' },
  { value: 'ROUND_2', label: 'Round 2', icon: '2️⃣', description: 'Second elimination round' },
  { value: 'ROUND_3', label: 'Round 3', icon: '3️⃣', description: 'Third elimination round' },
  { value: 'WILDCARD', label: 'Wildcard', icon: '🃏', description: 'Wildcard survival round for runner-ups' },
  { value: 'POINT_RUSH', label: 'Point Rush', icon: '⚡', description: 'FFWS special stage: bonus points earned, finals advantages granted' },
  { value: 'SURVIVAL_STAGE', label: 'Survival Stage', icon: '⚔️', description: 'Survival stage — bottom teams eliminated after each matchday' },
  { value: 'LEAGUE_STAGE', label: 'League Stage', icon: '🏆', description: 'League/group stage with round-robin and standings' },
  { value: 'PLAYOFFS', label: 'Playoffs', icon: '🔱', description: 'Playoff bracket' },
  { value: 'SEMI_FINALS', label: 'Semi Finals', icon: '4️⃣', description: 'Semi-final round' },
  { value: 'GUILD_WARS', label: 'Guild Wars', icon: '⚔️', description: 'Guild vs guild battle stage with rivalry tracking' },
  { value: 'REGIONAL_FINALS', label: 'Regional Finals', icon: '🌎', description: 'Regional championship finals' },
  { value: 'INVITATIONAL_STAGE', label: 'Invitational Stage', icon: '🎟️', description: 'Invite-only qualification stage for creator events' },
  { value: 'LAST_CHANCE_QUALIFIER', label: 'Last Chance Qualifier', icon: '💫', description: 'Last chance to qualify for finals' },
  { value: 'GRAND_FINALS', label: 'Grand Finals', icon: '👑', description: 'Grand championship finals' },
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
