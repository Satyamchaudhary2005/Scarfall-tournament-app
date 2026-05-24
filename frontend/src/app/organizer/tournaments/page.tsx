'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Button, Input, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Plus, Search, X, Trash2, Edit3,
  AlertTriangle, RefreshCw, PlayCircle, CheckCircle, Clock, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function OrganizerPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50">Please sign in to manage tournaments</p>
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
              <h1 className="text-3xl font-black text-white">My Tournaments</h1>
              <p className="text-white/50 mt-1">Create and manage your tournaments</p>
            </div>
          </div>
          <OrganizerContent />
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}

function OrganizerContent() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-tournaments'],
    queryFn: () => tournamentApi.getMyTournaments(),
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
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Tournament created!');
      setShowCreate(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: () => tournamentApi.update(editingId!, {
      ...form,
      ...(form.startsAt ? { startsAt: new Date(form.startsAt).toISOString() } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Tournament updated!');
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tournamentApi.deleteHosted(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete'),
  });

  const cleanupMutation = useMutation({
    mutationFn: () => tournamentApi.cleanupOld(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.message || 'Cleanup failed'),
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

  const filtered = data?.tournaments?.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search your tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => cleanupMutation.mutate()}
            loading={cleanupMutation.isPending}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="w-4 h-4" />
            Cleanup Old
          </Button>
          <Button onClick={() => { setShowCreate(!showCreate); setEditingId(null); resetForm(); }} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {editingId ? 'Edit Tournament' : 'Create Tournament'}
                </h3>
                <button onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <Input label="Prize Pool" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
                <Input label="Entry Fee" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="SOLO">Solo</option>
                    <option value="DUO">Duo</option>
                    <option value="SQUAD">Squad</option>
                  </select>
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

      {/* Tournaments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card border border-card-border animate-pulse" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/40 mb-2">No tournaments yet</h3>
          <p className="text-white/30 mb-6">Create your first tournament to get started</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Create Tournament
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((t) => (
            <Card key={t.id} className="p-5 relative overflow-hidden group">
              <div className="flex items-start justify-between mb-3">
                <Badge
                  size="sm"
                  variant={
                    t.status === 'LIVE' ? 'success' :
                    t.status === 'COMPLETED' ? 'info' :
                    t.status === 'CANCELLED' ? 'danger' : 'warning'
                  }
                >
                  {t.status === 'REGISTRATION_OPEN' ? 'Open' : t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-primary transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${t.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(t.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t.title}</h3>
              <div className="space-y-1.5 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                  <span>{t.prizePool || 'No prize'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="capitalize">{t.mode.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t._count?.registrations || 0}/{t.slots} registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(t.startsAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/30">{t.entryFee === 'Free' ? 'Free Entry' : `₹${t.entryFee}`}</span>
                <Link
                  href={`/tournaments/${t.id}`}
                  className="text-xs text-primary hover:text-primary-400 font-medium"
                >
                  View →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


