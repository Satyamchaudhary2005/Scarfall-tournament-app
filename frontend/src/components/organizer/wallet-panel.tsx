'use client';

import { useAuthStore } from '@/store/authStore';
import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi, razorpayApi } from '@/services/api';
import { Wallet, Lock, TrendingUp, IndianRupee, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WalletPanel() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showDeposit, setShowDeposit] = useState(false);
  const [amount, setAmount] = useState('');
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet(),
  });

  const w = walletData?.wallet as any;
  const wallet = {
    balance: w?.balance ?? 0,
    locked: w?.lockedAmount ?? 0,
    pendingEarnings: w?.pendingEarnings ?? 0,
    totalRevenue: w?.totalRevenue ?? 0,
  };

  const depositMutation = useMutation({
    mutationFn: async () => {
      setRazorpayLoading(true);
      try {
        const order = await razorpayApi.createOrder(Math.round(Number(amount) * 100));
        return new Promise<void>((resolve, reject) => {
          const rzp = new (window as any).Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'TournaX',
            description: 'Wallet Deposit',
            order_id: order.order_id,
            handler: async (response: any) => {
              try {
                await razorpayApi.verifyPayment(response);
                queryClient.invalidateQueries({ queryKey: ['wallet'] });
                setAmount('');
                setShowDeposit(false);
                resolve();
              } catch (err) { reject(err); }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
            theme: { color: '#ff1f1f' },
          });
          rzp.on('payment.failed', (response: any) => {
            reject(new Error(response.error?.description || 'Payment failed'));
          });
          rzp.open();
        });
      } finally {
        setRazorpayLoading(false);
      }
    },
  });

  const stats = [
    { label: 'Available', value: wallet.balance, icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: 'Locked', value: wallet.locked, icon: Lock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Pending', value: wallet.pendingEarnings, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Revenue', value: wallet.totalRevenue, icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  ];

  return (
    <div className="bg-card border border-card-border rounded-xl">
      <div className="p-4 border-b border-card-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Wallet</p>
            <p className="text-[10px] text-white/40">{user?.username}</p>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${stat.bg} ${stat.border} border rounded-lg p-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-xs text-white/50">{stat.label}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={stat.value}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-bold ${stat.color}`}
              >
                ₹{stat.value.toLocaleString()}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div className="p-3 pt-0">
        {showDeposit ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-bold text-lg z-10">₹</span>
              <input
                ref={inputRef}
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                className="w-full pl-8 pr-3 py-2.5 rounded-lg text-white text-base font-bold outline-none bg-white/[0.04] border border-white/10 focus:border-primary/40 transition-all placeholder:text-white/[0.08]"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[100, 500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    Number(amount) === amt
                      ? 'border-primary/40 text-primary bg-primary/10'
                      : 'border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/20 bg-white/[0.02]'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeposit(false); setAmount(''); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white/50 hover:text-white/70 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => depositMutation.mutate()}
                disabled={!amount || Number(amount) <= 0 || razorpayLoading}
                className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary hover:bg-primary-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {razorpayLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Plus className="w-3.5 h-3.5" /> Add Funds</>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowDeposit(true)}
            className="w-full py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Funds
          </button>
        )}
      </div>
    </div>
  );
}
