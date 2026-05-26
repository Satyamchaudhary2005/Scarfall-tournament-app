'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Check, Trophy, IndianRupee,
  Swords, Gamepad2, Target, Zap, Shield, Image, Settings,
  Timer, Users, Map, CheckCircle, Share2, Sparkles,
  Monitor, DollarSign, Lock, Unlock, BarChart3, Crosshair,
  LayoutList, ScrollText, ArrowRight, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { RevenueBreakdown, PerKillCalculator } from './revenue-panel';
import { StageBuilder } from './stage-builder';

interface StageData {
  id: string;
  name: string;
  type: string;
  teamsCount: number;
  qualifyingTeams: number;
  eliminationCount: number;
  teamsPerLobby: number;
  matchesCount: number;
  scoring: { killPoints: number; placementPoints: number[]; qualificationRule: string; qualificationValue: number };
  mapRotation: string[];
  startDate: string;
}

interface Draft {
  name: string;
  game: string;
  banner: string;
  description: string;
  type: string;
  entryType: 'FREE' | 'PAID';
  entryFee: number;
  maxTeams: number;
  prizePool: number;
  prizePoolPercent: number;
  sponsoredPrize: boolean;
  walletLock: number;
  roomSize: number;
  matchMap: string;
  teamType: string;
  matchTime: string;
  numMatches: number;
  matchRotation: string;
  scoringSystem: string;
  matchSchedule: string;
  stages: StageData[];
  rewardPerKill: number;
  maxKillReward: number;
  matchCount: number;
  killValidation: string;
  placementPoints: number[];
  killPoints: number;
  scoringPreset: string;
  maps: string;
  timing: string;
  teamTypeVal: string;
  autoDistribution: boolean;
  roomPasswordVisibility: string;
  ocrValidation: boolean;
  youtubeUrl: string;
  sponsorBanner: string;
  obsOverlay: boolean;
  featuredMatch: boolean;
  ocrVerification: boolean;
  antiCheat: boolean;
  duplicateDetection: boolean;
  manualApproval: boolean;
  autoQualification: boolean;
}

const initialDraft: Draft = {
  name: '', game: '', banner: '', description: '', type: 'SINGLE',
  entryType: 'FREE', entryFee: 0, maxTeams: 50, prizePool: 0, prizePoolPercent: 80,
  sponsoredPrize: false, walletLock: 0,
  roomSize: 4, matchMap: '', teamType: 'SOLO', matchTime: '60',
  numMatches: 3, matchRotation: 'FIXED', scoringSystem: 'POINTS', matchSchedule: '',
  stages: [],
  rewardPerKill: 5, maxKillReward: 500, matchCount: 1, killValidation: 'OCR',
  placementPoints: [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0],
  killPoints: 1, scoringPreset: 'STANDARD',
  maps: '', timing: '60', teamTypeVal: 'SOLO', autoDistribution: true,
  roomPasswordVisibility: 'REGISTERED', ocrValidation: false,
  youtubeUrl: '', sponsorBanner: '', obsOverlay: false, featuredMatch: false,
  ocrVerification: false, antiCheat: false, duplicateDetection: true,
  manualApproval: false, autoQualification: true,
};

const steps = [
  { id: 'basics', label: 'Basics', icon: Trophy },
  { id: 'entry', label: 'Entry & Prize', icon: IndianRupee },
  { id: 'format', label: 'Format', icon: Swords },
  { id: 'scoring', label: 'Scoring', icon: BarChart3 },
  { id: 'room', label: 'Room Settings', icon: Settings },
  { id: 'stream', label: 'Stream & Media', icon: Monitor },
  { id: 'moderation', label: 'Security', icon: Shield },
  { id: 'review', label: 'Review', icon: CheckCircle },
];

