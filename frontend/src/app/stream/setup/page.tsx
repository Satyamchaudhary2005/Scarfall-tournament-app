'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, Badge, Button } from '@/components/ui';
import { getSocket } from '@/services/socket';
import { useAuthStore } from '@/store/authStore';
import { API_URL } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Eye, EyeOff, Image, Type, Users, Trophy,
  Grid3X3, Copy, CheckCircle, HelpCircle,
  ExternalLink, Plus, Trash2, GripVertical,
  Pencil, Check, X, Timer, Clock, ChevronDown, Film,
  Sliders, Globe, Video, Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SourceType = 'logo' | 'match-title' | 'scoreboard' | 'player-names' | 'grid' | 'timer' | 'custom-text' | 'image' | 'video' | 'browser';

interface SourceConfig {
  text?: string;
  subtext?: string;
  fontSize?: number;
  color?: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number;
  scoreB?: number;
  bgOpacity?: number;
  src?: string;
  fileName?: string;
  url?: string;
}

interface Crop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Source {
  id: string;
  type: SourceType;
  label: string;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  crop?: Crop;
  config: SourceConfig;
}

interface Scene {
  id: string;
  name: string;
  sources: Source[];
}

const SOURCE_META: Record<SourceType, { label: string; icon: any; defaultLabel: string; defaults: Partial<Source> }> = {
  logo:            { label: 'Logo',            icon: Image,    defaultLabel: 'Tournament Logo',    defaults: { x: 2, y: 2, width: 12, height: 8 } },
  'match-title':   { label: 'Match Title',     icon: Type,     defaultLabel: 'Match Title',        defaults: { x: 25, y: 70, width: 50, height: 14 } },
  scoreboard:      { label: 'Scoreboard',      icon: Trophy,   defaultLabel: 'Scoreboard',         defaults: { x: 20, y: 30, width: 60, height: 30 } },
  'player-names':  { label: 'Player Names',    icon: Users,    defaultLabel: 'Player Names',       defaults: { x: 55, y: 2, width: 43, height: 8 } },
  grid:            { label: 'Grid Overlay',    icon: Grid3X3,  defaultLabel: 'Grid Overlay',       defaults: { x: 0, y: 0, width: 100, height: 100 } },
  timer:           { label: 'Timer',           icon: Timer,    defaultLabel: 'Countdown Timer',    defaults: { x: 45, y: 2, width: 10, height: 8 } },
  'custom-text':   { label: 'Custom Text',     icon: Type,     defaultLabel: 'Custom Text',        defaults: { x: 20, y: 45, width: 60, height: 10 } },
  image:           { label: 'Image',           icon: Image,    defaultLabel: 'Image',              defaults: { x: 10, y: 10, width: 30, height: 25 } },
  video:           { label: 'Video',           icon: Video,    defaultLabel: 'Video',              defaults: { x: 10, y: 10, width: 50, height: 35 } },
  browser:         { label: 'Browser Source',  icon: Globe,    defaultLabel: 'Browser Source',     defaults: { x: 10, y: 10, width: 60, height: 40 } },
};

const SOURCE_DEFAULTS: Record<SourceType, SourceConfig> = {
  logo:            { fontSize: 16 },
  'match-title':  { text: 'BGMI Clash Squad', subtext: 'Semi Finals', fontSize: 24, bgOpacity: 40 },
  scoreboard:     { teamA: 'Team Alpha', teamB: 'Team Beta', scoreA: 12, scoreB: 8, fontSize: 48, bgOpacity: 40 },
  'player-names': { text: 'Team Alpha vs Team Beta', fontSize: 14, bgOpacity: 40 },
  grid:           {},
  timer:          { text: '05:00', fontSize: 28 },
  'custom-text':  { text: 'Custom Text', fontSize: 24, color: '#ffffff', bgOpacity: 30 },
  image:          {},
  video:          {},
  browser:        { url: 'https://example.com' },
};

