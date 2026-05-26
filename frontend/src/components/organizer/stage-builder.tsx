'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  ArrowRight, Trophy, Users, Settings, Copy, Sparkles,
  Swords, Gamepad2, ScrollText, Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StageConfig {
  id: string;
  name: string;
  type: string;
  teamsCount: number;
  qualifyingTeams: number;
  eliminationCount: number;
  teamsPerLobby: number;
  matchesCount: number;
  scoring: { killPoints: number; placementPoints: number[]; qualificationRule: string; qualificationValue: number };
  mapRotation: string[];
  startDate: string;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  stages: Omit<StageConfig, 'id' | 'scoring' | 'mapRotation' | 'startDate'>[];
  recommendedTeams: string;
  complexity: string;
  stageCount: number;
}

const PRESETS: Preset[] = [
  {
    id: 'qual-finals',
    name: 'Qualifier → Finals',
    description: 'Simple two-stage format',
    stageCount: 2,
    recommendedTeams: '16-32',
    complexity: 'Low',
    stages: [
      { name: 'Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 32, qualifyingTeams: 16, eliminationCount: 16, teamsPerLobby: 16, matchesCount: 2 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 16, qualifyingTeams: 1, eliminationCount: 15, teamsPerLobby: 16, matchesCount: 1 },
    ],
  },
  {
    id: 'qual-semi-finals',
    name: 'Qualifier → Semi Finals → Finals',
    description: 'Three-stage competitive format',
    stageCount: 3,
    recommendedTeams: '32-64',
    complexity: 'Medium',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 64, qualifyingTeams: 32, eliminationCount: 32, teamsPerLobby: 16, matchesCount: 4 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 32, qualifyingTeams: 16, eliminationCount: 16, teamsPerLobby: 16, matchesCount: 2 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 16, qualifyingTeams: 1, eliminationCount: 15, teamsPerLobby: 16, matchesCount: 1 },
    ],
  },
  {
    id: 'full-pro',
    name: 'Full Professional Format',
    description: 'Complete pro circuit with wildcard',
    stageCount: 6,
    recommendedTeams: '128+',
    complexity: 'High',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 128, qualifyingTeams: 64, eliminationCount: 64, teamsPerLobby: 16, matchesCount: 8 },
      { name: 'Round 1', type: 'ROUND_1', teamsCount: 64, qualifyingTeams: 32, eliminationCount: 32, teamsPerLobby: 16, matchesCount: 4 },
      { name: 'Round 2', type: 'ROUND_2', teamsCount: 32, qualifyingTeams: 16, eliminationCount: 16, teamsPerLobby: 16, matchesCount: 2 },
      { name: 'Wildcard', type: 'WILDCARD', teamsCount: 8, qualifyingTeams: 4, eliminationCount: 4, teamsPerLobby: 8, matchesCount: 1 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 20, qualifyingTeams: 10, eliminationCount: 10, teamsPerLobby: 10, matchesCount: 2 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 10, qualifyingTeams: 1, eliminationCount: 9, teamsPerLobby: 10, matchesCount: 1 },
    ],
  },
  {
    id: 'free-fire',
    name: 'Free Fire League',
    description: 'League-style format for Free Fire',
    stageCount: 3,
    recommendedTeams: '24-48',
    complexity: 'Medium',
    stages: [
      { name: 'League Stage', type: 'LEAGUE_STAGE', teamsCount: 48, qualifyingTeams: 24, eliminationCount: 24, teamsPerLobby: 12, matchesCount: 6 },
      { name: 'Playoffs', type: 'PLAYOFFS', teamsCount: 24, qualifyingTeams: 12, eliminationCount: 12, teamsPerLobby: 12, matchesCount: 3 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 12, qualifyingTeams: 1, eliminationCount: 11, teamsPerLobby: 12, matchesCount: 1 },
    ],
  },
  {
    id: 'bgmi-pro',
    name: 'BGMI Professional Format',
    description: 'BGMI pro circuit format',
    stageCount: 4,
    recommendedTeams: '32-64',
    complexity: 'High',
    stages: [
      { name: 'Open Qualifier', type: 'OPEN_QUALIFIER', teamsCount: 64, qualifyingTeams: 32, eliminationCount: 32, teamsPerLobby: 16, matchesCount: 4 },
      { name: 'Point Rush', type: 'POINT_RUSH', teamsCount: 32, qualifyingTeams: 20, eliminationCount: 12, teamsPerLobby: 16, matchesCount: 3 },
      { name: 'Semi Finals', type: 'SEMI_FINALS', teamsCount: 20, qualifyingTeams: 12, eliminationCount: 8, teamsPerLobby: 10, matchesCount: 2 },
      { name: 'Grand Finals', type: 'GRAND_FINALS', teamsCount: 12, qualifyingTeams: 1, eliminationCount: 11, teamsPerLobby: 12, matchesCount: 1 },
    ],
  },
];

