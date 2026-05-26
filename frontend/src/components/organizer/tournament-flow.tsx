'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, LayoutGrid, Target, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface FlowNode {
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface FlowConfig {
  nodes: FlowNode[];
  label: string;
}

const flows: Record<string, FlowConfig> = {
  SINGLE: {
    label: 'Single Match',
    nodes: [
      { label: 'Registration', icon: <Users className="w-4 h-4" />, color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
      { label: 'Room Assign', icon: <LayoutGrid className="w-4 h-4" />, color: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
      { label: 'Match Live', icon: <Target className="w-4 h-4" />, color: 'border-green-500/30 bg-green-500/10 text-green-400' },
      { label: 'Results', icon: <Trophy className="w-4 h-4" />, color: 'border-primary/30 bg-primary/10 text-primary' },
    ],
  },
  MULTI: {
    label: 'Multi Match',
    nodes: [
      { label: 'Registration', icon: <Users className="w-4 h-4" />, color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
      { label: 'Match 1', icon: <Target className="w-4 h-4" />, color: 'border-green-500/30 bg-green-500/10 text-green-400' },
      { label: 'Match N', icon: <LayoutGrid className="w-4 h-4" />, color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' },
      { label: 'Final Rank', icon: <Trophy className="w-4 h-4" />, color: 'border-primary/30 bg-primary/10 text-primary' },
    ],
  },
  MULTI_STAGE: {
    label: 'Multi Stage',
    nodes: [
      { label: 'Open Quals', icon: <Users className="w-4 h-4" />, color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
      { label: 'Semi Finals', icon: <Target className="w-4 h-4" />, color: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
      { label: 'Grand Finals', icon: <Trophy className="w-4 h-4" />, color: 'border-primary/30 bg-primary/10 text-primary' },
    ],
  },
  PER_KILL: {
    label: 'Per Kill Challenge',
    nodes: [
      { label: 'Registration', icon: <Users className="w-4 h-4" />, color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
      { label: 'Kill Race', icon: <Target className="w-4 h-4" />, color: 'border-green-500/30 bg-green-500/10 text-green-400' },
      { label: 'Verification', icon: <LayoutGrid className="w-4 h-4" />, color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' },
      { label: 'Payout', icon: <Trophy className="w-4 h-4" />, color: 'border-primary/30 bg-primary/10 text-primary' },
    ],
  },
};

export function TournamentFlowPreview({ type = 'SINGLE' }: { type?: string }) {
  const flow = flows[type] || flows.SINGLE;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Tournament Flow</p>
          <p className="text-[10px] text-white/40">Format visualization</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1">
        {flow.nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                animate={hovered === i ? { scale: 1.1 } : { scale: 1 }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 ${node.color} ${
                  hovered === i ? 'shadow-lg shadow-primary/20' : ''
                }`}
              >
                {node.icon}
              </motion.div>
              <span className={`text-[9px] mt-1.5 font-medium text-center leading-tight transition-colors ${
                hovered === i ? 'text-white' : 'text-white/40'
              }`}>
                {node.label}
              </span>
            </div>
            {i < flow.nodes.length - 1 && (
              <div className="flex-1 flex items-center justify-center mb-5">
                <div className="w-full h-px bg-white/10 relative">
                  <ArrowRight className="w-3 h-3 text-white/20 absolute right-0 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-card-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Format</span>
          <span className="text-xs font-semibold text-white">{flow.label}</span>
        </div>
      </div>
    </div>
  );
}
