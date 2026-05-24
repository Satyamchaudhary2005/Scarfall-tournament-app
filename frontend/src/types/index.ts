// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
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
  host: UserBrief;
  registrations?: TournamentRegistration[];
  _count?: { registrations: number };
  createdAt: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamName?: string | null;
  teamSize: number;
  status: string;
  user: UserBrief;
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
