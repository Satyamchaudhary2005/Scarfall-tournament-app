'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Trophy, Users, LayoutGrid, Target } from 'lucide-react';
import { useState } from 'react';

interface FlowNode {
  label: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
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
      <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Tournament Flow</div>
      <div className="flex items-center gap-1">
        {flow.nodes.map((node, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <motion.div
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              animate={hovered === i ? { scale: 1.1 } : { scale: 1 }}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${node.color} ${
                hovered === i ? 'shadow-lg shadow-primary/20 scale-110' : ''
              }`}
            >
              {node.icon}
            </motion.div>
            <span className={`text-[9px] mt-1.5 font-medium text-center leading-tight transition-colors ${
              hovered === i ? 'text-white' : 'text-white/40'
            }`}>
              {node.label}
            </span>
            {i < flow.nodes.length - 1 && (
              <motion.div
                animate={hovered === i ? { x: 2 } : { x: 0 }}
                className="hidden sm:block absolute right-[-8px] top-1/2 -translate-y-1/2"
              >
                <ArrowRight className="w-3 h-3 text-white/20" />
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-3 pt-3 border-t border-card-border"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Format</span>
          <span className="text-white font-medium">{flow.label}</span>
        </div>
      </motion.div>
    </div>
  );
}
