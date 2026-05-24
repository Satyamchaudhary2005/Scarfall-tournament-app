'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Badge, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { Trophy, Users, Clock, Search, IndianRupee, Zap, Filter, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/utils';

const statusFilters = ['ALL', 'REGISTRATION_OPEN', 'UPCOMING', 'LIVE', 'ENDED'];
const modeFilters = ['ALL', 'SOLO', 'DUO', 'SQUAD'];

export default function TournamentsPage() {
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState('ALL');
  const [mode, setMode] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const apiStatus = status === 'ENDED' ? 'COMPLETED' : status;

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', apiStatus, mode, search, page],
    queryFn: () => tournamentApi.getAll({ status: apiStatus, mode, search: search || undefined, page, limit: 12 }),
  });

  const { data: regData } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => tournamentApi.getMyRegistrations(),
    enabled: isAuthenticated,
  });

  const tournaments = data?.tournaments || [];
  const pagination = data?.pagination;
  const registrations = regData?.registrations || [];
  const joinedIds = new Set(registrations.map((r) => r.tournamentId));
  const joinedTournaments = tournaments.filter((t) => joinedIds.has(t.id));

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Tournaments</h1>
          <p className="text-white/50">Browse and join competitive tournaments</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input-base pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-white/40 mr-2">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </div>
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  status === s
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'ENDED' ? 'Ended' : s.replace('_', ' ')}
              </button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            <div className="flex items-center gap-1.5 text-xs text-white/40 mr-2">
              <Zap className="w-3.5 h-3.5" />
              Mode:
            </div>
            {modeFilters.map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === m
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {m === 'ALL' ? 'All' : m}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-card border border-card-border animate-pulse" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/50 mb-2">No tournaments found</h3>
            <p className="text-white/30">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Joined Tournaments Section */}
            {joinedTournaments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">Joined Tournaments</h2>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {joinedTournaments.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {joinedTournaments.map((tournament, index) => (
                    <motion.div
                      key={tournament.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={`/tournaments/${tournament.id}`}>
                        <Card hover className={`h-full overflow-hidden group border-green-500/20 hover:border-green-500/40`}>
                          <div className="absolute top-3 right-3 z-10">
                            <Badge variant="success" size="sm">Joined</Badge>
                          </div>
                          {tournament.bannerUrl && (
                            <div className="h-32 overflow-hidden">
                              <img src={tournament.bannerUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
                                {tournament.title}
                              </h3>
                              <Badge className={getStatusBadgeVariant(tournament.status)} size="sm">
                                {tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : tournament.status === 'UPCOMING' ? 'UPCOMING' : tournament.status === 'COMPLETED' ? 'Ended' : tournament.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <IndianRupee className="w-4 h-4 text-primary" />
                                <span className="text-white/70">{tournament.prizePool}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-white/40" />
                                <span className="text-white/70">{tournament._count?.registrations || 0}/{tournament.slots}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Zap className="w-4 h-4 text-white/40" />
                                <span className="text-white/70">{tournament.mode}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                {tournament.status === 'COMPLETED' ? (
                                  <>
                                    <Clock className="w-4 h-4 text-white/30" />
                                    <span className="text-white/50">Ended {formatDistanceToNow(new Date(tournament.endsAt || tournament.startsAt), { addSuffix: true })}</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-white/40" />
                                    <span className="text-white/70">{formatDistanceToNow(new Date(tournament.startsAt), { addSuffix: true })}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <span className="text-xs text-white/30">by {tournament.host.username}</span>
                              <Badge variant={tournament.entryFee === 'Free' ? 'success' : 'warning'} size="sm">
                                {tournament.entryFee}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Tournaments Grid */}
            <div>
              {joinedTournaments.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-white">All Tournaments</h2>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Card hover className={`h-full overflow-hidden group transition-all duration-300 ${
                        tournament.status === 'COMPLETED'
                          ? 'opacity-50 hover:opacity-80 border-white/5'
                          : joinedIds.has(tournament.id) ? 'border-green-500/20' : ''
                      }`}>
                        {tournament.bannerUrl && (
                          <div className="h-32 overflow-hidden">
                            <img src={tournament.bannerUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className={`font-semibold transition-colors line-clamp-1 ${
                              tournament.status === 'COMPLETED' ? 'text-white/60 group-hover:text-white/80' : 'text-white group-hover:text-primary'
                            }`}>
                              {tournament.title}
                            </h3>
                            <div className="flex items-center gap-1.5">
                              {joinedIds.has(tournament.id) && (
                                <Badge variant="success" size="sm">Joined</Badge>
                              )}
                              <Badge className={getStatusBadgeVariant(tournament.status)} size="sm">
                                {tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : tournament.status === 'UPCOMING' ? 'UPCOMING' : tournament.status === 'COMPLETED' ? 'Ended' : tournament.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <IndianRupee className="w-4 h-4 text-primary" />
                              <span className={tournament.status === 'COMPLETED' ? 'text-white/50' : 'text-white/70'}>{tournament.prizePool}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-white/40" />
                              <span className={tournament.status === 'COMPLETED' ? 'text-white/50' : 'text-white/70'}>{tournament._count?.registrations || 0}/{tournament.slots}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-white/40" />
                              <span className={tournament.status === 'COMPLETED' ? 'text-white/50' : 'text-white/70'}>{tournament.mode}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {tournament.status === 'COMPLETED' ? (
                                <>
                                  <Clock className="w-4 h-4 text-white/20" />
                                  <span className="text-white/40">Ended {formatDistanceToNow(new Date(tournament.endsAt || tournament.startsAt), { addSuffix: true })}</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-white/40" />
                                  <span className="text-white/70">{formatDistanceToNow(new Date(tournament.startsAt), { addSuffix: true })}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="text-xs text-white/30">by {tournament.host.username}</span>
                            <Badge variant={tournament.entryFee === 'Free' ? 'success' : 'warning'} size="sm">
                              {tournament.entryFee}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

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
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === pagination.totalPages)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-white/20">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          page === p
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
