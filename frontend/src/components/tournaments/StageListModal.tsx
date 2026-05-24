'use client';

import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import {
  Layers, X, CheckCircle, Clock, Swords, Users, Skull, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TournamentStage } from '@/types';

interface StageListModalProps {
  tournamentId: string;
  onSelectStage: (stage: TournamentStage) => void;
  onClose: () => void;
}

export default function StageListModal({ tournamentId, onSelectStage, onClose }: StageListModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['tournament-stages', tournamentId],
    queryFn: () => tournamentApi.getStages(tournamentId),
  });

  const stages = data?.stages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Swords className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Manage Stage Matches</h3>
                <p className="text-sm text-white/50">Select a stage to manage matches and scores</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : stages.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No stages configured yet</p>
              <p className="text-white/20 text-xs mt-1">Set up stages in the Stage Builder first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stages.map((stage, idx) => (
                <motion.button
                  key={stage.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onSelectStage(stage)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                    stage.status === 'COMPLETED'
                      ? 'bg-green-500/5 border-green-500/20'
                      : stage.status === 'ACTIVE'
                        ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]',
                  )}
                >
                  {/* Stage number */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                    stage.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                    stage.status === 'ACTIVE' ? 'bg-primary/20 text-primary' :
                    'bg-white/5 text-white/40',
                  )}>
                    {stage.stageNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{stage.name}</h4>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full',
                        stage.status === 'ACTIVE' ? 'bg-primary/20 text-primary' :
                        stage.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        'bg-white/5 text-white/30',
                      )}>
                        {stage.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {stage.teamsCount || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-green-400/60" /> {stage.qualifyingTeams || '-'} qualify
                      </span>
                      <span className="flex items-center gap-1">
                        <Swords className="w-3 h-3" /> {stage.matchesCount || '-'} matches
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-primary font-semibold shrink-0">
                    Manage →
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
