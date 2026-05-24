'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings, Copy, Trash2, ChevronDown, ChevronUp, Users, Crosshair, Zap, Swords } from 'lucide-react';
import type { TournamentStage, StageTypeMeta } from '@/types';

interface DraggableStageCardProps {
  stage: TournamentStage;
  stageNumber: number;
  isLast: boolean;
  stageTypes: StageTypeMeta[];
  onUpdate: (stageId: string, data: Partial<TournamentStage>) => void;
  onDelete: (stageId: string) => void;
  onDuplicate: (stage: TournamentStage) => void;
  onOpenSettings: (stage: TournamentStage) => void;
}

const stageTypeIcons: Record<string, string> = {
  'IN_GAME_QUALIFIER': '🎮',
  'OPEN_QUALIFIER': '🔓',
  'ONLINE_QUALIFIER': '🌐',
  'KNOCKOUT': '💀',
  'ROUND_1': '1️⃣',
  'ROUND_2': '2️⃣',
  'ROUND_3': '3️⃣',
  'WILDCARD': '🃏',
  'SURVIVAL_STAGE': '⚔️',
  'LEAGUE_STAGE': '🏆',
  'PLAYOFFS': '🔱',
  'SEMI_FINALS': '4️⃣',
  'GRAND_FINALS': '👑',
  'LAST_CHANCE_QUALIFIER': '💫',
};

export default function DraggableStageCard({
  stage,
  stageNumber,
  isLast,
  stageTypes,
  onUpdate,
  onDelete,
  onDuplicate,
  onOpenSettings,
}: DraggableStageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(stage.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const typeMeta = stageTypes.find((t) => t.value === stage.type);
  const icon = stageTypeIcons[stage.type] || '📋';

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue !== stage.name) {
      onUpdate(stage.id, { name: nameValue.trim() });
    } else {
      setNameValue(stage.name);
    }
    setEditingName(false);
  };

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      style={style}
      className={`
        relative rounded-xl border-2 transition-colors duration-300
        ${isDragging ? 'shadow-glow-red border-primary/40' : ''}
        ${isLast
          ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-transparent'
          : 'border-white/10 bg-card hover:border-white/20'
        }
      `}
    >
      {/* Connection line to next stage */}
      {!isLast && (
        <div className="absolute -bottom-6 left-8 w-0.5 h-6 bg-gradient-to-b from-primary/40 to-primary/10" />
      )}

      <div className="p-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-3">
          {/* Drag handle */}
          <div
            className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 transition-colors touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Stage number */}
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
            ${isLast
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-primary/10 text-primary'
            }
          `}>
            {stageNumber}
          </div>

          {/* Stage icon */}
          <span className="text-xl">{icon}</span>

          {/* Stage name (editable) */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-medium text-sm w-full focus:outline-none focus:border-primary/50"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm font-semibold text-white hover:text-primary transition-colors truncate block w-full text-left"
                title="Click to rename"
              >
                {stage.name}
              </button>
            )}
          </div>

          {/* Stage type selector */}
          <select
            value={stage.type}
            onChange={(e) => onUpdate(stage.id, { type: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-primary/50"
          >
            {stageTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <span className={`
            text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
            ${stage.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
              stage.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
              'bg-white/5 text-white/30'}
          `}>
            {stage.status === 'PENDING' ? 'Pending' : stage.status}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenSettings(stage)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-primary transition-all"
              title="Stage Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(stage)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
              title="Duplicate Stage"
            >
              <Copy className="w-4 h-4" />
            </button>
            {!isLast && (
              <button
                onClick={() => onDelete(stage.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
                title="Delete Stage"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Users className="w-3.5 h-3.5 text-primary/60" />
            <span>{stage.teamsCount || '—'} teams</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Zap className="w-3.5 h-3.5 text-green-400/60" />
            <span>{stage.qualifyingTeams || '—'} qualify</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Crosshair className="w-3.5 h-3.5 text-red-400/60" />
            <span>{stage.eliminationCount || '—'} eliminated</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Swords className="w-3.5 h-3.5 text-blue-400/60" />
            <span>{stage.matchesCount || '—'} lobbies</span>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/5"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Teams Per Lobby</label>
                <input
                  type="number"
                  min={1}
                  value={stage.teamsPerLobby}
                  onChange={(e) => onUpdate(stage.id, { teamsPerLobby: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Qualifying Teams</label>
                <input
                  type="number"
                  min={0}
                  value={stage.qualifyingTeams}
                  onChange={(e) => onUpdate(stage.id, { qualifyingTeams: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Lobby Count</label>
                <input
                  type="number"
                  min={0}
                  value={stage.lobbyCount}
                  onChange={(e) => onUpdate(stage.id, { lobbyCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Format</label>
                <select
                  value={stage.formatType}
                  onChange={(e) => onUpdate(stage.id, { formatType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="BATTLE_ROYALE">Battle Royale</option>
                  <option value="SWISS">Swiss</option>
                  <option value="ROUND_ROBIN">Round Robin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={stage.startDate ? new Date(stage.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => onUpdate(stage.id, { startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={stage.endDate ? new Date(stage.endDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => onUpdate(stage.id, { endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Scoring rules quick edit */}
            <div className="mt-4">
              <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2">Scoring Rules</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="text-xs text-white/40">Kill Points</span>
                  <input
                    type="number"
                    min={0}
                    value={stage.scoringRules?.killPoints ?? 1}
                    onChange={(e) => onUpdate(stage.id, {
                      scoringRules: {
                        ...(stage.scoringRules || { killPoints: 1, placementPoints: [15,12,10,8,6,4,2,1,0,0,0,0,0,0,0,0], qualificationRule: 'TOP_N', qualificationValue: 0 }),
                        killPoints: parseInt(e.target.value) || 0,
                      },
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-white/40">Qualification Rule</span>
                  <select
                    value={stage.scoringRules?.qualificationRule || 'TOP_N'}
                    onChange={(e) => onUpdate(stage.id, {
                      scoringRules: {
                        ...(stage.scoringRules || { killPoints: 1, placementPoints: [15,12,10,8,6,4,2,1,0,0,0,0,0,0,0,0], qualificationRule: 'TOP_N' as const, qualificationValue: 0 }),
                        qualificationRule: e.target.value as 'TOP_N' | 'POINTS_THRESHOLD' | 'WINS_REQUIRED',
                      },
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary/50"
                  >
                    <option value="TOP_N">Top N Qualify</option>
                    <option value="POINTS_THRESHOLD">Points Threshold</option>
                    <option value="WINS_REQUIRED">Wins Required</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
