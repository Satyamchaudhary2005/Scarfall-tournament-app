'use client';

import { useAuthStore } from '@/store/authStore';
import { CreateWizard } from '@/components/organizer/create-wizard';
import { WalletPanel } from '@/components/organizer/wallet-panel';
import { TournamentFlowPreview } from '@/components/organizer/tournament-flow';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, LayoutGrid, Eye } from 'lucide-react';

export default function CreateTournamentPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [tournamentType, setTournamentType] = useState('SINGLE');

  if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50">{!isAuthenticated ? 'Please sign in to manage tournaments' : 'Organizer access required'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white">Create Tournament</h1>
                  <p className="text-white/50 mt-0.5 text-sm">Set up a professional esports tournament</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden mb-4">
            <div className="flex gap-1.5 bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setMobileTab('form')}
                className={`flex-1 py-2 px-4 rounded-md text-xs font-medium transition-all ${
                  mobileTab === 'form'
                    ? 'bg-primary text-white shadow-glow-red-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 inline mr-1.5" />
                Form
              </button>
              <button
                onClick={() => setMobileTab('preview')}
                className={`flex-1 py-2 px-4 rounded-md text-xs font-medium transition-all ${
                  mobileTab === 'preview'
                    ? 'bg-primary text-white shadow-glow-red-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                Preview
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            <div className={`flex-1 min-w-0 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              <CreateWizard onTypeChange={setTournamentType} />
            </div>
            <div className={`w-[340px] flex-shrink-0 space-y-4 ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
              <div className="lg:hidden">
                <WalletPanel />
              </div>
              <div className="hidden lg:block">
                <WalletPanel />
              </div>
              <TournamentFlowPreview type={tournamentType} />
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