const tournamentTypes = [
  { id: 'SINGLE', label: 'Single Match', desc: 'Quick standalone competitive room', format: 'Single lobby, one match determines winner', recommend: 'Best for 1v1 or small team matches', icon: Crosshair },
  { id: 'MULTI', label: 'Multi Match', desc: 'Multiple matches with combined leaderboard', format: 'Teams play multiple rounds, cumulative scoring', recommend: 'Ideal for league-style tournaments', icon: LayoutList },
  { id: 'MULTI_STAGE', label: 'Multi Stage', desc: 'Professional qualification-based tournament', format: 'Multiple stages with qualifiers, eliminations, finals', recommend: 'For large-scale competitive events', icon: Trophy },
  { id: 'PER_KILL', label: 'Per Kill Challenge', desc: 'Kill-based reward tournaments', format: 'Every kill earns money', recommend: 'Best for action-packed BR games', icon: Target },
];

const games = [
  { value: 'BGMI', label: 'BGMI' },
  { value: 'Free Fire', label: 'Free Fire' },
  { value: 'CODM', label: 'Call of Duty Mobile' },
  { value: 'Valorant', label: 'Valorant' },
  { value: 'PUBG PC', label: 'PUBG PC' },
  { value: 'CS2', label: 'CS2' },
  { value: 'Others', label: 'Other Game' },
];

const scoringPresets = [
  { id: 'STANDARD', label: 'Standard', points: [15, 12, 10, 8, 6, 4, 2, 1], kill: 1 },
  { id: 'BATTLE_ROYALE', label: 'Battle Royale', points: [20, 15, 12, 10, 8, 6, 4, 2, 1, 0], kill: 1 },
  { id: 'COMPETITIVE', label: 'Competitive', points: [25, 20, 16, 13, 11, 9, 7, 5, 3, 1], kill: 2 },
  { id: 'AGGRESSIVE', label: 'Aggressive', points: [10, 8, 6, 5, 4, 3, 2, 1], kill: 3 },
  { id: 'FLAT', label: 'Flat', points: [5, 4, 3, 2, 1, 0, 0, 0], kill: 1 },
];

