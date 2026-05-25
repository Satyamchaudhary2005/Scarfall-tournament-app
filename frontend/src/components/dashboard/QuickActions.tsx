'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Swords, PlusCircle, Users, Trophy } from 'lucide-react';

const actions = [
  {
    href: '/tournaments',
    label: 'Join Tournament',
    desc: 'Compete and win prizes',
    icon: Swords,
    variant: 'primary' as const,
  },
  {
    href: '/tournaments',
    label: 'Host Tournament',
    desc: 'Create your own event',
    icon: PlusCircle,
    variant: 'secondary' as const,
  },
  {
    href: '/clans',
    label: 'Find Players',
    desc: 'Build your squad',
    icon: Users,
    variant: 'secondary' as const,
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    desc: 'Top players & clans',
    icon: Trophy,
    variant: 'secondary' as const,
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href={action.href}>
              <Button
                variant={action.variant}
                className="w-full h-full flex-col gap-1.5 py-4 px-3"
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-semibold">{action.label}</span>
                <span className="text-[10px] text-white/40 font-normal">{action.desc}</span>
              </Button>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
