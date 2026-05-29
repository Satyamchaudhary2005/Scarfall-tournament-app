'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  Download,
  Smartphone,
  Monitor,
  Check,
  Sparkles,
  Zap,
  Award,
  Gamepad2,
  Shield,
  Radio,
  Swords,
  Users,
  Trophy,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const platforms = [
  {
    id: 'android',
    name: 'Android',
    icon: Smartphone,
    description: 'APK file — compatible with all Android devices running Android 8.0+',
    version: 'v1.0.0',
    size: '4 MB',
    status: 'available' as const,
    actionLabel: 'Download APK',
  },
  {
    id: 'ios',
    name: 'iOS',
    icon: Smartphone,
    description: 'iPhone & iPad — available on the App Store',
    version: 'v1.0.0',
    size: '—',
    status: 'soon' as const,
    actionLabel: 'Coming Soon',
  },
  {
    id: 'web',
    name: 'Web App',
    icon: Monitor,
    description: 'Play directly in your browser — no download required',
    version: 'Latest',
    size: '—',
    status: 'available' as const,
    actionLabel: 'Open Web App',
    href: '/tournaments',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Real-Time Sync',
    description: 'Live match updates, instant notifications, and real-time bracket progression.',
  },
  {
    icon: Award,
    title: 'Tournaments On-the-Go',
    description: 'Register, compete, and track your standings from anywhere.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your account and transactions are protected with enterprise-grade security.',
  },
  {
    icon: Radio,
    title: 'Live Spectating',
    description: 'Watch ongoing matches and follow your favourite players in real time.',
  },
  {
    icon: Gamepad2,
    title: 'Multi-Game Support',
    description: 'Compete across BGMI, Free Fire, Valorant, and more — all in one app.',
  },
  {
    icon: Swords,
    title: 'Quick Matchmaking',
    description: 'Join tournaments with a single tap and get matched instantly.',
  },
];

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);

  const apkUrl = '/downloads/tournax1.apk';

  const handleDownloadAPK = () => {
    const a = document.createElement('a');
    a.href = apkUrl;
    a.download = 'tournax1.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + '/download');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface to-surface/95" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hero-glow opacity-60" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Download App</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6"
            >
              Take TournaX
              <br />
              <span className="text-gradient">Anywhere</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              Download the official TournaX app and never miss a tournament.
              Compete, track, and win — right from your pocket.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-white/30"
            >
              Version 1.0.0 &middot; 4 MB &middot; Android 8.0+
            </motion.p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* ─── Platform Cards ─── */}
      <section className="relative -mt-16 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
          >
            {platforms.map((platform, i) => {
              const Icon = platform.icon;
              const isAvailable = platform.status === 'available';

              return (
                <motion.div
                  key={platform.id}
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={cn(
                    'relative group rounded-2xl border p-6 sm:p-8 text-center transition-all duration-300',
                    isAvailable
                      ? 'bg-white/[0.03] border-white/5 hover:border-primary/20 hover:shadow-glow-red card-hover-effect'
                      : 'bg-white/[0.015] border-white/5 opacity-60 cursor-not-allowed'
                  )}
                >
                  {!isAvailable && (
                    <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary uppercase tracking-wider">
                      Soon
                    </div>
                  )}

                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 transition-colors duration-300',
                      isAvailable
                        ? 'bg-primary/10 text-primary group-hover:bg-primary/20'
                        : 'bg-white/5 text-white/30'
                    )}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{platform.name}</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">
                    {platform.description}
                  </p>

                  <div className="flex items-center justify-center gap-4 text-xs text-white/30 mb-6">
                    <span>{platform.version}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{platform.size}</span>
                  </div>

                  {isAvailable ? (
                    platform.href ? (
                      <Link href={platform.href}>
                        <Button className="w-full">
                          <Download className="w-4 h-4" />
                          {platform.actionLabel}
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full" onClick={handleDownloadAPK}>
                        <Download className="w-4 h-4" />
                        {platform.actionLabel}
                      </Button>
                    )
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      {platform.actionLabel}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Share link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-primary transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Link copied!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Copy download link</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── QR Section ─── */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex flex-col lg:flex-row items-center gap-8 p-8 sm:p-12">
              <div className="flex-shrink-0">
                <div className="w-36 h-36 rounded-2xl bg-white p-2 flex items-center justify-center">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.origin + apkUrl : ''}
                    size={130}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L"
                  />
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Scan to Download
                </h3>
                <p className="text-white/50 leading-relaxed mb-6 max-w-lg">
                  Point your camera at the QR code to download the TournaX APK
                  directly on your phone. No app store needed.
                </p>
                <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Check className="w-3.5 h-3.5 text-green-400" /> Android 8.0+
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Check className="w-3.5 h-3.5 text-green-400" /> 4 MB
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Check className="w-3.5 h-3.5 text-green-400" /> No sign-up required
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="section-heading">Why Download the App?</h2>
            <p className="section-subheading">
              Everything you love about TournaX, now in your pocket.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="relative group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-primary/10 hover:bg-white/[0.04]"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-10 sm:p-14 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="relative z-10">
              <Trophy className="w-10 h-10 text-primary mx-auto mb-5" />
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Ready to Compete?
              </h2>
              <p className="text-white/50 leading-relaxed mb-8 max-w-lg mx-auto">
                Download the app and join thousands of players battling for glory,
                rankings, and prizes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/tournaments">
                  <Button size="lg" className="text-base px-10">
                    <Trophy className="w-5 h-5" />
                    Browse Tournaments
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="secondary" size="lg" className="text-base px-10">
                    <Users className="w-5 h-5" />
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
