'use client';

import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Card, Badge } from '@/components/ui';
import { Trophy, Clock, Users, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/utils';

export function MyMatches() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-registrations-dashboard'],
    queryFn: () => tournamentApi.getMyRegistrations(),
  });

  const registrations = data?.registrations?.filter((r) => r.tournament) || [];

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-white">Your Matches</h2>
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card border border-card-border animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const validRegs = registrations.filter((r) => r.tournament);
  if (validRegs.length === 0) return null;

  const upcoming = validRegs.filter(
    (r) => r.tournament!.status !== 'COMPLETED' && r.tournament!.status !== 'CANCELLED'
  );
  const displayRegs = upcoming.length > 0 ? upcoming : validRegs.slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-white">
          {upcoming.length > 0 ? 'Your Upcoming Matches' : 'Recent Matches'}
        </h2>
        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
          {validRegs.length}
        </span>
      </div>

      <div className="space-y-3">
        {displayRegs.slice(0, 4).map((reg, i) => {
          const t = reg.tournament!;
          return (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={`/tournaments/${t.id}`}>
                <Card hover className="p-4 border-green-500/20 hover:border-green-500/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-white truncate">{t.title}</h3>
                        <Badge
                          className={getStatusBadgeVariant(t.status)}
                          size="sm"
                        >
                          {t.status === 'REGISTRATION_OPEN' ? 'OPEN' : t.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(t.startsAt), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {t._count?.registrations || 0}/{t.slots}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {t.mode}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">{t.prizePool}</p>
                      <p className="text-[10px] text-white/30">prize</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {registrations.length > 4 && (
        <Link
          href="/profile"
          className="mt-3 block text-center text-xs text-white/30 hover:text-white/50 py-2 rounded-lg hover:bg-white/5 transition-all"
        >
          View all {registrations.length} registrations
        </Link>
      )}
    </motion.section>
  );
}
