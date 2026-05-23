'use client';

import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Card, Badge, Button } from '@/components/ui';
import { Trophy, Users, Clock, IndianRupee, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/utils';

export function UpcomingTournaments() {
  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', 'upcoming'],
    queryFn: () => tournamentApi.getAll({ status: 'UPCOMING', limit: 6 }),
  });

  const tournaments = data?.tournaments || [];

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-heading">Upcoming Tournaments</h2>
            <p className="section-subheading">Compete for glory and prizes</p>
          </div>
          <Link href="/tournaments">
            <Button variant="secondary" size="sm">View All</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-card border border-card-border animate-pulse" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No upcoming tournaments yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/tournaments/${tournament.id}`}>
                  <Card hover className="h-full overflow-hidden group">
                    {/* Banner */}
                    {tournament.bannerUrl && (
                      <div className="h-32 overflow-hidden">
                        <img
                          src={tournament.bannerUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
                          {tournament.title}
                        </h3>
                        <Badge className={getStatusBadgeVariant(tournament.status)} size="sm">
                          {tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : tournament.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <IndianRupee className="w-4 h-4 text-primary" />
                          <span className="text-white/70">{tournament.prizePool}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-white/40" />
                          <span className="text-white/70">
                            {tournament._count?.registrations || 0}/{tournament.slots}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-white/40" />
                          <span className="text-white/70">{tournament.mode}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-white/40" />
                          <span className="text-white/70">
                            {formatDistanceToNow(new Date(tournament.startsAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-xs text-white/30">
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
      </motion.div>
    </section>
  );
}
