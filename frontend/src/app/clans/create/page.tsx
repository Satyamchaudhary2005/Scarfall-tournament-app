'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { clanApi } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Input, Card } from '@/components/ui';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function CreateClanPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', tag: '', description: '', color: '#ff1f1f' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => clanApi.create(form),
    onSuccess: (data) => {
      toast.success('Clan created!');
      router.push(`/clans/${data.clan.id}`);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create clan'),
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.length < 3) errs.name = 'Name must be at least 3 characters';
    if (form.tag.length < 2 || form.tag.length > 6) errs.tag = 'Tag must be 2-6 characters';
    if (!/^[A-Z0-9]+$/.test(form.tag)) errs.tag = 'Tag must be uppercase alphanumeric';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/clans" className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to Clans
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white">Create a Clan</h1>
              <p className="text-white/50 text-sm mt-1">Start your own competitive squad</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Clan Name"
                placeholder="e.g. Phoenix Rising"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                required
              />
              <Input
                label="Clan Tag"
                placeholder="e.g. PHNX"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase() })}
                error={errors.tag}
                required
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Description (optional)</label>
                <textarea
                  className="input-base min-h-[100px] resize-none"
                  placeholder="Tell players about your clan..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Clan Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                  />
                  <span className="text-sm text-white/40">{form.color}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={mutation.isPending}>
                Create Clan
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
