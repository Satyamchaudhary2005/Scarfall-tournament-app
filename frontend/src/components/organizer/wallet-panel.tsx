'use client';

import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { Wallet, Lock, TrendingUp, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletData {
  balance: number;
  locked: number;
  pendingEarnings: number;
  totalRevenue: number;
}

export function WalletPanel() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,
    locked: 0,
    pendingEarnings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch('/api/wallet');
        const data = await res.json();
        if (data.wallet) {
          setWallet({
            balance: data.wallet.balance || 0,
            locked: data.wallet.lockedAmount || 0,
            pendingEarnings: data.wallet.pendingEarnings || 0,
            totalRevenue: data.wallet.totalRevenue || 0,
          });
        }
      } catch {}
    }
    fetchWallet();
  }, []);

  const stats = [
    { label: 'Available', value: wallet.balance, icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: 'Locked', value: wallet.locked, icon: Lock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Pending', value: wallet.pendingEarnings, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Revenue', value: wallet.totalRevenue, icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  ];

  return (
    <div className="bg-card border border-card-border rounded-xl">
      <div className="p-4 border-b border-card-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Wallet</p>
            <p className="text-[10px] text-white/40">{user?.username}</p>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${stat.bg} ${stat.border} border rounded-lg p-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-xs text-white/50">{stat.label}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={stat.value}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-bold ${stat.color}`}
              >
                ₹{stat.value.toLocaleString()}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
