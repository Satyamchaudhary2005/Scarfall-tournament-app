'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, tournamentApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Button, Input, Badge, Select, ConfirmModal } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Trophy, Swords, AlertTriangle,
  Plus, Search, X, Check, Trash2, Ban, Eye, Edit3,
  Send, Activity, Bell,
  UserCheck, UserX, Clock,
  PlayCircle, CheckCircle,
  Wallet, DollarSign, Minus,
  Crosshair, UserPlus, XCircle, Shield, Star, User,
  CalendarClock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn, API_URL } from '@/lib/utils';

type Tab = 'overview' | 'tournaments' | 'users' | 'clans' | 'reports' | 'notifications' | 'auto-tournaments';

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50">Admin access required</p>
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
              <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
              <p className="text-white/50 mt-1">Full control over your esports platform</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'tournaments', label: 'Tournaments', icon: Trophy },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'clans', label: 'Clans', icon: Swords },
              { id: 'reports', label: 'Reports', icon: AlertTriangle },
              { id: 'notifications', label: 'Broadcast', icon: Send },
              { id: 'auto-tournaments', label: 'Auto Tournaments', icon: CalendarClock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'tournaments' && <TournamentsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'clans' && <AdminClansTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'notifications' && <BroadcastTab />}
          {activeTab === 'auto-tournaments' && <AutoTournamentsTab />}
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 15000,
  });

  const stats = data?.stats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-card border border-card-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Clans', value: stats.totalClans.toLocaleString(), icon: Swords, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Tournaments', value: stats.totalTournaments.toLocaleString(), icon: Trophy, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { label: 'Matches Played', value: stats.totalMatches.toLocaleString(), icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: 'Live Now', value: stats.liveTournaments.toLocaleString(), icon: PlayCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Pending Reports', value: stats.pendingReports.toLocaleString(), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -translate-y-8 translate-x-8 rounded-full ${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`} />
            <stat.icon className={`w-6 h-6 ${stat.color} mb-3 relative`} />
            <p className="text-2xl font-bold text-white relative">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1 relative">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Create Tournament', icon: Plus, color: 'text-primary', href: '#tournaments' },
              { label: 'View Reports', icon: AlertTriangle, color: 'text-red-400', href: '#reports' },
              { label: 'Manage Users', icon: Users, color: 'text-blue-400', href: '#users' },
              { label: 'Send Broadcast', icon: Send, color: 'text-green-400', href: '#notifications' },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-white/70">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Platform Status
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Server Status', value: 'Operational', color: 'text-green-400' },
              { label: 'Active Users', value: stats.totalUsers.toLocaleString(), color: 'text-white' },
              { label: 'Live Tournaments', value: stats.liveTournaments, color: stats.liveTournaments > 0 ? 'text-green-400' : 'text-white/50' },
              { label: 'Pending Issues', value: stats.pendingReports, color: stats.pendingReports > 0 ? 'text-red-400' : 'text-green-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/50">{item.label}</span>
                <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Tournaments Tab ──────────────────────────────────────────────────────────

function TournamentsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; message: string; variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void; confirmLabel?: string;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tournaments', search],
    queryFn: () => tournamentApi.getAll({ limit: 50, search: search || undefined }),
  });

  const [form, setForm] = useState({
    title: '',
    prizePool: '',
    entryFee: 'Free',
    mode: 'SOLO' as string,
    slots: 100,
    startsAt: '',
    description: '',
    mapName: '',
    rules: '',
  });

  const resetForm = () => setForm({
    title: '', prizePool: '', entryFee: 'Free', mode: 'SOLO',
    slots: 100, startsAt: '', description: '', mapName: '', rules: '',
  });

  const createMutation = useMutation({
    mutationFn: () => tournamentApi.create({
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Tournament created!');
      setShowCreate(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: () => tournamentApi.update(editingId!, {
      ...form,
      ...(form.startsAt ? { startsAt: new Date(form.startsAt).toISOString() } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
      toast.success('Tournament updated!');
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateTournamentStatus(id, status),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Tournament deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      prizePool: t.prizePool || '',
      entryFee: t.entryFee || 'Free',
      mode: t.mode,
      slots: t.slots,
      startsAt: t.startsAt ? new Date(t.startsAt).toISOString().slice(0, 16) : '',
      description: t.description || '',
      mapName: t.mapName || '',
      rules: t.rules || '',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); setEditingId(null); resetForm(); }}>
          <Plus className="w-4 h-4" />
          Create Tournament
        </Button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreate || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingId ? 'Edit Tournament' : 'Create Tournament'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <Input label="Prize Pool" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
                <Input label="Entry Fee" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} />
                <div>
                  <Select
                    label="Mode"
                    value={form.mode}
                    onChange={(v) => setForm({ ...form, mode: v })}
                    options={[
                      { value: 'SOLO', label: 'Solo', icon: <Crosshair className="w-full h-full" />, description: '1 player per team' },
                      { value: 'DUO', label: 'Duo', icon: <Users className="w-full h-full" />, description: '2 players per team' },
                      { value: 'SQUAD', label: 'Squad', icon: <Swords className="w-full h-full" />, description: '4 players per team' },
                    ]}
                  />
                </div>
                <Input label="Slots" type="number" value={form.slots.toString()} onChange={(e) => setForm({ ...form, slots: parseInt(e.target.value) || 0 })} />
                <Input label="Start Date" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
                <Input label="Map Name" value={form.mapName} onChange={(e) => setForm({ ...form, mapName: e.target.value })} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all min-h-[80px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Rules</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all min-h-[80px]"
                    value={form.rules}
                    onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Save Changes' : 'Create Tournament'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournaments List */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/30 uppercase">
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Prize</th>
                  <th className="text-left p-4">Mode</th>
                  <th className="text-left p-4">Slots</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.tournaments?.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="text-sm text-white font-medium">{t.title}</span>
                    </td>
                    <td className="p-4">
                      <div className="inline-block min-w-[140px]">
                        <Select
                          size="sm"
                          value={t.status}
                          onChange={(v) => {
                            setConfirmModal({
                              open: true, title: 'Change Status',
                              message: `Change "${t.title}" status to ${v}?`,
                              variant: 'warning', confirmLabel: 'Change',
                              onConfirm: () => { statusMutation.mutate({ id: t.id, status: v }); setConfirmModal(m => ({ ...m, open: false })); },
                            });
                          }}
                          disabled={statusMutation.isPending}
                          options={[
                            { value: 'UPCOMING', label: 'Upcoming', icon: <Clock className="w-full h-full" /> },
                            { value: 'REGISTRATION_OPEN', label: 'Registration Open', icon: <UserPlus className="w-full h-full" /> },
                            { value: 'LIVE', label: 'Live', icon: <PlayCircle className="w-full h-full" /> },
                            { value: 'COMPLETED', label: 'Completed', icon: <CheckCircle className="w-full h-full" /> },
                            { value: 'CANCELLED', label: 'Cancelled', icon: <XCircle className="w-full h-full" /> },
                          ]}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white/70">{t.prizePool}</td>
                    <td className="p-4">
                      <Badge size="sm" variant={t.mode === 'SOLO' ? 'default' : t.mode === 'DUO' ? 'info' : 'warning'}>
                        {t.mode}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-white/70">
                      <span className="text-white">{t._count?.registrations || 0}</span>/{t.slots}
                    </td>
                    <td className="p-4 text-sm text-white/50">
                      {new Date(t.startsAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingId(viewingId === t.id ? null : t.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
                          title="View registrations"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-primary transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmModal({
                            open: true, title: 'Delete Tournament',
                            message: `Delete tournament "${t.title}"? This cannot be undone.`,
                            variant: 'danger', confirmLabel: 'Delete',
                            onConfirm: () => { deleteMutation.mutate(t.id); setConfirmModal(m => ({ ...m, open: false })); },
                          })}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.tournaments || data.tournaments.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/30">
                      No tournaments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Registrations Viewer */}
      <AnimatePresence>
        {viewingId && <TournamentRegistrationsViewer tournamentId={viewingId} onClose={() => setViewingId(null)} />}
      </AnimatePresence>

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
      />
    </div>
  );
}

function TournamentRegistrationsViewer({ tournamentId, onClose }: { tournamentId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tournament', tournamentId],
    queryFn: () => adminApi.getAdminTournament(tournamentId),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {data?.tournament?.title || 'Tournament'} Registrations
            <Badge size="sm" variant="info">
              {data?.tournament?._count?.registrations || 0} registered
            </Badge>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/30 uppercase">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Team</th>
                  <th className="text-left p-3">Clan</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {data?.tournament?.registrations?.map((reg: any) => (
                  <tr key={reg.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-sm text-white">{reg.user?.username}</td>
                    <td className="p-3 text-sm text-white/70">{reg.teamName || '-'}</td>
                    <td className="p-3 text-sm text-white/70">{reg.clan?.tag || '-'}</td>
                    <td className="p-3">
                      <Badge size="sm" variant={reg.status === 'CONFIRMED' ? 'success' : 'warning'}>
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-white/50">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!data?.tournament?.registrations || data.tournament.registrations.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-white/30">
                      No registrations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [walletUser, setWalletUser] = useState<any>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; message: string; variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void; confirmLabel?: string;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: () => adminApi.getUsers({ search: search || undefined, page, limit: 20 }),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => adminApi.banUser(userId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const walletMutation = useMutation({
    mutationFn: (amount: number) => adminApi.adjustWalletBalance({
      userId: walletUser.id,
      amount,
      description: walletDesc || undefined,
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message);
      setWalletUser(null);
      setWalletAmount('');
      setWalletDesc('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  return (
    <div>
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/30 uppercase">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Points</th>
                  <th className="text-left p-4">Stats</th>
                  <th className="text-left p-4">Clan</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((u: any) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="text-sm font-medium text-white">{u.username}</span>
                    </td>
                    <td className="p-4 text-sm text-white/50">{u.email}</td>
                    <td className="p-4">
                      <div className="inline-block min-w-[120px]">
                        <Select
                          size="sm"
                          value={u.role}
                          onChange={(v) => {
                            setConfirmModal({
                              open: true, title: 'Change Role',
                              message: `Change ${u.username}'s role to ${v}?`,
                              variant: 'warning', confirmLabel: 'Change',
                              onConfirm: () => { roleMutation.mutate({ id: u.id, role: v }); setConfirmModal(m => ({ ...m, open: false })); },
                            });
                          }}
                          disabled={roleMutation.isPending}
                          className={
                            u.role === 'ADMIN' ? 'text-amber-400' :
                            u.role === 'MODERATOR' ? 'text-orange-400' :
                            u.role === 'ORGANIZER' ? 'text-green-400' :
                            'text-slate-400'
                          }
                          options={[
                            { value: 'USER', label: 'User', icon: <User className="w-full h-full" /> },
                            { value: 'MODERATOR', label: 'Moderator', icon: <Shield className="w-full h-full" /> },
                            { value: 'ORGANIZER', label: 'Organizer', icon: <Trophy className="w-full h-full" /> },
                            { value: 'ADMIN', label: 'Admin', icon: <Star className="w-full h-full" /> },
                          ]}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white/70">{u.points.toLocaleString()}</td>
                    <td className="p-4 text-sm text-white/70">
                      <span className="text-green-400">{u.wins}W</span>
                      {' / '}
                      <span>{u.matchesPlayed}M</span>
                    </td>
                    <td className="p-4 text-sm text-white/70">{u.clan?.tag || '-'}</td>
                    <td className="p-4 text-sm text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setWalletUser(u); setWalletAmount(''); setWalletDesc(''); }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-green-400 transition-all"
                          title="Adjust wallet"
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => banMutation.mutate(u.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-yellow-400 transition-all"
                          title={u.role === 'USER' ? 'Suspend user' : 'Reinstate user'}
                          disabled={u.role === 'ADMIN'}
                        >
                          {u.role === 'USER' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => setConfirmModal({
                              open: true, title: 'Delete User',
                              message: `Permanently delete user "${u.username}"? This cannot be undone.`,
                              variant: 'danger', confirmLabel: 'Delete',
                              onConfirm: () => { deleteMutation.mutate(u.id); setConfirmModal(m => ({ ...m, open: false })); },
                            })}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.users || data.users.length === 0) && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-white/30">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-white/50">
          <span>Page {page} of {data.pagination.totalPages} ({data.pagination.total} total)</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Wallet Adjustment Modal */}
      <AnimatePresence>
        {walletUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setWalletUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Adjust Wallet</h3>
                      <p className="text-sm text-white/50">{walletUser.username}</p>
                    </div>
                  </div>
                  <button onClick={() => setWalletUser(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Amount (₹)"
                    type="number"
                    placeholder="Enter amount"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    min={1}
                  />

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Description (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Tournament winnings bonus"
                      value={walletDesc}
                      onChange={(e) => setWalletDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="secondary"
                      className="w-full h-11"
                      onClick={() => {
                        const amt = parseInt(walletAmount);
                        if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
                        walletMutation.mutate(amt);
                      }}
                      loading={walletMutation.isPending}
                    >
                      <Plus className="w-4 h-4" />
                      Add Funds
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full h-11"
                      onClick={() => {
                        const amt = parseInt(walletAmount);
                        if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
                        walletMutation.mutate(-amt);
                      }}
                      loading={walletMutation.isPending}
                    >
                      <Minus className="w-4 h-4" />
                      Deduct
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
      />
    </div>
  );
}

// ─── Clans Tab ────────────────────────────────────────────────────────────────

function AdminClansTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingClan, setEditingClan] = useState<any>(null);
  const [viewingClan, setViewingClan] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; message: string; variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void; confirmLabel?: string;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clans', search, page],
    queryFn: () => adminApi.getClans({ search: search || undefined, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteClan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clans'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Clan disbanded');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const [editForm, setEditForm] = useState({ name: '', tag: '', description: '', color: '#ff1f1f' });

  // Fetch clan details for viewing
  const { data: clanDetail } = useQuery({
    queryKey: ['admin', 'clan', viewingClan?.id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/clans/${viewingClan.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.json();
    },
    enabled: !!viewingClan,
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search clans..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/30 uppercase">
                  <th className="text-left p-4">Clan</th>
                  <th className="text-left p-4">Tag</th>
                  <th className="text-left p-4">Leader</th>
                  <th className="text-left p-4">Members</th>
                  <th className="text-left p-4">Points</th>
                  <th className="text-left p-4">Wins</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.clans?.map((c: any) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: c.color || '#ff1f1f' }}
                        >
                          {c.tag?.[0] || '?'}
                        </div>
                        <span className="text-sm font-medium text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white/50">[{c.tag}]</td>
                    <td className="p-4 text-sm text-white/70">{c.leader?.username}</td>
                    <td className="p-4 text-sm text-white/70">{c._count?.members || 0}</td>
                    <td className="p-4 text-sm text-white/70">{c.points?.toLocaleString()}</td>
                    <td className="p-4 text-sm text-white/70">{c.wins || 0}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingClan(viewingClan?.id === c.id ? null : c)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
                          title="View members"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmModal({
                            open: true, title: 'Disband Clan',
                            message: `Disband clan "${c.name}"? All members will be removed.`,
                            variant: 'danger', confirmLabel: 'Disband',
                            onConfirm: () => { deleteMutation.mutate(c.id); setConfirmModal(m => ({ ...m, open: false })); },
                          })}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                          title="Disband clan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.clans || data.clans.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/30">
                      No clans found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-white/50">
          <span>Page {page} of {data.pagination.totalPages} ({data.pagination.total} total)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Clan Members Viewer */}
      <AnimatePresence>
        {viewingClan && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Swords className="w-5 h-5 text-primary" />
                  {viewingClan.name} [{viewingClan.tag}]
                  <Badge size="sm" variant="info">
                    {clanDetail?.clan?.members?.length || 0} members
                  </Badge>
                </h3>
                <button onClick={() => setViewingClan(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!clanDetail ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-white/30 uppercase">
                        <th className="text-left p-3">User</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Points</th>
                        <th className="text-left p-3">Wins</th>
                        <th className="text-left p-3">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clanDetail?.clan?.members?.map((m: any) => (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{m.username[0]?.toUpperCase()}</span>
                              </div>
                              <span className="text-sm text-white">{m.username}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge size="sm" variant={m.clanRole === 'LEADER' ? 'gold' : 'default'}>
                              {m.clanRole || 'MEMBER'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-white/70">{m.points?.toLocaleString()}</td>
                          <td className="p-3 text-sm text-white/70">{m.wins || 0}</td>
                          <td className="p-3 text-sm text-white/70">
                            {m.deaths > 0 ? (m.kills / m.deaths).toFixed(2) : m.kills || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
      />
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const [filter, setFilter] = useState('PENDING');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', filter],
    queryFn: () => adminApi.getReports({ status: filter }),
    refetchInterval: 10000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, action }: { id: string; status: string; action?: string }) =>
      adminApi.resolveReport(id, { status, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Report resolved');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'PENDING', label: 'Pending', color: 'text-yellow-400' },
          { id: 'REVIEWED', label: 'Reviewed', color: 'text-blue-400' },
          { id: 'RESOLVED', label: 'Resolved', color: 'text-green-400' },
          { id: 'DISMISSED', label: 'Dismissed', color: 'text-white/40' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === s.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {data?.reports?.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
                <p className="text-white/40">No {filter.toLowerCase()} reports</p>
              </div>
            ) : (
              data?.reports?.map((report: any) => (
                <div key={report.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{report.reason}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Reported <strong className="text-white/70">{report.reported?.username}</strong> by{' '}
                        <strong className="text-white/70">{report.reporter?.username}</strong>
                        {' · '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      size="sm"
                      variant={report.status === 'PENDING' ? 'warning' : report.status === 'RESOLVED' ? 'success' : report.status === 'REVIEWED' ? 'info' : 'default'}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  {report.description && (
                    <p className="text-xs text-white/50 mb-3 bg-white/[0.02] p-2 rounded-lg">{report.description}</p>
                  )}
                  {report.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => resolveMutation.mutate({ id: report.id, status: 'RESOLVED', action: 'BAN' })}
                        loading={resolveMutation.isPending}
                      >
                        <Ban className="w-3 h-3" />
                        Ban & Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resolveMutation.mutate({ id: report.id, status: 'REVIEWED' })}
                        loading={resolveMutation.isPending}
                      >
                        <Eye className="w-3 h-3" />
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resolveMutation.mutate({ id: report.id, status: 'DISMISSED' })}
                        loading={resolveMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Broadcast Tab ────────────────────────────────────────────────────────────

function BroadcastTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [link, setLink] = useState('');
  const queryClient = useQueryClient();

  const broadcastMutation = useMutation({
    mutationFn: () => adminApi.broadcastNotification({
      title,
      message,
      type,
      link: link || undefined,
    }),
    onSuccess: (data: any) => {
      toast.success(`Broadcast sent to ${data.recipientCount} users!`);
      setTitle('');
      setMessage('');
      setType('SYSTEM');
      setLink('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  return (
    <div className="max-w-2xl">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Send Broadcast Notification
        </h3>
        <p className="text-sm text-white/40 mb-6">
          Send a notification to every user on the platform. Use this for important announcements.
        </p>

        <div className="space-y-4">
          <div>
            <Select
              label="Notification Type"
              value={type}
              onChange={(v) => setType(v)}
              options={[
                { value: 'SYSTEM', label: 'System Announcement', icon: <Bell className="w-full h-full" />, description: 'General platform-wide announcement' },
                { value: 'TOURNAMENT_UPDATE', label: 'Tournament Update', icon: <Trophy className="w-full h-full" />, description: 'Tournament-related notifications' },
                { value: 'CLAN_INVITE', label: 'Clan Related', icon: <Swords className="w-full h-full" />, description: 'Clan and team announcements' },
              ]}
            />
          </div>

          <Input
            label="Title"
            placeholder="e.g., Server Maintenance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Message</label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all min-h-[120px]"
              placeholder="Write your broadcast message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <Input
            label="Link (optional)"
            placeholder="e.g., /tournaments"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-400/80 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                This will send a notification to <strong>all users</strong> on the platform. Use responsibly.
              </span>
            </p>
          </div>

          <Button
            onClick={() => broadcastMutation.mutate()}
            loading={broadcastMutation.isPending}
            disabled={!title || !message}
            className="w-full"
          >
            <Send className="w-4 h-4" />
            Send Broadcast
          </Button>
        </div>
      </Card>

      {/* Quick Templates */}
      <Card className="p-6 mt-4">
        <h4 className="text-sm font-semibold text-white/70 mb-3">Quick Templates</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { title: 'Server Maintenance', message: 'Scheduled maintenance in 30 minutes. All live tournaments will be paused.', type: 'SYSTEM' },
            { title: 'New Tournament', message: 'A new tournament has been created! Check it out and register now.', type: 'TOURNAMENT_UPDATE', link: '/tournaments' },
            { title: 'Platform Update', message: 'We\'ve updated the platform with new features! Check them out.', type: 'SYSTEM' },
            { title: 'Tournament Results', message: 'Results for the recent tournament are now available.', type: 'TOURNAMENT_UPDATE', link: '/tournaments' },
          ].map((t, i) => (
            <button
              key={i}
              onClick={() => { setTitle(t.title); setMessage(t.message); setType(t.type); setLink(t.link || ''); }}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
            >
              <p className="text-xs font-medium text-white/70">{t.title}</p>
              <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{t.message}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Auto Tournaments Tab ─────────────────────────────────────────────────────

function AutoTournamentsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'auto-tournaments'],
    queryFn: () => adminApi.getAutoTournamentTemplates(),
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    prizePool: '',
    entryFee: 'Free',
    mode: 'SOLO',
    slots: 100,
    mapName: '',
    rules: '',
    format: 'SINGLE',
    totalRounds: 1,
    killPoints: 1,
    scheduledTime: '18:00',
    isActive: true,
  });

  const resetForm = () => setForm({
    title: '', description: '', prizePool: '', entryFee: 'Free',
    mode: 'SOLO', slots: 100, mapName: '', rules: '',
    format: 'SINGLE', totalRounds: 1, killPoints: 1, scheduledTime: '18:00', isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createAutoTournamentTemplate(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auto-tournaments'] });
      toast.success('Auto tournament template created!');
      setShowForm(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateAutoTournamentTemplate(editingId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auto-tournaments'] });
      toast.success('Template updated!');
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAutoTournamentTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auto-tournaments'] });
      toast.success('Template deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const triggerMutation = useMutation({
    mutationFn: (id: string) => adminApi.triggerAutoTournament(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auto-tournaments'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description || '',
      prizePool: t.prizePool || '',
      entryFee: t.entryFee || 'Free',
      mode: t.mode,
      slots: t.slots,
      mapName: t.mapName || '',
      rules: t.rules || '',
      format: t.format || 'SINGLE',
      totalRounds: t.totalRounds || 1,
      killPoints: t.killPoints || 1,
      scheduledTime: t.scheduledTime || '18:00',
      isActive: t.isActive,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-white/50">
            Configure tournament templates that auto-create daily. Use comma-separated times with optional titles (e.g. 15:00|Afternoon Showdown, 18:00|Evening Clash).
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}>
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showForm || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingId ? 'Edit Template' : 'New Auto Tournament Template'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <Input label="Prize Pool" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
                <Input label="Entry Fee" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} />
                <div>
                  <Select
                    label="Mode"
                    value={form.mode}
                    onChange={(v) => setForm({ ...form, mode: v })}
                    options={[
                      { value: 'SOLO', label: 'Solo', icon: <Crosshair className="w-full h-full" />, description: '1 player per team' },
                      { value: 'DUO', label: 'Duo', icon: <Users className="w-full h-full" />, description: '2 players per team' },
                      { value: 'SQUAD', label: 'Squad', icon: <Swords className="w-full h-full" />, description: '4 players per team' },
                    ]}
                  />
                </div>
                <Input label="Slots" type="number" value={form.slots.toString()} onChange={(e) => setForm({ ...form, slots: parseInt(e.target.value) || 0 })} />
                <Input label="Map Name" value={form.mapName} onChange={(e) => setForm({ ...form, mapName: e.target.value })} />
                <div>
                  <Select
                    label="Format"
                    value={form.format}
                    onChange={(v) => setForm({ ...form, format: v })}
                    options={[
                      { value: 'SINGLE', label: 'Single Match', icon: <PlayCircle className="w-full h-full" />, description: 'One match decides winner' },
                      { value: 'MULTI_ROUND', label: 'Multi Round', icon: <Activity className="w-full h-full" />, description: 'Multiple rounds accumulate points' },
                    ]}
                  />
                </div>
                <Input label="Total Rounds" type="number" value={form.totalRounds.toString()} onChange={(e) => setForm({ ...form, totalRounds: parseInt(e.target.value) || 1 })} />
                <Input label="Kill Points" type="number" value={form.killPoints.toString()} onChange={(e) => setForm({ ...form, killPoints: parseInt(e.target.value) || 0 })} />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Start Times (24h)</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all"
                    type="text"
                    value={form.scheduledTime}
                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                    placeholder="e.g. 15:00|Free Fire Squad|17:00, 18:00|Evening Clash|20:00"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </label>
                  <span className="text-sm text-white/70">Active</span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all min-h-[80px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Save Changes' : 'Create Template'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template List */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/30 uppercase">
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Mode</th>
                  <th className="text-left p-4">Time</th>
                  <th className="text-left p-4">Auto Del</th>
                  <th className="text-left p-4">Slots</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-left p-4">Last Run</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.templates?.map((t: any) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="text-sm text-white font-medium">{t.title}</span>
                    </td>
                    <td className="p-4">
                      <Badge size="sm" variant={t.isActive ? 'success' : 'default'}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge size="sm" variant={t.mode === 'SOLO' ? 'default' : t.mode === 'DUO' ? 'info' : 'warning'}>
                        {t.mode}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-white/70">{t.scheduledTime || '18:00'}</td>
                    <td className="p-4 text-sm text-white/70">{t.autoDeleteAfter ? `${t.autoDeleteAfter}m` : '—'}</td>
                    <td className="p-4 text-sm text-white/70">{t.slots}</td>
                    <td className="p-4 text-sm text-white/50">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-white/50">
                      {t.lastCreatedAt ? new Date(t.lastCreatedAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => triggerMutation.mutate(t.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-green-400 transition-all"
                          disabled={triggerMutation.isPending}
                          title="Create now"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-primary transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete template "${t.title}"?`)) {
                              deleteMutation.mutate(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.templates || data.templates.length === 0) && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-white/30">
                      No auto tournament templates configured yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