const stageTypeIcons: Record<string, React.ReactNode> = {
  OPEN_QUALIFIER: <Users className="w-4 h-4" />,
  SEMI_FINALS: <Swords className="w-4 h-4" />,
  GRAND_FINALS: <Trophy className="w-4 h-4" />,
  WILDCARD: <Sparkles className="w-4 h-4" />,
  LEAGUE_STAGE: <Gamepad2 className="w-4 h-4" />,
  PLAYOFFS: <Flag className="w-4 h-4" />,
  POINT_RUSH: <ScrollText className="w-4 h-4" />,
  ROUND_1: <Copy className="w-4 h-4" />,
  ROUND_2: <Copy className="w-4 h-4" />,
};

const stageTypeLabels: Record<string, string> = {
  OPEN_QUALIFIER: 'Open Qualifier',
  SEMI_FINALS: 'Semi Finals',
  GRAND_FINALS: 'Grand Finals',
  WILDCARD: 'Wildcard',
  LEAGUE_STAGE: 'League Stage',
  PLAYOFFS: 'Playoffs',
  POINT_RUSH: 'Point Rush',
  ROUND_1: 'Round 1',
  ROUND_2: 'Round 2',
};

let stageIdCounter = 0;

function createStage(preset?: Omit<StageConfig, 'id' | 'scoring' | 'mapRotation' | 'startDate'>): StageConfig {
  stageIdCounter++;
  return {
    id: `stage-${stageIdCounter}`,
    name: preset?.name || `Stage ${stageIdCounter}`,
    type: preset?.type || 'OPEN_QUALIFIER',
    teamsCount: preset?.teamsCount || 32,
    qualifyingTeams: preset?.qualifyingTeams || 16,
    eliminationCount: preset?.eliminationCount || 16,
    teamsPerLobby: preset?.teamsPerLobby || 16,
    matchesCount: preset?.matchesCount || 1,
    scoring: { killPoints: 1, placementPoints: [15, 12, 10, 8, 6, 4, 2, 1], qualificationRule: 'TOP_N', qualificationValue: 16 },
    mapRotation: [],
    startDate: '',
  };
}

