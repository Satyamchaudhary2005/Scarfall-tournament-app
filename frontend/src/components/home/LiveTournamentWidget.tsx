'use client';

import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Card, Badge } from '@/components/ui';
import { Trophy, Users, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export function LiveTournamentWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['live-tournaments'],
    queryFn: () => tournamentApi.getLive(),
    refetchInterval: 30000,
  });

  const tournaments = data?.tournaments || [];

  if (isLoading || tournaments.length === 0) return null;

  return (
    <section className="relative -mt-20 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="p-4 sm:p-6 bg-surface/80 backdrop-blur-xl border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              Live & Upcoming
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.slice(0, 3).map((tournament, index) => (
              <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
                        {tournament.title}
                      </span>
                    </div>
                    <Badge
                      variant={tournament.status === 'LIVE' ? 'success' : 'info'}
                      size="sm"
                    >
                      {tournament.status === 'LIVE' ? 'LIVE' : tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : 'UPCOMING'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{tournament.prizePool}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Prize</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {tournament.slots - (tournament._count?.registrations || 0)}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Slots Left</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{tournament.mode}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Mode</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(tournament.startsAt), { addSuffix: true })}</span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
