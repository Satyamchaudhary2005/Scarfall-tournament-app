'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  Trophy, Users, Clock, Search, IndianRupee, Zap, Filter, CheckCircle,
  Layers, Target, Crown, Crosshair, ChevronLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/utils';

const statusFilters = ['ALL', 'REGISTRATION_OPEN', 'LIVE', 'ENDED'];
const modeFilters = ['ALL', 'SOLO', 'DUO', 'SQUAD'];

const TYPE_CONFIG = {
  'multi': { label: 'Multi Tournament', icon: Layers, desc: 'Multi-round & multi-stage formats', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'purple' as const },
  'single': { label: 'Single Match', icon: Target, desc: 'One match, winner takes all', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'blue' as const },
  'free': { label: 'Free Entry', icon: Crown, desc: 'No entry fee required', color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/20', text: 'text-green-400', badge: 'success' as const },
  'earn-per-kill': { label: 'Earn Per Kill', icon: Crosshair, desc: 'Get points for every elimination', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'warning' as const },
};

type CategoryType = keyof typeof TYPE_CONFIG;

export default function TournamentsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-48 rounded-lg bg-card border border-card-border animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-52 rounded-xl bg-card border border-card-border animate-pulse" />)}
          </div>
        </div>
        <Footer />
      </main>
    }>
      <TournamentsContent />
    </Suspense>
  );
}

function TournamentsContent() {
  const { isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const filteredType = typeParam && typeParam in TYPE_CONFIG ? (typeParam as CategoryType) : null;

  const [status, setStatus] = useState('ALL');
  const [mode, setMode] = useState('ALL');
  const [search, setSearch] = useState('');

  const scrollRefs = useRef<Map<CategoryType, HTMLDivElement | null>>(new Map());
  const [canScrollLeft, setCanScrollLeft] = useState<Record<string, boolean>>({});
  const [canScrollRight, setCanScrollRight] = useState<Record<string, boolean>>({});

  const updateScrollState = useCallback((type: CategoryType) => {
    const el = scrollRefs.current.get(type);
    if (!el) return;
    setCanScrollLeft(prev => ({ ...prev, [type]: el.scrollLeft > 4 }));
    setCanScrollRight(prev => ({ ...prev, [type]: el.scrollLeft < el.scrollWidth - el.clientWidth - 4 }));
  }, []);

  const scrollRow = useCallback((type: CategoryType, direction: 'left' | 'right') => {
    const el = scrollRefs.current.get(type);
    if (!el) return;
    const cardWidth = 260 + 12; // card width + gap
    el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback((type: CategoryType) => {
    updateScrollState(type);
  }, [updateScrollState]);

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

  const allFilteredQuery = useQuery({
    queryKey: ['tournaments', filteredType, 'all', apiStatus, mode, search],
    queryFn: () => tournamentApi.getAll({ status: apiStatus, mode, search: search || undefined, type: filteredType!, limit: 100 }),
    enabled: !!filteredType,
  });

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

  const renderCategoryRow = (type: CategoryType, index: number = 0) => {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;
    const { data, isLoading } = queries[type];
    const tournaments = (data?.tournaments || [])
      .filter((t: any) => status !== 'ALL' || t.status !== 'COMPLETED')
      .sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    const total = data?.pagination?.total || 0;

    return (        <motion.div
        key={type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.06 }}
        className="mb-8"
      >
        {/* Row Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${config.text}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {config.label}
                {!isLoading && (
                  <span className="text-[10px] font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                    {total}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-white/40">{config.desc}</p>
            </div>
          </div>
          {!isLoading && total > 8 && (
            <Link
              href={`/tournaments?type=${type}`}
              className={`text-xs font-medium ${config.text} hover:underline hidden sm:block`}
            >
              View all {total} →
            </Link>
          )}
        </div>

        {/* Horizontal scrollable row */}
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[260px] w-[70vw] sm:w-[260px] h-52 rounded-xl bg-card border border-card-border animate-pulse shrink-0" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex items-center gap-3 py-6 px-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Icon className={`w-8 h-8 ${config.text}/20`} />
            <p className="text-white/30 text-sm">No {config.label.toLowerCase()} available</p>
          </div>
        ) : (
          <>
            <div className="relative group">
              {/* Left scroll arrow */}
              {canScrollLeft[type] && (
                <button
                  onClick={() => scrollRow(type, 'left')}
                  className="hidden sm:flex absolute left-0 top-0 bottom-2 z-10 w-9 items-center justify-center bg-gradient-to-r from-surface via-surface/95 to-transparent text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Scroll left"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              {/* Right scroll arrow */}
              {canScrollRight[type] && (
                <button
                  onClick={() => scrollRow(type, 'right')}
                  className="hidden sm:flex absolute right-0 top-0 bottom-2 z-10 w-9 items-center justify-center bg-gradient-to-l from-surface via-surface/95 to-transparent text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Scroll right"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
              <div
                ref={(el) => { scrollRefs.current.set(type, el); if (el) requestAnimationFrame(() => updateScrollState(type)); }}
                onScroll={() => handleScroll(type)}
                className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {tournaments.map((t: any) => (
                  <div key={t.id} className="min-w-[260px] w-[70vw] sm:w-[260px] shrink-0 snap-start">
                    {renderTournamentCard(t)}
                  </div>
                ))}
                {total > 8 && (
                  <Link
                    href={`/tournaments?type=${type}`}
                    className={`min-w-[120px] w-[120px] shrink-0 flex flex-col items-center justify-center rounded-xl border border-dashed ${config.border} hover:bg-white/5 transition-all text-center px-3`}
                  >
                    <Icon className={`w-5 h-5 ${config.text} mb-1`} />
                    <span className={`text-xs font-medium ${config.text}`}>View all {total}</span>
                  </Link>
                )}
                <div className="w-2 shrink-0" />
              </div>
            </div>
            {total > 8 && (
              <Link
                href={`/tournaments?type=${type}`}
                className={`mt-2 text-xs font-medium ${config.text} hover:underline text-center block sm:hidden py-1.5 rounded-lg hover:bg-white/5 transition-all`}
              >
                View all {total} →
              </Link>
            )}
          </>
        )}
      </motion.div>
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

        {/* 4 Category Rows — each is a horizontal carousel */}
        {filteredType ? (
          <motion.div
            key={filteredType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link href="/tournaments" className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h2 className="text-xl font-bold text-white">{TYPE_CONFIG[filteredType].label}</h2>
                  <p className="text-sm text-white/40">{TYPE_CONFIG[filteredType].desc}</p>
                </div>
              </div>
            </div>
            {allFilteredQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-52 rounded-xl bg-card border border-card-border animate-pulse" />
                ))}
              </div>
            ) : (allFilteredQuery.data?.tournaments ?? []).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/30">No tournaments found in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(allFilteredQuery.data?.tournaments ?? [])
                  .filter((t: any) => status !== 'ALL' || t.status !== 'COMPLETED')
                  .sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                  .map((t: any) => renderTournamentCard(t))}
              </div>
            )}
          </motion.div>
        ) : (
          (Object.keys(TYPE_CONFIG) as CategoryType[]).map((type, i) =>
            renderCategoryRow(type, i)
          )
        )}
      </div>

      <Footer />
    </main>
  );
}
