'use client';

import { motion } from 'framer-motion';
import { Trophy, ChevronDown, ChevronRight, Skull, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StageBracketEntry, StageBracketMatch, StageBracketTeam } from '@/types';
import { useMemo, useState } from 'react';

interface VisualBracketProps {
  bracket: StageBracketEntry[];
  className?: string;
}

function TeamBadge({ team, rank }: { team: StageBracketTeam; rank: number }) {
  const isFirst = rank === 1 && team.placement === 1;
  const isQualified = team.qualified;
  const isEliminated = team.eliminated;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all',
        isFirst && 'bg-yellow-500/10 border border-yellow-500/30',
        isQualified && !isFirst && 'bg-green-500/5 border border-green-500/20',
        isEliminated && 'bg-red-500/5 border border-red-500/10 opacity-60',
        !isQualified && !isEliminated && 'bg-white/5 border border-white/10',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
          isFirst ? 'bg-yellow-500/20 text-yellow-400' :
          isQualified ? 'bg-green-500/20 text-green-400' :
          isEliminated ? 'bg-red-500/20 text-red-400' :
          'bg-white/10 text-white/50'
        )}>
          {rank}
        </span>
        <span className={cn(
          'truncate max-w-[120px]',
          isFirst && 'text-yellow-300 font-bold',
          isQualified && !isFirst && 'text-green-300',
          isEliminated && 'text-red-400/60 line-through',
          !isQualified && !isEliminated && 'text-white/70',
        )}>
          {team.teamName}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {team.kills > 0 && (
          <span className="text-[10px] text-red-400/70">
            {team.kills}K
          </span>
        )}
        {team.points > 0 && (
          <span className="text-[10px] text-primary font-bold">
            {team.points}pt
          </span>
        )}
        {isQualified && <CheckCircle className="w-3 h-3 text-green-400" />}
        {isEliminated && <Skull className="w-3 h-3 text-red-500/50" />}
      </div>
    </motion.div>
  );
}

function BracketMatch({ match, matchIndex }: { match: StageBracketMatch; matchIndex: number }) {
  const [expanded, setExpanded] = useState(false);
  const sortedTeams = [...match.teams].sort((a, b) => (a.placement || 999) - (b.placement || 999));
  const qualifiedCount = match.teams.filter((t) => t.qualified).length;
  const isEmpty = match.teams.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: matchIndex * 0.05 }}
      className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/70">{match.name}</span>
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded-full',
            match.status === 'LIVE' && 'bg-green-500/20 text-green-400',
            match.status === 'COMPLETED' && 'bg-blue-500/20 text-blue-400',
            match.status === 'PENDING' && 'bg-white/5 text-white/30',
          )}>
            {match.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">
            {match.teams.length} teams
            {qualifiedCount > 0 && ` • ${qualifiedCount} qualify`}
          </span>
          {expanded ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronRight className="w-3 h-3 text-white/30" />}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          {isEmpty ? (
            <p className="text-xs text-white/20 text-center py-3">No teams assigned yet</p>
          ) : (
            sortedTeams.map((team, i) => (
              <TeamBadge key={team.teamId} team={team} rank={i + 1} />
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function VisualBracket({ bracket, className }: VisualBracketProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {bracket.map((stage, stageIdx) => {
        const completedMatches = stage.matches.filter((m) => m.status === 'COMPLETED').length;
        const qualifiedTeams = stage.matches.reduce(
          (sum, m) => sum + m.teams.filter((t) => t.qualified).length, 0
        );
        const isLast = stageIdx === bracket.length - 1;
        const hasNext = stageIdx < bracket.length - 1;

        return (
          <div key={stage.id}>
            {/* Stage Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stageIdx * 0.1 }}
              className="relative"
            >
              <div className={cn(
                'p-4 rounded-xl border relative overflow-hidden',
                stage.status === 'COMPLETED'
                  ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20'
                  : stage.status === 'ACTIVE'
                    ? 'bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20'
                    : 'bg-white/[0.02] border-white/5'
              )}>
                {/* Glow effect for active stages */}
                {stage.status === 'ACTIVE' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent animate-pulse" />
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isLast && <Trophy className="w-4 h-4 text-yellow-400" />}
                      <h4 className={cn(
                        'text-sm font-bold',
                        isLast ? 'text-yellow-300' : 'text-white'
                      )}>
                        {stage.name}
                      </h4>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full',
                        stage.status === 'COMPLETED' && 'bg-green-500/20 text-green-400',
                        stage.status === 'ACTIVE' && 'bg-primary/20 text-primary',
                        stage.status === 'PENDING' && 'bg-white/5 text-white/30',
                      )}>
                        {stage.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      <span>{stage.teamsCount} teams</span>
                      {stage.lobbyCount > 0 && <span>{stage.lobbyCount} lobbies</span>}
                      <span>{completedMatches}/{stage.matches.length} done</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-white/50">
                      Qualify: <span className="text-green-400 font-bold">{stage.qualifyingTeams}</span>
                    </span>
                    <span className="text-white/50">
                      Eliminated: <span className="text-red-400 font-bold">{stage.eliminationCount}</span>
                    </span>
                    {qualifiedTeams > 0 && (
                      <span className="text-white/50">
                        Advanced: <span className="text-primary font-bold">{qualifiedTeams}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Matches within this stage */}
              <div className="mt-2 space-y-1.5">
                {stage.matches.map((match, mIdx) => (
                  <BracketMatch key={match.id} match={match} matchIndex={mIdx} />
                ))}
              </div>
            </motion.div>

            {/* Connection arrow to next stage */}
            {hasNext && (
              <div className="flex justify-center py-2">
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: stageIdx * 0.1 + 0.3 }}
                  className="flex flex-col items-center gap-1"
                >
                  <ArrowRight className="w-5 h-5 text-primary/40" />
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">
                    {qualifiedTeams > 0 ? `${qualifiedTeams} advance` : 'Qualifiers advance'}
                  </span>
                </motion.div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
