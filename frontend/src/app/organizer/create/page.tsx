'use client';

import { useAuthStore } from '@/store/authStore';
import { CreateWizard } from '@/components/organizer/create-wizard';
import { WalletPanel } from '@/components/organizer/wallet-panel';
import { TournamentFlowPreview } from '@/components/organizer/tournament-flow';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreateTournamentPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  useEffect(() => {
    if (user && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-surface">
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Create Tournament</h1>
              <p className="text-white/40 mt-1 text-sm">Set up a professional esports tournament</p>
            </div>
            <div className="hidden lg:block">
              <WalletPanel />
            </div>
          </div>

          <div className="lg:hidden mb-4 flex gap-2">
            <button
              onClick={() => setMobileTab('form')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mobileTab === 'form'
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mobileTab === 'preview'
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}
            >
              Preview & Revenue
            </button>
          </div>

          <div className="flex gap-6">
            <div className={`flex-1 min-w-0 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              <CreateWizard />
            </div>
            <div className={`w-[380px] flex-shrink-0 space-y-4 ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
              <div className="lg:hidden">
                <WalletPanel />
              </div>
              <TournamentFlowPreview />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
