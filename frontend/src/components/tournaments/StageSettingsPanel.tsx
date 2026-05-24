'use client';

import { motion } from 'framer-motion';
import { Button, Card, Input, Select } from '@/components/ui';
import { X, Crosshair, Trophy, Map, Settings2, Save, Layout, GitBranch, TrendingUp, Award, Grid3x3 } from 'lucide-react';
import type { TournamentStage, StageTypeMeta } from '@/types';

interface StageSettingsPanelProps {
  stage: TournamentStage;
  stageTypes: StageTypeMeta[];
  onSave: (stageId: string, data: Partial<TournamentStage>) => void;
  onClose: () => void;
}

export default function StageSettingsPanel({ stage, stageTypes, onSave, onClose }: StageSettingsPanelProps) {
  const typeMeta = stageTypes.find((t) => t.value === stage.type);

  const scoring = stage.scoringRules || {
    killPoints: 1,
    placementPoints: [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    qualificationRule: 'TOP_N',
    qualificationValue: 0,
  };

  const handleSave = () => {
    onSave(stage.id, stage);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{stage.name}</h3>
                <p className="text-sm text-white/50">
                  {typeMeta?.icon} {typeMeta?.label || stage.type} • Stage {stage.stageNumber}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Stage Identity */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Stage Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Stage Name</label>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => onSave(stage.id, { name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Stage Type</label>
                  <Select
                    value={stage.type}
                    onChange={(v) => onSave(stage.id, { type: v })}
                    options={stageTypes.map((t) => ({
                      value: t.value,
                      label: t.label,
                      icon: <span>{t.icon}</span>,
                      description: t.description,
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Team Flow */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-red-400" />
                Team Flow & Elimination
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Incoming Teams</label>
                  <input
                    type="number"
                    value={stage.teamsCount}
                    onChange={(e) => onSave(stage.id, { teamsCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Teams Per Lobby</label>
                  <input
                    type="number"
                    value={stage.teamsPerLobby}
                    onChange={(e) => onSave(stage.id, { teamsPerLobby: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Qualifying Teams</label>
                  <input
                    type="number"
                    value={stage.qualifyingTeams}
                    onChange={(e) => onSave(stage.id, { qualifyingTeams: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Elimination Count</label>
                  <input
                    type="number"
                    value={stage.eliminationCount}
                    onChange={(e) => onSave(stage.id, { eliminationCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Scoring Rules */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Scoring Rules
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Points Per Kill</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={scoring.killPoints}
                    onChange={(e) => onSave(stage.id, {
                      scoringRules: { ...scoring, killPoints: parseInt(e.target.value) || 0 },
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Qualification Rule</label>
                  <Select
                    value={scoring.qualificationRule}
                    onChange={(v) => onSave(stage.id, {
                      scoringRules: { ...scoring, qualificationRule: v as 'TOP_N' | 'POINTS_THRESHOLD' | 'WINS_REQUIRED' },
                    })}
                    options={[
                      { value: 'TOP_N', label: 'Top N Qualify', icon: <Trophy className="w-full h-full" />, description: 'Top placing teams advance' },
                      { value: 'POINTS_THRESHOLD', label: 'Points Threshold', icon: <TrendingUp className="w-full h-full" />, description: 'Reach a points target' },
                      { value: 'WINS_REQUIRED', label: 'Wins Required', icon: <Award className="w-full h-full" />, description: 'Must win a minimum matches' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Qualification Value</label>
                  <input
                    type="number"
                    value={scoring.qualificationValue}
                    onChange={(e) => onSave(stage.id, {
                      scoringRules: { ...scoring, qualificationValue: parseInt(e.target.value) || 0 },
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Placement points */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-white/50 mb-2">Placement Points (positions 1-16)</label>
                <div className="flex flex-wrap gap-1.5">
                  {scoring.placementPoints.slice(0, 16).map((pt: number, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="text-[10px] text-white/30 mb-0.5">#{idx + 1}</span>
                      <input
                        type="number"
                        min={0}
                        value={pt}
                        onChange={(e) => {
                          const newPts = [...scoring.placementPoints];
                          newPts[idx] = parseInt(e.target.value) || 0;
                          onSave(stage.id, { scoringRules: { ...scoring, placementPoints: newPts } });
                        }}
                        className="w-12 text-center bg-white/5 border border-white/10 rounded px-1 py-1 text-white text-[11px] focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Format & Match Settings */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-400" />
                Format & Match Settings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Format Type</label>
                  <Select
                    value={stage.formatType}
                    onChange={(v) => onSave(stage.id, { formatType: v })}
                    options={[
                      { value: 'STANDARD', label: 'Standard', icon: <Layout className="w-full h-full" />, description: 'Default elimination format' },
                      { value: 'BATTLE_ROYALE', label: 'Battle Royale', icon: <Crosshair className="w-full h-full" />, description: 'BR scoring & match format' },
                      { value: 'SWISS', label: 'Swiss System', icon: <GitBranch className="w-full h-full" />, description: 'Swiss system pairing' },
                      { value: 'ROUND_ROBIN', label: 'Round Robin', icon: <Grid3x3 className="w-full h-full" />, description: 'All teams play each other' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Lobby Count</label>
                  <input
                    type="number"
                    min={1}
                    value={stage.lobbyCount}
                    onChange={(e) => onSave(stage.id, { lobbyCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Matches</label>
                  <input
                    type="number"
                    min={1}
                    value={stage.matchesCount}
                    onChange={(e) => onSave(stage.id, { matchesCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Map className="w-4 h-4 text-green-400" />
                Schedule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Start Date</label>
                  <input
                    type="datetime-local"
                    value={stage.startDate ? new Date(stage.startDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => onSave(stage.id, { startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">End Date</label>
                  <input
                    type="datetime-local"
                    value={stage.endDate ? new Date(stage.endDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => onSave(stage.id, { endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save/Cancel */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
