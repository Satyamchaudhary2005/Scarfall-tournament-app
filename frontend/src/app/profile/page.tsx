'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Button } from '@/components/ui';
import { authApi, walletApi } from '@/services/api';
import { Trophy, Swords, Users, Skull, Crosshair, Activity, LogOut, Gamepad2, Wallet, Banknote, TrendingUp, TrendingDown, Plus, Minus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateKd, calculateWinRate, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const [ignValue, setIgnValue] = useState(user?.ign || '');

  const updateIgnMutation = useMutation({
    mutationFn: (ign: string) => authApi.updateProfile({ ign }),
    onSuccess: (res) => {
      updateUser(res.user);
      toast.success('In-game name updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update');
    },
  });

  if (!isAuthenticated || !user) {
    router.push('/auth/login');
    return null;
  }

  const stats = [
    { label: 'Points', value: user.points.toLocaleString(), icon: Trophy, color: 'text-primary' },
    { label: 'Kills', value: user.kills.toLocaleString(), icon: Crosshair, color: 'text-red-400' },
    { label: 'KD Ratio', value: calculateKd(user.kills, user.deaths), icon: Swords, color: 'text-blue-400' },
    { label: 'Wins', value: user.wins.toLocaleString(), icon: Trophy, color: 'text-yellow-400' },
    { label: 'Matches', value: user.matchesPlayed.toLocaleString(), icon: Activity, color: 'text-purple-400' },
    { label: 'Win Rate', value: `${calculateWinRate(user.wins, user.matchesPlayed)}%`, icon: Skull, color: 'text-green-400' },
  ];

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <Card className="p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-primary">{user.username[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-black text-white">{user.username}</h1>
                <p className="text-white/50 mt-1">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {user.role}
                  </span>
                  {user.clan && (
                    <Link href={`/clans/${user.clan.id}`} className="text-xs text-white/40 hover:text-primary transition-colors">
                      [{user.clan.tag}] {user.clan.name}
                    </Link>
                  )}
                </div>
              </div>
              <Button variant="ghost" onClick={logout} className="text-red-400 hover:text-red-300">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </Card>

          {/* Wallet Section */}
          <WalletSection />

          {/* In-Game Name */}
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">In-Game Name</h2>
            </div>
            <p className="text-xs text-white/40 mb-3">
              Set your in-game name so tournament organizers can identify you in the lobby.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={ignValue}
                onChange={(e) => setIgnValue(e.target.value)}
                placeholder="Enter your in-game name..."
                className="input-base flex-1"
              />
              <Button
                onClick={() => updateIgnMutation.mutate(ignValue)}
                loading={updateIgnMutation.isPending}
                disabled={ignValue === (user.ign || '')}
              >
                Save
              </Button>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Clan Info */}
          {user.clan && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                My Clan
              </h2>
              <Link href={`/clans/${user.clan.id}`} className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-black text-primary">
                  {user.clan.tag[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    [{user.clan.tag}] {user.clan.name}
                  </p>
                  <p className="text-sm text-white/40">View clan profile →</p>
                </div>
              </Link>
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Link href="/tournaments">
              <Card hover className="p-6 text-center">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-white">My Tournaments</h3>
                <p className="text-sm text-white/40">View your registrations</p>
              </Card>
            </Link>
            <Link href="/leaderboard">
              <Card hover className="p-6 text-center">
                <Swords className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-white">Leaderboard</h3>
                <p className="text-sm text-white/40">See where you rank</p>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}

function WalletSection() {
  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet(),
    refetchInterval: 30000,
  });

  const { data: txData } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => walletApi.getTransactions(),
  });

  const balance = walletData?.wallet?.balance ?? 0;
  const transactions = txData?.transactions ?? walletData?.wallet?.transactions ?? [];

  // Calculate estimated total winnings from transaction history
  const totalWinnings = transactions
    .filter((tx: any) => tx.type === 'TOURNAMENT_WINNING')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const totalSpent = transactions
    .filter((tx: any) => tx.type === 'TOURNAMENT_FEE')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  return (
    <Card className="p-6 mb-8 overflow-hidden relative">
      {/* BG gradient orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-red-500/5 to-red-700/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-red-500/3 to-red-700/5 rounded-full blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Wallet</h2>
              <p className="text-xs text-white/40">Manage your gaming funds</p>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="flex flex-wrap gap-6 mb-5">
          <div className="flex-1 min-w-[140px]">
            <p className="text-xs text-white/30 font-medium tracking-widest uppercase mb-1">Available Balance</p>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5 h-9">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : (
                <>₹{balance.toLocaleString()}</>
              )}
            </p>
          </div>
          {totalWinnings > 0 && (
            <div className="min-w-[120px]">
              <p className="text-xs text-green-400/50 font-medium tracking-widest uppercase mb-1">Total Winnings</p>
              <p className="text-lg sm:text-xl font-black text-green-400">+₹{totalWinnings.toLocaleString()}</p>
            </div>
          )}
          {totalSpent > 0 && (
            <div className="min-w-[120px]">
              <p className="text-xs text-red-400/50 font-medium tracking-widest uppercase mb-1">Total Entry Fees</p>
              <p className="text-lg sm:text-xl font-black text-red-400">-₹{totalSpent.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => {
              toast.success('Open the wallet dropdown from the navbar to deposit funds');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 transition-all text-xs font-bold text-white shadow-lg shadow-red-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Deposit
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-400/30 transition-all text-xs font-semibold text-white/60 hover:text-red-400 active:scale-95"
          >
            <Minus className="w-3.5 h-3.5" />
            Withdraw
          </button>
          <Link href="/tournaments?type=free">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-400/40 transition-all text-xs font-semibold text-green-400 hover:text-green-300 active:scale-95">
              <Trophy className="w-3.5 h-3.5" />
              Free Tournaments
            </button>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white/70">Recent Activity</h3>
            <Clock className="w-3.5 h-3.5 text-white/20" />
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-6 rounded-lg bg-white/[0.02] border border-white/5">
              <Banknote className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/20 font-medium">No transactions yet</p>
              <p className="text-xs text-white/10 mt-1">Deposit funds or join tournaments to get started</p>
            </div>
          ) : (
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {transactions.slice(0, 10).map((tx: any, i: number) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      tx.type === 'DEPOSIT' && 'bg-green-500/15 text-green-400',
                      tx.type === 'WITHDRAW' && 'bg-red-500/15 text-red-400',
                      tx.type === 'TOURNAMENT_WINNING' && 'bg-yellow-500/15 text-yellow-400',
                      tx.type === 'TOURNAMENT_FEE' && 'bg-blue-500/15 text-blue-400',
                    )}>
                      {tx.type === 'DEPOSIT' && <TrendingUp className="w-3.5 h-3.5" />}
                      {tx.type === 'WITHDRAW' && <TrendingDown className="w-3.5 h-3.5" />}
                      {tx.type === 'TOURNAMENT_WINNING' && <Trophy className="w-3.5 h-3.5" />}
                      {tx.type === 'TOURNAMENT_FEE' && <Swords className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/80 capitalize">
                        {tx.type === 'TOURNAMENT_WINNING' ? 'Tournament Win'
                          : tx.type === 'TOURNAMENT_FEE' ? 'Entry Fee'
                          : tx.type.toLowerCase()}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    (tx.type === 'DEPOSIT' || tx.type === 'TOURNAMENT_WINNING') && 'text-green-400',
                    (tx.type === 'WITHDRAW' || tx.type === 'TOURNAMENT_FEE') && 'text-red-400',
                  )}>
                    {(tx.type === 'DEPOSIT' || tx.type === 'TOURNAMENT_WINNING') ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
