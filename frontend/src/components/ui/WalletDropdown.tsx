'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi, razorpayApi } from '@/services/api';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Plus, Minus, Banknote, Clock, TrendingUp, TrendingDown, Sparkles, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabIcons: Record<string, any> = {
  balance: Banknote,
  deposit: TrendingUp,
  withdraw: TrendingDown,
  history: Clock,
};

function WalletLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="#ff1f1f" strokeWidth="1.5" fill="rgba(255,31,31,0.1)" />
      <rect x="15" y="10" width="5" height="4" rx="1.5" fill="#ff1f1f" />
      <path d="M2 11h5c1.5 0 3 1 3 3s-1.5 3-3 3H2" stroke="#ff1f1f" strokeWidth="1.2" fill="none" opacity="0.5" />
    </svg>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const duration = 600;
    const steps = 20;
    const step = (value - display) / steps;
    let current = display;
    const timer = setInterval(() => {
      current += step;
      if ((step > 0 && current >= value) || (step < 0 && current <= value)) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

export function WalletDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'balance' | 'deposit' | 'withdraw' | 'history'>('balance');
  const [amount, setAmount] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet(),
    refetchInterval: 30000,
  });

  const [razorpayLoading, setRazorpayLoading] = useState(false);

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
                setActiveTab('balance');
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => {
                reject(new Error('Payment cancelled'));
              },
            },
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
    onError: () => {
      setRazorpayLoading(false);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => walletApi.withdraw(Number(amount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setAmount('');
      setActiveTab('balance');
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveTab('balance');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && (activeTab === 'deposit' || activeTab === 'withdraw')) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, activeTab]);

  const balance = walletData?.wallet?.balance ?? 0;
  const transactions = walletData?.wallet?.transactions ?? [];
  const isPending = razorpayLoading || depositMutation.isPending || withdrawMutation.isPending;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/[0.07] transition-all duration-200 group relative"
      >
        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
          <WalletLogo />
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] text-red-400/50 font-medium tracking-widest uppercase">Wallet</span>
          <span className="font-bold text-red-400 group-hover:text-red-300 transition-colors -mt-0.5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1 h-4">
                <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            ) : (
              <>₹<AnimatedNumber value={balance} /></>
            )}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="fixed left-4 right-4 top-24 z-50 overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px]"
          >
            {/* Outer glass container */}
            <div className="relative bg-gradient-to-b from-[#0d0d1a]/95 to-[#111128]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
              {/* Animated gradient orbs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-700/5 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-red-500/3 rounded-full blur-3xl" />

              {/* Header section */}
              <div className="relative px-3 sm:px-5 pt-4 sm:pt-5 pb-4">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 mb-4 overflow-x-auto">
                  {(['balance', 'deposit', 'withdraw', 'history'] as const).map((tab) => {
                    const Icon = tabIcons[tab];
                    return (
                      <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setAmount(''); }}
                        className={cn(
                          'flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative',
                          activeTab === tab
                            ? 'text-white'
                            : 'text-white/30 hover:text-white/50'
                        )}
                      >
                        {activeTab === tab && (
                          <motion.div
                            layoutId="walletTab"
                            className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-red-600/10 rounded-lg border border-red-500/20 shadow-lg shadow-red-500/10"
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" />
                          {tab === 'balance' ? 'Wallet' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Balance view */}
                {activeTab === 'balance' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative text-center py-2"
                  >
                    <p className="text-xs text-white/30 font-medium tracking-[0.2em] uppercase mb-3">Total Balance</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        ₹<AnimatedNumber value={balance} />
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2.5 max-w-[240px] mx-auto">
                      <button
                        onClick={() => setActiveTab('withdraw')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-400/30 transition-all text-xs font-semibold text-white/60 hover:text-red-400 flex items-center justify-center gap-1.5 group"
                      >
                        <Minus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        Withdraw
                      </button>
                      <button
                        onClick={() => setActiveTab('deposit')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 transition-all text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 group"
                      >
                        <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                        Deposit
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Deposit / Withdraw */}
                {(activeTab === 'deposit' || activeTab === 'withdraw') && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg',
                        activeTab === 'deposit'
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
                          : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                      )}>
                        {activeTab === 'deposit' ? <Plus className="w-5 h-5 text-white" /> : <Minus className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{activeTab === 'deposit' ? 'Add Funds' : 'Cash Out'}</h3>
                        <p className="text-[11px] text-white/40">
                          {activeTab === 'deposit' ? 'Add money to your gaming wallet' : `Available: ₹${balance.toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="relative mb-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold text-2xl z-10">₹</span>
                      <input
                        ref={inputRef}
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={1}
                        max={activeTab === 'withdraw' ? balance : undefined}
                        className={cn(
                          'w-full pl-10 pr-4 py-3.5 rounded-xl text-white text-2xl font-bold outline-none transition-all placeholder:text-white/[0.08]',
                          'bg-white/[0.04] border focus:bg-white/[0.07]',
                          activeTab === 'deposit'
                            ? 'border-white/10 focus:border-green-400/40'
                            : 'border-white/10 focus:border-red-400/40'
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[100, 500, 1000, 5000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setAmount(String(amt))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-xs font-bold border transition-all duration-150',
                            Number(amount) === amt
                              ? activeTab === 'deposit'
                                ? 'border-green-400/40 text-green-400 bg-green-500/10 shadow-lg shadow-green-500/10'
                                : 'border-red-400/40 text-red-400 bg-red-500/10 shadow-lg shadow-red-500/10'
                              : 'border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/20 bg-white/[0.02]'
                          )}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>

                    <Button
                      className="w-full h-11 rounded-xl font-bold text-sm"
                      variant={activeTab === 'deposit' ? 'primary' : 'secondary'}
                      onClick={() => (activeTab === 'deposit' ? depositMutation : withdrawMutation).mutate()}
                      disabled={!amount || Number(amount) <= 0 || (activeTab === 'withdraw' && Number(amount) > balance) || isPending}
                      loading={isPending}
                    >
                      {activeTab === 'deposit' ? (
                        <><Plus className="w-4 h-4" /> Add ₹{Number(amount || 0).toLocaleString()}</>
                      ) : (
                        <><Minus className="w-4 h-4" /> Withdraw ₹{Number(amount || 0).toLocaleString()}</>
                      )}
                    </Button>

                    {(depositMutation.isError || withdrawMutation.isError) && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 text-center mt-2">
                        {((depositMutation.error || withdrawMutation.error) as any)?.message || 'Transaction failed'}
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* History */}
                {activeTab === 'history' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Transactions</h3>
                        <p className="text-[11px] text-white/40">Your recent wallet activity</p>
                      </div>
                    </div>

                    <div className="space-y-0.5 max-h-48 sm:max-h-60 overflow-y-auto -mx-1 pr-1 scrollbar-thin">
                      {transactions.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white/15" />
                          </div>
                          <p className="text-sm text-white/30 font-semibold">No transactions yet</p>
                          <p className="text-xs text-white/15 mt-1">Deposit money to see your activity here</p>
                        </div>
                      ) : (
                        transactions.map((tx, i) => (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.025 }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-default group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                                tx.type === 'DEPOSIT' && 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 text-green-400',
                                tx.type === 'WITHDRAW' && 'bg-gradient-to-br from-red-500/20 to-rose-500/10 text-red-400',
                                (tx.type === 'TOURNAMENT_WINNING' || tx.type === 'TOURNAMENT_FEE') && 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 text-blue-400',
                                tx.type === 'CLAN_FEE' && 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 text-purple-400',
                              )}>
                                {tx.type === 'DEPOSIT' && <TrendingUp className="w-4 h-4" />}
                                {tx.type === 'WITHDRAW' && <TrendingDown className="w-4 h-4" />}
                                {tx.type === 'TOURNAMENT_WINNING' && <Trophy className="w-4 h-4" />}
                                {tx.type === 'TOURNAMENT_FEE' && <Swords className="w-4 h-4" />}
                                {tx.type === 'CLAN_FEE' && <Users className="w-4 h-4" />}
                                {!['DEPOSIT', 'WITHDRAW', 'TOURNAMENT_WINNING', 'TOURNAMENT_FEE', 'CLAN_FEE'].includes(tx.type) && <ArrowDownUp className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white/90 capitalize">
                                  {tx.type === 'TOURNAMENT_WINNING' ? 'Tournament Winning'
                                    : tx.type === 'TOURNAMENT_FEE' ? 'Tournament Fee'
                                    : tx.type === 'CLAN_FEE' ? 'Clan Fee'
                                    : tx.type.toLowerCase()}
                                </p>
                                <p className="text-[10px] text-white/25 mt-0.5">
                                  {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                            </div>
                            <span className={cn(
                              'text-sm font-bold tracking-tight',
                              (tx.type === 'DEPOSIT' || tx.type === 'TOURNAMENT_WINNING') && 'text-green-400',
                              (tx.type === 'WITHDRAW' || tx.type === 'TOURNAMENT_FEE' || tx.type === 'CLAN_FEE') && 'text-red-400',
                            )}>
                              {(tx.type === 'DEPOSIT' || tx.type === 'TOURNAMENT_WINNING') ? '+' : '-'}₹{tx.amount.toLocaleString()}
                            </span>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer accent */}
              <div className="relative px-5 py-2.5 bg-white/[0.02] border-t border-white/[0.04]">
                <div className="flex items-center justify-center gap-4 text-[10px] text-white/20">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Instant</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> 24/7</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Trophy(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C5 4 6 3 6 3s1 1 1.5 1A2.5 2.5 0 0 1 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C19 4 18 3 18 3s-1 1-1.5 1A2.5 2.5 0 0 0 18 9z"/><path d="M4 22h16"/><path d="M10 22V8M14 22V8"/><path d="M12 8V2"/><path d="M8 2h8"/></svg>; }
function Swords(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/></svg>; }
function Users(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
