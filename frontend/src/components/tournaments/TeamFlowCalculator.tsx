'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import { Calculator, Users, ArrowDown, RefreshCw, CheckCircle } from 'lucide-react';
import type { TournamentStage } from '@/types';

interface TeamFlowCalculatorProps {
  stages: TournamentStage[];
  totalTeams: number;
  onUpdateStage: (stageId: string, data: Partial<TournamentStage>) => void;
  onGenerate: () => void;
  generating: boolean;
}

const DEFAULT_PLACEMENT_PTS = [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0];

export default function TeamFlowCalculator({
  stages,
  totalTeams,
  onUpdateStage,
  onGenerate,
  generating,
}: TeamFlowCalculatorProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  // Defaults aligned with real Free Fire & BGMI tournament formats
  const [baseTeams, setBaseTeams] = useState(totalTeams || 100);
  const [qualifyPercent, setQualifyPercent] = useState(25);
  const [teamsPerLobby, setTeamsPerLobby] = useState(12);

  const calculatedFlow = useMemo(() => {
    if (stages.length === 0) return [];

    const flow: { stageName: string; in: number; out: number; eliminated: number; lobbies: number }[] = [];

    stages.forEach((stage, idx) => {
      const prev = idx > 0 ? flow[idx - 1] : null;
      const incoming = prev ? prev.out : baseTeams;
      const out = idx === stages.length - 1 ? 1 : Math.max(1, Math.round(incoming * (qualifyPercent / 100)));
      const eliminated = incoming - out;
      const lobbies = Math.max(1, Math.ceil(incoming / (stage.teamsPerLobby || teamsPerLobby)));

      flow.push({
        stageName: stage.name,
        in: incoming,
        out,
        eliminated,
        lobbies,
      });
    });

    return flow;
  }, [stages, baseTeams, qualifyPercent, teamsPerLobby]);

  const applyCalculation = () => {
    calculatedFlow.forEach((flow, idx) => {
      if (idx < stages.length) {
        onUpdateStage(stages[idx].id, {
          teamsCount: flow.in,
          qualifyingTeams: flow.out,
          eliminationCount: flow.eliminated,
          lobbyCount: flow.lobbies,
          teamsPerLobby: stages[idx].teamsPerLobby || teamsPerLobby,
          matchesCount: flow.lobbies,
        });
      }
    });
  };

  return (
    <div>
      <button
        onClick={() => setShowCalculator(!showCalculator)}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <Calculator className="w-4 h-4" />
        Team Flow Calculator
        <span className="text-[10px] text-white/20">(auto-calculate progression)</span>
      </button>

      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-5 mt-3 border-primary/20">
              {/* Input Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Total Registered Teams</label>
                  <input
                    type="number"
                    min={2}
                    value={baseTeams}
                    onChange={(e) => setBaseTeams(parseInt(e.target.value) || 2)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Teams Per Lobby</label>
                  <input
                    type="number"
                    min={4}
                    max={100}
                    value={teamsPerLobby}
                    onChange={(e) => setTeamsPerLobby(parseInt(e.target.value) || 4)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Qualification Rate ({qualifyPercent}%)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={75}
                      value={qualifyPercent}
                      onChange={(e) => setQualifyPercent(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-full bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <span className="text-sm text-white font-medium w-8">{qualifyPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Calculated Flow */}
              <div className="space-y-2 mb-6">
                {calculatedFlow.map((step, idx) => (
                  <div
                    key={idx}
                    className={`
                      flex items-center gap-4 p-3 rounded-lg text-sm
                      ${idx === calculatedFlow.length - 1
                        ? 'bg-yellow-500/5 border border-yellow-500/20'
                        : 'bg-white/[0.02] border border-white/5'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                      ${idx === calculatedFlow.length - 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary/10 text-primary'}
                    `}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 font-medium text-white">{step.stageName}</div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-white/70">
                        <Users className="w-3 h-3" /> {step.in.toLocaleString()}
                      </span>
                      <ArrowDown className="w-3 h-3 text-white/20" />
                      <span className="flex items-center gap-1 text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        -{step.eliminated.toLocaleString()}
                      </span>
                      <ArrowDown className="w-3 h-3 text-white/20" />
                      <span className="flex items-center gap-1 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        {step.out.toLocaleString()}
                      </span>
                      <span className="text-white/30">({step.lobbies} lobbies)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setBaseTeams(totalTeams || 1024);
                    setQualifyPercent(25);
                    setTeamsPerLobby(16);
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    applyCalculation();
                    setShowCalculator(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply Flow to Stages
                </Button>
              </div>

              <p className="text-[10px] text-white/20 text-center mt-3">
                {calculatedFlow[0]?.in.toLocaleString()} teams in → {calculatedFlow[calculatedFlow.length - 1]?.out} champion
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      {stages.length > 0 && (
        <Button
          onClick={onGenerate}
          loading={generating}
          className="w-full mt-4"
        >
          <RefreshCw className="w-4 h-4" />
          Auto-Generate Tournament from Stages
        </Button>
      )}
    </div>
  );
}
