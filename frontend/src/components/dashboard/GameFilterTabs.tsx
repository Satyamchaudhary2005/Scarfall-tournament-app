'use client';

import { motion } from 'framer-motion';

const GAMES = [
  { id: 'all', label: 'All Games', icon: '🎮' },
  { id: 'bgmi', label: 'BGMI', icon: '🔥' },
  { id: 'freefire', label: 'Free Fire', icon: '💥' },
  { id: 'valorant', label: 'Valorant', icon: '🔫' },
  { id: 'cod', label: 'COD', icon: '🎯' },
  { id: 'other', label: 'Other', icon: '⭐' },
];

export const GAME_KEYWORDS: Record<string, string[]> = {
  all: [],
  bgmi: ['bgmi', 'pubg', 'battlegrounds'],
  freefire: ['free fire', 'freefire', 'ff'],
  valorant: ['valorant'],
  cod: ['cod', 'call of duty', 'call of duty mobile', 'codm'],
  other: [],
};

interface GameFilterTabsProps {
  active: string;
  onSelect: (id: string) => void;
}

export function GameFilterTabs({ active, onSelect }: GameFilterTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {GAMES.map((game) => {
        const isActive = active === game.id;
        return (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary text-white shadow-glow-red-sm'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
            }`}
          >
            <span className="mr-1.5">{game.icon}</span>
            {game.label}
            {isActive && (
              <motion.div
                layoutId="game-filter-active"
                className="absolute inset-0 rounded-lg bg-primary -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </motion.div>
  );
}