export function StageBuilder({ stages: externalStages, onChange, totalTeams = 64 }: {
  stages?: StageConfig[];
  onChange: (stages: StageConfig[]) => void;
  totalTeams?: number;
}) {
  const [stages, setStages] = useState<StageConfig[]>(externalStages || [createStage()]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  function updateStages(newStages: StageConfig[]) {
    setStages(newStages);
    onChange(newStages);
  }

  function addStage() {
    const last = stages[stages.length - 1];
    updateStages([...stages, createStage({
      name: `Stage ${stages.length + 1}`,
      type: stages.length === 0 ? 'OPEN_QUALIFIER' : 'SEMI_FINALS',
      teamsCount: last?.qualifyingTeams || 32,
      qualifyingTeams: Math.floor((last?.qualifyingTeams || 32) / 2),
      eliminationCount: (last?.qualifyingTeams || 32) - Math.floor((last?.qualifyingTeams || 32) / 2),
      teamsPerLobby: 16,
      matchesCount: 2,
    })]);
  }

  function removeStage(id: string) {
    if (stages.length <= 1) return;
    updateStages(stages.filter((s) => s.id !== id));
  }

  function updateStage(id: string, updates: Partial<StageConfig>) {
    updateStages(stages.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function applyPreset(preset: Preset) {
    const newStages = preset.stages.map((s) => createStage(s));
    updateStages(newStages);
    setShowPresets(false);
  }

  function reorderStages(list: StageConfig[]) {
    const reordered = list.map((s, i) => ({ ...s, name: `Stage ${i + 1}` }));
    updateStages(reordered);
  }

  function addDefaultScoring(id: string) {
    updateStage(id, {
      scoring: { killPoints: 1, placementPoints: [15, 12, 10, 8, 6, 4, 2, 1], qualificationRule: 'TOP_N', qualificationValue: 16 },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-white">Tournament Stages</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowPresets(!showPresets)}>
            <Sparkles className="w-3.5 h-3.5" />
            Presets
          </Button>
          <Button variant="secondary" size="sm" onClick={addStage}>
            <Plus className="w-3.5 h-3.5" />
            Add Stage
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyPreset(preset)}
                  className="bg-card border border-card-border hover:border-primary/30 rounded-xl p-3 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{preset.stageCount} Stages</span>
                    <span className="text-[10px] text-white/40">{preset.complexity}</span>
                  </div>
                  <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{preset.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{preset.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/30">{preset.recommendedTeams} teams</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {preset.stages.map((s, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        {i < preset.stages.length - 1 && (
                          <div className="w-4 h-px bg-primary/20" />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Reorder.Group axis="y" values={stages} onReorder={reorderStages} className="space-y-2">
        <AnimatePresence initial={false}>
          {stages.map((stage, index) => (
            <Reorder.Item key={stage.id} value={stage} as="div">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-card-border rounded-xl overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(expandedId === stage.id ? null : stage.id)}
                >
                  <div {...{}} className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    stage.type === 'GRAND_FINALS'
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-white/10 bg-white/5 text-white/60'
                  }`}>
                    {stageTypeIcons[stage.type] || <Copy className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{stage.name}</span>
                      <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                        {stageTypeLabels[stage.type] || stage.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-white/30">
                      <span>{stage.teamsCount} teams</span>
                      <span>{stage.qualifyingTeams} qualify</span>
                      <span>{stage.matchesCount} matches</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeStage(stage.id); }}
                      disabled={stages.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-red-400" />
                    </Button>
                    {expandedId === stage.id ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === stage.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-card-border">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Stage Type</label>
                            <select
                              value={stage.type}
                              onChange={(e) => updateStage(stage.id, { type: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                            >
                              {Object.entries(stageTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Teams Count</label>
                            <input
                              type="number"
                              value={stage.teamsCount}
                              onChange={(e) => updateStage(stage.id, { teamsCount: Number(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Qualifying</label>
                            <input
                              type="number"
                              value={stage.qualifyingTeams}
                              onChange={(e) => updateStage(stage.id, { qualifyingTeams: Number(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Eliminated</label>
                            <input
                              type="number"
                              value={stage.eliminationCount}
                              onChange={(e) => updateStage(stage.id, { eliminationCount: Number(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Per Lobby</label>
                            <input
                              type="number"
                              value={stage.teamsPerLobby}
                              onChange={(e) => updateStage(stage.id, { teamsPerLobby: Number(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Matches</label>
                            <input
                              type="number"
                              value={stage.matchesCount}
                              onChange={(e) => updateStage(stage.id, { matchesCount: Number(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => addDefaultScoring(stage.id)}
                          >
                            <Settings className="w-3 h-3" />
                            Scoring Rules
                          </Button>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/50">Progression</span>
                            <span className="text-white">
                              {stage.teamsCount} → {stage.qualifyingTeams} qualify
                              ({stage.eliminationCount} eliminated)
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                              style={{ width: `${(stage.qualifyingTeams / stage.teamsCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {stages.length > 0 && (
        <div className="relative flex items-center gap-0.5 py-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center flex-1">
              <motion.div
                className={`flex-1 h-2 rounded-full ${
                  stage.type === 'GRAND_FINALS'
                    ? 'bg-gradient-to-r from-primary to-primary/60'
                    : 'bg-white/10'
                }`}
                style={{ opacity: 0.3 + (i / stages.length) * 0.7 }}
              />
              {i < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-white/20 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {stages.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm">
          No stages configured. Add a stage or choose a preset.
        </div>
      )}
    </div>
  );
}
