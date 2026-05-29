// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  ign?: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'ORGANIZER';
  points: number;
  kills: number;
  deaths: number;
  matchesPlayed: number;
  wins: number;
  clanId?: string | null;
  clanRole?: string | null;
  clan?: ClanBrief | null;
  createdAt: string;
}

export interface UserBrief {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

// Clan Types
export interface Clan {
  id: string;
  name: string;
  tag: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  color: string;
  points: number;
  wins: number;
  matchesPlayed: number;
  rank: number;
  maxMembers: number;
  leader: UserBrief;
  members?: (UserBrief & { clanRole?: string | null; points?: number; kills?: number; deaths?: number; wins?: number })[];
  _count?: { members: number };
  createdAt: string;
}

export interface ClanBrief {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string | null;
}

// Tournament Types
export type TournamentStatus = 'UPCOMING' | 'REGISTRATION_OPEN' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type TournamentMode = 'SOLO' | 'DUO' | 'SQUAD';
export type TournamentFormat = 'SINGLE' | 'MULTI_ROUND' | 'MULTI_STAGE';

export interface Tournament {
  id: string;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  prizePool: string;
  entryFee: string;
  mode: TournamentMode;
  slots: number;
  status: TournamentStatus;
  registrationStartsAt?: string | null;
  registrationEndsAt?: string | null;
  startsAt: string;
  endsAt?: string | null;
  mapName?: string | null;
  rules?: string | null;
  roomId?: string | null;
  roomPassword?: string | null;
  host: UserBrief;
  registrations?: TournamentRegistration[];
  rounds?: Round[];
  format?: TournamentFormat;
  totalRounds?: number;
  killPoints?: number;
  placementPoints?: number[];
  _count?: { registrations: number };
  createdAt: string;
}

export interface Round {
  id: string;
  tournamentId: string;
  roundNumber: number;
  title: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  startsAt?: string | null;
  roomId?: string | null;
  roomPassword?: string | null;
  scores?: RoundScore[];
  _count?: { scores: number };
}

export interface RoundScore {
  id: string;
  roundId: string;
  teamId: string;
  teamName: string;
  placement: number;
  kills: number;
  points: number;
  confirmed: boolean;
}

export interface ScoreboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  totalPoints: number;
  totalKills: number;
  bestPlacement: number;
  matchesPlayed: number;
  roundScores: Record<number, { placement: number; kills: number; points: number }>;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamName?: string | null;
  teamSize: number;
  status: string;
  user: UserBrief | null;
  guestIgn?: string | null;
  tournament?: Tournament;
  clanId?: string | null;
  clan?: ClanBrief | null;
  playingMembers?: string | null;
  substituteMembers?: string | null;
  clanXpAwarded?: number;
  createdAt: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl?: string | null;
  clan?: ClanBrief | null;
  points: number;
  kills: number;
  deaths: number;
  wins: number;
  matchesPlayed: number;
  kdRatio: number;
}

export interface ClanLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  tag: string;
  logoUrl?: string | null;
  color: string;
  points: number;
  wins: number;
  matchesPlayed: number;
  memberCount: number;
  leader: UserBrief;
}

// Invite Types
export interface ClanInvite {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  clan: {
    id: string;
    name: string;
    tag: string;
    logoUrl?: string | null;
    color: string;
    points: number;
    _count: { members: number };
  };
  inviter: UserBrief;
  invitee?: UserBrief;
  createdAt: string;
}

// Clan Activity Log Types
export interface ClanActivityLog {
  id: string;
  action: string;
  details?: string | null;
  actor: UserBrief;
  targetId?: string | null;
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

// API Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalClans: number;
  totalTournaments: number;
  totalMatches: number;
  liveTournaments: number;
  pendingReports: number;
}

export interface Report {
  id: string;
  reason: string;
  description?: string | null;
  status: string;
  reporter: UserBrief;
  reported: UserBrief & { email: string };
  createdAt: string;
  updatedAt: string;
}

// ===== Multi-Stage Tournament Types =====

