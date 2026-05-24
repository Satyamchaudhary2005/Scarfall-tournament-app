'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Button, Input, Badge, Select } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Plus, Search, X, Trash2, Edit3,
  AlertTriangle, RefreshCw, PlayCircle, CheckCircle, Clock, Users, Key,
  Crosshair, Skull, Target, Swords,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function OrganizerPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50">{!isAuthenticated ? 'Please sign in to manage tournaments' : 'Organizer access required'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-white">My Tournaments</h1>
              <p className="text-white/50 mt-1">Create and manage your tournaments</p>
            </div>
          </div>
          <OrganizerContent />
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}

function OrganizerContent() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-tournaments'],
    queryFn: () => tournamentApi.getMyTournaments(),
  });

  const [form, setForm] = useState({
    title: '',
    prizePool: '',
    entryFee: 'Free',
    mode: 'SOLO' as string,
    slots: 100,
    startsAt: '',
    description: '',
    mapName: '',
    rules: '',
    format: 'SINGLE' as string,
    totalRounds: 3,
    killPoints: 1,
  });

  const resetForm = () => setForm({
    title: '', prizePool: '', entryFee: 'Free', mode: 'SOLO',
    slots: 100, startsAt: '', description: '', mapName: '', rules: '',
    format: 'SINGLE', totalRounds: 3, killPoints: 1,
  });

  const formatFormData = (data: any) => {
    const payload: any = {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
    };
    if (data.format === 'MULTI_ROUND') {
      const defaultPlacement = [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0];
      payload.placementPoints = defaultPlacement;
      payload.killPoints = data.killPoints || 1;
      payload.totalRounds = data.totalRounds || 3;
    }
    console.log('Sending payload:', JSON.stringify(payload));
    return payload;
  };

  const createMutation = useMutation({
    mutationFn: () => tournamentApi.create(formatFormData(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Tournament created!');
      setShowCreate(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error('Create tournament error:', err, err.details);
      const msg = err.details
        ? err.details.map((d: any) => `${d.path?.join('.')}: ${d.message}`).join(', ')
        : err.message || 'Failed to create';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => tournamentApi.update(editingId!, formatFormData(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Tournament updated!');
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tournamentApi.deleteHosted(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete'),
  });

  const [roomCreds, setRoomCreds] = useState<{ id: string; roomId: string; roomPassword: string } | null>(null);

  const roomCredsMutation = useMutation({
    mutationFn: (data: { id: string; roomId: string; roomPassword: string }) =>
      tournamentApi.setRoomCredentials(data.id, { roomId: data.roomId, roomPassword: data.roomPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Room credentials sent to all participants!');
      setRoomCreds(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to set room credentials'),
  });

  const cleanupMutation = useMutation({
    mutationFn: () => tournamentApi.cleanupOld(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Cleanup failed'),
  });

  // Round management
  const [manageRoundsFor, setManageRoundsFor] = useState<any>(null);
  const [newRoundTitle, setNewRoundTitle] = useState('');

  const { data: roundData } = useQuery({
    queryKey: ['tournament-rounds', manageRoundsFor?.id],
    queryFn: () => tournamentApi.getScoreboard(manageRoundsFor.id),
    enabled: !!manageRoundsFor,
  });

  const createRoundMutation = useMutation({
    mutationFn: () => tournamentApi.createRound(manageRoundsFor.id, { title: newRoundTitle || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-rounds', manageRoundsFor?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Round created!');
      setNewRoundTitle('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create round'),
  });

  const updateRoundStatusMutation = useMutation({
    mutationFn: ({ roundId, status }: { roundId: string; status: string }) =>
      tournamentApi.updateRoundStatus(manageRoundsFor.id, roundId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-rounds', manageRoundsFor?.id] });
      toast.success('Round status updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update round'),
  });

  const deleteRoundMutation = useMutation({
    mutationFn: (roundId: string) => tournamentApi.deleteRound(manageRoundsFor.id, roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-rounds', manageRoundsFor?.id] });
      toast.success('Round deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete round'),
  });

  // Score input for a round
  const [scoringRound, setScoringRound] = useState<any>(null);
  const [scoreEntries, setScoreEntries] = useState<{ teamId: string; teamName: string; placement: number; kills: number }[]>([]);

  const openScoreInput = (round: any, scoreboard: any[]) => {
    setScoringRound(round);
    // Pre-fill from existing scores or create entries for all teams
    if (round.scores && round.scores.length > 0) {
      setScoreEntries(round.scores.map((s: any) => ({
        teamId: s.teamId,
        teamName: s.teamName,
        placement: s.placement,
        kills: s.kills,
      })));
    } else {
      setScoreEntries(scoreboard.map((s: any) => ({
        teamId: s.teamId,
        teamName: s.teamName,
        placement: 0,
        kills: 0,
      })));
    }
  };

  const submitScoresMutation = useMutation({
    mutationFn: () => tournamentApi.updateRoundScores(manageRoundsFor.id, scoringRound.id, scoreEntries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-rounds', manageRoundsFor?.id] });
      toast.success('Scores saved!');
      setScoringRound(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save scores'),
  });

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      prizePool: t.prizePool || '',
      entryFee: t.entryFee || 'Free',
      mode: t.mode,
      slots: t.slots,
      startsAt: t.startsAt ? new Date(t.startsAt).toISOString().slice(0, 16) : '',
      description: t.description || '',
      mapName: t.mapName || '',
      rules: t.rules || '',
      format: t.format || 'SINGLE',
      totalRounds: t.totalRounds || 3,
      killPoints: t.killPoints || 1,
    });
  };

  const filtered = data?.tournaments?.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search your tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => cleanupMutation.mutate()}
            loading={cleanupMutation.isPending}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="w-4 h-4" />
            Cleanup Old
          </Button>
          <Button onClick={() => { setShowCreate(!showCreate); setEditingId(null); resetForm(); }} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreate || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {editingId ? 'Edit Tournament' : 'Create Tournament'}
                </h3>
                <button onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <Input label="Prize Pool" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
                <Input label="Entry Fee" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} />
                <div>
                  <Select
                    label="Mode"
                    value={form.mode}
                    onChange={(v) => setForm({ ...form, mode: v })}
                    options={[
                      { value: 'SOLO', label: 'Solo', icon: <Crosshair className="w-full h-full" />, description: '1 player per team' },
                      { value: 'DUO', label: 'Duo', icon: <Users className="w-full h-full" />, description: '2 players per team' },
                      { value: 'SQUAD', label: 'Squad', icon: <Swords className="w-full h-full" />, description: '4 players per team' },
                    ]}
                  />
                </div>
                <Input label="Slots" type="number" value={form.slots.toString()} onChange={(e) => setForm({ ...form, slots: parseInt(e.target.value) || 0 })} />
                <Input label="Start Date" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
                <Input label="Map Name" value={form.mapName} onChange={(e) => setForm({ ...form, mapName: e.target.value })} />
                <div>
                  <Select
                    label="Format"
                    value={form.format}
                    onChange={(v) => setForm({ ...form, format: v })}
                    options={[
                      { value: 'SINGLE', label: 'Single Match', icon: <Target className="w-full h-full" />, description: 'One match, winner takes all' },
                      { value: 'MULTI_ROUND', label: 'Multi-Round (BR)', icon: <RefreshCw className="w-full h-full" />, description: 'Multiple matches with cumulative scoring' },
                    ]}
                  />
                </div>
                {form.format === 'MULTI_ROUND' && (
                  <>
                    <Input label="Total Matches" type="number" value={form.totalRounds.toString()} onChange={(e) => setForm({ ...form, totalRounds: parseInt(e.target.value) || 1 })} />
                    <Input label="Points per Kill" type="number" value={form.killPoints.toString()} onChange={(e) => setForm({ ...form, killPoints: parseInt(e.target.value) || 0 })} />
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all min-h-[80px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Rules</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all min-h-[80px]"
                    value={form.rules}
                    onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Save Changes' : 'Create Tournament'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Credentials Modal */}
      <AnimatePresence>
        {roomCreds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Room Credentials</h3>
                    <p className="text-sm text-white/50">Share with registered participants</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Room ID</label>
                    <input
                      type="text"
                      value={roomCreds.roomId}
                      onChange={(e) => setRoomCreds({ ...roomCreds, roomId: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                      placeholder="e.g. Room-1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Room Password</label>
                    <input
                      type="text"
                      value={roomCreds.roomPassword}
                      onChange={(e) => setRoomCreds({ ...roomCreds, roomPassword: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                      placeholder="e.g. pass123"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setRoomCreds(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!roomCreds.roomId || !roomCreds.roomPassword}
                    onClick={() => roomCredsMutation.mutate(roomCreds)}
                    loading={roomCredsMutation.isPending}
                  >
                    Send to Participants
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Round Management Modal */}
      <AnimatePresence>
        {manageRoundsFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Swords className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Rounds: {manageRoundsFor.title}</h3>
                      <p className="text-sm text-white/50">{manageRoundsFor.totalRounds} matches • {manageRoundsFor.killPoints}pt per kill</p>
                    </div>
                  </div>
                  <button onClick={() => { setManageRoundsFor(null); setScoringRound(null); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Rounds list */}
                <div className="space-y-3 mb-6">
                  {roundData?.rounds?.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-sm">
                      No rounds yet. Create one to get started.
                    </div>
                  ) : (
                    roundData?.rounds?.map((round: any) => (
                      <div key={round.id} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">R{round.roundNumber}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{round.title}</p>
                            <p className="text-xs text-white/40">
                              {round._count?.scores || 0} scores • {round.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openScoreInput(round, roundData?.scoreboard || [])}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-primary/20 text-white/70 hover:text-primary transition-all"
                          >
                            <Target className="w-3.5 h-3.5 inline mr-1" />
                            Scores
                          </button>
                          {round.status === 'UPCOMING' && (
                            <button
                              onClick={() => updateRoundStatusMutation.mutate({ roundId: round.id, status: 'LIVE' })}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all"
                            >
                              <PlayCircle className="w-3.5 h-3.5 inline mr-1" />
                              Start
                            </button>
                          )}
                          {round.status === 'LIVE' && (
                            <button
                              onClick={() => updateRoundStatusMutation.mutate({ roundId: round.id, status: 'COMPLETED' })}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                              Complete
                            </button>
                          )}
                          {round.status === 'UPCOMING' && (
                            <button
                              onClick={() => { if (confirm(`Delete round ${round.roundNumber}?`)) deleteRoundMutation.mutate(round.id); }}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Create round */}
                {(roundData?.rounds?.length || 0) < manageRoundsFor.totalRounds && (
                  <div className="flex gap-3 items-end border-t border-white/5 pt-4">
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">Round Title (optional)</label>
                      <input
                        type="text"
                        value={newRoundTitle}
                        onChange={(e) => setNewRoundTitle(e.target.value)}
                        placeholder={`Match ${(roundData?.rounds?.length || 0) + 1}`}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <Button onClick={() => createRoundMutation.mutate()} loading={createRoundMutation.isPending}>
                      <Plus className="w-4 h-4" />
                      Add Round
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Score Input Modal */}
      <AnimatePresence>
        {scoringRound && manageRoundsFor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Scores: {scoringRound.title}</h3>
                      <p className="text-sm text-white/50">Enter placement and kills for each team</p>
                    </div>
                  </div>
                  <button onClick={() => setScoringRound(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto mb-4">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-3 py-2 text-xs text-white/40 font-medium uppercase">Team</th>
                        <th className="text-center px-3 py-2 text-xs text-white/40 font-medium uppercase w-24">Placement</th>
                        <th className="text-center px-3 py-2 text-xs text-white/40 font-medium uppercase w-20">Kills</th>
                        <th className="text-center px-3 py-2 text-xs text-white/40 font-medium uppercase w-16">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreEntries.map((entry, i) => {
                        const placementConfig = [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0];
                        const killPts = manageRoundsFor.killPoints || 1;
                        const pts = entry.placement > 0
                          ? (placementConfig[Math.min(entry.placement - 1, 15)] || 0) + (entry.kills * killPts)
                          : 0;
                        return (
                          <tr key={entry.teamId} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-3 py-2">
                              <span className="text-sm text-white font-medium">{entry.teamName}</span>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                max={99}
                                value={entry.placement || ''}
                                onChange={(e) => {
                                  const newEntries = [...scoreEntries];
                                  newEntries[i] = { ...newEntries[i], placement: parseInt(e.target.value) || 0 };
                                  setScoreEntries(newEntries);
                                }}
                                className="w-20 mx-auto block text-center bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                                placeholder="#"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                max={99}
                                value={entry.kills || ''}
                                onChange={(e) => {
                                  const newEntries = [...scoreEntries];
                                  newEntries[i] = { ...newEntries[i], kills: parseInt(e.target.value) || 0 };
                                  setScoreEntries(newEntries);
                                }}
                                className="w-16 mx-auto block text-center bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="text-sm font-bold text-primary">{pts}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setScoringRound(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => submitScoresMutation.mutate()}
                    loading={submitScoresMutation.isPending}
                  >
                    Save Scores
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tournaments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card border border-card-border animate-pulse" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/40 mb-2">No tournaments yet</h3>
          <p className="text-white/30 mb-6">Create your first tournament to get started</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Create Tournament
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((t) => (
            <Card key={t.id} className="p-5 relative overflow-hidden group">
              <div className="flex items-start justify-between mb-3">
                <Badge
                  size="sm"
                  variant={
                    t.status === 'LIVE' ? 'success' :
                    t.status === 'COMPLETED' ? 'info' :
                    t.status === 'CANCELLED' ? 'danger' : 'warning'
                  }
                >
                  {t.status === 'REGISTRATION_OPEN' ? 'Open' : t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setRoomCreds({ id: t.id, roomId: t.roomId || '', roomPassword: t.roomPassword || '' })}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-green-400 transition-all"
                    title="Room Credentials"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  {t.format === 'MULTI_ROUND' && (
                    <button
                      onClick={() => setManageRoundsFor(t)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-yellow-400 transition-all"
                      title="Manage Rounds"
                    >
                      <Swords className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-primary transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${t.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(t.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t.title}</h3>
              <div className="space-y-1.5 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                  <span>{t.prizePool || 'No prize'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="capitalize">{t.mode.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t._count?.registrations || 0}/{t.slots} registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(t.startsAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/30">{t.entryFee === 'Free' ? 'Free Entry' : `₹${t.entryFee}`}</span>
                <Link
                  href={`/tournaments/${t.id}`}
                  className="text-xs text-primary hover:text-primary-400 font-medium"
                >
                  View →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


