'use client';

import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TournamentMissionControl } from '@/components/organizer/mission-control';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ManageTournamentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50">Organizer access required</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/organizer/tournaments')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Tournaments
        </button>
        <TournamentMissionControl tournamentId={id as string} />
      </div>
      <Footer />
    </main>
  );
}