function createSource(type: SourceType): Source {
  const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const meta = SOURCE_META[type];
  return {
    id, type, label: meta.defaultLabel, visible: true,
    ...meta.defaults,
    config: { ...SOURCE_DEFAULTS[type] },
  } as Source;
}

function createScene(name: string, sources: SourceType[] = []): Scene {
  return {
    id: `scene_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    sources: sources.map(createSource),
  };
}

function SceneCard({ scene, active, onSelect, onRename, onDelete }: {
  scene: Scene; active: boolean; onSelect: () => void; onRename: (name: string) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(scene.name);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const saveRename = () => { if (name.trim()) onRename(name.trim()); setEditing(false); };

  return (
    <div onClick={editing ? undefined : onSelect} className={cn(
      'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm border',
      active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
    )}>
      <Film className="w-4 h-4 shrink-0" />
      {editing ? (
        <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onBlur={saveRename}
          onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { setName(scene.name); setEditing(false); } }}
          className="flex-1 bg-transparent text-sm text-white outline-none border-b border-white/20" onClick={(e) => e.stopPropagation()} />
      ) : (
        <span className="flex-1 truncate">{scene.name}</span>
      )}
      <span className="text-[10px] text-white/20 font-mono">{scene.sources.length}</span>
      {!editing && (
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Pencil className="w-3 h-3" /></button>
          {showConfirm ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); setShowConfirm(false); }} className="p-1 rounded hover:bg-red-500/20 text-red-400"><Check className="w-3 h-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }} className="p-1 rounded hover:bg-white/10 text-white/30"><X className="w-3 h-3" /></button>
            </>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }} className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
          )}
        </div>
      )}
    </div>
  );
}

function DraggableSourceItem({ source, active, onSelect, onToggle, onDelete }: {
  source: Source; active: boolean; onSelect: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: source.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : 1 };
  const Icon = SOURCE_META[source.type].icon;

  return (
    <div ref={setNodeRef} style={style} onClick={onSelect} className={cn(
      'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm border',
      active ? 'bg-primary/10 border-primary/20 text-white' : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white/70'
    )}>
      <div className="cursor-grab active:cursor-grabbing touch-none text-white/20 hover:text-white/50" {...attributes} {...listeners}>
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{source.label}</span>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={cn('p-1 rounded hover:bg-white/10', source.visible ? 'text-green-400' : 'text-white/20')}>
        {source.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      {showConfirm ? (
        <div className="flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); setShowConfirm(false); }} className="p-1 rounded hover:bg-red-500/20 text-red-400"><Check className="w-3 h-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }} className="p-1 rounded hover:bg-white/10 text-white/30"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }} className="p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
      )}
    </div>
  );
}

function SourceRenderer({ source }: { source: Source }) {
  if (!source.visible) return null;

  const baseStyle: React.CSSProperties = {
    position: 'absolute', left: `${source.x}%`, top: `${source.y}%`,
    width: `${source.width}%`, height: `${source.height}%`,
  };

  switch (source.type) {
    case 'logo':
      return (
        <div style={baseStyle} className="flex items-center gap-3 pointer-events-none">
          <img src="/logo.png" alt="" className="h-full object-contain" />
          <span className="text-sm font-bold text-white drop-shadow-lg">TournaX</span>
        </div>
      );

    case 'match-title':
      return (
        <div className="flex flex-col items-center justify-center text-center rounded-xl pointer-events-none" style={{ ...baseStyle, backgroundColor: `rgba(0,0,0,${(source.config.bgOpacity || 40) / 100})`, backdropFilter: 'blur(4px)' }}>
          {source.config.subtext && <p className="text-xs text-white/60 uppercase tracking-wider" style={{ fontSize: Math.max(8, (source.config.fontSize || 24) * 0.45) }}>{source.config.subtext}</p>}
          <h3 className="font-black text-white mt-0.5 leading-tight" style={{ fontSize: source.config.fontSize || 24 }}>{source.config.text || 'Match Title'}</h3>
        </div>
      );

    case 'scoreboard':
      return (
        <div className="flex items-center justify-center rounded-xl px-4 pointer-events-none" style={{ ...baseStyle, backgroundColor: `rgba(0,0,0,${(source.config.bgOpacity || 40) / 100})`, backdropFilter: 'blur(4px)' }}>
          <div className="flex items-center justify-center gap-4 w-full h-full">
            <div className="text-center flex-1 min-w-0">
              <p className="text-xs text-white/50 uppercase tracking-wider truncate" style={{ fontSize: Math.max(8, (source.config.fontSize || 48) * 0.22) }}>{source.config.teamA || 'Alpha'}</p>
              <p className="font-black text-white leading-none mt-0.5" style={{ fontSize: source.config.fontSize || 48 }}>{source.config.scoreA ?? 0}</p>
            </div>
            <div className="shrink-0"><p className="font-black text-white/30" style={{ fontSize: Math.max(12, (source.config.fontSize || 48) * 0.4) }}>VS</p></div>
            <div className="text-center flex-1 min-w-0">
              <p className="text-xs text-white/50 uppercase tracking-wider truncate" style={{ fontSize: Math.max(8, (source.config.fontSize || 48) * 0.22) }}>{source.config.teamB || 'Beta'}</p>
              <p className="font-black text-white leading-none mt-0.5" style={{ fontSize: source.config.fontSize || 48 }}>{source.config.scoreB ?? 0}</p>
            </div>
          </div>
        </div>
      );

    case 'player-names':
      return (
        <div className="flex items-center justify-center rounded-lg px-3 pointer-events-none" style={{ ...baseStyle, backgroundColor: `rgba(0,0,0,${(source.config.bgOpacity || 40) / 100})`, backdropFilter: 'blur(4px)' }}>
          <Users className="w-4 h-4 text-white/60 shrink-0 mr-2" />
          <span className="font-semibold text-white truncate" style={{ fontSize: source.config.fontSize || 14 }}>{source.config.text || 'Team Alpha vs Team Beta'}</span>
        </div>
      );

    case 'grid':
      return (
        <div style={baseStyle} className="grid grid-cols-3 grid-rows-3 pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/10" />)}
        </div>
      );

    case 'timer':
      return (
        <div className="flex items-center justify-center rounded-lg pointer-events-none" style={{ ...baseStyle, backgroundColor: `rgba(0,0,0,${(source.config.bgOpacity || 40) / 100})`, backdropFilter: 'blur(4px)' }}>
          <Clock className="w-3.5 h-3.5 text-white/50 mr-1.5 shrink-0" />
          <span className="font-mono font-bold text-white" style={{ fontSize: source.config.fontSize || 28 }}>{source.config.text || '05:00'}</span>
        </div>
      );

    case 'custom-text':
      return (
        <div className="flex items-center justify-center rounded-lg px-3 pointer-events-none" style={{ ...baseStyle, backgroundColor: `rgba(0,0,0,${(source.config.bgOpacity || 30) / 100})`, backdropFilter: 'blur(4px)', color: source.config.color || '#ffffff' }}>
          <span className="font-bold text-center leading-tight" style={{ fontSize: source.config.fontSize || 24 }}>{source.config.text || 'Custom Text'}</span>
        </div>
      );

    case 'image':
      return (
        <div style={baseStyle} className="pointer-events-none">
          {source.config.src ? (
            <img src={source.config.src} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-white/5 border border-dashed border-white/10">
              <Image className="w-6 h-6 text-white/20" />
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div style={baseStyle} className="pointer-events-none">
          {source.config.src ? (
            <video src={source.config.src} autoPlay loop muted playsInline className="w-full h-full object-contain rounded-lg" />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-white/5 border border-dashed border-white/10">
              <Video className="w-6 h-6 text-white/20" />
            </div>
          )}
        </div>
      );

    case 'browser':
      return (
        <div style={baseStyle} className="pointer-events-none">
          {source.config.url ? (
            <iframe src={source.config.url} className="w-full h-full rounded-lg bg-white" sandbox="allow-scripts allow-same-origin" title={source.label} />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-white/5 border border-dashed border-white/10">
              <Globe className="w-6 h-6 text-white/20" />
            </div>
          )}
        </div>
      );
  }
}

export default function StreamSetupPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  if (authLoading) return <div className="min-h-screen bg-surface" />;
  if (!isAdmin) return <StreamViewer />;

  return <StreamEditor />;
}

function StreamEditor() {
  const [scenes, setScenes] = useState<Scene[]>([
    createScene('Default Overlay', ['logo', 'match-title', 'scoreboard']),
    createScene('Full Screen', ['logo', 'match-title', 'scoreboard', 'player-names', 'grid']),
    createScene('Minimal', ['logo', 'scoreboard']),
  ]);
  const [activeSceneId, setActiveSceneId] = useState(scenes[0].id);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const changeIdRef = useRef(0);
  const lastEmitChangeId = useRef(0);
  const isApplyingRemote = useRef(false);

  const activeScene = scenes.find((s) => s.id === activeSceneId)!;
  const selectedSource = selectedSourceId ? activeScene?.sources.find((s) => s.id === selectedSourceId) : null;

  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;

  // Drag-to-position on preview
  const [dragState, setDragState] = useState<{ id: string; origX: number; origY: number; startX: number; startY: number } | null>(null);

  const handlePreviewMouseDown = useCallback((e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    const src = activeScene.sources.find((s) => s.id === sourceId);
    if (!src) return;
    setSelectedSourceId(sourceId);
    setDragState({ id: sourceId, origX: src.x, origY: src.y, startX: e.clientX, startY: e.clientY });
  }, [activeScene.sources]);

  useEffect(() => {
    if (!dragState) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragState.startY) / rect.height) * 100;
      const src = activeScene.sources.find((s) => s.id === dragState.id);
      if (!src) return;
      const maxX = 100 - src.width;
      const maxY = 100 - src.height;
      updateSource(dragState.id, {
        x: Math.max(0, Math.min(maxX, dragState.origX + dx)),
        y: Math.max(0, Math.min(maxY, dragState.origY + dy)),
      });
    };
    const handleMouseUp = () => setDragState(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragState]);

  // Socket real-time sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.auth = { token: localStorage.getItem('token') || undefined };
      socket.connect();
    }
    const onConnect = () => {
      socket.emit('stream:join');
      if (scenesRef.current.length > 0) {
        socket.emit('stream:state-update', { scenes: scenesRef.current });
      }
    };
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();

    const handleRemoteUpdate = (data: { scenes: Scene[] }) => {
      console.log('[stream] Received remote state update');
      isApplyingRemote.current = true;
      setScenes(data.scenes);
      setActiveSceneId((prev) => data.scenes.some((s: Scene) => s.id === prev) ? prev : data.scenes[0]?.id || prev);
      setSelectedSourceId(null);
      isApplyingRemote.current = false;
    };
    socket.on('stream:state-update', handleRemoteUpdate);
    return () => {
      socket.emit('stream:leave');
      socket.off('connect', onConnect);
      socket.off('stream:state-update', handleRemoteUpdate);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setShowAddMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateScenes = (fn: (scenes: Scene[]) => Scene[]) => {
    changeIdRef.current++;
    setScenes((prev) => fn(prev));
  };

  // Emit local changes to other clients + persist to API
  useEffect(() => {
    if (lastEmitChangeId.current === changeIdRef.current) return;
    lastEmitChangeId.current = changeIdRef.current;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('stream:state-update', { scenes });
    }
    fetch(`${API_URL}/stream/scenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes }),
    }).catch(() => {});
  }, [scenes]);

  const addScene = () => {
    const count = scenes.length + 1;
    const newScene = createScene(`Scene ${count}`);
    updateScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newScene.id);
    setSelectedSourceId(null);
  };

  const renameScene = (id: string, name: string) => updateScenes((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));

  const deleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    updateScenes((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSceneId === id) setActiveSceneId(filtered[0].id);
      return filtered;
    });
    setSelectedSourceId(null);
  };

  const addSource = (type: SourceType) => {
    const isFileType = type === 'image' || type === 'video';
    if (isFileType) return addFileSource(type);
    const source = createSource(type);
    updateScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, sources: [...s.sources, source] } : s)));
    setSelectedSourceId(source.id);
    setShowAddMenu(false);
  };

  const addFileSource = (type: 'image' | 'video') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const source = createSource(type);
      source.config.src = url;
      source.config.fileName = file.name;
      source.label = file.name;
      updateScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, sources: [...s.sources, source] } : s)));
      setSelectedSourceId(source.id);
      setShowAddMenu(false);
    };
    input.click();
  };

  const deleteSource = (id: string) => {
    updateScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, sources: s.sources.filter((src) => src.id !== id) } : s)));
    if (selectedSourceId === id) setSelectedSourceId(null);
  };

  const toggleSource = (id: string) => {
    updateScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, sources: s.sources.map((src) => src.id === id ? { ...src, visible: !src.visible } : src) } : s)));
  };

  const updateSource = (id: string, updates: Partial<Source>) => {
    updateScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, sources: s.sources.map((src) => src.id === id ? { ...src, ...updates } as Source : src) } : s)));
  };

  const updateSourceConfig = (id: string, config: Partial<SourceConfig>) => {
    updateScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, sources: s.sources.map((src) => src.id === id ? { ...src, config: { ...src.config, ...config } } : src) } : s)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateScenes((prev) => prev.map((s) => {
      if (s.id !== activeSceneId) return s;
      const oldIndex = s.sources.findIndex((src) => src.id === active.id);
      const newIndex = s.sources.findIndex((src) => src.id === over.id);
      return { ...s, sources: arrayMove(s.sources, oldIndex, newIndex) };
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + '/stream/setup');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDraggingSource = dragState?.id === selectedSourceId;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-white">Stream Setup</h1>
              <p className="text-sm text-white/50 mt-0.5">Manage scenes and sources like OBS</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <><CheckCircle className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy URL</>}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.open('https://obsproject.com', '_blank')}>
              <ExternalLink className="w-4 h-4" /> OBS
            </Button>
          </div>

          {/* Three-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6" style={{ minHeight: '60vh' }}>
            {/* Scenes Panel */}
            <div className="lg:col-span-2">
              <Card className="p-3 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Scenes</span>
                  <button onClick={addScene} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {scenes.map((scene) => (
                    <SceneCard key={scene.id} scene={scene} active={scene.id === activeSceneId}
                      onSelect={() => { setActiveSceneId(scene.id); setSelectedSourceId(null); }}
                      onRename={(name) => renameScene(scene.id, name)} onDelete={() => deleteScene(scene.id)} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Preview */}
            <div className="lg:col-span-7">
              <Card className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-white/40" />
                    <span className="text-sm font-semibold text-white">Preview</span>
                    <Badge variant="success">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{activeScene.name}</span>
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-white/20">16:9 · #00FF00</span>
                </div>

                <div className="relative flex-1 flex items-center justify-center">
                  <div ref={previewRef} className="relative w-full aspect-video overflow-hidden border border-white/10 select-none"
                    style={{ backgroundColor: '#00FF00' }}>
                    {/* Sources rendered on the green screen */}
                    <div className="absolute inset-0" style={{ zIndex: 1 }}>
                      {activeScene.sources.map((source) => {
                        const crop = source.crop;
                        const hasCrop = crop && (crop.top > 0 || crop.right > 0 || crop.bottom > 0 || crop.left > 0);
                        return (
                        <div
                          key={source.id}
                          onMouseDown={(e) => handlePreviewMouseDown(e, source.id)}
                          className="cursor-move"
                          style={{
                            position: 'absolute',
                            left: `${source.x}%`, top: `${source.y}%`,
                            width: `${source.width}%`, height: `${source.height}%`,
                            zIndex: dragState?.id === source.id ? 10 : 1,
                            clipPath: hasCrop ? `inset(${crop!.top}% ${crop!.right}% ${crop!.bottom}% ${crop!.left}%)` : undefined,
                          }}
                        >
                          <SourceRenderer source={source} />
                          <div className="absolute inset-0 border border-dashed border-white/0 hover:border-white/40 rounded transition-colors pointer-events-none" />
                          {dragState?.id === source.id && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white/70 whitespace-nowrap pointer-events-none">
                              <Move className="w-3 h-3 inline mr-1" />{Math.round(source.x)}%, {Math.round(source.y)}%
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </Card>
            </div>

            {/* Sources Panel */}
            <div className="lg:col-span-3 space-y-3">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Sources</span>
                  <div className="relative" ref={addMenuRef}>
                    <button onClick={() => setShowAddMenu(!showAddMenu)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showAddMenu && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="absolute right-0 top-full mt-1 w-44 py-1 rounded-lg bg-card border border-white/10 shadow-xl z-50">
                          {(Object.entries(SOURCE_META) as [SourceType, typeof SOURCE_META[SourceType]][]).map(([type, meta]) => {
                            const Icon = meta.icon;
                            return (
                              <button key={type} onClick={() => addSource(type)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5">
                                <Icon className="w-3.5 h-3.5" />
                                {meta.label}
                                {(type === 'image' || type === 'video') && <span className="ml-auto text-[9px] text-white/20 font-mono">File</span>}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={activeScene.sources.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1 min-h-[100px]">
                      {activeScene.sources.length === 0 ? (
                        <p className="text-xs text-white/20 text-center py-8">No sources. Click Add to start.</p>
                      ) : (
                        activeScene.sources.map((source) => (
                          <DraggableSourceItem key={source.id} source={source} active={source.id === selectedSourceId}
                            onSelect={() => setSelectedSourceId(source.id)} onToggle={() => toggleSource(source.id)} onDelete={() => deleteSource(source.id)} />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </Card>

              {selectedSource && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <SourceConfigPanel
                    source={selectedSource}
                    onUpdate={(updates) => updateSource(selectedSource.id, updates)}
                    onConfigUpdate={(config) => updateSourceConfig(selectedSource.id, config)}
                    onReplaceFile={selectedSource.type === 'image' || selectedSource.type === 'video' ? () => addFileSource(selectedSource.type as 'image' | 'video') : undefined}
                  />
                </motion.div>
              )}

              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">OBS Setup</span>
                </div>
                <div className="space-y-2">
                  {['Add this page as a Browser Source', 'Chroma key filter → pick #00FF00', 'Tune Similarity & Smoothness'].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold text-green-400">{i + 1}</span>
                      <p className="text-[11px] text-white/50">{step}</p>
                    </div>
                  ))}
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

function StreamViewer() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch latest scenes from server on mount
  useEffect(() => {
    fetch(`${API_URL}/stream/scenes`)
      .then((r) => r.json())
      .then((data) => {
        if (data.scenes && data.scenes.length > 0) {
          setScenes(data.scenes);
          setActiveId(data.scenes[0].id);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Listen for live updates via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.auth = { token: localStorage.getItem('token') || undefined };
      socket.connect();
    }
    const onConnect = () => socket.emit('stream:join');
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();

    const handler = (data: { scenes: Scene[] }) => {
      if (data.scenes) {
        setScenes(data.scenes);
        setActiveId((prev) => data.scenes.some((s: Scene) => s.id === prev) ? prev : data.scenes[0]?.id);
      }
    };
    socket.on('stream:state-update', handler);
    return () => {
      socket.emit('stream:leave');
      socket.off('connect', onConnect);
      socket.off('stream:state-update', handler);
    };
  }, []);

  // Also poll API every 3s as fallback
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/stream/scenes`);
        const data = await res.json();
        if (data.scenes && data.scenes.length > 0) {
          setScenes((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data.scenes)) return prev;
            return data.scenes;
          });
          setActiveId((prev) => data.scenes.some((s: Scene) => s.id === prev) ? prev : data.scenes[0]?.id);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!loaded) return <div className="min-h-screen bg-surface" />;

  const scene = scenes.find((s) => s.id === activeId);

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ backgroundColor: '#00FF00' }}>
      {scene?.sources.map((source) => (
        <SourceRenderer key={source.id} source={source} />
      ))}
    </div>
  );
}

function SourceConfigPanel({ source, onUpdate, onConfigUpdate, onReplaceFile }: {
  source: Source; onUpdate: (updates: Partial<Source>) => void; onConfigUpdate: (config: Partial<SourceConfig>) => void; onReplaceFile?: () => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Sliders className="w-3.5 h-3.5 text-white/30" />
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Configure</span>
        <span className="text-[11px] text-white/30 font-mono ml-auto">{SOURCE_META[source.type].label}</span>
      </div>

      <div className="space-y-2.5">
        {/* Label */}
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider">Label</label>
          <input value={source.label} onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-primary/40" />
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <SliderField label="X Position" value={source.x} onChange={(v) => onUpdate({ x: v })} unit="%" />
          <SliderField label="Y Position" value={source.y} onChange={(v) => onUpdate({ y: v })} unit="%" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SliderField label="Width" value={source.width} onChange={(v) => onUpdate({ width: v })} unit="%" />
          <SliderField label="Height" value={source.height} onChange={(v) => onUpdate({ height: v })} unit="%" />
        </div>

        {/* Crop */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Crop</label>
            {(source.crop?.top || source.crop?.right || source.crop?.bottom || source.crop?.left) ? (
              <button onClick={() => onUpdate({ crop: { top: 0, right: 0, bottom: 0, left: 0 } })}
                className="text-[10px] text-red-400/60 hover:text-red-400">Reset</button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SliderField label="Top" value={source.crop?.top ?? 0} onChange={(v) => onUpdate({ crop: { ...source.crop || { top: 0, right: 0, bottom: 0, left: 0 }, top: v } })} unit="%" />
            <SliderField label="Right" value={source.crop?.right ?? 0} onChange={(v) => onUpdate({ crop: { ...source.crop || { top: 0, right: 0, bottom: 0, left: 0 }, right: v } })} unit="%" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <SliderField label="Bottom" value={source.crop?.bottom ?? 0} onChange={(v) => onUpdate({ crop: { ...source.crop || { top: 0, right: 0, bottom: 0, left: 0 }, bottom: v } })} unit="%" />
            <SliderField label="Left" value={source.crop?.left ?? 0} onChange={(v) => onUpdate({ crop: { ...source.crop || { top: 0, right: 0, bottom: 0, left: 0 }, left: v } })} unit="%" />
          </div>
        </div>

        {/* Image config */}
        {source.type === 'image' && (
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Source</label>
            {source.config.src ? (
              <div className="mt-1 flex items-center gap-2">
                <img src={source.config.src} alt="" className="w-10 h-10 rounded object-cover bg-white/5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/60 truncate">{source.config.fileName || 'Image'}</p>
                </div>
                {onReplaceFile && <button onClick={onReplaceFile} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/50">Replace</button>}
              </div>
            ) : (
              <button onClick={onReplaceFile} className="w-full mt-1 px-3 py-2 rounded bg-white/5 hover:bg-white/10 border border-dashed border-white/10 text-xs text-white/40 text-center">
                Choose Image File
              </button>
            )}
          </div>
        )}

        {/* Video config */}
        {source.type === 'video' && (
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Source</label>
            {source.config.src ? (
              <div className="mt-1 flex items-center gap-2">
                <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center"><Video className="w-4 h-4 text-white/40" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/60 truncate">{source.config.fileName || 'Video'}</p>
                </div>
                {onReplaceFile && <button onClick={onReplaceFile} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/50">Replace</button>}
              </div>
            ) : (
              <button onClick={onReplaceFile} className="w-full mt-1 px-3 py-2 rounded bg-white/5 hover:bg-white/10 border border-dashed border-white/10 text-xs text-white/40 text-center">
                Choose Video File
              </button>
            )}
          </div>
        )}

        {/* Browser source config */}
        {source.type === 'browser' && (
          <TextField label="URL" value={source.config.url || ''} onChange={(v) => onConfigUpdate({ url: v })} placeholder="https://example.com" />
        )}

        {/* Type-specific config for existing types */}
        {source.type === 'match-title' && (
          <><TextField label="Title" value={source.config.text || ''} onChange={(v) => onConfigUpdate({ text: v })} />
            <TextField label="Subtitle" value={source.config.subtext || ''} onChange={(v) => onConfigUpdate({ subtext: v })} />
            <SliderField label="Font Size" value={source.config.fontSize || 24} onChange={(v) => onConfigUpdate({ fontSize: v })} min={12} max={72} unit="px" />
            <SliderField label="BG Opacity" value={source.config.bgOpacity ?? 40} onChange={(v) => onConfigUpdate({ bgOpacity: v })} min={0} max={100} unit="%" /></>
        )}
        {source.type === 'scoreboard' && (
          <><TextField label="Team A" value={source.config.teamA || ''} onChange={(v) => onConfigUpdate({ teamA: v })} />
            <TextField label="Score A" value={String(source.config.scoreA ?? 0)} onChange={(v) => onConfigUpdate({ scoreA: Number(v) || 0 })} type="number" />
            <TextField label="Team B" value={source.config.teamB || ''} onChange={(v) => onConfigUpdate({ teamB: v })} />
            <TextField label="Score B" value={String(source.config.scoreB ?? 0)} onChange={(v) => onConfigUpdate({ scoreB: Number(v) || 0 })} type="number" />
            <SliderField label="Font Size" value={source.config.fontSize || 48} onChange={(v) => onConfigUpdate({ fontSize: v })} min={18} max={96} unit="px" />
            <SliderField label="BG Opacity" value={source.config.bgOpacity ?? 40} onChange={(v) => onConfigUpdate({ bgOpacity: v })} min={0} max={100} unit="%" /></>
        )}
        {source.type === 'player-names' && (
          <><TextField label="Text" value={source.config.text || ''} onChange={(v) => onConfigUpdate({ text: v })} />
            <SliderField label="Font Size" value={source.config.fontSize || 14} onChange={(v) => onConfigUpdate({ fontSize: v })} min={10} max={48} unit="px" />
            <SliderField label="BG Opacity" value={source.config.bgOpacity ?? 40} onChange={(v) => onConfigUpdate({ bgOpacity: v })} min={0} max={100} unit="%" /></>
        )}
        {source.type === 'timer' && (
          <><TextField label="Time Display" value={source.config.text || '05:00'} onChange={(v) => onConfigUpdate({ text: v })} />
            <SliderField label="Font Size" value={source.config.fontSize || 28} onChange={(v) => onConfigUpdate({ fontSize: v })} min={14} max={80} unit="px" />
            <SliderField label="BG Opacity" value={source.config.bgOpacity ?? 40} onChange={(v) => onConfigUpdate({ bgOpacity: v })} min={0} max={100} unit="%" /></>
        )}
        {source.type === 'custom-text' && (
          <><TextField label="Text" value={source.config.text || ''} onChange={(v) => onConfigUpdate({ text: v })} />
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wider">Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={source.config.color || '#ffffff'} onChange={(e) => onConfigUpdate({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10" />
                <span className="text-[10px] font-mono text-white/40">{source.config.color || '#ffffff'}</span>
              </div>
            </div>
            <SliderField label="Font Size" value={source.config.fontSize || 24} onChange={(v) => onConfigUpdate({ fontSize: v })} min={10} max={96} unit="px" />
            <SliderField label="BG Opacity" value={source.config.bgOpacity ?? 30} onChange={(v) => onConfigUpdate({ bgOpacity: v })} min={0} max={100} unit="%" /></>
        )}
      </div>
    </Card>
  );
}

function SliderField({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-white/30 uppercase tracking-wider">{label}</label>
        <span className="text-[10px] font-mono text-white/40">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 h-1 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:cursor-pointer" />
    </div>
  );
}

function TextField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-white/30 uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-primary/40 [&[type=number]]:font-mono" />
    </div>
  );
}
