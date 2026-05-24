'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  Trophy, Users, Clock, Search, IndianRupee, Zap, Filter, CheckCircle,
  Layers, Target, Crown, Crosshair,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/utils';

const statusFilters = ['ALL', 'REGISTRATION_OPEN', 'UPCOMING', 'LIVE', 'ENDED'];
const modeFilters = ['ALL', 'SOLO', 'DUO', 'SQUAD'];

const TYPE_CONFIG = {
  'multi': { label: 'Multi Tournament', icon: Layers, desc: 'Multi-round & multi-stage formats', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'purple' as const },
  'single': { label: 'Single Match', icon: Target, desc: 'One match, winner takes all', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'blue' as const },
  'free': { label: 'Free Entry', icon: Crown, desc: 'No entry fee required', color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/20', text: 'text-green-400', badge: 'success' as const },
  'earn-per-kill': { label: 'Earn Per Kill', icon: Crosshair, desc: 'Get points for every elimination', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'warning' as const },
};

type CategoryType = keyof typeof TYPE_CONFIG;

export default function TournamentsPage() {
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState('ALL');
  const [mode, setMode] = useState('ALL');
  const [search, setSearch] = useState('');

  const apiStatus = status === 'ENDED' ? 'COMPLETED' : status;
  const commonParams = { status: apiStatus, mode, search: search || undefined, limit: 8 };

  const queries = {
    multi: useQuery({
      queryKey: ['tournaments', 'multi', apiStatus, mode, search],
      queryFn: () => tournamentApi.getAll({ ...commonParams, type: 'multi' }),
    }),
    single: useQuery({
      queryKey: ['tournaments', 'single', apiStatus, mode, search],
      queryFn: () => tournamentApi.getAll({ ...commonParams, type: 'single' }),
    }),
    free: useQuery({
      queryKey: ['tournaments', 'free', apiStatus, mode, search],
      queryFn: () => tournamentApi.getAll({ ...commonParams, type: 'free' }),
    }),
    'earn-per-kill': useQuery({
      queryKey: ['tournaments', 'earn-per-kill', apiStatus, mode, search],
      queryFn: () => tournamentApi.getAll({ ...commonParams, type: 'earn-per-kill' }),
    }),
  };

  const { data: regData } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => tournamentApi.getMyRegistrations(),
    enabled: isAuthenticated,
  });

  const registrations = regData?.registrations || [];
  const joinedIds = new Set(registrations.map((r) => r.tournamentId));

  const renderTournamentCard = (tournament: any) => (
    <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
      <Card hover className={`h-full overflow-hidden group transition-all duration-300 ${
        tournament.status === 'COMPLETED'
          ? 'opacity-50 hover:opacity-80 border-white/5'
          : joinedIds.has(tournament.id) ? 'border-green-500/20' : ''
      }`}>
        {tournament.bannerUrl && (
          <div className="h-28 overflow-hidden">
            <img src={tournament.bannerUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2 gap-2">
            <h3 className={`font-semibold text-sm leading-tight transition-colors line-clamp-1 ${
              tournament.status === 'COMPLETED' ? 'text-white/60 group-hover:text-white/80' : 'text-white group-hover:text-primary'
            }`}>
              {tournament.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {joinedIds.has(tournament.id) && (
                <Badge variant="success" size="sm">Joined</Badge>
              )}
              <Badge className={getStatusBadgeVariant(tournament.status)} size="sm">
                {tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : tournament.status === 'UPCOMING' ? 'UPCOMING' : tournament.status === 'COMPLETED' ? 'Ended' : tournament.status}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3 text-xs">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className={tournament.status === 'COMPLETED' ? 'text-white/50' : 'text-white/70'}>{tournament.prizePool}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <span className={tournament.status === 'COMPLETED' ? 'text-white/50' : 'text-white/70'}>{tournament._count?.registrations || 0}/{tournament.slots}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <span className={tournament.status === 'COMPLETED' ? 'text-white/50' : 'text-white/70'}>{tournament.mode}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
              {tournament.status === 'COMPLETED' ? (
                <span className="text-white/40 truncate">Ended {formatDistanceToNow(new Date(tournament.endsAt || tournament.startsAt), { addSuffix: true })}</span>
              ) : (
                <span className="text-white/70 truncate">{formatDistanceToNow(new Date(tournament.startsAt), { addSuffix: true })}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-[10px] text-white/30 truncate">by {tournament.host.username}</span>
            <Badge variant={tournament.entryFee === 'Free' ? 'success' : 'warning'} size="sm">
              {tournament.entryFee}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );

  const renderColumn = (type: CategoryType) => {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;
    const { data, isLoading } = queries[type];
    const tournaments = data?.tournaments || [];

    return (
      <div key={type} className="flex flex-col min-w-0">
        {/* Column Header */}
        <div className={`flex items-center gap-2.5 mb-4 px-1`}>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.text}`} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {config.label}
              {!isLoading && (
                <span className="text-[10px] font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                  {data?.pagination?.total || 0}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-white/40 truncate">{config.desc}</p>
          </div>
        </div>

        {/* Column Content */}
        <div className="flex-1 space-y-3">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-44 rounded-xl bg-card border border-card-border animate-pulse" />
              ))}
            </>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Icon className={`w-10 h-10 mx-auto mb-2 ${config.text}/20`} />
              <p className="text-white/30 text-xs">No tournaments</p>
            </div>
          ) : (
            tournaments.map(renderTournamentCard)
          )}
        </div>

        {/* View All Link */}
        {!isLoading && tournaments.length > 0 && data?.pagination && data.pagination.total > 8 && (
          <Link
            href={`/tournaments?type=${type}`}
            className={`mt-3 text-xs font-medium ${config.text} hover:underline text-center block py-2 rounded-lg hover:bg-white/5 transition-all`}
          >
            View all {data.pagination.total} →
          </Link>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Tournaments</h1>
          <p className="text-white/50">Browse tournaments by category</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-white/40 mr-2">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </div>
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
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
                onClick={() => setMode(m)}
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

        {/* Joined Section */}
        {isAuthenticated && registrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">Your Joined Tournaments</h2>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                {registrations.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {registrations.slice(0, 4).map((reg: any) => {
                const t = reg.tournament;
                if (!t) return null;
                return (
                  <Link key={reg.id} href={`/tournaments/${t.id}`}>
                    <Card hover className="h-full overflow-hidden border-green-500/20 hover:border-green-500/40">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm text-white line-clamp-1">{t.title}</h3>
                          <Badge variant="success" size="sm">Joined</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {t._count?.registrations || 0}/{t.slots}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(t.startsAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
              {registrations.length > 4 && (
                <Link href="/profile" className="flex items-center justify-center rounded-xl border border-dashed border-white/10 hover:border-white/20 text-white/30 hover:text-white/50 text-sm transition-all">
                  +{registrations.length - 4} more
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* 4 Category Columns — swipeable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
>
          {/* Mobile: horizontal scroll wrapper */}
          <div className="flex sm:hidden overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-none" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {(Object.keys(TYPE_CONFIG) as CategoryType[]).map((type) => (
              <div key={type} className="min-w-[280px] w-[80vw] snap-start shrink-0">
                {renderColumn(type)}
              </div>
            ))}
            {/* End padding for last card */}
            <div className="w-2 shrink-0" />
          </div>
          {/* Tablet+ : grid columns */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 lg:gap-4 col-span-full">
            {(Object.keys(TYPE_CONFIG) as CategoryType[]).map((type) => (
              <div key={type} className="min-w-0">
                {renderColumn(type)}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
