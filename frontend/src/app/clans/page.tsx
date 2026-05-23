'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clanApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Users, Trophy, Search, Plus, Swords, MailPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ClansPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['clans', search, page],
    queryFn: () => clanApi.getAll({ search: search || undefined, page, limit: 12 }),
  });

  const clans = data?.clans || [];
  const pagination = data?.pagination;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Clans</h1>
              <p className="text-white/50">Find your squad and compete together</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/clans/invites">
                <Button variant="ghost" size="sm">
                  <MailPlus className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/clans/create">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create Clan
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search clans..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-base pl-10"
            />
          </div>

          {/* Clan Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-card border border-card-border animate-pulse" />
              ))}
            </div>
          ) : clans.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/50 mb-2">No clans found</h3>
              <p className="text-white/30">Create the first clan!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clans.map((clan, index) => (
                <motion.div
                  key={clan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/clans/${clan.id}`}>
                    <Card hover className="p-6 h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
                          style={{ backgroundColor: `${clan.color || '#ff1f1f'}20`, color: clan.color || '#ff1f1f' }}
                        >
                          {clan.tag[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-white truncate">{clan.name}</h3>
                          <p className="text-sm text-white/40">
                            [{clan.tag}] · Led by {clan.leader.username}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-primary">{clan.points}</p>
                          <p className="text-xs text-white/40">Clan XP</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{clan._count?.members || 0}</p>
                          <p className="text-xs text-white/40">Members</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{clan.wins}</p>
                          <p className="text-xs text-white/40">Wins</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-white/30">Page {page} of {pagination.totalPages}</span>
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
