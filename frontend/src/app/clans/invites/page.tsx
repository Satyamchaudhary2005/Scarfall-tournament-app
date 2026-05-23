'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clanApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { Mail, Check, X, ChevronLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ClanInvitesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['clan-invites'],
    queryFn: () => clanApi.getMyInvites(),
    enabled: isAuthenticated,
  });

  const acceptMutation = useMutation({
    mutationFn: (inviteId: string) => clanApi.acceptInvite(inviteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clan-invites'] });
      toast.success(data.message || 'Joined clan!');
      router.push('/clans');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to accept invite'),
  });

  const declineMutation = useMutation({
    mutationFn: (inviteId: string) => clanApi.declineInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-invites'] });
      toast.success('Invite declined');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to decline invite'),
  });

  const invites = data?.invites || [];

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Mail className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-black text-white">Clan Invites</h1>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-card border border-card-border animate-pulse" />
              ))}
            </div>
          ) : invites.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/50 mb-2">No pending invites</h3>
              <p className="text-white/30">Clan leaders will send you invites here</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black shrink-0"
                        style={{
                          backgroundColor: `${invite.clan.color || '#ff1f1f'}20`,
                          color: invite.clan.color || '#ff1f1f',
                        }}
                      >
                        {invite.clan.tag[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white">
                          {invite.clan.name}
                        </h3>
                        <p className="text-sm text-white/50">
                          [{invite.clan.tag}] · {invite.clan.points} Clan XP · {invite.clan._count.members} members
                        </p>
                        <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Invited by {invite.inviter.username}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => declineMutation.mutate(invite.id)}
                          loading={declineMutation.isPending}
                          className="!text-red-400 !border-red-500/30 hover:!bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(invite.id)}
                          loading={acceptMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
