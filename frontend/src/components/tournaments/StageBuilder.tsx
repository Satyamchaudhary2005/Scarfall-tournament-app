'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge } from '@/components/ui';
import {
  Layers, Plus, Save, X, AlertTriangle, Trophy, RefreshCw, ArrowDown, Star, CheckCircle, GripVertical, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StagePresetSelector from './StagePresetSelector';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import DraggableStageCard from './DraggableStageCard';
import StageSettingsPanel from './StageSettingsPanel';
import VisualTournamentFlow from './VisualTournamentFlow';
import TeamFlowCalculator from './TeamFlowCalculator';
import type { TournamentStage, StagePreset, StageTypeMeta } from '@/types';

interface StageBuilderProps {
  tournamentId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const STAGE_TYPE_OPTIONS = [
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

function generateStageId(): string {
  return `temp_${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultStage(stageNumber: number, type: string = 'OPEN_QUALIFIER'): TournamentStage {
  return {
    id: generateStageId(),
    tournamentId: '',
    stageNumber,
    name: getDefaultStageName(type, stageNumber),
    type,
    status: stageNumber === 1 ? 'ACTIVE' : 'PENDING',
    teamsCount: 0,
    qualifyingTeams: 0,
    eliminationCount: 0,
    lobbyCount: 0,
    teamsPerLobby: 16,
    matchesCount: 0,
    formatType: 'STANDARD',
    scoringRules: {
      killPoints: 1,
      placementPoints: [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      qualificationRule: 'TOP_N',
      qualificationValue: 0,
    },
    mapRotation: null,
    roomSettings: null,
    startDate: null,
    endDate: null,
  };
}

function getDefaultStageName(type: string, number: number): string {
  const names: Record<string, string> = {
    'IN_GAME_QUALIFIER': 'In-Game Qualifier',
    'OPEN_QUALIFIER': 'Open Qualifier',
    'ONLINE_QUALIFIER': 'Online Qualifier',
    'KNOCKOUT': 'Knockout',
    'ROUND_1': 'Round 1',
    'ROUND_2': 'Round 2',
    'ROUND_3': 'Round 3',
    'WILDCARD': 'Wildcard',
    'SURVIVAL_STAGE': 'Survival Stage',
    'LEAGUE_STAGE': 'League Stage',
    'PLAYOFFS': 'Playoffs',
    'SEMI_FINALS': 'Semi Finals',
    'GRAND_FINALS': 'Grand Finals',
    'LAST_CHANCE_QUALIFIER': 'Last Chance Qualifier',
  };
  return names[type] || `Stage ${number}`;
}

export default function StageBuilder({ tournamentId, onClose, onSaved }: StageBuilderProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'presets' | 'builder'>('presets');
  const [stages, setStages] = useState<TournamentStage[]>([]);
  const [totalTeams, setTotalTeams] = useState(1024);
  const [settingsStage, setSettingsStage] = useState<TournamentStage | null>(null);
  const [savedPresetId, setSavedPresetId] = useState<string | null>(null);

  // Load existing stages if editing
  const { data: existingData } = useQuery({
    queryKey: ['tournament-stages', tournamentId],
    queryFn: () => tournamentApi.getStages(tournamentId!),
    enabled: !!tournamentId,
  });

  useEffect(() => {
    if (existingData?.stages && existingData.stages.length > 0) {
      setStages(existingData.stages.map((s) => ({ ...s, scoringRules: s.scoringRules || null })));
      setView('builder');
    }
  }, [existingData]);

  const saveMutation = useMutation({
    mutationFn: (data: { stages: any[]; totalRegisteredTeams?: number }) =>
      tournamentApi.saveStages(tournamentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-stages', tournamentId] });
      toast.success('Stages saved successfully!');
      onSaved?.();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save stages');
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => tournamentApi.generateFromStages(tournamentId!),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-stages', tournamentId] });
      toast.success('Tournament generated! ' + data.totalTeams + ' teams across ' + data.stages.length + ' stages');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Generation failed');
    },
  });

  // Select a preset
  const handleSelectPreset = useCallback((preset: StagePreset) => {
    const newStages = preset.stages.map((s, idx) => ({
      ...createDefaultStage(idx + 1, s.type),
      name: s.name,
      teamsCount: s.teamsCount,
      qualifyingTeams: s.qualifyingTeams,
      eliminationCount: s.eliminationCount,
      teamsPerLobby: s.teamsPerLobby,
    }));
    setStages(newStages);
    setSavedPresetId(preset.id);
    setView('builder');
  }, []);

  // Update a single stage
  const handleUpdateStage = useCallback((stageId: string, data: Partial<TournamentStage>) => {
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, ...data } : s))
    );
  }, []);

  // Delete a stage
  const handleDeleteStage = useCallback((stageId: string) => {
    setStages((prev) => {
      const filtered = prev.filter((s) => s.id !== stageId);
      return filtered.map((s, idx) => ({ ...s, stageNumber: idx + 1 }));
    });
  }, []);

  // Duplicate a stage
  const handleDuplicateStage = useCallback((stage: TournamentStage) => {
    setStages((prev) => {
      const idx = prev.findIndex((s) => s.id === stage.id);
      const newStage = {
        ...createDefaultStage(0, stage.type),
        name: `${stage.name} (Copy)`,
        teamsCount: stage.teamsCount,
        qualifyingTeams: stage.qualifyingTeams,
        eliminationCount: stage.eliminationCount,
        teamsPerLobby: stage.teamsPerLobby,
        scoringRules: stage.scoringRules ? { ...stage.scoringRules } : null,
      };
      const newStages = [...prev];
      newStages.splice(idx + 1, 0, newStage);
      return newStages.map((s, i) => ({ ...s, stageNumber: i + 1 }));
    });
  }, []);

  // Add a stage
  const handleAddStage = useCallback(() => {
    setStages((prev) => {
      const newNum = prev.length + 1;
      const type = newNum === 1 ? 'OPEN_QUALIFIER' : 'ROUND_1';
      return [...prev, createDefaultStage(newNum, type)];
    });
  }, []);

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, stageNumber: i + 1 }));
    });
  }, []);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Save all stages
  const handleSave = useCallback(() => {
    if (stages.length === 0) {
      toast.error('Add at least one stage before saving');
      return;
    }
    saveMutation.mutate({
      stages: stages.map((s) => ({
        name: s.name,
        type: s.type,
        teamsCount: s.teamsCount,
        qualifyingTeams: s.qualifyingTeams,
        eliminationCount: s.eliminationCount,
        lobbyCount: s.lobbyCount,
        teamsPerLobby: s.teamsPerLobby,
        matchesCount: s.matchesCount,
        formatType: s.formatType,
        scoringRules: s.scoringRules,
        mapRotation: s.mapRotation,
        roomSettings: s.roomSettings,
        startDate: s.startDate,
        endDate: s.endDate,
      })),
      totalRegisteredTeams: totalTeams,
    });
  }, [stages, totalTeams, saveMutation]);

  return (
    <div className="space-y-6">
      {/* Preset Selection View */}
      {view === 'presets' && (
        <StagePresetSelector
          onSelect={handleSelectPreset}
          onBack={onClose}
        />
      )}

      {/* Stage Builder View */}
      {view === 'builder' && (
        <>
          {/* Builder Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-black text-white">Stage Builder</h2>
                <p className="text-sm text-white/50">
                  {stages.length} stage{stages.length !== 1 ? 's' : ''} configured
                  {savedPresetId ? ` • Preset applied` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('presets')}
              >
                Change Preset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Total Teams Input */}
          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Users className="w-4 h-4 text-primary" />
                <span>Total Registered Teams:</span>
              </div>
              <input
                type="number"
                min={2}
                max={100000}
                value={totalTeams}
                onChange={(e) => setTotalTeams(parseInt(e.target.value) || 2)}
                className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary/50 text-center"
              />
              <span className="text-xs text-white/30">
                Teams will flow through {stages.length} stage{stages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </Card>

          {/* Stage Builder Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Stage Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stages List with Drag & Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stages.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6">
                    {stages.map((stage, idx) => (
                      <div key={stage.id} className="relative">
                        <DraggableStageCard
                          stage={stage}
                          stageNumber={idx + 1}
                          isLast={idx === stages.length - 1}
                          stageTypes={STAGE_TYPE_OPTIONS}
                          onUpdate={handleUpdateStage}
                          onDelete={handleDeleteStage}
                          onDuplicate={handleDuplicateStage}
                          onOpenSettings={setSettingsStage}
                        />
                        {/* Connection indicator */}
                        {!idx && (
                          <div className="text-[10px] text-white/20 text-center mt-1">
                            Drag handles to reorder stages
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Stage Button */}
              <button
                onClick={handleAddStage}
                className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/30 text-white/30 hover:text-primary/60 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Stage
              </button>
            </div>

            {/* Right: Calculator & Actions */}
            <div className="space-y-6">
              {/* Visual Flow */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Flow Preview
                </h3>
                <VisualTournamentFlow stages={stages} totalTeams={totalTeams} />
              </Card>

              {/* Team Flow Calculator */}
              <div className="bg-card border border-card-border rounded-xl p-4">
                <TeamFlowCalculator
                  stages={stages}
                  totalTeams={totalTeams}
                  onUpdateStage={handleUpdateStage}
                  onGenerate={() => generateMutation.mutate()}
                  generating={generateMutation.isPending}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSave}
                  loading={saveMutation.isPending}
                  className="w-full"
                >
                  <Save className="w-4 h-4" />
                  Save Stage Configuration
                </Button>

                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full"
                >
                  <X className="w-4 h-4" />
                  Close Builder
                </Button>
              </div>

              {/* Stage Count Summary */}
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span>Stages</span>
                    <span className="font-bold text-white">{stages.length}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Total Teams In</span>
                    <span className="font-bold text-white">{totalTeams.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Stages With Scoring</span>
                    <span className="font-bold text-white">
                      {stages.filter((s) => s.scoringRules?.killPoints).length}/{stages.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Champion</span>
                    <span className="font-bold text-yellow-400">1</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Stage Settings Modal */}
      <AnimatePresence>
        {settingsStage && (
          <StageSettingsPanel
            stage={settingsStage}
            stageTypes={STAGE_TYPE_OPTIONS}
            onSave={handleUpdateStage}
            onClose={() => setSettingsStage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
