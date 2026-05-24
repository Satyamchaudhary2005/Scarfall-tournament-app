'use client';

import { motion } from 'framer-motion';
import { ArrowDown, Trophy, Users, Crosshair, Crown } from 'lucide-react';
import type { TournamentStage } from '@/types';

interface VisualTournamentFlowProps {
  stages: TournamentStage[];
  totalTeams?: number;
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

export default function VisualTournamentFlow({ stages, totalTeams }: VisualTournamentFlowProps) {
  if (stages.length === 0) return null;

  return (
    <div className="w-full py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Tournament Flow</h3>
          {totalTeams && (
            <p className="text-xs text-white/40">{totalTeams.toLocaleString()} teams • {stages.length} stages</p>
          )}
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="relative flex flex-col items-center gap-0">
        {stages.map((stage, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === stages.length - 1;
          const inTeams = stage.teamsCount || (isFirst && totalTeams ? totalTeams : 0);
          const outTeams = stage.qualifyingTeams;

          return (
            <div key={stage.id} className="flex flex-col items-center w-full">
              {/* Arrow connection */}
              {!isFirst && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex flex-col items-center">
                    <ArrowDown className="w-5 h-5 text-primary/40 animate-bounce" />
                    <div className="text-[10px] text-primary/30 font-medium mt-0.5">
                      {stages[idx - 1].qualifyingTeams || '—'} teams qualify
                    </div>
                  </div>
                </div>
              )}

              {/* Stage Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`
                  relative w-full max-w-md rounded-xl border-2 overflow-hidden
                  ${isLast
                    ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 shadow-lg shadow-yellow-500/10'
                    : 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40'
                  }
                  transition-all duration-300
                `}
              >
                {/* Glow effect for grand finals */}
                {isLast && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse" />
                )}

                <div className="relative p-4">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stageTypeIcons[stage.type] || '📋'}</span>
                      <div>
                        <span className={`
                          text-sm font-bold
                          ${isLast ? 'text-yellow-400' : 'text-white'}
                        `}>
                          {stage.name}
                        </span>
                        <span className="text-[10px] text-white/30 ml-2">
                          Stage {stage.stageNumber}
                        </span>
                      </div>
                    </div>
                    <span className={`
                      text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                      ${isLast ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary/10 text-primary'}
                    `}>
                      {isLast ? 'FINALS' : stage.formatType === 'BATTLE_ROYALE' ? 'BR' : stage.formatType === 'SWISS' ? 'SWISS' : 'ELIM'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <Users className={`w-4 h-4 mx-auto mb-1 ${isLast ? 'text-yellow-400/60' : 'text-primary/60'}`} />
                      <span className={`text-sm font-bold block ${isLast ? 'text-yellow-300' : 'text-white'}`}>
                        {inTeams || '—'}
                      </span>
                      <span className="text-[10px] text-white/30">Teams In</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <Crosshair className="w-4 h-4 mx-auto mb-1 text-red-400/60" />
                      <span className="text-sm font-bold text-red-300 block">
                        {(inTeams && outTeams) ? inTeams - outTeams : '—'}
                      </span>
                      <span className="text-[10px] text-white/30">Eliminated</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <Crown className={`w-4 h-4 mx-auto mb-1 ${isLast ? 'text-yellow-400/60' : 'text-green-400/60'}`} />
                      <span className={`text-sm font-bold block ${isLast ? 'text-yellow-300' : 'text-green-300'}`}>
                        {outTeams || '—'}
                      </span>
                      <span className="text-[10px] text-white/30">Qualify</span>
                    </div>
                  </div>

                  {/* Stage progression bar */}
                  {inTeams > 0 && outTeams > 0 && outTeams < inTeams && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-[10px] text-white/30 mb-1">
                        <span>Advancing: {Math.round((outTeams / inTeams) * 100)}%</span>
                        <span className="ml-auto">{outTeams}/{inTeams}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(outTeams / inTeams) * 100}%` }}
                          transition={{ duration: 1, delay: idx * 0.2 }}
                          className={`h-full rounded-full ${isLast ? 'bg-yellow-500' : 'bg-primary'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Last stage crown indicator */}
              {isLast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stages.length * 0.1 + 0.3 }}
                  className="mt-4 flex items-center gap-2 text-yellow-400/60 text-xs"
                >
                  <Crown className="w-4 h-4" />
                  <span>1 Champion Crowned</span>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[10px] text-white/30">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> Teams In
        </span>
        <span className="flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-red-400/60" /> Eliminated
        </span>
        <span className="flex items-center gap-1">
          <Crown className="w-3 h-3 text-green-400/60" /> Qualify
        </span>
        <span className="flex items-center gap-1">
          <ArrowDown className="w-3 h-3 text-primary/40" /> Progression
        </span>
      </div>
    </div>
  );
}