export type StageType =
  | 'IN_GAME_QUALIFIER'
  | 'OPEN_QUALIFIER'
  | 'ONLINE_QUALIFIER'
  | 'SCRIM_STAGE'
  | 'KNOCKOUT'
  | 'ROUND_1'
  | 'ROUND_2'
  | 'ROUND_3'
  | 'WILDCARD'
  | 'POINT_RUSH'
  | 'SURVIVAL_STAGE'
  | 'LEAGUE_STAGE'
  | 'PLAYOFFS'
  | 'SEMI_FINALS'
  | 'GUILD_WARS'
  | 'REGIONAL_FINALS'
  | 'INVITATIONAL_STAGE'
  | 'LAST_CHANCE_QUALIFIER'
  | 'GRAND_FINALS'
  | (string & {});

export interface TournamentStage {
  id: string;
  tournamentId: string;
  stageNumber: number;
  name: string;
  type: StageType;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  teamsCount: number;
  qualifyingTeams: number;
  eliminationCount: number;
  lobbyCount: number;
  teamsPerLobby: number;
  matchesCount: number;
  formatType: string;
  scoringRules: StageScoringRules | null;
  mapRotation: string[] | null;
  roomSettings: any | null;
  startDate: string | null;
  endDate: string | null;
}

export interface StageScoringRules {
  killPoints: number;
  placementPoints: number[];
  qualificationRule: 'TOP_N' | 'POINTS_THRESHOLD' | 'WINS_REQUIRED';
  qualificationValue: number;
}

export interface StagePreset {
  id: string;
  name: string;
  description: string;
  stages: StagePresetStage[];
  recommendedTeams: string;
  complexity: string;
  features?: string;
}

export interface StagePresetStage {
  name: string;
  type: StageType;
  teamsCount: number;
  qualifyingTeams: number;
  eliminationCount: number;
  teamsPerLobby: number;
}

export interface StageTypeMeta {
  value: string;
  label: string;
  icon: string;
  description: string;
}

export interface StageGenerationResult {
  stageNumber: number;
  name: string;
  type: string;
  incomingTeams: number;
  lobbyCount: number;
  teamsPerLobby: number;
  matchesCount: number;
  qualifyingTeams: number;
  eliminationCount: number;
}

// ===== Stage Match Types =====

export interface StageMatch {
  id: string;
  stageId: string;
  tournamentId: string;
  matchNumber: number;
  name: string;
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
  teamsCount: number;
  roomId: string | null;
  roomPassword: string | null;
  startDate: string | null;
  endDate: string | null;
  teams: StageMatchTeam[];
  createdAt: string;
}

export interface StageMatchTeam {
  id: string;
  matchId: string;
  teamId: string;
  teamName: string;
  placement: number;
  kills: number;
  points: number;
  eliminated: boolean;
  qualified: boolean;
  confirmed: boolean;
}

export interface StageBracketEntry {
  id: string;
  stageNumber: number;
  name: string;
  type: string;
  status: string;
  teamsCount: number;
  qualifyingTeams: number;
  eliminationCount: number;
  lobbyCount: number;
  matches: StageBracketMatch[];
}

export interface StageBracketMatch {
  id: string;
  matchNumber: number;
  name: string;
  status: string;
  teams: StageBracketTeam[];
}

export interface StageBracketTeam {
  teamId: string;
  teamName: string;
  placement: number;
  kills: number;
  points: number;
  qualified: boolean;
  eliminated: boolean;
}

// Wallet Types
export interface Wallet {
  id: string;
  balance: number;
  userId: string;
  transactions?: TransactionItem[];
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TOURNAMENT_FEE' | 'TOURNAMENT_WINNING' | 'CLAN_FEE';
  amount: number;
  description?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
}

// Auto Tournament Template
export interface AutoTournamentTemplate {
  id: string;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  prizePool: string;
  entryFee: string;
  mode: TournamentMode;
  slots: number;
  mapName?: string | null;
  rules?: string | null;
  format?: TournamentFormat;
  totalRounds: number;
  killPoints: number;
  placementPoints?: number[] | null;
  isActive: boolean;
  createdBy: string;
  creator?: UserBrief;
  lastCreatedAt?: string | null;
  createdAt: string;
}

export interface RazorpayVerifyResponse {
  message: string;
  wallet: Wallet;
}
