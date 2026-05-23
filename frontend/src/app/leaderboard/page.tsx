'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Input } from '@/components/ui';
import { Search, Swords, Trophy, Users, Skull, Crosshair, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn, calculateKd } from '@/lib/utils';

const tabs = [
  { id: 'global', label: 'Global', icon: Swords },
  { id: 'seasonal', label: 'Season 1', icon: Trophy },
  { id: 'clan', label: 'Clans', icon: Users },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Crown className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Crown className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-mono text-white/30 w-5 text-center">{rank}</span>;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('global');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: globalData, isLoading: globalLoading } = useQuery({
    queryKey: ['leaderboard', 'global', search, page],
    queryFn: () => leaderboardApi.getGlobal({ search: search || undefined, page, limit: 50 }),
    enabled: activeTab === 'global',
  });

  const { data: seasonalData, isLoading: seasonalLoading } = useQuery({
    queryKey: ['leaderboard', 'seasonal', search, page],
    queryFn: () => leaderboardApi.getSeasonal({ search: search || undefined, page, limit: 50 }),
    enabled: activeTab === 'seasonal',
  });

  const { data: clanData, isLoading: clanLoading } = useQuery({
    queryKey: ['leaderboard', 'clan', search, page],
    queryFn: () => leaderboardApi.getClan({ search: search || undefined, page, limit: 50 }),
    enabled: activeTab === 'clan',
  });

  const isLoading = globalLoading || seasonalLoading || clanLoading;
  const leaderboard = activeTab === 'global' ? globalData?.leaderboard : activeTab === 'seasonal' ? seasonalData?.leaderboard : clanData?.leaderboard;
  const pagination = activeTab === 'global' ? globalData?.pagination : activeTab === 'seasonal' ? seasonalData?.pagination : clanData?.pagination;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Leaderboard</h1>
          <p className="text-white/50 mb-8">Top players and clans ranked by performance</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder={activeTab === 'clan' ? 'Search clans...' : 'Search players...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-base pl-10"
            />
          </div>

          {/* Leaderboard Table */}
          <Card>
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">No entries yet</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs text-white/30 uppercase tracking-wider">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">{activeTab === 'clan' ? 'Clan' : 'Player'}</div>
                  <div className="col-span-2 text-right">Clan XP</div>
                  <div className="col-span-2 text-right">Kills</div>
                  <div className="col-span-1 text-right">KD</div>
                  <div className="col-span-1 text-right">Wins</div>
                  <div className="col-span-1 text-right">Matches</div>
                </div>

                {/* Table Body */}
                {leaderboard.map((entry: any, index: number) => (
                  <div
                    key={entry.id || entry.username || index}
                    className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    {/* Rank + Name */}
                    <div className="col-span-2 md:col-span-5 flex items-center gap-3">
                      <RankBadge rank={entry.rank} />
                      <div className="flex items-center gap-2 min-w-0">
                        {activeTab !== 'clan' && (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {entry.avatarUrl ? (
                              <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-primary">
                                {entry.username?.[0]?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {activeTab === 'clan' ? (
                              <Link href={`/clans/${entry.id}`} className="hover:text-primary transition-colors">
                                <span className="font-mono text-xs text-white/30 mr-1.5">[{entry.tag}]</span>
                                {entry.name}
                              </Link>
                            ) : (
                              entry.username
                            )}
                          </p>
                          {entry.clan && (
                            <p className="text-xs text-white/30">
                              [{entry.clan.tag}] {entry.clan.name}
                            </p>
                          )}
                          {activeTab === 'clan' && (
                            <p className="text-xs text-white/30">{entry.memberCount} members</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="col-span-1 md:col-span-2 text-right">
                      <p className="text-sm font-bold text-primary">
                        {activeTab === 'clan' ? entry.points : entry.points?.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-white/30 uppercase md:hidden">Pts</p>
                    </div>
                    <div className="hidden md:block md:col-span-2 text-right">
                      <p className="text-sm text-white/80">{activeTab === 'clan' ? '-' : entry.kills?.toLocaleString() || 0}</p>
                    </div>
                    <div className="hidden md:block md:col-span-1 text-right">
                      <p className="text-sm text-white/60">
                        {activeTab === 'clan' ? '-' : calculateKd(entry.kills || 0, entry.deaths || 0)}
                      </p>
                    </div>
                    <div className="hidden md:block md:col-span-1 text-right">
                      <p className="text-sm text-white/80">{activeTab === 'clan' ? entry.wins : entry.wins || 0}</p>
                    </div>
                    <div className="hidden md:block md:col-span-1 text-right">
                      <p className="text-sm text-white/60">{activeTab === 'clan' ? entry.matchesPlayed : entry.matchesPlayed || 0}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-white/30">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
