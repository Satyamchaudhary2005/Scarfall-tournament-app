'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Percent, Shield } from 'lucide-react';

interface RevenueData {
  entryFee: number;
  teams: number;
  prizePoolPercent: number;
  totalCollection: number;
  prizePool: number;
  organizerEarnings: number;
  commission: number;
}

function calculateRevenue(entryFee: number, teams: number, prizePoolPercent: number): RevenueData {
  const totalCollection = entryFee * teams;
  const prizePool = Math.round(totalCollection * (prizePoolPercent / 100));
  const remaining = totalCollection - prizePool;
  const commission = Math.round(remaining * 0.5);
  const organizerEarnings = remaining - commission;

  return { entryFee, teams, prizePoolPercent, totalCollection, prizePool, organizerEarnings, commission };
}

export function RevenueBreakdown({ entryFee = 0, teams = 0, prizePoolPercent = 80, show = false }: {
  entryFee?: number;
  teams?: number;
  prizePoolPercent?: number;
  show?: boolean;
}) {
  const data = calculateRevenue(entryFee, teams, prizePoolPercent);

  const items = [
    { label: 'Total Collection', value: data.totalCollection, icon: IndianRupee, color: 'text-white', bg: 'bg-white/5' },
    { label: 'Prize Pool', value: data.prizePool, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Your Earnings', value: data.organizerEarnings, icon: ArrowUpRight, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'TournaX Commission', value: data.commission, icon: ArrowDownRight, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-card border border-card-border rounded-xl">
            <div className="px-4 py-3 border-b border-card-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Revenue Breakdown</p>
                  <p className="text-[10px] text-white/40">Real-time calculation</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`${item.bg} rounded-lg px-3 py-2.5 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="text-xs text-white/60">{item.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${item.color}`}>
                    ₹{item.value.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700" style={{ width: `${prizePoolPercent}%` }} />
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(100 - prizePoolPercent) / 2}%` }} />
                <div className="h-full bg-yellow-500 transition-all duration-700" style={{ width: `${(100 - prizePoolPercent) / 2}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span className="flex items-center gap-1"><Percent className="w-2.5 h-2.5" />Prize Pool</span>
                <span>Organizer</span>
                <span>Commission</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PerKillCalculator({ kills = 0, rewardPerKill = 0, maxReward = 0 }: {
  kills?: number;
  rewardPerKill?: number;
  maxReward?: number;
}) {
  const total = Math.min(kills * rewardPerKill, maxReward);

  return (
    <div className="bg-card border border-card-border rounded-xl">
      <div className="px-4 py-3 border-b border-card-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Kill Reward Calculator</p>
            <p className="text-[10px] text-white/40">Live kill earnings estimate</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Per Kill</span>
          <span className="text-sm font-bold text-white">₹{rewardPerKill}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Kills</span>
          <span className="text-sm font-bold text-white">{kills}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Max Reward</span>
          <span className="text-sm font-bold text-white/50">₹{maxReward.toLocaleString()}</span>
        </div>
        <div className="pt-3 border-t border-card-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">Total Reward</span>
            <motion.span
              key={total}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-white"
            >
              ₹{total.toLocaleString()}
            </motion.span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((total / (maxReward || 1)) * 100, 100)}%` }}
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            />
          </div>
        </div>
      </div>
      <div className="mx-4 mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-yellow-400/70 leading-relaxed">
            Anti-fraud notice: Kill counts are verified through match results and OCR validation. Suspicious activity will be reviewed and may result in disqualification.
          </p>
        </div>
      </div>
    </div>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
