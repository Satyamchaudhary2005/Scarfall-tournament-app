'use client';

import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Button } from '@/components/ui';
import { Trophy, Swords, Users, Skull, Crosshair, Activity, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateKd, calculateWinRate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

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
