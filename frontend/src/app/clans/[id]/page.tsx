'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clanApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  Users, Trophy, ChevronLeft, LogOut, Crown,
  Search, X, UserPlus, Send, Clock, Settings, Trash2, AlertTriangle, Save,
  UserRoundPlus, Check, XCircle, UserMinus, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateKd } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ClanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', tag: '', description: '', color: '#ff1f1f' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string | null>(null);
  const [kickConfirmMember, setKickConfirmMember] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clan', id],
    queryFn: () => clanApi.getById(id as string),
    enabled: !!id,
  });

  const { data: invitesData } = useQuery({
    queryKey: ['clan-invites-sent', id],
    queryFn: () => clanApi.getClanInvites(id as string),
    enabled: !!id && isAuthenticated && data?.clan?.leader?.id === user?.id,
  });

  const { data: joinRequestsData } = useQuery({
    queryKey: ['join-requests', id],
    queryFn: () => clanApi.getJoinRequests(id as string),
    enabled: !!id && isAuthenticated && data?.clan?.leader?.id === user?.id,
  });

  const joinMutation = useMutation({
    mutationFn: () => clanApi.join(id as string),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
      toast.success(res.message || 'Joined clan!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to join'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => clanApi.leave(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
      toast.success('Left clan');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to leave'),
  });

  const sendInviteMutation = useMutation({
    mutationFn: (username: string) => clanApi.sendInvite(id as string, username),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clan-invites-sent', id] });
      setInviteModalOpen(false);
      setSearchQuery('');
      toast.success(res.message || 'Invite sent!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to send invite'),
  });

  // Debounced user search for auto-suggest
  const { data: searchResults, isLoading: searchingUsers } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: () => clanApi.searchUsers(searchQuery),
    enabled: searchQuery.trim().length >= 2 && inviteModalOpen,
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId: string) => clanApi.cancelInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-invites-sent', id] });
      toast.success('Invite cancelled');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to cancel invite'),
  });

  const updateClanMutation = useMutation({
    mutationFn: () => clanApi.update(id as string, editForm),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
      setSettingsModalOpen(false);
      setEditErrors({});
      toast.success(res.message || 'Clan updated!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update clan'),
  });

  const deleteClanMutation = useMutation({
    mutationFn: () => clanApi.delete(id as string),
    onSuccess: (res) => {
      toast.success(res.message || 'Clan deleted');
      router.push('/clans');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete clan'),
  });

  const transferLeadershipMutation = useMutation({
    mutationFn: (newLeaderId: string) => clanApi.transferLeadership(id as string, newLeaderId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
      setLeaveModalOpen(false);
      setSelectedNewLeader(null);
      toast.success(res.message || 'Leadership transferred!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to transfer leadership'),
  });

  const applyToJoinMutation = useMutation({
    mutationFn: () => clanApi.applyToJoin(id as string),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', id] });
      toast.success(res.message || 'Join request sent!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to send join request'),
  });

  const approveRequestMutation = useMutation({
    mutationFn: (requestId: string) => clanApi.approveJoinRequest(requestId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', id] });
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
      toast.success(res.message || 'Request approved!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to approve request'),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => clanApi.rejectJoinRequest(requestId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', id] });
      toast.success(res.message || 'Request rejected');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to reject request'),
  });

  const { data: activityLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ['clan-activity-logs', id],
    queryFn: () => clanApi.getActivityLogs(id as string),
    enabled: !!id,
  });

  const kickMemberMutation = useMutation({
    mutationFn: (userId: string) => clanApi.kickMember(id as string, userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
      toast.success(res.message || 'Member kicked');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to kick member'),
  });

  const clan = data?.clan;
  const isMember = clan?.members?.some((m: any) => m.id === user?.id);
  const isLeader = clan?.leader?.id === user?.id;
  const pendingInvites = invitesData?.invites?.filter((i: any) => i.status === 'PENDING') || [];
  const pendingJoinRequests = joinRequestsData?.requests?.filter((r: any) => r.status === 'PENDING') || [];

  // Populate edit form when clan data loads
  useEffect(() => {
    if (clan) {
      setEditForm({
        name: clan.name,
        tag: clan.tag,
        description: clan.description || '',
        color: clan.color || '#ff1f1f',
      });
    }
  }, [clan]);

  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (editForm.name.length < 3) errs.name = 'Name must be at least 3 characters';
    if (editForm.tag.length < 2 || editForm.tag.length > 6) errs.tag = 'Tag must be 2-6 characters';
    if (!/^[A-Z0-9]+$/.test(editForm.tag)) errs.tag = 'Tag must be uppercase alphanumeric';
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdateClan = () => {
    if (!validateEdit()) return;
    updateClanMutation.mutate();
  };

  const handleDeleteClan = () => {
    deleteClanMutation.mutate();
    setDeleteConfirm(false);
    setSettingsModalOpen(false);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-20 max-w-4xl mx-auto px-4">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-4" />
          <div className="h-64 rounded-xl bg-card border border-card-border animate-pulse" />
        </div>
      </main>
    );
  }

  if (!clan) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-20 text-center">
          <p className="text-white/40">Clan not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Clan Header */}
          <Card className="p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shrink-0"
                style={{ backgroundColor: `${clan.color || '#ff1f1f'}20`, color: clan.color || '#ff1f1f' }}
              >
                {clan.tag[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-white">{clan.name}</h1>
                <p className="text-white/40 mt-1">[{clan.tag}] · Led by {clan.leader?.username}</p>
                {clan.description && (
                  <p className="text-white/60 text-sm mt-2">{clan.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAuthenticated && isLeader && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setInviteModalOpen(true)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Player
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditForm({ name: clan.name, tag: clan.tag, description: clan.description || '', color: clan.color || '#ff1f1f' }); setDeleteConfirm(false); setSettingsModalOpen(true); }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        const otherMembers = clan.members?.filter((m: any) => m.id !== user?.id) || [];
                        if (otherMembers.length === 0) {
                          leaveMutation.mutate();
                        } else {
                          setSelectedNewLeader(null);
                          setLeaveModalOpen(true);
                        }
                      }}
                      loading={leaveMutation.isPending}
                    >
                      <LogOut className="w-4 h-4" />
                      Leave Clan
                    </Button>
                  </>
                )}
                {isMember && !isLeader && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => leaveMutation.mutate()}
                    loading={leaveMutation.isPending}
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Clan
                  </Button>
                )}
                {isAuthenticated && !isMember && !user?.clanId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => applyToJoinMutation.mutate()}
                    loading={applyToJoinMutation.isPending}
                  >
                    <UserRoundPlus className="w-4 h-4" />
                    Apply to Join
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{clan.points}</p>
                <p className="text-xs text-white/40">Clan XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{clan.members?.length || 0}</p>
                <p className="text-xs text-white/40">Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{clan.wins}</p>
                <p className="text-xs text-white/40">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{clan.matchesPlayed}</p>
                <p className="text-xs text-white/40">Matches</p>
              </div>
            </div>
          </Card>

          {/* Leader: Pending Invites Section */}
          {isLeader && pendingInvites.length > 0 && (
            <Card className="p-6 mb-6 border-primary/20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Pending Invites ({pendingInvites.length})
              </h2>
              <div className="space-y-2">
                {pendingInvites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {invite.invitee?.avatarUrl ? (
                          <img src={invite.invitee.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {invite.invitee?.username?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{invite.invitee?.username}</p>
                        <p className="text-xs text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Invited by {invite.inviter?.username}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInviteMutation.mutate(invite.id)}
                      loading={cancelInviteMutation.isPending}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Leader: Pending Join Requests */}
          {isLeader && pendingJoinRequests.length > 0 && (
            <Card className="p-6 mb-6 border-green-500/20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserRoundPlus className="w-5 h-5 text-green-400" />
                Join Requests ({pendingJoinRequests.length})
              </h2>
              <div className="space-y-2">
                {pendingJoinRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center overflow-hidden">
                        {req.user?.avatarUrl ? (
                          <img src={req.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-green-400">
                            {req.user?.username?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{req.user?.username}</p>
                        <p className="text-xs text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Requested to join
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectRequestMutation.mutate(req.id)}
                        loading={rejectRequestMutation.isPending}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => approveRequestMutation.mutate(req.id)}
                        loading={approveRequestMutation.isPending}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Members */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Members ({clan.members?.length || 0}/{clan.maxMembers || 15})
            </h2>

            <div className="space-y-2">
              {clan.members?.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">{member.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {member.username}
                        {member.clanRole === 'LEADER' && (
                          <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        )}
                      </p>
                      <p className="text-xs text-white/40">
                        {member.clanRole === 'LEADER' ? 'Leader' : 'Member'}
                      </p>
                    </div>
                  </div>                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>{member.points} pts</span>
                        <span>{calculateKd(member.kills || 0, member.deaths || 0)} KD</span>
                        <span>{member.wins} wins</span>
                      </div>
                      {isLeader && member.clanRole !== 'LEADER' && (
                        <button
                          onClick={() => setKickConfirmMember(member)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0"
                          title="Kick member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Logs */}
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Activity Log
            </h2>

            {logsLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/5" />

                <div className="space-y-0">
                  {(activityLogsData?.logs?.length ?? 0) > 0 ? (
                    activityLogsData!.logs.map((log: any, idx: number) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-start gap-4 py-3"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-0.5">
                          <div className={`w-[10px] h-[10px] rounded-full border-2 ${
                            log.action === 'MEMBER_KICKED' ? 'border-red-500 bg-red-500/20' :
                            log.action === 'MEMBER_JOINED' ? 'border-green-500 bg-green-500/20' :
                            log.action === 'MEMBER_LEFT' ? 'border-yellow-500 bg-yellow-500/20' :
                            log.action === 'LEADERSHIP_TRANSFERRED' ? 'border-purple-500 bg-purple-500/20' :
                            log.action === 'CLAN_CREATED' ? 'border-blue-500 bg-blue-500/20' :
                            log.action === 'CLAN_DISBANDED' ? 'border-red-600 bg-red-600/20' :
                            log.action === 'JOIN_REQUEST_APPROVED' ? 'border-emerald-500 bg-emerald-500/20' :
                            'border-white/30 bg-white/10'
                          }`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-white">{log.actor?.username || 'Unknown'}</span>
                            <ActionText action={log.action} details={log.details} />
                          </div>
                          <p className="text-xs text-white/30 mt-0.5">{formatTimeAgo(log.createdAt)}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-sm text-white/30">No activity yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Invite Player Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setInviteModalOpen(false); setSearchQuery(''); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Invite Player
                  </h3>
                  <button
                    onClick={() => { setInviteModalOpen(false); setSearchQuery(''); }}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search players by username..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim().length >= 1) { setShowSuggestions(false); sendInviteMutation.mutate(searchQuery.trim()); } }}
                    className="input-base pl-10 w-full"
                    autoFocus
                  />

                  {/* Auto-suggest dropdown */}
                  {showSuggestions && searchQuery.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                      {searchingUsers ? (
                        <div className="p-3 text-sm text-white/40 text-center">Searching...</div>
                      ) : (searchResults?.users?.length ?? 0) > 0 ? (
                        (searchResults?.users ?? []).map((u: any) => (
                          <button
                            key={u.id}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                            onClick={() => {
                              setSearchQuery(u.username);
                              setShowSuggestions(false);
                            }}
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-primary">{u.username[0].toUpperCase()}</span>
                              )}
                            </div>
                            <span className="text-sm text-white">{u.username}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-white/40 text-center">No players found</div>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-white/30 mb-4">
                  Search for a player by username, then click send to invite them.
                </p>

                {searchQuery.trim().length >= 1 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                    <span className="text-sm text-white">Invite <strong>{searchQuery.trim()}</strong>?</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setInviteModalOpen(false); setSearchQuery(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={searchQuery.trim().length < 1}
                    onClick={() => sendInviteMutation.mutate(searchQuery.trim())}
                    loading={sendInviteMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                    Send Invite
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setSettingsModalOpen(false); setEditErrors({}); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Clan Settings
                  </h3>
                  <button
                    onClick={() => { setSettingsModalOpen(false); setEditErrors({}); }}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                {/* Edit Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Clan Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="input-base w-full"
                      placeholder="e.g. Phoenix Rising"
                    />
                    {editErrors.name && <p className="text-xs text-red-400 mt-1">{editErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Clan Tag</label>
                    <input
                      type="text"
                      value={editForm.tag}
                      onChange={(e) => setEditForm({ ...editForm, tag: e.target.value.toUpperCase() })}
                      className="input-base w-full"
                      placeholder="e.g. PHNX"
                    />
                    {editErrors.tag && <p className="text-xs text-red-400 mt-1">{editErrors.tag}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Description (optional)</label>
                    <textarea
                      className="input-base w-full min-h-[80px] resize-none"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Tell players about your clan..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Clan Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                      />
                      <span className="text-sm text-white/40">{editForm.color}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleUpdateClan}
                    loading={updateClanMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>

                {/* Delete Clan Section */}
                <hr className="border-white/5 mb-6" />

                {!deleteConfirm ? (
                  <div>
                    <p className="text-sm text-white/40 mb-3">Danger Zone</p>
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Clan
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-400 mb-1">
                          Are you absolutely sure?
                        </p>
                        <p className="text-xs text-white/50">
                          This will permanently delete <strong className="text-white">{clan.name}</strong> and all its data.
                          All members will be removed. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        onClick={handleDeleteClan}
                        loading={deleteClanMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                        Confirm Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Leadership Modal */}
      <AnimatePresence>
        {leaveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setLeaveModalOpen(false); setSelectedNewLeader(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-primary" />
                    Transfer Leadership
                  </h3>
                  <button
                    onClick={() => { setLeaveModalOpen(false); setSelectedNewLeader(null); }}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>
                <p className="text-sm text-white/40 mb-4">
                  Select a member to become the new clan leader before you leave.
                </p>

                <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
                  {clan.members
                    ?.filter((m: any) => m.id !== user?.id)
                    .map((member: any) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedNewLeader(
                          selectedNewLeader === member.id ? null : member.id
                        )}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                          selectedNewLeader === member.id
                            ? 'bg-primary/20 border border-primary/30'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-primary">{member.username[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{member.username}</p>
                          <p className="text-xs text-white/40">{member.points} pts</p>
                        </div>
                        {selectedNewLeader === member.id && (
                          <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                        )}
                      </button>
                    ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setLeaveModalOpen(false); setSelectedNewLeader(null); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedNewLeader}
                    onClick={() => {
                      if (selectedNewLeader) {
                        transferLeadershipMutation.mutate(selectedNewLeader, {
                          onSuccess: () => {
                            // After transfer, leave the clan
                            leaveMutation.mutate();
                          },
                        });
                      }
                    }}
                    loading={transferLeadershipMutation.isPending || leaveMutation.isPending}
                  >
                    <Crown className="w-4 h-4" />
                    Transfer & Leave
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kick Member Confirmation Modal */}
      <AnimatePresence>
        {kickConfirmMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setKickConfirmMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 400, delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center"
                >
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </motion.div>

                <h3 className="text-lg font-bold text-white mb-2">
                  Kick Member
                </h3>
                <p className="text-sm text-white/50 mb-1">
                  Are you sure you want to kick
                </p>
                <p className="text-base font-semibold text-white mb-6">
                  {kickConfirmMember.username}
                </p>

                {kickConfirmMember.avatarUrl && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={kickConfirmMember.avatarUrl}
                      alt=""
                      className="w-14 h-14 rounded-full border-2 border-red-500/30 object-cover"
                    />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 mb-6">
                  <p className="text-xs text-red-400/70">
                    This will remove <strong className="text-red-300">{kickConfirmMember.username}</strong> from <strong className="text-white">{clan?.name}</strong>.
                    They will be notified about this action.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setKickConfirmMember(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      kickMemberMutation.mutate(kickConfirmMember.id, {
                        onSuccess: () => setKickConfirmMember(null),
                        onError: () => setKickConfirmMember(null),
                      });
                    }}
                    loading={kickMemberMutation.isPending}
                  >
                    <UserMinus className="w-4 h-4" />
                    Confirm Kick
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ACTION_LABELS: Record<string, { text: string; icon?: string }> = {
  MEMBER_KICKED: { text: 'kicked' },
  MEMBER_JOINED: { text: 'joined the clan' },
  MEMBER_LEFT: { text: 'left the clan' },
  LEADERSHIP_TRANSFERRED: { text: 'transferred leadership' },
  CLAN_CREATED: { text: 'created the clan' },
  CLAN_DISBANDED: { text: 'disbanded the clan' },
  JOIN_REQUEST_APPROVED: { text: 'approved the join request of' },
};

function ActionText({ action, details }: { action: string; details?: string | null }) {
  const label = ACTION_LABELS[action];
  if (!label) return <span className="text-sm text-white/50">{action.replace(/_/g, ' ').toLowerCase()}</span>;

  let extra = '';
  if (details) {
    try {
      const parsed = JSON.parse(details);
      if (action === 'LEADERSHIP_TRANSFERRED' && parsed.newLeader) {
        extra = ` to ${parsed.newLeader}`;
      } else if (action === 'MEMBER_KICKED' && parsed.kickedUsername) {
        extra = ` ${parsed.kickedUsername} from the clan`;
      } else if (action === 'JOIN_REQUEST_APPROVED' && parsed.username) {
        extra = ` ${parsed.username}`;
      }
    } catch {}
  }

  return <span className="text-sm text-white/50">{label.text}{extra}</span>;
}
