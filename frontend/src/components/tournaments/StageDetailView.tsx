'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge } from '@/components/ui';
import {
  Layers, Plus, Save, X, AlertTriangle, Trophy, RefreshCw,
  CheckCircle, PlayCircle, Swords, Target, Users, Key, Skull,
  ArrowUp, ArrowDown, Crown, Eye, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import VisualBracket from './VisualBracket';
import { cn } from '@/lib/utils';
import type { TournamentStage, StageMatch, StageMatchTeam, StageBracketEntry } from '@/types';

interface StageDetailViewProps {
  tournamentId: string;
  stage: TournamentStage;
  onClose: () => void;
}

const PLACEMENT_POINTS = [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0];

export default function StageDetailView({ tournamentId, stage, onClose }: StageDetailViewProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'matches' | 'bracket'>('matches');
  const [scoringMatchId, setScoringMatchId] = useState<string | null>(null);
  const [scoreEntries, setScoreEntries] = useState<{ teamId: string; placement: number; kills: number }[]>([]);
  const [roomModal, setRoomModal] = useState<{ matchId: string; roomId: string; roomPassword: string } | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);

  // Fetch stage matches
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['stage-matches', tournamentId, stage.id],
    queryFn: () => tournamentApi.getStageMatches(tournamentId, stage.id),
    refetchInterval: 10000,
  });

  // Fetch bracket view
  const { data: bracketData, isLoading: bracketLoading } = useQuery({
    queryKey: ['stage-bracket', tournamentId, stage.id],
    queryFn: () => tournamentApi.getStageBracket(tournamentId, stage.id),
    enabled: activeTab === 'bracket',
  });

  const matches = matchesData?.matches || [];

  // Generate matches mutation
  const generateMutation = useMutation({
    mutationFn: () => tournamentApi.generateStageMatches(tournamentId, stage.id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['stage-matches', tournamentId, stage.id] });
      toast.success(`Generated ${data.matches.length} lobbies for ${data.totalTeams} teams`);
    },
    onError: (err: any) => toast.error(err.message || 'Generation failed'),
  });

  // Create single match
  const createMatchMutation = useMutation({
    mutationFn: () => tournamentApi.createStageMatch(tournamentId, stage.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-matches', tournamentId, stage.id] });
      toast.success('Match created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create match'),
  });

  // Update match (room credentials, status)
  const updateMatchMutation = useMutation({
    mutationFn: ({ matchId, data }: { matchId: string; data: any }) =>
      tournamentApi.updateStageMatch(tournamentId, stage.id, matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-matches', tournamentId, stage.id] });
      toast.success('Match updated');
      setRoomModal(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update match'),
  });

  // Delete match
  const deleteMatchMutation = useMutation({
    mutationFn: (matchId: string) => tournamentApi.deleteStageMatch(tournamentId, stage.id, matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-matches', tournamentId, stage.id] });
      toast.success('Match deleted');
      setMatchToDelete(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete match'),
  });

  // Save scores
  const submitScoresMutation = useMutation({
    mutationFn: ({ matchId, scores }: { matchId: string; scores: { teamId: string; placement: number; kills: number }[] }) =>
      tournamentApi.updateStageScores(tournamentId, stage.id, matchId, scores),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['stage-matches', tournamentId, stage.id] });
      queryClient.invalidateQueries({ queryKey: ['stage-bracket', tournamentId, stage.id] });
      toast.success(data.stageCompleted ? 'Stage completed! All matches done.' : 'Scores saved');
      setScoringMatchId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save scores'),
  });

  // Advance teams to next stage
  const advanceMutation = useMutation({
    mutationFn: () => tournamentApi.advanceTeams(tournamentId, stage.id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['stage-matches', tournamentId, stage.id] });
      queryClient.invalidateQueries({ queryKey: ['stage-bracket', tournamentId, stage.id] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to advance teams'),
  });

  // Open score entry for a match
  const openScoreEntry = useCallback((match: StageMatch) => {
    setScoringMatchId(match.id);
    if (match.teams.some((t) => t.confirmed)) {
      setScoreEntries(
        match.teams.map((t) => ({ teamId: t.teamId, placement: t.placement, kills: t.kills }))
      );
    } else {
      setScoreEntries(
        match.teams.map((t) => ({ teamId: t.teamId, placement: 0, kills: 0 }))
      );
    }
  }, []);

  // Calculate points
  const calcPoints = (placement: number, kills: number) => {
    const killPts = stage.scoringRules?.killPoints || 1;
    const placementPts = stage.scoringRules?.placementPoints || PLACEMENT_POINTS;
    const pts = placement > 0 ? (placementPts[Math.min(placement - 1, placementPts.length - 1)] || 0) : 0;
    return pts + kills * killPts;
  };

  // Get status badge variant
  const statusVariant = (status: string) => {
    switch (status) {
      case 'LIVE': return 'success' as const;
      case 'COMPLETED': return 'info' as const;
      default: return 'warning' as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{stage.name}</h2>
            <p className="text-sm text-white/50">
              Stage {stage.stageNumber} • {stage.type.replace(/_/g, ' ')}{' '}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full ml-2',
                stage.status === 'ACTIVE' ? 'bg-primary/20 text-primary' :
                stage.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                'bg-white/5 text-white/30'
              )}>
                {stage.status}
              </span>
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Stage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stage.teamsCount || '-'}</p>
          <p className="text-[10px] text-white/40">Teams</p>
        </Card>
        <Card className="p-3 text-center">
          <Swords className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-400">{stage.qualifyingTeams || '-'}</p>
          <p className="text-[10px] text-white/40">Qualify</p>
        </Card>
        <Card className="p-3 text-center">
          <Skull className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-400">{stage.eliminationCount || '-'}</p>
          <p className="text-[10px] text-white/40">Eliminated</p>
        </Card>
        <Card className="p-3 text-center">
          <Target className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-yellow-400">{matches.length}</p>
          <p className="text-[10px] text-white/40">Lobbies</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('matches')}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'matches' ? 'bg-primary/20 text-primary shadow-lg' : 'text-white/50 hover:text-white'
          )}
        >
          <Swords className="w-3.5 h-3.5 inline mr-1.5" />
          Matches
        </button>
        <button
          onClick={() => setActiveTab('bracket')}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'bracket' ? 'bg-primary/20 text-primary shadow-lg' : 'text-white/50 hover:text-white'
          )}
        >
          <Eye className="w-3.5 h-3.5 inline mr-1.5" />
          Bracket View
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'matches' && (
        <>
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">
              {matches.length} matches • {stage.teamsPerLobby} teams per lobby
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => createMatchMutation.mutate()}
                loading={createMatchMutation.isPending}
                disabled={matches.length >= (stage.lobbyCount || 1)}
              >
                <Plus className="w-3 h-3" />
                Add Lobby
              </Button>
              <Button
                size="sm"
                onClick={() => generateMutation.mutate()}
                loading={generateMutation.isPending}
              >
                <RefreshCw className="w-3 h-3" />
                Generate Matches
              </Button>
            </div>
          </div>

          {/* Matches List */}
          {matchesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-card border border-card-border animate-pulse" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <Card className="p-8 text-center">
              <Swords className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white/40 mb-1">No matches yet</h3>
              <p className="text-sm text-white/20 mb-4">
                Generate matches from registered teams or create lobbies manually
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" onClick={() => createMatchMutation.mutate()}>
                  <Plus className="w-4 h-4" />
                  Create Lobby
                </Button>
                <Button onClick={() => generateMutation.mutate()} loading={generateMutation.isPending}>
                  <RefreshCw className="w-4 h-4" />
                  Auto-Generate
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {matches.map((match, idx) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={cn(
                    'p-4 border',
                    match.status === 'LIVE' && 'border-green-500/30',
                    match.status === 'COMPLETED' && 'border-blue-500/20',
                  )}>
                    {/* Match Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                          match.status === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                          match.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/5 text-white/40'
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{match.name}</h4>
                            <Badge size="sm" variant={statusVariant(match.status)}>
                              {match.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-white/40">{match.teamsCount} teams</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Start/Complete button */}
                        {match.status === 'PENDING' && (
                          <button
                            onClick={() => setRoomModal({ matchId: match.id, roomId: '', roomPassword: '' })}
                            className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-all"
                            title="Start Match"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        {match.status === 'LIVE' && (
                          <button
                            onClick={() => updateMatchMutation.mutate({
                              matchId: match.id,
                              data: { status: 'COMPLETED' },
                            })}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-all"
                            title="Complete Match"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Scores button */}
                        {match.teams.length > 0 && (
                          <button
                            onClick={() => openScoreEntry(match)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-white/40 hover:text-primary transition-all"
                            title="Enter Scores"
                          >
                            <Target className="w-4 h-4" />
                          </button>
                        )}
                        {/* Room credentials */}
                        <button
                          onClick={() => setRoomModal({
                            matchId: match.id,
                            roomId: match.roomId || '',
                            roomPassword: match.roomPassword || '',
                          })}
                          className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-white/40 hover:text-yellow-400 transition-all"
                          title="Room Credentials"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        {match.status === 'PENDING' && (
                          <button
                            onClick={() => setMatchToDelete(match.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                            title="Delete Match"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teams List */}
                    <div className="space-y-1">
                      {match.teams.length === 0 ? (
                        <p className="text-xs text-white/20 text-center py-2">No teams assigned</p>
                      ) : (
                        [...match.teams]
                          .sort((a, b) => (a.placement || 999) - (b.placement || 999))
                          .map((team, tIdx) => (
                            <div
                              key={team.teamId}
                              className={cn(
                                'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs',
                                team.placement === 1 && 'bg-yellow-500/5',
                                team.qualified && !team.placement && 'bg-green-500/5',
                                team.eliminated && 'bg-red-500/5 opacity-60',
                                !team.placement && !team.qualified && !team.eliminated && 'bg-white/[0.02]',
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                  team.placement === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                  team.qualified ? 'bg-green-500/20 text-green-400' :
                                  team.eliminated ? 'bg-red-500/20 text-red-400' :
                                  'bg-white/10 text-white/40'
                                )}>
                                  {team.placement || (tIdx + 1)}
                                </span>
                                <span className={cn(
                                  'truncate max-w-[200px]',
                                  team.placement === 1 && 'text-yellow-300 font-semibold',
                                  team.qualified && !team.placement && 'text-green-300',
                                  team.eliminated && 'text-red-400/60 line-through',
                                )}>
                                  {team.teamName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {team.kills > 0 && <span className="text-red-400/70">{team.kills}K</span>}
                                {team.points > 0 && (
                                  <span className="font-bold text-primary">{team.points}pt</span>
                                )}
                                {team.qualified && <CheckCircle className="w-3 h-3 text-green-400" />}
                                {team.placement === 1 && <Crown className="w-3 h-3 text-yellow-400" />}
                                {team.confirmed && !team.qualified && !team.eliminated && (
                                  <span className="text-[10px] text-primary/50">✓</span>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Advance Teams Button */}
          {stage.status === 'ACTIVE' && stage.stageNumber < 10 && (
            <div className="pt-2">
              <Button
                onClick={() => advanceMutation.mutate()}
                loading={advanceMutation.isPending}
                className="w-full"
                variant="secondary"
              >
                <ArrowUp className="w-4 h-4" />
                Advance Qualified Teams to Next Stage
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bracket Tab */}
      {activeTab === 'bracket' && (
        <>
          {bracketLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-card border border-card-border animate-pulse" />
              ))}
            </div>
          ) : bracketData?.bracket ? (
            <VisualBracket bracket={bracketData.bracket} />
          ) : (
            <Card className="p-8 text-center">
              <Eye className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white/40">No bracket data yet</h3>
              <p className="text-sm text-white/20">Generate matches to view the bracket</p>
            </Card>
          )}
        </>
      )}

      {/* Score Entry Modal */}
      <AnimatePresence>
        {scoringMatchId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                      <h3 className="text-xl font-bold text-white">Enter Scores</h3>
                      <p className="text-sm text-white/50">
                        {stage.scoringRules?.killPoints || 1}pt per kill • Top {stage.qualifyingTeams} qualify
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setScoringMatchId(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
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
                        <th className="text-center px-3 py-2 text-xs text-white/40 font-medium uppercase w-20">Pts</th>
                        <th className="text-center px-3 py-2 text-xs text-white/40 font-medium uppercase w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreEntries.map((entry, i) => {
                        const pts = calcPoints(entry.placement, entry.kills);
                        const qualified = entry.placement > 0 && entry.placement <= stage.qualifyingTeams;
                        const eliminated = entry.placement > stage.qualifyingTeams;
                        return (
                          <tr key={entry.teamId} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-3 py-2">
                              <span className="text-sm text-white font-medium">
                                {matches.find((m) => m.teams.some((t) => t.teamId === entry.teamId))
                                  ?.teams.find((t) => t.teamId === entry.teamId)?.teamName || entry.teamId.slice(0, 8)}
                              </span>
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
                            <td className="px-3 py-2 text-center">
                              {entry.placement > 0 && (
                                qualified
                                  ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                                  : eliminated
                                    ? <Skull className="w-4 h-4 text-red-400 mx-auto" />
                                    : null
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setScoringMatchId(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => submitScoresMutation.mutate(
                      { matchId: scoringMatchId, scores: scoreEntries }
                    )}
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

      {/* Room Credentials Modal */}
      <AnimatePresence>
        {roomModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Match Room</h3>
                    <p className="text-sm text-white/50">Room credentials for this lobby</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Room ID</label>
                    <input
                      type="text"
                      value={roomModal.roomId}
                      onChange={(e) => setRoomModal({ ...roomModal, roomId: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="e.g. Room-A1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                    <input
                      type="text"
                      value={roomModal.roomPassword}
                      onChange={(e) => setRoomModal({ ...roomModal, roomPassword: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="e.g. pass123"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setRoomModal(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!roomModal.roomId || !roomModal.roomPassword}
                    loading={updateMatchMutation.isPending}
                    onClick={() => {
                      updateMatchMutation.mutate({
                        matchId: roomModal.matchId,
                        data: {
                          roomId: roomModal.roomId,
                          roomPassword: roomModal.roomPassword,
                          status: 'LIVE',
                        },
                      });
                    }}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Start Match
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {matchToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <Card className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Delete Match?</h3>
                <p className="text-sm text-white/50 mb-6">This will remove all team assignments and scores.</p>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setMatchToDelete(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => deleteMatchMutation.mutate(matchToDelete)}
                    loading={deleteMatchMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


