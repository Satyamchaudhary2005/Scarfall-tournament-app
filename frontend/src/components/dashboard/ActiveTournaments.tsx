'use client';

import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Card, Badge, Button } from '@/components/ui';
import { Trophy, Users, Clock, IndianRupee, Zap, Frown } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/utils';
import { GAME_KEYWORDS } from './GameFilterTabs';
import { Tournament } from '@/types';

interface ActiveTournamentsProps {
  gameFilter: string;
}

function matchesGame(tournament: Tournament, gameId: string): boolean {
  if (gameId === 'all') return true;
  const keywords = GAME_KEYWORDS[gameId];
  if (!keywords || keywords.length === 0) return true;
  const title = tournament.title.toLowerCase();
  return keywords.some((kw) => title.includes(kw));
}

export function ActiveTournaments({ gameFilter }: ActiveTournamentsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-tournaments', gameFilter],
    queryFn: () => tournamentApi.getAll({ status: 'REGISTRATION_OPEN', limit: 12 }),
  });

  const tournaments = (data?.tournaments || []).filter((t) => matchesGame(t, gameFilter));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Active Tournaments</h2>
          <p className="text-sm text-white/40">Compete, win prizes, climb the ranks</p>
        </div>
        <Link href="/tournaments">
          <Button variant="secondary" size="sm">View All</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-card border border-card-border animate-pulse" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-card border border-card-border">
          <Frown className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No tournaments found for this category</p>
          <Link href="/tournaments">
            <Button variant="ghost" size="sm" className="mt-3">Browse All Tournaments</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.slice(0, 9).map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/tournaments/${tournament.id}`}>
                <Card hover className="h-full overflow-hidden group">
                  {tournament.bannerUrl && (
                    <div className="h-28 overflow-hidden">
                      <img
                        src={tournament.bannerUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="font-semibold text-sm text-white group-hover:text-primary transition-colors line-clamp-1">
                        {tournament.title}
                      </h3>
                      <Badge
                        variant={tournament.status === 'REGISTRATION_OPEN' ? 'info' : 'success'}
                        size="sm"
                        className="shrink-0"
                      >
                        {tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : tournament.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-white/70">{tournament.prizePool}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="text-white/70">
                          {tournament._count?.registrations || 0}/{tournament.slots}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="text-white/70">{tournament.mode}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="text-white/70 truncate">
                          {formatDistanceToNow(new Date(tournament.startsAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                      <span className="text-[10px] text-white/30 truncate">
                        by {tournament.host.username}
                      </span>
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
      )}
    </motion.section>
  );
}
