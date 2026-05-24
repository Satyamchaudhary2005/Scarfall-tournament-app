'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge } from '@/components/ui';
import { ChevronRight, Trophy, Users, Layers, Star, ArrowDown } from 'lucide-react';
import type { StagePreset } from '@/types';

interface StagePresetSelectorProps {
  onSelect: (preset: StagePreset) => void;
  onBack: () => void;
}

const complexityColors: Record<string, string> = {
  'Beginner': 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
  'Easy': 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  'Moderate': 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  'Advanced': 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
  'Professional': 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
  'Ultimate': 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
};

export default function StagePresetSelector({ onSelect, onBack }: StagePresetSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['stage-presets'],
    queryFn: () => tournamentApi.getStagePresets(),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const presets = data?.presets || [];

  const selectedPreset = presets.find((p) => p.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Layers className="w-6 h-6 text-primary" />
            Choose Tournament Format
          </h2>
          <p className="text-white/50 mt-1">
            Select a professional stage preset or build from scratch
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-white/40 hover:text-white transition-colors"
        >
          Back
        </button>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {presets.map((preset, index) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedId(preset.id)}
            className={`
              relative cursor-pointer rounded-xl border-2 transition-all duration-300 p-5
              ${selectedId === preset.id
                ? 'border-primary bg-primary/[0.08] shadow-glow-red'
                : 'border-white/5 bg-card hover:border-white/20 hover:bg-white/[0.03]'
              }
            `}
          >
            {/* Stage count badge */}
            <div className="absolute top-3 right-3">
              <Badge size="sm" variant={selectedId === preset.id ? 'gold' : 'default'}>
                {preset.stages.length} Stage{preset.stages.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Complexity */}
            <span className={`
              inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-3
              ${complexityColors[preset.complexity] || 'bg-white/5 border-white/10 text-white/40'}
            `}>
              {preset.complexity}
            </span>

            {/* Title */}
            <h3 className="text-base font-bold text-white mb-1 pr-16">{preset.name}</h3>
            <p className="text-xs text-white/40 mb-3">{preset.description}</p>

            {/* Recommended teams & features */}
            <div className="flex items-center gap-1.5 text-xs text-white/50 mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>{preset.recommendedTeams} teams</span>
            </div>
            {preset.features && (
              <div className="text-[10px] text-primary/70 mb-3 line-clamp-2">
                {preset.features}
              </div>
            )}

            {/* Stage flow mini view */}
            <div className="space-y-1">
              {preset.stages.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`
                    w-2 h-2 rounded-full flex-shrink-0
                    ${idx === preset.stages.length - 1 ? 'bg-yellow-400' : 'bg-primary/50'}
                  `} />
                  <span className="text-xs text-white/60 truncate">{stage.name}</span>
                  {idx < preset.stages.length - 1 && (
                    <ArrowDown className="w-2.5 h-2.5 text-white/20 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Preset Preview & Confirm */}
      <AnimatePresence>
        {selectedPreset && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="p-6 border-primary/20">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedPreset.name}</h3>
                      <p className="text-sm text-white/50">{selectedPreset.stages.length} stages • {selectedPreset.complexity} • {selectedPreset.recommendedTeams} recommended</p>
                    </div>
                  </div>

                  {/* Full stage flow */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedPreset.stages.map((stage, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium border
                          ${idx === selectedPreset.stages.length - 1
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            : 'bg-primary/5 border-primary/20 text-primary'
                          }
                        `}>
                          {stage.name}
                        </div>
                        {idx < selectedPreset.stages.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-white/20" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="flex-shrink-0"
                  onClick={() => onSelect(selectedPreset)}
                >
                  <Trophy className="w-4 h-4" />
                  Use Preset
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card border border-card-border animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
