'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi, clanApi, walletApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Card, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import type { Tournament } from '@/types';
import {
  Trophy, Users, Clock, IndianRupee, Zap, Calendar,
  ChevronLeft, UserPlus, Check, AlertCircle, Swords, Key, Copy,
  Crosshair, Skull, Gift, Crown, Medal, Target, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatDateTime, getStatusBadgeVariant } from '@/lib/utils';
import toast from 'react-hot-toast';

type MemberSelection = Record<string, 'playing' | 'substitute'>;

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<MemberSelection>({});
  const [teamName, setTeamName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentApi.getById(id as string),
    enabled: !!id,
  });

  // Fetch user's clan members if tournament is DUO/SQUAD
  const isDuoOrSquad = data?.tournament?.mode === 'DUO' || data?.tournament?.mode === 'SQUAD';
  const { data: clanData } = useQuery({
    queryKey: ['user-clan-members', user?.clanId],
    queryFn: () => clanApi.getById(user!.clanId!),
    enabled: !!user?.clanId && isDuoOrSquad && showRegisterModal,
  });

  const clanMembers = clanData?.clan?.members || [];
  const clan = clanData?.clan;

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet(),
  });

  const walletBalance = walletData?.wallet?.balance || 0;

  const parseEntryFee = (fee: string): number => {
    if (!fee || fee.toLowerCase() === 'free' || fee === '0') return 0;
    return parseFloat(fee.replace(/[^0-9.]/g, '')) || 0;
  };

  const registerMutation = useMutation({
    mutationFn: (data?: { teamName?: string; teamSize?: number }) =>
      tournamentApi.register(id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      toast.success('Registered successfully!');
      setShowRegisterModal(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Registration failed');
    },
  });

  const clanRegisterMutation = useMutation({
    mutationFn: (data: { clanId: string; playingMembers: string[]; substituteMembers?: string[]; teamName?: string }) =>
      tournamentApi.registerClan(id as string, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      toast.success(`Clan registered! +${res.clanXpAwarded} Clan XP`);
      setShowRegisterModal(false);
      setSelectedMembers({});
      setTeamName('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Clan registration failed');
    },
  });

  const tournament = data?.tournament;
  const isRegistered = tournament?.registrations?.some(r => r.user?.id === user?.id);
  const isFull = tournament ? (tournament._count?.registrations || 0) >= tournament.slots : false;

  // Check if any clan member is already registered
  const isClanRegistered = tournament?.registrations?.some(r => r.clanId === user?.clanId);

  const entryFeeAmount = tournament ? parseEntryFee(tournament.entryFee) : 0;
  const hasSufficientBalance = entryFeeAmount === 0 || walletBalance >= entryFeeAmount;

  const handleMemberToggle = (memberId: string, role: 'playing' | 'substitute') => {
    setSelectedMembers(prev => {
      const next = { ...prev };
      if (next[memberId] === role) {
        delete next[memberId];
      } else {
        next[memberId] = role;
      }
      return next;
    });
  };

  const getMemberCounts = () => {
    const counts = { playing: 0, substitute: 0 };
    Object.values(selectedMembers).forEach(role => counts[role as keyof typeof counts]++);
    return counts;
  };

  const isSquad = tournament?.mode === 'SQUAD';
  const maxPlaying = isSquad ? 4 : 2;
  const maxSubs = isSquad ? 3 : 2;

  const counts = getMemberCounts();
  const canRegisterClan = counts.playing === maxPlaying && counts.substitute <= maxSubs;

  const handleClanRegister = () => {
    if (!user?.clanId) {
      toast.error('You must be in a clan to register for DUO/SQUAD tournaments');
      return;
    }
    const playing = Object.entries(selectedMembers)
      .filter(([_, role]) => role === 'playing')
      .map(([id]) => id);
    const subs = Object.entries(selectedMembers)
      .filter(([_, role]) => role === 'substitute')
      .map(([id]) => id);

    clanRegisterMutation.mutate({
      clanId: user.clanId,
      playingMembers: playing,
      substituteMembers: subs.length > 0 ? subs : undefined,
      teamName: teamName || undefined,
    });
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

  if (!tournament) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 text-center">
          <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h2>
          <Link href="/tournaments" className="text-primary hover:underline">Back to tournaments</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Hero */}
          <div className="relative rounded-xl overflow-hidden mb-8">
            {tournament.bannerUrl ? (
              <img src={tournament.bannerUrl} alt="" className="w-full h-48 sm:h-64 object-cover" />
            ) : (
              <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-primary/30 via-primary/10 to-surface flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Trophy className="w-20 h-20 text-primary/40" />
                </motion.div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <Badge className={getStatusBadgeVariant(tournament.status)} size="md">
                {tournament.status === 'REGISTRATION_OPEN' ? 'Registration Open' : tournament.status.charAt(0) + tournament.status.slice(1).toLowerCase().replace(/_/g, ' ')}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">{tournament.title}</h1>
              <p className="text-sm text-white/50 mt-1">{tournament.mode} • {String(tournament.format || '').replace(/_/g, ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <Card className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <IndianRupee className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-xl font-bold text-white">{tournament.prizePool}</p>
                    <p className="text-xs text-white/40">Prize Pool</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-xl font-bold text-white">{tournament._count?.registrations || 0}/{tournament.slots}</p>
                    <p className="text-xs text-white/40">Players</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-xl font-bold text-white">{tournament.mode}</p>
                    <p className="text-xs text-white/40">Mode</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-xl font-bold text-white">{formatDateTime(tournament.startsAt)}</p>
                    <p className="text-xs text-white/40">Date</p>
                  </div>
                </div>
              </Card>

              {/* Prize Distribution */}
              {(tournament as any).prizeDistribution?.enabled && (
                <Card className="p-6 border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Prize Distribution</h3>
                      <p className="text-sm text-white/50">Top {(tournament as any).prizeDistribution.topN} winners</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(tournament as any).prizeDistribution.distribution.map((amount: number, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i === 1 ? 'bg-gray-400/20 text-gray-300' :
                          i === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-white/5 text-white/40'
                        }`}>
                          {i === 0 ? <Crown className="w-4 h-4" /> : i === 1 ? <Medal className="w-4 h-4" /> : i === 2 ? <Medal className="w-4 h-4" /> : `#${i + 1}`}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">
                              {i === 0 ? '1st Place' : i === 1 ? '2nd Place' : i === 2 ? '3rd Place' : `${i + 1}th Place`}
                            </span>
                            <span className="text-sm font-bold text-yellow-400">₹{amount.toLocaleString()}</span>
                          </div>
                          <div className="mt-1.5 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(amount / Math.max(...(tournament as any).prizeDistribution.distribution)) * 100}%` }}
                              className={`h-full rounded-full ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-primary/50'}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-card-border flex items-center justify-between text-sm">
                    <span className="text-white/50">Total Prize Pool</span>
                    <span className="text-lg font-bold text-white">
                      ₹{(tournament as any).prizeDistribution.distribution.reduce((a: number, b: number) => a + b, 0).toLocaleString()}
                    </span>
                  </div>
                </Card>
              )}

              {/* Description */}
              {tournament.description && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">About This Tournament</h3>
                  <p className="text-white/70 leading-relaxed">{tournament.description}</p>
                </Card>
              )}

              {/* Rules */}
              {tournament.rules && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Rules</h3>
                  <p className="text-white/70 whitespace-pre-line leading-relaxed">{tournament.rules}</p>
                </Card>
              )}

              {/* BR Scoreboard */}
              {tournament.format === 'MULTI_ROUND' && (
                <ScoreboardSection tournamentId={id as string} tournament={tournament} />
              )}

              {/* Participants */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Participants ({tournament.registrations?.length || 0})
                </h3>
                {tournament.registrations && tournament.registrations.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      // Group by clan for DUO/SQUAD, show individual for SOLO
                      const clanGroups: Record<string, any[]> = {};
                      const soloPlayers: any[] = [];

                      tournament.registrations.forEach((reg: any) => {
                        if (reg.clanId) {
                          if (!clanGroups[reg.clanId]) clanGroups[reg.clanId] = [];
                          // Only show each member once (they appear multiple times)
                          if (!clanGroups[reg.clanId].find((r: any) => r.user?.id === reg.user?.id)) {
                            clanGroups[reg.clanId].push(reg);
                          }
                        } else {
                          soloPlayers.push(reg);
                        }
                      });

                      return (
                        <>
                          {/* Clan groups */}
                          {Object.entries(clanGroups).map(([clanId, regs]) => (
                            <div key={clanId} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                              <div className="flex items-center gap-2 mb-2 text-sm">
                                <Swords className="w-4 h-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  {regs[0]?.teamName || 'Team'}
                                </span>
                                {regs[0]?.playingMembers && (
                                  <span className="text-xs text-white/30 ml-auto">
                                    {JSON.parse(regs[0].playingMembers).length} playing
                                    {regs[0].substituteMembers && JSON.parse(regs[0].substituteMembers).length > 0 &&
                                      ` + ${JSON.parse(regs[0].substituteMembers).length} subs`
                                    }
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {regs.map((reg: any) => (
                                  <div key={reg.user?.id || reg.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/5">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-primary">
                                        {((reg.user?.ign || reg.user?.username || reg.guestIgn || '?')[0]).toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-xs text-white/80">{reg.user?.ign || reg.user?.username || reg.guestIgn}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {/* Solo & IGN-added players */}
                          {soloPlayers.map((reg: any) => {
                            const displayName = reg.user?.ign || reg.user?.username || reg.guestIgn || 'Unknown';
                            return (
                              <div key={reg.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">
                                    {displayName[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{displayName}</p>
                                  {reg.teamName && (
                                    <p className="text-xs text-white/40">{reg.teamName}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No participants yet. Be the first!</p>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Room Credentials - only show to registered users or host */}
              {(isRegistered || user?.id === tournament.host.id) && tournament.roomId && (
                <Card className="p-6 border-green-500/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="w-4 h-4 text-green-400" />
                    Room Credentials
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-white/40 mb-1">Room ID</p>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/5 border border-green-500/20">
                        <code className="text-sm font-mono text-green-400 flex-1 select-all">{tournament.roomId}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tournament.roomId!);
                            toast.success('Room ID copied!');
                          }}
                          className="p-1 rounded hover:bg-green-500/10 text-green-400/60 hover:text-green-400 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">Password</p>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/5 border border-green-500/20">
                        <code className="text-sm font-mono text-green-400 flex-1 select-all">{tournament.roomPassword}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tournament.roomPassword!);
                            toast.success('Password copied!');
                          }}
                          className="p-1 rounded hover:bg-green-500/10 text-green-400/60 hover:text-green-400 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Per-round room credentials for multi-round tournaments */}
              {tournament?.format === 'MULTI_ROUND' && (isRegistered || user?.id === tournament.host.id) && tournament?.rounds?.some((r: any) => (r.status === 'WAITING' || r.status === 'LIVE') && r.roomId) && (
                <Card className="p-6 border-blue-500/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-blue-400" />
                    Match Rooms
                  </h3>
                  <div className="space-y-4">
                    {tournament.rounds.filter((r: any) => (r.status === 'WAITING' || r.status === 'LIVE') && r.roomId).map((round: any) => (
                      <div key={round.id} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-400">R{round.roundNumber}</span>
                          </div>
                          <p className="text-sm font-semibold text-white">{round.title}</p>
                          <Badge size="sm" variant={round.status === 'LIVE' ? 'success' : 'warning'}>{round.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-white/40 mb-0.5">Room ID</p>
                            <div className="flex items-center gap-1 p-1.5 rounded bg-blue-500/5 border border-blue-500/10">
                              <code className="text-xs font-mono text-blue-300 flex-1 select-all truncate">{round.roomId}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(round.roomId);
                                  toast.success('Room ID copied!');
                                }}
                                className="p-0.5 rounded hover:bg-blue-500/10 text-blue-400/60 hover:text-blue-400 transition-all shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-0.5">Password</p>
                            <div className="flex items-center gap-1 p-1.5 rounded bg-blue-500/5 border border-blue-500/10">
                              <code className="text-xs font-mono text-blue-300 flex-1 select-all truncate">{round.roomPassword}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(round.roomPassword);
                                  toast.success('Password copied!');
                                }}
                                className="p-0.5 rounded hover:bg-blue-500/10 text-blue-400/60 hover:text-blue-400 transition-all shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-white mb-4">Registration</h3>

                {isAuthenticated && user && !user.ign && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-300">
                      Set your{' '}
                      <Link href="/profile" className="underline hover:text-yellow-200">in-game name</Link>
                      {' '}so the host can identify you.
                    </div>
                  </div>
                )}

                {(tournament as any).prizeDistribution?.enabled && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-semibold text-yellow-400">Prize Distribution</span>
                    </div>
                    <div className="space-y-1">
                      {(tournament as any).prizeDistribution.distribution.slice(0, 3).map((amount: number, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-white/50">
                            {i === 0 ? '🥇 1st' : i === 1 ? '🥈 2nd' : '🥉 3rd'}
                          </span>
                          <span className="text-white font-medium">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {(tournament as any).prizeDistribution.topN > 3 && (
                        <p className="text-[10px] text-white/30 pt-1 border-t border-yellow-500/10">
                          + {(tournament as any).prizeDistribution.topN - 3} more positions
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Entry Fee</span>
                    <span className="text-white font-medium">{tournament.entryFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Slots</span>
                    <span className="text-white font-medium">{tournament.slots}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Available</span>
                    <span className="text-white font-medium">
                      {tournament.slots - (tournament._count?.registrations || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Host</span>
                    <span className="text-white font-medium">{tournament.host.username}</span>
                  </div>
                  {tournament.mode !== 'SOLO' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Clan XP</span>
                        <span className="text-green-400 font-medium">
                          +{tournament.mode === 'DUO' ? '50' : '100'} XP
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Required</span>
                        <span className="text-white font-medium">
                          {tournament.mode === 'SQUAD' ? '4+3 subs' : '2+2 subs'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {isRegistered ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Check className="w-4 h-4" />
                    {isDuoOrSquad ? 'Your clan is registered' : 'You are registered'}
                  </div>
                ) : (
                  <>
                    {isFull ? (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <AlertCircle className="w-4 h-4" />
                        Tournament is full
                      </div>
                    ) : tournament.status === 'REGISTRATION_OPEN' || tournament.status === 'UPCOMING' ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.error('Please login to register');
                            router.push('/auth/login');
                            return;
                          }
                          if (isDuoOrSquad && !user?.clanId) {
                            toast.error('You must be in a clan to register for DUO/SQUAD tournaments');
                            return;
                          }
                          if (isDuoOrSquad && isClanRegistered) {
                            toast.error('Your clan is already registered');
                            return;
                          }
                          setShowRegisterModal(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4" />
                        {isDuoOrSquad ? 'Register as Clan' : 'Register Now'}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-white/40 text-sm p-3 rounded-lg bg-white/5">
                        <Clock className="w-4 h-4" />
                        Registration is closed
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Register Modal - Clan Member Selection for DUO/SQUAD */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <Card className="p-6">
                {isDuoOrSquad ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Swords className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Clan Registration</h3>
                        <p className="text-sm text-white/50">{tournament.mode} Mode</p>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Playing: <strong className="text-white">{counts.playing}/{maxPlaying}</strong></span>
                        <span className="text-white/70">Substitutes: <strong className="text-white">{counts.substitute}/{maxSubs}</strong></span>
                        <span className="text-green-400 font-medium">+{isSquad ? '100' : '50'} Clan XP</span>
                      </div>
                      {(tournament as any).prizeDistribution?.enabled && (
                        <div className="pt-2 border-t border-primary/10">
                          <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-1">Prize Distribution</p>
                          {(tournament as any).prizeDistribution.distribution.map((amount: number, i: number) => (
                            <div key={i} className="flex items-center justify-between py-0.5">
                              <span className="text-xs text-white/50">{i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${i + 1}`}</span>
                              <span className="text-xs font-semibold text-yellow-400">₹{amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Team Name */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Team Name (optional)</label>
                      <input
                        type="text"
                        placeholder={clan ? `Team ${clan.name}` : 'Enter team name...'}
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="input-base"
                      />
                    </div>

                    {/* Member Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Select Clan Members
                      </label>
                      <p className="text-xs text-white/40 mb-3">
                        Click on a member to toggle between playing, substitute, or unselected.
                      </p>

                      {clanMembers.length === 0 ? (
                        <div className="text-center py-8 text-white/40 text-sm">
                          No clan members found. Members must join your clan first.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {clanMembers.map((member: any) => {
                            const role = selectedMembers[member.id];
                            const isSelf = member.id === user?.id;
                            return (
                              <div
                                key={member.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                  role === 'playing'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : role === 'substitute'
                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                }`}
                                onClick={() => {
                                  if (!role) {
                                    if (counts.playing < maxPlaying) {
                                      handleMemberToggle(member.id, 'playing');
                                    } else {
                                      toast.error(`Maximum ${maxPlaying} playing members`);
                                    }
                                  } else if (role === 'playing') {
                                    if (counts.substitute < maxSubs) {
                                      handleMemberToggle(member.id, 'substitute');
                                    } else {
                                      handleMemberToggle(member.id, 'playing');
                                    }
                                  } else {
                                    handleMemberToggle(member.id, 'substitute');
                                  }
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (role === 'playing') {
                                    handleMemberToggle(member.id, 'substitute');
                                  } else if (role === 'substitute') {
                                    handleMemberToggle(member.id, 'playing');
                                  } else {
                                    if (counts.playing < maxPlaying) {
                                      handleMemberToggle(member.id, 'playing');
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {member.avatarUrl ? (
                                      <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-primary">
                                        {member.username[0].toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {member.username}
                                      {isSelf && <span className="text-xs text-white/30 ml-1">(you)</span>}
                                    </p>
                                    <p className="text-xs text-white/40">{member.clanRole || 'MEMBER'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {role === 'playing' && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded">Playing</span>
                                  )}
                                  {role === 'substitute' && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">Sub</span>
                                  )}
                                  {!role && (
                                    <span className="text-[10px] text-white/30">Click to add</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {entryFeeAmount > 0 && (
                      <div className="flex items-center justify-between text-sm mb-4 px-3 py-2 rounded-lg bg-white/5">
                        <span className="text-white/50">Entry Fee</span>
                        <span className="text-white font-medium">{tournament.entryFee}</span>
                      </div>
                    )}
                    {entryFeeAmount > 0 && (
                      <div className="flex items-center justify-between text-sm mb-4 px-3 py-2 rounded-lg bg-white/5">
                        <span className="text-white/50">Wallet Balance</span>
                        <span className={`font-medium ${hasSufficientBalance ? 'text-green-400' : 'text-red-400'}`}>
                          ₹{walletBalance.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {entryFeeAmount > 0 && !hasSufficientBalance && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                        <p className="text-red-400 font-medium mb-1">Insufficient balance</p>
                        <p className="text-red-400/70 text-xs">
                          You need ₹{entryFeeAmount.toLocaleString()} to register.{' '}
                          <Link href="/profile" className="text-primary hover:underline">Add funds</Link>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setShowRegisterModal(false);
                          setSelectedMembers({});
                          setTeamName('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!canRegisterClan || clanMembers.length === 0 || (entryFeeAmount > 0 && !hasSufficientBalance)}
                        onClick={handleClanRegister}
                        loading={clanRegisterMutation.isPending}
                      >
                        {entryFeeAmount > 0 && !hasSufficientBalance
                          ? 'Insufficient Balance'
                          : canRegisterClan
                            ? `Register Clan (+${isSquad ? '100' : '50'} XP)`
                            : `Select ${maxPlaying - counts.playing} more playing members`}
                      </Button>
                    </div>

                    <p className="text-xs text-white/20 text-center mt-3">
                      Left-click to toggle between unselected → playing → substitute. Right-click to reverse.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">Confirm Registration</h3>
                    <p className="text-white/50 text-sm mb-6">
                      You are about to register for <strong className="text-white">{tournament.title}</strong>
                    </p>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Prize Pool</span>
                        <span className="text-white font-medium">{tournament.prizePool}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Entry Fee</span>
                        <span className="text-white font-medium">{tournament.entryFee}</span>
                      </div>
                      {entryFeeAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Wallet Balance</span>
                          <span className={`font-medium ${hasSufficientBalance ? 'text-green-400' : 'text-red-400'}`}>
                            ₹{walletBalance.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-white/50">Mode</span>
                        <span className="text-white font-medium">{tournament.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Players</span>
                        <span className="text-white font-medium">{tournament._count?.registrations || 0}/{tournament.slots}</span>
                      </div>
                      {(tournament as any).prizeDistribution?.enabled && (
                        <div className="mt-3 pt-3 border-t border-card-border">
                          <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-2">Prize Distribution</p>
                          {(tournament as any).prizeDistribution.distribution.map((amount: number, i: number) => (
                            <div key={i} className="flex items-center justify-between py-0.5">
                              <span className="text-xs text-white/50">
                                {i === 0 ? '🥇 1st' : i === 1 ? '🥈 2nd' : i === 2 ? '🥉 3rd' : `#${i + 1}th`}
                              </span>
                              <span className="text-xs font-semibold text-yellow-400">₹{amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {entryFeeAmount > 0 && !hasSufficientBalance && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                        <p className="text-red-400 font-medium mb-1">Insufficient balance</p>
                        <p className="text-red-400/70 text-xs">
                          You need ₹{entryFeeAmount.toLocaleString()} to register.{' '}
                          <Link href="/profile" className="text-primary hover:underline">Add funds</Link>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowRegisterModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!hasSufficientBalance}
                        onClick={() => registerMutation.mutate({})}
                        loading={registerMutation.isPending}
                      >
                        Confirm
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

function ScoreboardSection({ tournamentId, tournament }: { tournamentId: string; tournament: Tournament }) {
  const { data, isLoading } = useQuery({
    queryKey: ['scoreboard', tournamentId],
    queryFn: () => tournamentApi.getScoreboard(tournamentId),
    refetchInterval: tournament.status === 'LIVE' ? 10000 : false,
  });

  const isHost = useAuthStore.getState().user?.id === tournament.host.id;

  const scoreboard = data?.scoreboard || [];
  const rounds = data?.rounds || [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          Scoreboard
        </h3>
        {tournament.format === 'MULTI_ROUND' && (
          <span className="text-xs text-white/40">
            {tournament.totalRounds} Match{Number(tournament.totalRounds) > 1 ? 'es' : ''} • {tournament.killPoints}pt per kill
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : scoreboard.length === 0 ? (
        <p className="text-white/40 text-sm">
          {tournament.status === 'LIVE' || tournament.status === 'COMPLETED'
            ? 'No scores yet. The organizer will add match scores soon.'
            : 'Scores will appear once matches start.'}
        </p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2 text-xs text-white/40 font-medium uppercase tracking-wider w-12">#</th>
                <th className="text-left px-4 py-2 text-xs text-white/40 font-medium uppercase tracking-wider">Team</th>
                {rounds.map((r) => (
                  <th key={r.id} className="text-center px-3 py-2 text-xs text-white/40 font-medium uppercase tracking-wider">
                    <div>R{r.roundNumber}</div>
                    <div className="text-[10px] text-white/20 truncate max-w-[60px]">{r.title}</div>
                  </th>
                ))}
                <th className="text-center px-4 py-2 text-xs text-white/40 font-medium uppercase tracking-wider">Kills</th>
                <th className="text-center px-4 py-2 text-xs text-primary font-medium uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {scoreboard.map((entry, i) => (
                <tr key={entry.teamId} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i < 3 ? 'bg-primary/[0.03]' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-white">{entry.teamName}</span>
                    <span className="text-xs text-white/30 ml-2">{entry.matchesPlayed}m</span>
                  </td>
                  {rounds.map((r) => {
                    const rs = entry.roundScores[r.roundNumber];
                    return (
                      <td key={r.id} className="text-center px-3 py-3">
                        {rs ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-bold ${rs.placement === 1 ? 'text-yellow-400' : rs.placement <= 3 ? 'text-primary' : 'text-white/70'}`}>
                              #{rs.placement}
                            </span>
                            <span className="text-xs text-white/30">{rs.kills}k • {rs.points}pt</span>
                          </div>
                        ) : (
                          <span className="text-white/10">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-4 py-3">
                    <span className="text-sm font-bold text-white/70">{entry.totalKills}</span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className="text-lg font-black text-primary">{entry.totalPoints}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Placement points legend */}
      {tournament.placementPoints && tournament.placementPoints.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50 transition-colors">
            Placement Points
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tournament.placementPoints.map((pts, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                #{i + 1}: {pts}pt
              </span>
            ))}
          </div>
        </details>
      )}
    </Card>
  );
}
