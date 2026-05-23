import { API_URL } from '@/lib/utils';
import {
  AuthResponse,
  User,
  UserBrief,
  Tournament,
  TournamentRegistration,
  Clan,
  ClanInvite,
  LeaderboardEntry,
  ClanLeaderboardEntry,
  AdminStats,
  Report,
  Pagination,
  Notification,
  Wallet,
  TransactionItem,
} from '@/types';

class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || 'Request failed', res.status, data.details);
  }

  return data as T;
}

// Auth API
export const authApi = {
  signup: (data: { username: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  googleAuth: (data: { googleId: string; email: string; username: string; avatarUrl?: string }) =>
    request<AuthResponse>('/auth/oauth/google', { method: 'POST', body: JSON.stringify(data) }),

  discordAuth: (data: { discordId: string; email: string; username: string; avatarUrl?: string }) =>
    request<AuthResponse>('/auth/oauth/discord', { method: 'POST', body: JSON.stringify(data) }),

  supabaseAuth: (data: { supabaseId: string; email: string; username: string; avatarUrl?: string }) =>
    request<AuthResponse>('/auth/supabase', { method: 'POST', body: JSON.stringify(data) }),

  getProfile: () =>
    request<{ user: User }>('/auth/profile'),

  updateProfile: (data: Partial<{ username: string; avatarUrl: string; bannerUrl: string }>) =>
    request<{ message: string; user: User }>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Tournament API
export const tournamentApi = {
  getAll: (params?: { status?: string; mode?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.mode && params.mode !== 'ALL') searchParams.set('mode', params.mode);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ tournaments: Tournament[]; pagination: Pagination }>(`/tournaments${qs ? `?${qs}` : ''}`);
  },

  getLive: () =>
    request<{ tournaments: Tournament[] }>('/tournaments/live'),

  getById: (id: string) =>
    request<{ tournament: Tournament }>(`/tournaments/${id}`),

  getMyRegistrations: () =>
    request<{ registrations: TournamentRegistration[] }>('/tournaments/my-registrations'),

  create: (data: any) =>
    request<{ message: string; tournament: Tournament }>('/tournaments', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    request<{ message: string; tournament: Tournament }>(`/tournaments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  register: (id: string, data?: { teamName?: string; teamSize?: number }) =>
    request<{ message: string; registration: TournamentRegistration }>(`/tournaments/${id}/register`, { method: 'POST', body: JSON.stringify(data || {}) }),

  registerClan: (id: string, data: { clanId: string; playingMembers: string[]; substituteMembers?: string[]; teamName?: string }) =>
    request<{ message: string; clanXpAwarded: number; registrations: TournamentRegistration[] }>(`/tournaments/${id}/clan-register`, { method: 'POST', body: JSON.stringify(data) }),

  unregister: (id: string) =>
    request<{ message: string }>(`/tournaments/${id}/register`, { method: 'DELETE' }),
};

// Clan API
export const clanApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ clans: Clan[]; pagination: Pagination }>(`/clans${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    request<{ clan: Clan & { members: any[] } }>(`/clans/${id}`),

  create: (data: { name: string; tag: string; description?: string; color?: string }) =>
    request<{ message: string; clan: Clan }>('/clans', { method: 'POST', body: JSON.stringify(data) }),

  join: (id: string) =>
    request<{ message: string }>(`/clans/${id}/join`, { method: 'POST' }),

  leave: (id: string) =>
    request<{ message: string }>(`/clans/${id}/leave`, { method: 'POST' }),

  update: (id: string, data: any) =>
    request<{ message: string; clan: Clan }>(`/clans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  kickMember: (clanId: string, userId: string) =>
    request<{ message: string }>(`/clans/${clanId}/members/${userId}`, { method: 'DELETE' }),

  getLeaderboard: () =>
    request<{ clans: ClanLeaderboardEntry[] }>('/clans/leaderboard'),

  // Invite endpoints
  searchUsers: (q: string) =>
    request<{ users: UserBrief[] }>(`/clans/search-users?q=${encodeURIComponent(q)}`),

  getMyInvites: () =>
    request<{ invites: ClanInvite[] }>('/clans/invites'),

  getClanInvites: (clanId: string) =>
    request<{ invites: ClanInvite[] }>(`/clans/${clanId}/invites`),

  sendInvite: (clanId: string, username: string) =>
    request<{ message: string }>(`/clans/${clanId}/invite`, { method: 'POST', body: JSON.stringify({ username }) }),

  acceptInvite: (inviteId: string) =>
    request<{ message: string }>(`/clans/invites/${inviteId}/accept`, { method: 'PATCH' }),

  declineInvite: (inviteId: string) =>
    request<{ message: string }>(`/clans/invites/${inviteId}/decline`, { method: 'PATCH' }),

  cancelInvite: (inviteId: string) =>
    request<{ message: string }>(`/clans/invites/${inviteId}`, { method: 'DELETE' }),

  delete: (id: string) =>
    request<{ message: string }>(`/clans/${id}`, { method: 'DELETE' }),

  transferLeadership: (clanId: string, newLeaderId: string) =>
    request<{ message: string }>(`/clans/${clanId}/transfer-leadership`, { method: 'POST', body: JSON.stringify({ newLeaderId }) }),

  // Join Request endpoints
  applyToJoin: (clanId: string) =>
    request<{ message: string }>(`/clans/${clanId}/apply`, { method: 'POST' }),

  getJoinRequests: (clanId: string) =>
    request<{ requests: any[] }>(`/clans/${clanId}/join-requests`),

  approveJoinRequest: (requestId: string) =>
    request<{ message: string }>(`/clans/join-requests/${requestId}/approve`, { method: 'POST' }),

  rejectJoinRequest: (requestId: string) =>
    request<{ message: string }>(`/clans/join-requests/${requestId}/reject`, { method: 'POST' }),

  // Activity Logs
  getActivityLogs: (clanId: string) =>
    request<{ logs: import('@/types').ClanActivityLog[] }>(`/clans/${clanId}/activity-logs`),
};

// Leaderboard API
export const leaderboardApi = {
  getGlobal: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ leaderboard: LeaderboardEntry[]; pagination: Pagination }>(`/leaderboard/global${qs ? `?${qs}` : ''}`);
  },

  getSeasonal: (params?: { season?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.season) searchParams.set('season', params.season);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ leaderboard: LeaderboardEntry[]; pagination: Pagination; season: string }>(`/leaderboard/seasonal${qs ? `?${qs}` : ''}`);
  },

  getClan: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ leaderboard: ClanLeaderboardEntry[]; pagination: Pagination }>(`/leaderboard/clan${qs ? `?${qs}` : ''}`);
  },
};

// Admin API
export const adminApi = {
  getStats: () =>
    request<{ stats: AdminStats }>('/admin/stats'),

  getUsers: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ users: any[]; pagination: Pagination }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  banUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}/ban`, { method: 'PATCH' }),

  updateUserRole: (id: string, role: string) =>
    request<{ message: string; user: any }>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getReports: (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ reports: Report[]; pagination: Pagination }>(`/admin/reports${qs ? `?${qs}` : ''}`);
  },

  resolveReport: (id: string, data: { status: string; action?: string }) =>
    request<{ message: string }>(`/admin/reports/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(data) }),

  getClans: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ clans: Clan[]; pagination: Pagination }>(`/admin/clans${qs ? `?${qs}` : ''}`);
  },

  deleteClan: (id: string) =>
    request<{ message: string }>(`/admin/clans/${id}`, { method: 'DELETE' }),

  // Tournament admin
  updateTournamentStatus: (id: string, status: string) =>
    request<{ message: string; tournament: Tournament }>(`/admin/tournaments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  deleteTournament: (id: string) =>
    request<{ message: string }>(`/admin/tournaments/${id}`, { method: 'DELETE' }),

  getAdminTournament: (id: string) =>
    request<{ tournament: Tournament & { registrations: any[]; _count: { registrations: number } } }>(`/admin/tournaments/${id}`),

  // Broadcast
  broadcastNotification: (data: { title: string; message: string; type?: string; link?: string }) =>
    request<{ message: string; recipientCount: number }>('/admin/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),
};

// Notification API
export const notificationApi = {
  getAll: () =>
    request<{ notifications: Notification[] }>('/notifications'),

  markRead: (id: string) =>
    request<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),
};

// Wallet API
export const walletApi = {
  getWallet: () =>
    request<{ wallet: Wallet }>('/wallet'),

  deposit: (amount: number) =>
    request<{ message: string; wallet: Wallet }>('/wallet/deposit', { method: 'POST', body: JSON.stringify({ amount }) }),

  withdraw: (amount: number) =>
    request<{ message: string; wallet: Wallet }>('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),

  getTransactions: () =>
    request<{ transactions: TransactionItem[] }>('/wallet/transactions'),
};

// Report API (user-facing)
export const reportApi = {
  create: (data: { reportedId: string; reason: string; description?: string }) =>
    request<{ message: string; report: Report }>('/reports', { method: 'POST', body: JSON.stringify(data) }),
};

export { ApiError };
