'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveTournamentWidget } from '@/components/home/LiveTournamentWidget';
import { StatsSection } from '@/components/home/StatsSection';
import { UpcomingTournaments } from '@/components/home/UpcomingTournaments';
import { TopClansSection } from '@/components/home/TopClansSection';

export default function HomePage() {
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
