'use client';

import { useQuery } from '@tanstack/react-query';
import { clanApi } from '@/services/api';
import { Card, Button, Badge } from '@/components/ui';
import { Users, Trophy, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function TopClansSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['clans', 'top'],
    queryFn: () => clanApi.getAll({ limit: 4 }),
  });

  const clans = data?.clans || [];
  const topClans = clans.slice(0, 4);

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-heading">Top Clans</h2>
            <p className="section-subheading">The strongest clans in ScarFall</p>
          </div>
          <Link href="/clans">
            <Button variant="secondary" size="sm">View All</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topClans.map((clan, index) => (
            <motion.div
              key={clan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/clans/${clan.id}`}>
                <Card hover className="p-5 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                        style={{ backgroundColor: `${clan.color}20`, color: clan.color }}
                      >
                        {clan.tag[0]}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface border border-card-border flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white/50">{index + 1}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{clan.name}</h3>
                      <p className="text-sm text-white/40">{clan.tag}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <Trophy className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-white">{clan.points}</span>
                      <span>pts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40">
                      <Users className="w-3.5 h-3.5" />
                      <span>{clan._count?.members || 0}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-xs text-white/30">
                      Led by <span className="text-white/50">{clan.leader.username}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
