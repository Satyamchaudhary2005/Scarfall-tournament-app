'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi, walletApi, notificationApi } from '@/services/api';
import { Card, Button, Badge, ConfirmModal } from '@/components/ui';
import StageListModal from '@/components/tournaments/StageListModal';
import StageDetailView from '@/components/tournaments/StageDetailView';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, IndianRupee, Calendar, Zap, Swords, Target,
  ChevronLeft, ChevronRight, Settings, Trash2, Copy, Key,
  PlayCircle, CheckCircle, Clock, AlertCircle, XCircle,
  BarChart3, RefreshCw, Wallet, Bell, Activity, Share2,
  Eye, EyeOff, Crown, Crosshair, Skull, Medal, Gift,
  Radio, Monitor, Link, ExternalLink, Layers,
  ChevronDown, ChevronUp, Plus, Minus, Edit3,
  Search, Filter, Check, X, UserPlus, UserX,
  TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react';

type Tab = 'overview' | 'stages' | 'matches' | 'standings' | 'teams' | 'finance' | 'stream' | 'activity';

interface LobbyAssignment {
  lobbyId: string;
  label: string;
  teams: any[];
}

export function TournamentMissionControl({ tournamentId, onBack }: { tournamentId: string; onBack?: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [showStageList, setShowStageList] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<any>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tData, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentApi.getById(tournamentId),
    refetchInterval: 30000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet(),
  });

  const { data: activityData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll(),
    refetchInterval: 15000,
  });

  const tournament = tData?.tournament;
  const wallet = walletData?.wallet;
  const notifications = activityData?.notifications || [];

  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tournamentApi.deleteHosted(id),
    onSuccess: () => {
      toast.success('Tournament deleted');
      router.push('/organizer/tournaments');
    },
    onError: () => toast.error('Failed to delete tournament'),
  });

  const entryFeeNum = Number(tournament?.entryFee || 0);
  const totalCollection = entryFeeNum * (tournament?.slots || 0);
  const prizePoolNum = Number(tournament?.prizePool || 0);
  const commission = Math.round(totalCollection * 0.1);
  const organizerEarnings = Math.max(0, totalCollection - prizePoolNum - commission);
  const registeredCount = tournament?._count?.registrations || 0;
  const isMultiStage = tournament?.format === 'MULTI_STAGE';
  const isMultiRound = tournament?.format === 'MULTI_ROUND';
  const isLive = tournament?.status === 'LIVE';
  const isRegistration = tournament?.status === 'REGISTRATION_OPEN';

  const statusColors: Record<string, string> = {
    DRAFT: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    UPCOMING: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    REGISTRATION_OPEN: 'text-green-400 bg-green-500/10 border-green-500/20',
    LIVE: 'text-red-400 bg-red-500/10 border-red-500/20',
    WAITING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    COMPLETED: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    CANCELLED: 'text-white/40 bg-white/5 border-white/10',
  };

  const tabs: { id: Tab; label: string; icon: any; mobileLabel: string }[] = [
    { id: 'overview', label: 'Overview', icon: Radio, mobileLabel: 'Live' },
    { id: 'stages', label: 'Stages', icon: Layers, mobileLabel: 'Stages' },
    { id: 'matches', label: 'Matches', icon: Swords, mobileLabel: 'Matches' },
    { id: 'standings', label: 'Standings', icon: BarChart3, mobileLabel: 'Rank' },
    { id: 'teams', label: 'Teams', icon: Users, mobileLabel: 'Teams' },
    { id: 'finance', label: 'Finance', icon: IndianRupee, mobileLabel: 'Money' },
    { id: 'stream', label: 'Stream', icon: Monitor, mobileLabel: 'Stream' },
    { id: 'activity', label: 'Activity', icon: Activity, mobileLabel: 'Feed' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-xl bg-card border border-card-border animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card border border-card-border animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white/40 mb-2">Tournament not found</h2>
        {onBack && <button onClick={onBack} className="text-primary text-sm hover:underline">Back to tournaments</button>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile Bottom Nav */}
      <MobileBottomNav tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

      <div className="flex gap-0 lg:gap-4">
        {/* Desktop Sidebar */}
        <aside className={cn(
          'hidden lg:flex flex-col bg-card border border-card-border rounded-xl transition-all duration-300 flex-shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}>
          <SidebarNav
            tabs={tabs}
            activeTab={activeTab}
            onSelect={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            tournament={tournament}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-0">
          {/* Tournament Header */}
          <TournamentHeader
            tournament={tournament}
            statusColors={statusColors}
            registeredCount={registeredCount}
            prizePoolNum={prizePoolNum}
            totalCollection={totalCollection}
            organizerEarnings={organizerEarnings}
            onBack={onBack}
            onDelete={() => setShowConfirmModal({
              open: true, title: 'Delete Tournament',
              message: `Delete "${tournament.title}"? This cannot be undone.`,
              variant: 'danger', confirmLabel: 'Delete',
              onConfirm: () => { deleteMutation.mutate(tournament.id); setShowConfirmModal((prev: any) => ({ ...prev, open: false })); },
            })}
            deleteLoading={deleteMutation.isPending}
          />

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <OverviewTab
                tournament={tournament}
                registeredCount={registeredCount}
                prizePoolNum={prizePoolNum}
                totalCollection={totalCollection}
                organizerEarnings={organizerEarnings}
                commission={commission}
                wallet={wallet}
                notifications={notifications}
                onOpenStageList={() => setShowStageList(true)}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'stages' && (
              <StagesTab
                tournamentId={tournamentId}
                tournament={tournament}
                onSelectStage={(s: any) => { setSelectedStage(s); setActiveTab('matches'); }}
              />
            )}
            {activeTab === 'matches' && (
              <MatchesTab
                tournamentId={tournamentId}
                tournament={tournament}
                selectedStage={selectedStage}
                onBackToStages={() => setActiveTab('stages')}
                onOpenStageList={() => setShowStageList(true)}
              />
            )}
            {activeTab === 'standings' && (
              <StandingsTab tournamentId={tournamentId} tournament={tournament} />
            )}
            {activeTab === 'teams' && (
              <TeamsTab tournamentId={tournamentId} tournament={tournament} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            )}
            {activeTab === 'finance' && (
              <FinanceTab
                tournament={tournament}
                totalCollection={totalCollection}
                prizePoolNum={prizePoolNum}
                organizerEarnings={organizerEarnings}
                commission={commission}
                wallet={wallet}
              />
            )}
            {activeTab === 'stream' && (
              <StreamTab tournamentId={tournamentId} tournament={tournament} />
            )}
            {activeTab === 'activity' && (
              <ActivityTab notifications={notifications} />
            )}
          </div>
        </div>

        {/* Right Panel - Desktop only */}
        <aside className="hidden xl:block w-72 flex-shrink-0 space-y-4">
          <RightPanel
            tournament={tournament}
            wallet={wallet}
            totalCollection={totalCollection}
            organizerEarnings={organizerEarnings}
            commission={commission}
            notifications={notifications.slice(0, 5)}
            onTabChange={setActiveTab}
          />
        </aside>
      </div>

      {/* Stage List Modal */}
      {showStageList && (
        <StageListModal
          tournamentId={tournamentId}
          onSelectStage={(s) => { setSelectedStage(s); setShowStageList(false); setActiveTab('matches'); }}
          onClose={() => setShowStageList(false)}
        />
      )}

      <ConfirmModal
        open={showConfirmModal.open}
        onClose={() => setShowConfirmModal({ ...showConfirmModal, open: false })}
        onConfirm={showConfirmModal.onConfirm}
        title={showConfirmModal.title}
        message={showConfirmModal.message}
        confirmLabel={showConfirmModal.confirmLabel}
        variant={showConfirmModal.variant}
      />
    </div>
  );
}

// ─── Mobile Bottom Navigation ───────────────────────────────────────────────────

function MobileBottomNav({ tabs, activeTab, onSelect }: { tabs: any[]; activeTab: string; onSelect: (t: any) => void }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-card-border">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                isActive ? 'text-primary' : 'text-white/30 hover:text-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-semibold">{tab.mobileLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Sidebar Navigation ────────────────────────────────────────────────────────

function SidebarNav({ tabs, activeTab, onSelect, collapsed, onToggle, tournament }: any) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-card-border flex items-center justify-between">
        {!collapsed && <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Navigation</span>}
        <button onClick={onToggle} className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/50 transition-all">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex-1 p-2 space-y-1">
        {tabs.map((tab: any) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={cn(
                'flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold transition-all',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
              title={collapsed ? tab.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{tab.label}</span>}
            </button>
          );
        })}
      </div>
      <div className="p-2 border-t border-card-border">
        <div className={cn(
          'p-2 rounded-lg bg-white/5 border border-white/5',
          collapsed && 'text-center'
        )}>
          <div className={cn('text-[10px] font-bold', collapsed ? 'text-white/30' : 'text-white/40')}>
            {collapsed ? (
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mb-1 ${tournament?.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`} />
                <span className="text-[8px]">{tournament?.status?.charAt(0)}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${tournament?.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`} />
                  <span className="text-white/60">{tournament?.status?.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-[9px] text-white/20 mt-1 truncate">{tournament?.title}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tournament Header ─────────────────────────────────────────────────────────

function TournamentHeader({ tournament, statusColors, registeredCount, prizePoolNum, totalCollection, organizerEarnings, onBack, onDelete, deleteLoading }: any) {
  return (
    <div className="relative rounded-xl overflow-hidden mb-6">
      <div className="h-36 sm:h-44 bg-gradient-to-br from-primary/30 via-primary/10 to-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,31,31,0.03)_50%,transparent_75%)] bg-[length:400%_400%] animate-pulse"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white/60 hover:text-white transition-all backdrop-blur-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', statusColors[tournament.status])}>
                {tournament.status === 'REGISTRATION_OPEN' ? 'REGISTRATION OPEN' : tournament.status}
              </span>
              {tournament.status === 'LIVE' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{tournament.title}</h1>
          </div>
        </div>
        <button
          onClick={onDelete}
          disabled={deleteLoading}
          className="p-2 rounded-lg bg-black/30 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all backdrop-blur-sm disabled:opacity-50"
          title="Delete Tournament"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderStat icon={Trophy} value={`₹${prizePoolNum.toLocaleString()}`} label="Prize Pool" color="text-yellow-400" />
          <HeaderStat icon={Users} value={`${registeredCount}/${tournament.slots}`} label="Teams" color="text-blue-400" />
          <HeaderStat icon={IndianRupee} value={`₹${organizerEarnings.toLocaleString()}`} label="Your Earnings" color="text-green-400" />
          <HeaderStat icon={Calendar} value={formatDateTime(tournament.startsAt)} label={tournament.mode} color="text-purple-400" />
        </div>
      </div>
    </div>
  );
}

function HeaderStat({ icon: Icon, value, label, color }: any) {
  return (
    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="leading-tight">
        <p className="text-sm font-bold text-white">{value}</p>
        <p className="text-[9px] text-white/40 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ tournament, registeredCount, prizePoolNum, totalCollection, organizerEarnings, commission, wallet, notifications, onOpenStageList, onTabChange }: any) {
  const isMultiStage = tournament?.format === 'MULTI_STAGE';
  const isLive = tournament?.status === 'LIVE';

  return (
    <div className="space-y-6">
      {/* Live Status Banner */}
      {isLive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500/20 via-red-500/10 to-transparent border border-red-500/30 p-4"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />
          <div className="relative flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-400">LIVE NOW</span>
            </span>
            <span className="text-sm text-white/60">Match is in progress</span>
            <button onClick={() => onTabChange('matches')} className="ml-auto px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all">
              View Matches →
            </button>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickStatCard icon={Users} value={String(registeredCount)} label="Registered Teams" sub={`of ${tournament.slots} slots`} color="text-blue-400" bg="bg-blue-500/10" />
        <QuickStatCard icon={IndianRupee} value={`₹${totalCollection.toLocaleString()}`} label="Total Collection" sub={`₹${entryFeeNum(tournament)} × ${tournament.slots}`} color="text-green-400" bg="bg-green-500/10" />
        <QuickStatCard icon={Trophy} value={`₹${prizePoolNum.toLocaleString()}`} label="Prize Pool" sub={totalCollection > 0 ? `${Math.round((prizePoolNum / totalCollection) * 100)}% of collection` : 'Fixed amount'} color="text-yellow-400" bg="bg-yellow-500/10" />
        <QuickStatCard icon={Wallet} value={`₹${organizerEarnings.toLocaleString()}`} label="Your Earnings" sub={`+ ₹${commission.toLocaleString()} commission`} color="text-primary" bg="bg-primary/10" />
      </div>

      {/* Action Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard
          icon={Layers}
          label="Manage Stages"
          desc={isMultiStage ? 'Configure qualification flow' : 'View tournament structure'}
          action="Open Stages"
          color="text-purple-400"
          bg="bg-purple-500/10"
          onClick={() => isMultiStage ? onTabChange('stages') : onOpenStageList()}
        />
        <ActionCard
          icon={Swords}
          label="Match Controls"
          desc="Manage lobbies, rooms, and scores"
          action="Open Matches"
          color="text-red-400"
          bg="bg-red-500/10"
          onClick={() => onTabChange('matches')}
        />
        <ActionCard
          icon={BarChart3}
          label="Live Standings"
          desc="View rankings and qualification"
          action="View Standings"
          color="text-green-400"
          bg="bg-green-500/10"
          onClick={() => onTabChange('standings')}
        />
      </div>

      {/* Prize Distribution */}
      {tournament.prizeDistribution?.enabled && (
        <Card className="p-4 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Prize Distribution</span>
            <span className="text-[10px] text-white/30 ml-auto">Top {tournament.prizeDistribution.topN}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {tournament.prizeDistribution.distribution.slice(0, 3).map((amount: number, i: number) => (
              <div key={i} className={cn(
                'p-3 rounded-xl text-center border',
                i === 0 ? 'bg-yellow-500/10 border-yellow-500/20' :
                i === 1 ? 'bg-gray-400/10 border-gray-400/20' :
                'bg-orange-500/10 border-orange-500/20'
              )}>
                <p className="text-lg font-black text-white">₹{amount.toLocaleString()}</p>
                <p className="text-xs text-white/50">{i === 0 ? '1st Place' : i === 1 ? '2nd Place' : '3rd Place'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-white">Recent Activity</span>
        </div>
        <div className="space-y-2">
          {notifications.slice(0, 5).map((n: any) => (
            <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-3 h-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 truncate">{n.title}</p>
                <p className="text-[10px] text-white/30">{n.message}</p>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-xs text-white/30 text-center py-4">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function entryFeeNum(t: any) { return Number(t?.entryFee || 0); }

function QuickStatCard({ icon: Icon, value, label, sub, color, bg }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bg} border border-white/5 rounded-xl p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-black ${color} mb-0.5`}>{value}</p>
      <p className="text-[10px] text-white/30">{sub}</p>
    </motion.div>
  );
}

function ActionCard({ icon: Icon, label, desc, action, color, bg, onClick }: any) {
  return (
    <button onClick={onClick} className="text-left p-4 rounded-xl bg-card border border-card-border hover:border-white/20 transition-all group">
      <div className={`w-10 h-10 rounded-xl ${bg} border border-white/5 flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-sm font-semibold text-white mb-1">{label}</p>
      <p className="text-xs text-white/40 mb-3">{desc}</p>
      <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{action} →</span>
    </button>
  );
}

// ─── Stages Tab ─────────────────────────────────────────────────────────────────

function StagesTab({ tournamentId, tournament, onSelectStage }: any) {
  const isMultiStage = tournament?.format === 'MULTI_STAGE';
  const queryClient = useQueryClient();

  const { data: stagesData, isLoading } = useQuery({
    queryKey: ['stages', tournamentId],
    queryFn: () => tournamentApi.getStages(tournamentId),
    enabled: !!tournamentId,
    refetchInterval: 15000,
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: any }) => tournamentApi.updateStage(tournamentId, stageId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stages', tournamentId] }); toast.success('Stage updated'); },
    onError: (err: any) => toast.error(err.message || 'Failed to update stage'),
  });

  const stages = stagesData?.stages || [];
  const completedStages = stages.filter((s: any) => s.status === 'COMPLETED');
  const activeStage = stages.find((s: any) => s.status === 'ACTIVE' || s.status === 'LIVE');

  if (!isMultiStage) {
    return (
      <Card className="p-8 text-center">
        <Layers className="w-12 h-12 text-white/10 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white/40 mb-1">Single Format Tournament</h3>
        <p className="text-sm text-white/30">Stage management is available for Multi-Stage tournaments.</p>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-card border border-card-border animate-pulse" />)}</div>;
  }

  if (stages.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Layers className="w-12 h-12 text-white/10 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white/40 mb-1">No Stages Configured</h3>
        <p className="text-sm text-white/30">Use the stage builder to set up your tournament flow.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Layers className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Stage Flow</h2>
          <p className="text-sm text-white/50">{stages.length} stages • {completedStages.length} completed</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {activeStage && <Badge variant="success" size="sm"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 inline-block animate-pulse" /> {activeStage.name} ACTIVE</Badge>}
        </div>
      </div>

      <div className="space-y-3">
        {stages.map((stage: any, i: number) => {
          const isFirst = i === 0;
          const isLast = i === stages.length - 1;
          const isActive = stage.status === 'ACTIVE' || stage.status === 'LIVE';
          const isDone = stage.status === 'COMPLETED';

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Connecting arrow */}
              {!isFirst && (
                <div className="flex justify-center py-1">
                  <div className="flex flex-col items-center">
                    <ChevronDown className="w-4 h-4 text-white/20" />
                    <span className="text-[9px] text-white/20 -mt-1">{stage.teamsCount} teams</span>
                  </div>
                </div>
              )}

              <div className={cn(
                'rounded-xl border p-4 transition-all cursor-pointer hover:border-white/20',
                isActive ? 'bg-primary/5 border-primary/30 shadow-glow-red-sm' :
                isDone ? 'bg-green-500/5 border-green-500/20' :
                'bg-card border-card-border'
              )} onClick={() => onSelectStage(stage)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                      isActive ? 'bg-primary/20 text-primary border border-primary/30' :
                      isDone ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      'bg-white/5 text-white/40 border border-white/10'
                    )}>
                      {isLast ? <Crown className="w-4 h-4" /> : isDone ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">{stage.name}</span>
                      <Badge size="sm" className="ml-2" variant={
                        stage.status === 'COMPLETED' ? 'success' :
                        stage.status === 'ACTIVE' || stage.status === 'LIVE' ? 'info' : 'default'
                      }>
                        {stage.status || 'PENDING'}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30">{stage.type?.replace(/_/g, ' ')}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-white/40">Teams</span>
                    <p className="text-sm font-semibold text-white">{stage.teamsCount || '-'}</p>
                  </div>
                  <div>
                    <span className="text-white/40">Qualify</span>
                    <p className="text-sm font-semibold text-green-400">{stage.qualifyingTeams || '-'}</p>
                  </div>
                  <div>
                    <span className="text-white/40">Eliminated</span>
                    <p className="text-sm font-semibold text-red-400">{stage.eliminationCount || '-'}</p>
                  </div>
                </div>
                {stage.teamsPerLobby && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-3 text-[10px] text-white/30">
                    <span>{stage.lobbyCount || 0} lobbies</span>
                    <span>{stage.teamsPerLobby} per lobby</span>
                    <span>{stage.matchesCount || 0} matches</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Matches Tab ────────────────────────────────────────────────────────────────

function MatchesTab({ tournamentId, tournament, selectedStage, onBackToStages, onOpenStageList }: any) {
  if (tournament?.format === 'MULTI_STAGE') {
    if (selectedStage) {
      return <StageDetailView tournamentId={tournamentId} stage={selectedStage} onClose={onBackToStages} />;
    }
    return (
      <Card className="p-8 text-center">
        <Swords className="w-12 h-12 text-white/10 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white/40 mb-1">Select a Stage</h3>
        <p className="text-sm text-white/30 mb-4">Choose a stage to manage its matches and lobbies.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onOpenStageList}>Browse Stages</Button>
          <Button variant="secondary" onClick={onBackToStages}>View Stage Flow</Button>
        </div>
      </Card>
    );
  }

  if (tournament?.format === 'MULTI_ROUND') {
    return <MultiRoundMatchManager tournamentId={tournamentId} tournament={tournament} />;
  }

  return <SingleMatchView tournament={tournament} tournamentId={tournamentId} />;
}

function SingleMatchView({ tournament, tournamentId }: any) {
  const queryClient = useQueryClient();
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsRoomId, setCredsRoomId] = useState('');
  const [credsPassword, setCredsPassword] = useState('');

  const sendCredsMutation = useMutation({
    mutationFn: (data: { roomId: string; roomPassword: string }) =>
      tournamentApi.setRoomCredentials(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success('Credentials sent — match is in WAITING. Will go LIVE in 10 min.');
      setShowCredsModal(false);
      setCredsRoomId('');
      setCredsPassword('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const completeMutation = useMutation({
    mutationFn: () => (tournamentApi as any).updateStatus(tournamentId, 'COMPLETED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success('Match marked completed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const goLiveMutation = useMutation({
    mutationFn: () => (tournamentApi as any).updateStatus(tournamentId, 'LIVE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success('Match is now LIVE');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const roomAssigned = tournament.roomId || tournament.roomPassword;
  const status = tournament.status;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Match Details</h3>
          <div className="flex items-center gap-2">
            {status === 'WAITING' && (
              <>
                <WaitingCountdown createdAt={tournament.createdAt} />
                <button onClick={() => goLiveMutation.mutate()} className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold transition-all">
                  <Zap className="w-3 h-3 inline mr-1" /> Go Live Now
                </button>
              </>
            )}
            {status === 'LIVE' && (
              <button onClick={() => completeMutation.mutate()} className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-all">
                <CheckCircle className="w-3 h-3 inline mr-1" /> Mark Completed
              </button>
            )}
            {!roomAssigned && status !== 'COMPLETED' && status !== 'LIVE' && (
              <button onClick={() => setShowCredsModal(true)} className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all">
                <Key className="w-3 h-3 inline mr-1" /> Send Credentials
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/40">Map</span>
            <p className="text-white font-medium">{tournament.mapName || 'TBD'}</p>
          </div>
          <div>
            <span className="text-white/40">Mode</span>
            <p className="text-white font-medium">{tournament.mode}</p>
          </div>
          <div>
            <span className="text-white/40">Room ID</span>
            <p className="text-white font-mono">{tournament.roomId || 'Not assigned'}</p>
          </div>
          <div>
            <span className="text-white/40">Password</span>
            <p className="text-white font-mono">{tournament.roomPassword || 'Not assigned'}</p>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showCredsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Send Room Credentials</h3>
                <p className="text-sm text-white/50 mb-4">Match will enter WAITING status for 10 minutes, then go LIVE automatically.</p>
                <div className="space-y-3 mb-4">
                  <input value={credsRoomId} onChange={(e) => setCredsRoomId(e.target.value)} placeholder="Room ID" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
                  <input value={credsPassword} onChange={(e) => setCredsPassword(e.target.value)} placeholder="Room Password" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowCredsModal(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={() => sendCredsMutation.mutate({ roomId: credsRoomId, roomPassword: credsPassword })} loading={sendCredsMutation.isPending} disabled={!credsRoomId || !credsPassword}>Send & Wait</Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function MultiRoundMatchManager({ tournamentId, tournament }: any) {
  const queryClient = useQueryClient();
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [roundTitle, setRoundTitle] = useState('');

  const { data: tData } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentApi.getById(tournamentId),
    refetchInterval: 15000,
  });
  const rounds = tData?.tournament?.rounds || [];

  const createMutation = useMutation({
    mutationFn: () => tournamentApi.createRound(tournamentId, { title: roundTitle || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); setShowCreateRound(false); setRoundTitle(''); toast.success('Round created'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const startMutation = useMutation({
    mutationFn: (data: any) => tournamentApi.updateRoundStatus(tournamentId, data.roundId, 'WAITING', { roomId: data.roomId, roomPassword: data.roomPassword }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('Round in waiting — will go LIVE in 10 min'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const completeMutation = useMutation({
    mutationFn: (roundId: string) => tournamentApi.updateRoundStatus(tournamentId, roundId, 'COMPLETED'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('Round completed'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const goLiveMutation = useMutation({
    mutationFn: (roundId: string) => tournamentApi.updateRoundStatus(tournamentId, roundId, 'LIVE'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('Round is now LIVE'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (roundId: string) => tournamentApi.deleteRound(tournamentId, roundId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('Round deleted'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Match Rounds</h3>
        <Button size="sm" onClick={() => setShowCreateRound(true)}><Plus className="w-3.5 h-3.5" /> Add Round</Button>
      </div>

      {showCreateRound && (
        <Card className="p-4">
          <div className="flex gap-3">
            <input
              value={roundTitle}
              onChange={(e) => setRoundTitle(e.target.value)}
              placeholder="Round title (optional)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
              autoFocus
            />
            <Button size="sm" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreateRound(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {rounds.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No rounds created yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rounds.map((round: any) => (
            <Card key={round.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  R{round.roundNumber}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{round.title || `Round ${round.roundNumber}`}</p>
                  <p className="text-xs text-white/40">
                    {round.scores?.length || 0} scores • {round.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {round.status === 'UPCOMING' && (
                  <StartRoundButton roundId={round.id} roundNumber={round.roundNumber} onStart={(data: any) => startMutation.mutate({ roundId: round.id, ...data })} loading={startMutation.isPending} />
                )}
                {round.status === 'WAITING' && (
                  <>
                    <WaitingCountdown createdAt={round.createdAt} />
                    <button onClick={() => goLiveMutation.mutate(round.id)} className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold transition-all">
                      <Zap className="w-3 h-3 inline mr-1" /> Go Live Now
                    </button>
                  </>
                )}
                {round.status === 'LIVE' && (
                  <button onClick={() => completeMutation.mutate(round.id)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-all">
                    <CheckCircle className="w-3 h-3 inline mr-1" /> Mark Completed
                  </button>
                )}
                {round.status === 'UPCOMING' && (
                  <button onClick={() => deleteMutation.mutate(round.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StartRoundButton({ roundId, roundNumber, onStart, loading }: any) {
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold transition-all">
        <PlayCircle className="w-3 h-3 inline mr-1" /> Start
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Start Round {roundNumber}</h3>
                <div className="space-y-3 mb-4">
                  <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
                  <input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} placeholder="Room Password" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={() => { onStart({ roomId, roomPassword }); setOpen(false); }} loading={loading} disabled={!roomId || !roomPassword}>Start Match</Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function WaitingCountdown({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const TEN_MIN = 10 * 60 * 1000;

    const tick = () => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, TEN_MIN - elapsed);
      setRemaining(left);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-semibold">
      <Clock className="w-3 h-3" />
      {remaining > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : 'Starting...'}
    </span>
  );
}

// ─── Standings Tab ──────────────────────────────────────────────────────────────

function StandingsTab({ tournamentId, tournament }: any) {
  const { data, isLoading } = useQuery({
    queryKey: ['scoreboard', tournamentId],
    queryFn: () => tournamentApi.getScoreboard(tournamentId),
    refetchInterval: tournament?.status === 'LIVE' ? 10000 : false,
    enabled: !!tournamentId && tournament?.format === 'MULTI_ROUND',
  });

  const scoreboard = data?.scoreboard || [];
  const rounds = data?.rounds || [];

  if (tournament?.format !== 'MULTI_ROUND') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Standings</h2>
            <p className="text-sm text-white/50">Single match results</p>
          </div>
        </div>
        <p className="text-white/40 text-sm">{tournament?.status === 'COMPLETED' ? 'Match has concluded. Check the tournament detail page for results.' : 'Standings will appear once matches are completed.'}</p>
      </Card>
    );
  }

  if (isLoading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-card border border-card-border rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Live Standings</h2>
          <p className="text-sm text-white/50">{scoreboard.length} teams • {tournament.totalRounds || 0} matches</p>
        </div>
        <Badge variant={tournament?.status === 'LIVE' ? 'success' : 'default'} size="sm" className="ml-auto">
          {tournament?.status === 'LIVE' ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 inline-block animate-pulse" /> LIVE</> : tournament?.status}
        </Badge>
      </div>

      {scoreboard.length === 0 ? (
        <Card className="p-8 text-center">
          <BarChart3 className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No scores yet</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Team</th>
                  {rounds.map((r: any) => (
                    <th key={r.id} className="text-center px-3 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">
                      R{r.roundNumber}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Kills</th>
                  <th className="text-center px-4 py-3 text-xs text-primary font-medium uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry: any, i: number) => (
                  <tr key={entry.teamId} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i < 3 ? 'bg-primary/[0.03]' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>
                          #{entry.rank}
                        </span>
                        {i === 0 && <Crown className="w-3 h-3 text-yellow-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-white">{entry.teamName}</span>
                      <span className="text-xs text-white/30 ml-2">{entry.matchesPlayed}m</span>
                    </td>
                    {rounds.map((r: any) => {
                      const rs = entry.roundScores?.[r.roundNumber];
                      return (
                        <td key={r.id} className="text-center px-3 py-3">
                          {rs ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-bold ${rs.placement === 1 ? 'text-yellow-400' : 'text-white/70'}`}>#{rs.placement}</span>
                              <span className="text-xs text-white/30">{rs.kills}k</span>
                            </div>
                          ) : <span className="text-white/10">—</span>}
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3">
                      <span className="text-sm font-bold text-white/70">{entry.totalKills}</span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <motion.span
                        key={entry.totalPoints}
                        initial={{ scale: 1.3, color: '#ff1f1f' }}
                        animate={{ scale: 1, color: '#ff1f1f' }}
                        className="text-lg font-black text-primary"
                      >
                        {entry.totalPoints}
                      </motion.span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tournament.placementPoints?.length > 0 && (
        <details className="text-xs text-white/30 cursor-pointer hover:text-white/50">
          <summary className="font-medium">Placement Points</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tournament.placementPoints.map((pts: number, i: number) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-white/40">#{i + 1}: {pts}pt</span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Teams Tab ──────────────────────────────────────────────────────────────────

function TeamsTab({ tournamentId, tournament, searchQuery, onSearchChange }: any) {
  const queryClient = useQueryClient();
  const registrations = tournament?.registrations || [];
  const [guestIgn, setGuestIgn] = useState('');
  const [guestTeamName, setGuestTeamName] = useState('');

  const addMutation = useMutation({
    mutationFn: () => tournamentApi.manualRegisterParticipant(tournamentId, { guestIgn, teamName: guestTeamName || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); setGuestIgn(''); setGuestTeamName(''); toast.success('Participant added'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const removeMutation = useMutation({
    mutationFn: (regId: string) => tournamentApi.removeParticipant(tournamentId, regId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('Participant removed'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const filtered = registrations.filter((r: any) => {
    const name = r.user?.ign || r.user?.username || r.guestIgn || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Team Management</h2>
          <p className="text-sm text-white/50">{registrations.length} registered • {tournament.slots} slots</p>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search teams..." className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 w-40" />
          </div>
        </div>
      </div>

      {/* Add Participant */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Add Participant</p>
        <div className="flex gap-2">
          <input value={guestIgn} onChange={(e) => setGuestIgn(e.target.value)} placeholder="Player IGN" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
          <input value={guestTeamName} onChange={(e) => setGuestTeamName(e.target.value)} placeholder="Team (optional)" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
          <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending} disabled={!guestIgn.trim()}>Add</Button>
        </div>
      </Card>

      {/* Team List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">{searchQuery ? 'No matching teams' : 'No participants yet'}</p>
        </Card>
      ) : (
        <div className="space-y-1">
          {filtered.map((reg: any) => {
            const displayName = reg.user?.ign || reg.user?.username || reg.guestIgn || 'Unknown';
            return (
              <div key={reg.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {displayName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{displayName}</p>
                    {reg.teamName && <p className="text-xs text-white/40">{reg.teamName}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removeMutation.mutate(reg.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Finance Tab ────────────────────────────────────────────────────────────────

function FinanceTab({ tournament, totalCollection, prizePoolNum, organizerEarnings, commission, wallet }: any) {
  const isFree = tournament?.entryFee === '0' || tournament?.entryFee === 'Free' || !totalCollection;
  const lockedAmount = tournament?.prizeDistribution?.enabled
    ? tournament.prizeDistribution.distribution.reduce((a: number, b: number) => a + b, 0)
    : prizePoolNum;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <IndianRupee className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Financial Overview</h2>
          <p className="text-sm text-white/50">{isFree ? 'Free Entry Tournament' : 'Paid Entry'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FinanceCard
          icon={Users}
          label={isFree ? 'Sponsor Prize' : 'Total Collection'}
          value={isFree ? `₹${prizePoolNum.toLocaleString()}` : `₹${totalCollection.toLocaleString()}`}
          sub={isFree ? 'Reserved from wallet' : `${tournament?.slots || 0} × ₹${Number(tournament?.entryFee || 0).toLocaleString()}`}
          color="text-blue-400" bg="bg-blue-500/10"
        />
        <FinanceCard
          icon={Lock}
          label="Prize Pool"
          value={`₹${prizePoolNum.toLocaleString()}`}
          sub={isFree ? 'Locked from wallet' : `${Math.round((prizePoolNum / Math.max(totalCollection, 1)) * 100)}% of collection`}
          color="text-yellow-400" bg="bg-yellow-500/10"
        />
        <FinanceCard
          icon={TrendingUp}
          label="Your Earnings"
          value={`₹${organizerEarnings.toLocaleString()}`}
          sub={isFree ? 'No earnings (free entry)' : 'After prize pool & commission'}
          color="text-green-400" bg="bg-green-500/10"
        />
        <FinanceCard
          icon={Zap}
          label="TournaX Commission"
          value={`₹${commission.toLocaleString()}`}
          sub={isFree ? 'Waived for free entry' : '10% platform fee'}
          color="text-purple-400" bg="bg-purple-500/10"
        />
      </div>

      {isFree && (
        <Card className="p-4 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">Free Entry Tournament</span>
          </div>
          <p className="text-xs text-blue-300/70">Prize pool of ₹{prizePoolNum.toLocaleString()} is locked from your wallet. No entry fees collected.</p>
        </Card>
      )}

      {/* Wallet Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-white">Wallet Summary</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-white/40">Available</p>
            <p className="text-lg font-bold text-green-400">₹{(wallet?.balance || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Locked</p>
            <p className="text-lg font-bold text-yellow-400">₹{(wallet?.lockedAmount || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Pending</p>
            <p className="text-lg font-bold text-blue-400">₹{(wallet?.pendingEarnings || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Total Revenue</p>
            <p className="text-lg font-bold text-primary">₹{(wallet?.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Prize Distribution in Finance */}
      {tournament?.prizeDistribution?.enabled && (
        <Card className="p-4 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Prize Breakdown</span>
          </div>
          <div className="space-y-2">
            {(tournament as any).prizeDistribution.distribution.map((amount: number, i: number) => {
              const pct = prizePoolNum > 0 ? Math.round((amount / prizePoolNum) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-white/5 text-white/40'
                  }`}>#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{i === 0 ? '1st Place' : i === 1 ? '2nd Place' : i === 2 ? '3rd Place' : `${i + 1}th Place`}</span>
                      <span className="text-white font-bold">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-white/30 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function FinanceCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <div className={`${bg} border border-white/5 rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-black ${color} mb-0.5`}>{value}</p>
      <p className="text-[10px] text-white/30">{sub}</p>
    </div>
  );
}

// ─── Stream Tab ─────────────────────────────────────────────────────────────────

function StreamTab({ tournamentId, tournament }: any) {
  const queryClient = useQueryClient();
  const [streamUrl, setStreamUrl] = useState(tournament?.youtubeUrl || '');
  const [streamTitle, setStreamTitle] = useState('');
  const isLive = tournament?.status === 'LIVE';

  const updateStreamMutation = useMutation({
    mutationFn: () => tournamentApi.update(tournamentId, { youtubeUrl: streamUrl }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('Stream updated'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const toggleLiveMutation = useMutation({
    mutationFn: (status: string) => tournamentApi.update(tournamentId, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success(isLive ? 'Tournament ended' : 'Tournament is now LIVE!'); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const videoId = streamUrl ? extractYouTubeId(streamUrl) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Monitor className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Live Stream</h2>
          <p className="text-sm text-white/50">Manage your tournament broadcast</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isLive && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-400">LIVE</span>
            </span>
          )}
          <Button
            size="sm"
            variant={isLive ? 'secondary' : 'primary'}
            onClick={() => toggleLiveMutation.mutate(isLive ? 'COMPLETED' : 'LIVE')}
            loading={toggleLiveMutation.isPending}
          >
            {isLive ? 'End Stream' : 'Go Live'}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          <input
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="YouTube livestream URL"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          />
          <input
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            placeholder="Stream title (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateStreamMutation.mutate()} loading={updateStreamMutation.isPending}>Save Stream</Button>
            {videoId && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Watch Live
              </a>
            )}
          </div>
        </div>
      </Card>

      {videoId && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Stream Preview</p>
              <p className="text-[10px] text-white/30">Click Watch Live to open in YouTube</p>
            </div>
            {isLive && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/25"
              >
                <Radio className="w-3.5 h-3.5" />
                WATCH LIVE
              </a>
            )}
          </div>
          <a href={streamUrl} target="_blank" rel="noopener noreferrer" className="block aspect-video bg-surface rounded-lg overflow-hidden border border-white/10 group cursor-pointer">
            {videoId ? (
              <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/10 to-surface">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Stream thumbnail"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/80 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 text-white ml-0.5" />
                  </div>
                </div>
                {isLive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-bold text-white">LIVE</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Monitor className="w-10 h-10 text-white/20" />
              </div>
            )}
          </a>
        </Card>
      )}

      {isLive && (
        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE NOW — {tournament.title}
              </p>
              <p className="text-xs text-white/50 mt-0.5">Broadcasting to all viewers</p>
            </div>
            {videoId && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                WATCH LIVE
              </a>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Activity Tab ───────────────────────────────────────────────────────────────

function ActivityTab({ notifications }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
          <p className="text-sm text-white/50">Real-time tournament operations</p>
        </div>
        <Badge variant="info" size="sm" className="ml-auto">{notifications.length} events</Badge>
      </div>

      <Card className="p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {notifications.map((n: any, i: number) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  {n.message && <p className="text-xs text-white/40 mt-0.5">{n.message}</p>}
                  <p className="text-[10px] text-white/20 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Right Panel ────────────────────────────────────────────────────────────────

function RightPanel({ tournament, wallet, totalCollection, organizerEarnings, commission, notifications, onTabChange }: any) {
  return (
    <div className="space-y-4">
      {/* Quick Wallet */}
      <Card className="p-4 sticky top-24">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Wallet</p>
            <p className="text-[10px] text-white/40">Available: ₹{(wallet?.balance || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Locked</span>
            <span className="text-yellow-400 font-semibold">₹{(wallet?.lockedAmount || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Total Revenue</span>
            <span className="text-primary font-semibold">₹{(wallet?.totalRevenue || 0).toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={() => onTabChange('finance')}
          className="w-full py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-primary to-primary/80 text-white transition-all flex items-center justify-center gap-1.5"
        >
          View Full Finance
        </button>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-white">Activity</span>
        </div>
        <div className="space-y-1.5">
          {notifications.length === 0 ? (
            <p className="text-xs text-white/20 text-center py-2">No activity</p>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-white/[0.02]">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-2.5 h-2.5 text-primary" />
                </div>
                <p className="text-[10px] text-white/60 leading-tight">{n.title}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-white">Quick Stats</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/40">Collection</span>
            <span className="text-white font-medium">₹{totalCollection.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Your Earnings</span>
            <span className="text-green-400 font-medium">₹{organizerEarnings.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Commission</span>
            <span className="text-purple-400 font-medium">₹{commission.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/5">
            <span className="text-white/40">Mode</span>
            <span className="text-white font-medium">{tournament?.mode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Format</span>
            <span className="text-white font-medium">{tournament?.format?.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Lock(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>; }
function Info(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>; }
