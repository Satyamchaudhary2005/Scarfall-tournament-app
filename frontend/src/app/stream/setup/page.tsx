'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Badge, Button } from '@/components/ui';
import { motion } from 'framer-motion';
import {
  Monitor, Eye, EyeOff, Image, Type, Users, Trophy,
  Grid3X3, Copy, CheckCircle, HelpCircle, Youtube,
  ExternalLink, Settings2, PanelRightOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ELEMENTS = [
  { id: 'logo', label: 'Tournament Logo', icon: Image, defaultOn: true },
  { id: 'title', label: 'Match Title', icon: Type, defaultOn: true },
  { id: 'players', label: 'Player Names', icon: Users, defaultOn: false },
  { id: 'score', label: 'Scoreboard', icon: Trophy, defaultOn: true },
  { id: 'grid', label: 'Grid Overlay', icon: Grid3X3, defaultOn: false },
];

export default function StreamSetupPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(ELEMENTS.map((e) => [e.id, e.defaultOn]))
  );
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => setToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + '/stream/setup');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">Stream Setup</h1>
              <p className="text-sm text-white/50 mt-0.5">Configure your chroma key overlay for live broadcasts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Green Screen Preview */}
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PanelRightOpen className="w-4 h-4 text-white/40" />
                    <span className="text-sm font-semibold text-white">Preview</span>
                  </div>
                  <Badge variant="success">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      16:9 Chroma Key
                    </span>
                  </Badge>
                </div>

                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10"
                  style={{ backgroundColor: '#00FF00' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[10px] font-mono text-black/20 tracking-widest uppercase">
                        Chroma Key Area
                      </p>
                    </div>
                  </div>

                  {/* Toggleable overlay elements */}
                  {toggles.logo && (
                    <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <img src="/logo.png" alt="TournaX" className="w-8 h-8 object-contain" />
                      <span className="text-sm font-bold text-white">TournaX</span>
                    </div>
                  )}

                  {toggles.title && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center bg-black/40 backdrop-blur-sm px-6 py-3 rounded-xl">
                      <p className="text-xs text-white/60 uppercase tracking-wider">Semi Finals</p>
                      <h3 className="text-xl font-black text-white mt-0.5">BGMI Clash Squad</h3>
                    </div>
                  )}

                  {toggles.players && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <Users className="w-4 h-4 text-white/60" />
                      <span className="text-xs font-semibold text-white">Team Alpha vs Team Beta</span>
                    </div>
                  )}

                  {toggles.score && (
                    <div className="absolute inset-0 flex items-center justify-center gap-12">
                      <div className="text-center bg-black/40 backdrop-blur-sm px-8 py-4 rounded-xl">
                        <p className="text-xs text-white/50 uppercase tracking-wider">Alpha</p>
                        <p className="text-5xl font-black text-white mt-1">12</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-white/30">VS</p>
                      </div>
                      <div className="text-center bg-black/40 backdrop-blur-sm px-8 py-4 rounded-xl">
                        <p className="text-xs text-white/50 uppercase tracking-wider">Beta</p>
                        <p className="text-5xl font-black text-white mt-1">8</p>
                      </div>
                    </div>
                  )}

                  {toggles.grid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-white/10" />
                      ))}
                    </div>
                  )}

                  {/* Chroma key indicator */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-green-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      #00FF00
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4 text-white/40" />
                  <h3 className="text-sm font-semibold text-white">Overlay Elements</h3>
                </div>
                <div className="space-y-2">
                  {ELEMENTS.map((el) => {
                    const Icon = el.icon;
                    const isOn = toggles[el.id];
                    return (
                      <button
                        key={el.id}
                        onClick={() => toggle(el.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                          isOn
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{el.label}</span>
                        {isOn ? (
                          <Eye className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-white/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-4 h-4 text-white/40" />
                  <h3 className="text-sm font-semibold text-white">OBS Setup</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-green-400">1</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Add Browser Source</p>
                      <p className="text-[11px] text-white/40 mt-0.5">Add this page as a browser source in OBS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-green-400">2</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Set Chroma Key</p>
                      <p className="text-[11px] text-white/40 mt-0.5">Apply a chroma key filter on the source, pick the green color (#00FF00)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-green-400">3</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Adjust Settings</p>
                      <p className="text-[11px] text-white/40 mt-0.5">Tune similarity, smoothness, and opacity in the chroma key filter</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Youtube className="w-4 h-4 text-white/40" />
                  <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
                </div>
                <div className="space-y-2">
                  <Button variant="primary" className="w-full justify-center" onClick={handleCopy}>
                    {copied ? (
                      <><CheckCircle className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy Page URL</>
                    )}
                  </Button>
                  <Button variant="secondary" className="w-full justify-center" onClick={() => window.open('https://obsproject.com', '_blank')}>
                    <ExternalLink className="w-4 h-4" /> Download OBS
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