export function CreateWizard() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [publishing, setPublishing] = useState(false);

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const totalCollection = draft.entryFee * draft.maxTeams;
  const prizePoolAmount = draft.entryType === 'PAID'
    ? Math.round(totalCollection * (draft.prizePoolPercent / 100))
    : draft.prizePool;

  function validateStep(idx: number): boolean {
    switch (idx) {
      case 0: return !!draft.name && !!draft.game && !!draft.type;
      case 1:
        if (draft.entryType === 'PAID') return draft.entryFee > 0 && draft.maxTeams > 0;
        if (draft.sponsoredPrize) return draft.prizePool > 0;
        return true;
      case 2:
        if (draft.type === 'SINGLE') return !!draft.matchMap;
        if (draft.type === 'MULTI_STAGE') return draft.stages.length > 0;
        if (draft.type === 'PER_KILL') return draft.rewardPerKill > 0;
        return true;
      default: return true;
    }
  }

  function nextStep() { if (validateStep(step)) setStep((s) => Math.min(s + 1, steps.length - 1)); }
  function prevStep() { setStep((s) => Math.max(s - 1, 0)); }

  async function handlePublish() {
    setPublishing(true);
    try {
      const body: Record<string, unknown> = {
        title: draft.name,
        game: draft.game,
        description: draft.description,
        mode: draft.teamType || 'SOLO',
        format: draft.type === 'MULTI' ? 'MULTI_ROUND' : draft.type === 'MULTI_STAGE' ? 'MULTI_STAGE' : 'SINGLE',
        slots: draft.maxTeams,
        entryFee: draft.entryType === 'PAID' ? String(draft.entryFee) : '0',
        prizePool: String(prizePoolAmount),
        mapName: draft.matchMap,
        bannerUrl: draft.banner || undefined,
        rules: draft.description,
        startsAt: new Date().toISOString(),
      };

      if (draft.type === 'MULTI') {
        body.totalRounds = draft.numMatches;
        body.killPoints = draft.killPoints;
        body.placementPoints = draft.placementPoints;
      }

      if (draft.type === 'PER_KILL') {
        body.killPoints = draft.rewardPerKill;
        body.killReward = draft.rewardPerKill;
        body.maxKillReward = draft.maxKillReward;
        body.totalRounds = draft.matchCount;
      }

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to create');

      if (draft.type === 'MULTI_STAGE' && draft.stages.length > 0) {
        const tournament = await res.json();
        for (const stage of draft.stages) {
          await fetch(`/api/tournaments/${tournament.id}/stages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stageNumber: draft.stages.indexOf(stage) + 1,
              name: stage.name,
              type: stage.type,
              teamsCount: stage.teamsCount,
              qualifyingTeams: stage.qualifyingTeams,
              eliminationCount: stage.eliminationCount,
              lobbyCount: Math.ceil(stage.teamsCount / stage.teamsPerLobby),
              teamsPerLobby: stage.teamsPerLobby,
              matchesCount: stage.matchesCount,
              formatType: 'BATTLEROYALE',
              scoringRules: stage.scoring,
            }),
          });
        }
      }

      toast.success('Tournament created successfully!');
      setDraft(initialDraft);
      setStep(0);
    } catch {
      toast.error('Failed to create tournament');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <StepIndicator current={step} steps={steps} onSelect={setStep} />

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <StepBasics draft={draft} update={update} />}
            {step === 1 && <StepEntryPrize draft={draft} update={update} prizePoolAmount={prizePoolAmount} totalCollection={totalCollection} />}
            {step === 2 && <StepFormat draft={draft} update={update} />}
            {step === 3 && <StepScoring draft={draft} update={update} />}
            {step === 4 && <StepRoom draft={draft} update={update} />}
            {step === 5 && <StepStream draft={draft} update={update} />}
            {step === 6 && <StepModeration draft={draft} update={update} />}
            {step === 7 && <StepReview draft={draft} prizePoolAmount={prizePoolAmount} totalCollection={totalCollection} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-card-border">
        <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        {step < steps.length - 1 ? (
          <Button onClick={nextStep} disabled={!validateStep(step)}>
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handlePublish} loading={publishing} className="relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary via-primary-600 to-primary"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <span className="relative flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish Tournament'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current, steps, onSelect }: {
  current: number;
  steps: { id: string; label: string; icon: React.FC<{ className?: string }> }[];
  onSelect: (i: number) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-1 min-w-max pb-1">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === current;
          const isDone = i < current;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : isDone
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/[0.07]'
              }`}
            >
              {isDone ? (
                <Check className="w-3 h-3" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepBasics({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Tournament Basics</h2>
        <p className="text-sm text-white/40">Set up the core details of your tournament</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Tournament Name" value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="Enter tournament name" />
        <Select
          label="Game"
          value={draft.game}
          onChange={(v) => update('game', v)}
          options={games}
        />
      </div>

      <Input label="Banner URL (optional)" value={draft.banner} onChange={(e) => update('banner', e.target.value)} placeholder="https://example.com/banner.jpg" />
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
        <textarea
          value={draft.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe your tournament, rules, and what players can expect..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 min-h-[100px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-3">Tournament Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tournamentTypes.map((t) => {
            const Icon = t.icon;
            const selected = draft.type === t.id;
            return (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => update('type', t.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selected
                    ? 'bg-primary/10 border-primary/30 shadow-glow-red-sm'
                    : 'bg-card border-card-border hover:border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${
                  selected ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-white/40'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">{t.label}</p>
                <p className="text-xs text-white/50 mb-2">{t.desc}</p>
                <p className="text-[10px] text-white/30 leading-relaxed">{t.format}</p>
                <div className={`mt-2 text-[10px] font-medium ${
                  selected ? 'text-primary' : 'text-white/30'
                }`}>
                  {t.recommend}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepEntryPrize({ draft, update, prizePoolAmount, totalCollection }: {
  draft: Draft; update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  prizePoolAmount: number; totalCollection: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Entry & Prize System</h2>
        <p className="text-sm text-white/40">Configure how players enter and how prizes are distributed</p>
      </div>

      <div className="flex gap-3">
        {(['FREE', 'PAID'] as const).map((type) => (
          <motion.button
            key={type}
            whileTap={{ scale: 0.98 }}
            onClick={() => update('entryType', type)}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              draft.entryType === type
                ? 'bg-primary/10 border-primary/30'
                : 'bg-card border-card-border hover:border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mx-auto mb-2 ${
              draft.entryType === type ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-white/40'
            }`}>
              {type === 'FREE' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <p className="text-sm font-semibold text-white text-center">{type === 'FREE' ? 'Free Entry' : 'Paid Entry'}</p>
            <p className="text-xs text-white/40 text-center mt-1">
              {type === 'FREE' ? 'No entry fee required' : 'Players pay to enter'}
            </p>
          </motion.button>
        ))}
      </div>

      {draft.entryType === 'PAID' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Entry Fee (₹)" type="number" value={String(draft.entryFee)} onChange={(e) => update('entryFee', Number(e.target.value))} icon={<IndianRupee className="w-4 h-4" />} />
            <Input label="Maximum Teams" type="number" value={String(draft.maxTeams)} onChange={(e) => update('maxTeams', Number(e.target.value))} icon={<Users className="w-4 h-4" />} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Prize Pool Percentage: {draft.prizePoolPercent}%</label>
            <input
              type="range"
              min={50}
              max={95}
              value={draft.prizePoolPercent}
              onChange={(e) => update('prizePoolPercent', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-glow-red-sm"
            />
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>50% (Low)</span>
              <span>95% (High)</span>
            </div>
          </div>
          <RevenueBreakdown entryFee={draft.entryFee} teams={draft.maxTeams} prizePoolPercent={draft.prizePoolPercent} show />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sponsored"
              checked={draft.sponsoredPrize}
              onChange={(e) => update('sponsoredPrize', e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/30"
            />
            <label htmlFor="sponsored" className="text-sm text-white/70">Add Sponsored Prize Pool</label>
          </div>

          {draft.sponsoredPrize && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Input label="Prize Pool Amount (₹)" type="number" value={String(draft.prizePool)} onChange={(e) => update('prizePool', Number(e.target.value))} icon={<IndianRupee className="w-4 h-4" />} />
              <div className={`rounded-lg p-3 border ${
                draft.prizePool > 12500
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Wallet Balance</span>
                  <span className="font-bold text-white">₹12,500</span>
                </div>
                {draft.prizePool > 12500 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 mt-2">
                    Insufficient wallet balance. Required: ₹{draft.prizePool.toLocaleString()}
                  </motion.p>
                )}
              </div>
              <p className="text-xs text-white/30">
                Prize pool amount will be locked upon tournament creation.
              </p>
            </motion.div>
          )}

          {draft.sponsoredPrize && draft.prizePool > 0 && draft.prizePool <= 12500 && (
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">Prize Pool Lock</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">To be locked</span>
                <span className="text-lg font-bold text-yellow-400">₹{draft.prizePool.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/30 mt-1">
                <span>Available after lock: ₹{(12500 - draft.prizePool).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepFormat({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Format Configuration</h2>
        <p className="text-sm text-white/40">Configure the tournament format and rules</p>
      </div>

      {draft.type === 'SINGLE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Room Size" type="number" value={String(draft.roomSize)} onChange={(e) => update('roomSize', Number(e.target.value))} />
          <Input label="Match Map" value={draft.matchMap} onChange={(e) => update('matchMap', e.target.value)} placeholder="e.g. Erangel" />
          <Select
            label="Team Type"
            value={draft.teamType}
            onChange={(v) => update('teamType', v)}
            options={[
              { value: 'SOLO', label: 'Solo' },
              { value: 'DUO', label: 'Duo' },
              { value: 'SQUAD', label: 'Squad' },
            ]}
          />
          <Input label="Match Time (minutes)" type="number" value={draft.matchTime} onChange={(e) => update('matchTime', e.target.value)} />
        </div>
      )}

      {draft.type === 'MULTI' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Number of Matches" type="number" value={String(draft.numMatches)} onChange={(e) => update('numMatches', Number(e.target.value))} />
            <Select
              label="Match Rotation"
              value={draft.matchRotation}
              onChange={(v) => update('matchRotation', v)}
              options={[
                { value: 'FIXED', label: 'Fixed Order' },
                { value: 'RANDOM', label: 'Random Rotation' },
                { value: 'VOTE', label: 'Player Vote' },
              ]}
            />
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Standings Preview</div>
            <div className="space-y-2">
              {[
                { rank: 1, name: 'Team Alpha', points: 42, kills: 18 },
                { rank: 2, name: 'Team Beta', points: 38, kills: 15 },
                { rank: 3, name: 'Team Gamma', points: 35, kills: 12 },
              ].map((team) => (
                <div key={team.rank} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    team.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    team.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>{team.rank}</span>
                  <span className="flex-1 text-sm text-white">{team.name}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-white/50">{team.kills} kills</span>
                    <span className="text-primary font-bold">{team.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {draft.type === 'MULTI_STAGE' && (
        <StageBuilder stages={draft.stages} onChange={(stages) => update('stages', stages)} totalTeams={draft.maxTeams} />
      )}

      {draft.type === 'PER_KILL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Reward Per Kill (₹)" type="number" value={String(draft.rewardPerKill)} onChange={(e) => update('rewardPerKill', Number(e.target.value))} />
            <Input label="Maximum Kill Reward (₹)" type="number" value={String(draft.maxKillReward)} onChange={(e) => update('maxKillReward', Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Match Count" type="number" value={String(draft.matchCount)} onChange={(e) => update('matchCount', Number(e.target.value))} />
            <Select
              label="Kill Validation"
              value={draft.killValidation}
              onChange={(v) => update('killValidation', v)}
              options={[
                { value: 'OCR', label: 'OCR Validation' },
                { value: 'MANUAL', label: 'Manual Review' },
                { value: 'AUTO', label: 'Auto Verify' },
              ]}
            />
          </div>
          <PerKillCalculator kills={12} rewardPerKill={draft.rewardPerKill} maxReward={draft.maxKillReward} />
        </div>
      )}
    </div>
  );
}

function StepScoring({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Scoring System</h2>
        <p className="text-sm text-white/40">Configure placement and kill points</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Scoring Preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {scoringPresets.map((preset) => (
            <motion.button
              key={preset.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                update('scoringPreset', preset.id);
                update('placementPoints', preset.points);
                update('killPoints', preset.kill);
              }}
              className={`p-3 rounded-xl border text-center transition-all ${
                draft.scoringPreset === preset.id
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-card border-card-border hover:border-white/20'
              }`}
            >
              <p className="text-sm font-semibold text-white">{preset.id}</p>
              <div className="mt-2 space-y-1">
                <div className="text-[10px] text-white/40">Pts: {preset.points.slice(0, 3).join(', ')}...</div>
                <div className="text-[10px] text-primary">Kill: {preset.kill}pt</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Placement Points</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((pos) => (
            <div key={pos} className="text-center">
              <div className="text-[10px] text-white/30 mb-1">#{pos}</div>
              <input
                type="number"
                value={draft.placementPoints[pos - 1] ?? 0}
                onChange={(e) => {
                  const pts = [...draft.placementPoints];
                  pts[pos - 1] = Number(e.target.value);
                  update('placementPoints', pts);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-primary/50"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="sm:w-1/3">
        <Input label="Points Per Kill" type="number" value={String(draft.killPoints)} onChange={(e) => update('killPoints', Number(e.target.value))} />
      </div>
    </div>
  );
}

function StepRoom({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Room & Match Settings</h2>
        <p className="text-sm text-white/40">Configure match rooms and participant access</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Match Maps (comma separated)" value={draft.maps} onChange={(e) => update('maps', e.target.value)} placeholder="Erangel, Miramar, Sanhok" />
        <Input label="Match Timing (minutes)" type="number" value={draft.timing} onChange={(e) => update('timing', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Team Type"
          value={draft.teamTypeVal}
          onChange={(v) => update('teamTypeVal', v)}
          options={[
            { value: 'SOLO', label: 'Solo' },
            { value: 'DUO', label: 'Duo' },
            { value: 'SQUAD', label: 'Squad' },
          ]}
        />
        <Select
          label="Room Password Visibility"
          value={draft.roomPasswordVisibility}
          onChange={(v) => update('roomPasswordVisibility', v)}
          options={[
            { value: 'REGISTERED', label: 'Registered Players Only' },
            { value: 'PUBLIC', label: 'Public' },
            { value: 'HIDDEN', label: 'Hidden (Manual Share)' },
          ]}
        />
      </div>

      <div className="space-y-3">
        {[
          { id: 'autoDistribution', label: 'Auto Room Distribution', desc: 'Automatically assign teams to rooms' },
          { id: 'ocrValidation', label: 'OCR Validation', desc: 'Validate match results via OCR' },
        ].map((toggle) => (
          <label key={toggle.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={draft[toggle.id as 'autoDistribution' | 'ocrValidation']}
              onChange={(e) => update(toggle.id as 'autoDistribution' | 'ocrValidation', e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/30"
            />
            <div>
              <p className="text-sm font-medium text-white">{toggle.label}</p>
              <p className="text-xs text-white/40">{toggle.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function StepStream({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Stream & Media</h2>
        <p className="text-sm text-white/40">Configure streaming and media settings</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Input label="YouTube Stream URL" value={draft.youtubeUrl} onChange={(e) => update('youtubeUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." icon={<Monitor className="w-4 h-4" />} />
        <Input label="Sponsor Banner URL" value={draft.sponsorBanner} onChange={(e) => update('sponsorBanner', e.target.value)} placeholder="https://example.com/banner.png" icon={<Image className="w-4 h-4" />} />
      </div>

      {draft.youtubeUrl && (
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-sm font-semibold text-white mb-3">Stream Preview</div>
          <div className="aspect-video bg-surface rounded-lg flex items-center justify-center border border-white/10">
            <div className="text-center">
              <Monitor className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">Stream preview unavailable</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {[
          { id: 'obsOverlay', label: 'OBS Overlay', desc: 'Enable OBS integration for live streaming' },
          { id: 'featuredMatch', label: 'Featured Match', desc: 'Feature this tournament on the homepage' },
        ].map((toggle) => (
          <label key={toggle.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={draft[toggle.id as 'obsOverlay' | 'featuredMatch']}
              onChange={(e) => update(toggle.id as 'obsOverlay' | 'featuredMatch', e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/30"
            />
            <div>
              <p className="text-sm font-medium text-white">{toggle.label}</p>
              <p className="text-xs text-white/40">{toggle.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function StepModeration({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Moderation & Security</h2>
        <p className="text-sm text-white/40">Configure security and anti-cheat measures</p>
      </div>

      <div className="space-y-3">
        {[
          { id: 'ocrVerification', label: 'OCR Result Verification', desc: 'Automatically verify match results using OCR', icon: ScrollText, color: 'text-blue-400' },
          { id: 'antiCheat', label: 'Anti-Cheat Review', desc: 'Screen participants for cheating software', icon: Shield, color: 'text-red-400' },
          { id: 'duplicateDetection', label: 'Duplicate Team Detection', desc: 'Prevent teams from registering multiple times', icon: Users, color: 'text-yellow-400' },
          { id: 'manualApproval', label: 'Manual Approval Mode', desc: 'Manually approve each registration', icon: CheckCircle, color: 'text-purple-400' },
          { id: 'autoQualification', label: 'Auto Qualification Engine', desc: 'Automatically qualify top teams to next stage', icon: Zap, color: 'text-green-400' },
        ].map((feature) => {
          const Icon = feature.icon;
          const checked = draft[feature.id as keyof Draft] as boolean;
          return (
            <label key={feature.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-all">
              <Icon className={`w-5 h-5 ${feature.color} flex-shrink-0`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{feature.label}</p>
                <p className="text-xs text-white/40">{feature.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => update(feature.id as keyof Draft, e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/30"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({ draft, prizePoolAmount, totalCollection }: {
  draft: Draft; prizePoolAmount: number; totalCollection: number;
}) {
  const typeLabel = tournamentTypes.find((t) => t.id === draft.type)?.label || draft.type;

  const summarySections = [
    {
      title: 'Tournament Info',
      items: [
        { label: 'Name', value: draft.name || '-' },
        { label: 'Game', value: draft.game || '-' },
        { label: 'Type', value: typeLabel },
        { label: 'Team Type', value: draft.teamType || draft.teamTypeVal || 'SOLO' },
        { label: 'Max Teams', value: String(draft.maxTeams) },
      ],
    },
    {
      title: 'Entry & Prize',
      items: [
        { label: 'Entry', value: draft.entryType === 'PAID' ? `₹${draft.entryFee}` : 'Free' },
        { label: 'Prize Pool', value: `₹${prizePoolAmount.toLocaleString()}` },
        ...(draft.entryType === 'PAID' ? [
          { label: 'Total Collection', value: `₹${totalCollection.toLocaleString()}` },
          { label: 'Your Earnings', value: `₹${Math.round(totalCollection * (1 - draft.prizePoolPercent / 100) * 0.5).toLocaleString()}` },
          { label: 'Commission', value: `₹${Math.round(totalCollection * (1 - draft.prizePoolPercent / 100) * 0.5).toLocaleString()}` },
        ] : []),
        ...(draft.sponsoredPrize ? [{ label: 'Locked Amount', value: `₹${Math.min(draft.prizePool, 12500).toLocaleString()}` }] : []),
      ],
    },
    {
      title: 'Format',
      items: [
        ...(draft.type === 'SINGLE' ? [
          { label: 'Map', value: draft.matchMap || '-' },
          { label: 'Match Time', value: `${draft.matchTime} min` },
        ] : []),
        ...(draft.type === 'MULTI' ? [
          { label: 'Matches', value: String(draft.numMatches) },
          { label: 'Rotation', value: draft.matchRotation },
        ] : []),
        ...(draft.type === 'MULTI_STAGE' ? [
          { label: 'Stages', value: String(draft.stages.length) },
          ...draft.stages.map((s, i) => ({ label: `Stage ${i + 1}`, value: `${s.teamsCount} → ${s.qualifyingTeams} qualify` })),
        ] : []),
        ...(draft.type === 'PER_KILL' ? [
          { label: 'Per Kill', value: `₹${draft.rewardPerKill}` },
          { label: 'Max Reward', value: `₹${draft.maxKillReward}` },
          { label: 'Matches', value: String(draft.matchCount) },
        ] : []),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-glow-red"
        >
          <Trophy className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">Review & Publish</h2>
        <p className="text-sm text-white/40 mt-1">Final review before your tournament goes live</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Prize Pool', value: `₹${prizePoolAmount.toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total Teams', value: String(draft.maxTeams), color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Format', value: typeLabel, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {summarySections.map((section) => (
        <div key={section.title} className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border">
            <p className="text-sm font-semibold text-white">{section.title}</p>
          </div>
          <div className="p-4 space-y-2">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm text-white/50">{item.label}</span>
                <span className="text-sm text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="inline-flex items-center gap-2 text-xs text-white/30 bg-white/5 px-4 py-2 rounded-full">
          <Shield className="w-3 h-3" />
          Everything looks ready. Click Publish to launch your tournament.
        </div>
      </motion.div>
    </div>
  );
}


