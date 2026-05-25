'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { walletApi } from '@/services/api';
import { motion } from 'framer-motion';
import { Trophy, Swords, Gamepad2, Crosshair, Wallet, TrendingUp } from 'lucide-react';
import { calculateKd, calculateWinRate } from '@/lib/utils';

const statCards: { key: string; label: string; icon: any; format: (v: any) => string }[] = [
  { key: 'points', label: 'Rank Points', icon: Trophy, format: (v: number) => v.toLocaleString() },
  { key: 'wins', label: 'Wins', icon: Swords, format: (v: number) => v.toString() },
  { key: 'matchesPlayed', label: 'Matches', icon: Gamepad2, format: (v: number) => v.toString() },
  { key: 'kd', label: 'K/D', icon: Crosshair, format: (v: string) => v },
];

export function UserStatsBar() {
  const { user } = useAuthStore();
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet(),
  });

  if (!user) return null;

  const stats = [
    { key: 'points', value: user.points },
    { key: 'wins', value: user.wins },
    { key: 'matchesPlayed', value: user.matchesPlayed },
    { key: 'kd', value: calculateKd(user.kills, user.deaths) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-5 gap-3"
    >
      {stats.map((stat, i) => {
        const config = statCards[i];
        const Icon = config.icon;
        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative p-4 rounded-xl bg-card border border-card-border hover:border-primary/20 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-white font-mono truncate">
                  {config.format(stat.value)}
                </p>
                <p className="text-[11px] text-white/40 font-medium">{config.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Wallet Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4 * 0.08 }}
        className="relative p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-white font-mono truncate">
              ₹{walletData?.wallet?.balance?.toLocaleString() ?? '0'}
            </p>
            <p className="text-[11px] text-white/40 font-medium">Wallet</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
