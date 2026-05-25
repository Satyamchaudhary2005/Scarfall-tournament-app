'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveTournamentWidget } from '@/components/home/LiveTournamentWidget';
import { StatsSection } from '@/components/home/StatsSection';
import { UpcomingTournaments } from '@/components/home/UpcomingTournaments';
import { TopClansSection } from '@/components/home/TopClansSection';
import { UserStatsBar } from '@/components/dashboard/UserStatsBar';
import { GameFilterTabs } from '@/components/dashboard/GameFilterTabs';
import { ActiveTournaments } from '@/components/dashboard/ActiveTournaments';
import { MyMatches } from '@/components/dashboard/MyMatches';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [gameFilter, setGameFilter] = useState('all');

  if (isAuthenticated) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-black text-white">Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">Your competitive gaming hub</p>
          </motion.div>

          {/* Quick Stats */}
          <UserStatsBar />

          {/* Quick Actions */}
          <QuickActions />

          {/* Game Filter */}
          <GameFilterTabs active={gameFilter} onSelect={setGameFilter} />

          {/* Active Tournaments */}
          <ActiveTournaments gameFilter={gameFilter} />

          {/* My Matches */}
          <MyMatches />

          {/* Top Clans */}
          <TopClansSection />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Live Tournament Widget */}
      <LiveTournamentWidget />

      {/* Stats Section */}
      <StatsSection />

      {/* Upcoming Tournaments */}
      <UpcomingTournaments />

      {/* Top Clans */}
      <TopClansSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
