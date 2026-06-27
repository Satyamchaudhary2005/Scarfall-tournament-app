'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/services/socket';

type ReactionType = 'confetti' | 'fireworks' | 'hearts' | 'stars' | 'emoji_rain';

interface Particle {
  id: number;
  type: ReactionType;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
  color?: string;
  emoji?: string;
}

const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#ffd700', '#00d2d3'];
const EMOJIS_CONFETTI = ['🎉', '✨', '🎊', '💫', '⭐', '🌟'];
const EMOJIS_HEARTS = ['❤️', '💖', '💗', '💓', '💕', '🩷'];
const EMOJIS_STARS = ['⭐', '🌟', '✨', '💫', '🌠'];
const EMOJIS_RAIN = ['🎉', '🎊', '🥳', '🎈', '🎁', '💥', '🔥', '🏆', '👑', '💎'];

function generateParticles(type: ReactionType): Particle[] {
  const count = type === 'fireworks' ? 12 : type === 'hearts' ? 15 : 25;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    let emojiGroup: string[];
    if (type === 'hearts') emojiGroup = EMOJIS_HEARTS;
    else if (type === 'stars') emojiGroup = EMOJIS_STARS;
    else if (type === 'emoji_rain') emojiGroup = EMOJIS_RAIN;
    else emojiGroup = EMOJIS_CONFETTI;

    particles.push({
      id: i,
      type,
      x: type === 'fireworks' ? 20 + Math.random() * 60 : Math.random() * 100,
      y: type === 'fireworks' ? 20 + Math.random() * 40 : type === 'hearts' ? 40 + Math.random() * 40 : 0,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 3,
      size: 8 + Math.random() * 16,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      emoji: emojiGroup[Math.floor(Math.random() * emojiGroup.length)],
    });
  }

  return particles;
}

const TYPE_LABELS: Record<ReactionType, { title: string; subtitle: string }> = {
  confetti: { title: '🎉 Confetti!', subtitle: 'Celebration in progress' },
  fireworks: { title: '🎆 Fireworks!', subtitle: 'Something spectacular is happening' },
  hearts: { title: '💖 Hearts!', subtitle: 'Spreading the love' },
  stars: { title: '⭐ Stars!', subtitle: 'Wishing upon a star' },
  emoji_rain: { title: '🎊 Emoji Rain!', subtitle: 'Let the party begin' },
};

export function LiveReactionOverlay() {
  const [active, setActive] = useState<ReactionType | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.auth = { token: localStorage.getItem('token') || undefined };
      socket.connect();
    }

    const handler = (data: { type: ReactionType }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setActive(data.type);
      setParticles(generateParticles(data.type));
      timerRef.current = setTimeout(() => {
        setActive(null);
        setParticles([]);
      }, 4500);
    };

    socket.on('reaction:play', handler);

    return () => {
      socket.off('reaction:play', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!active) return null;

  const label = TYPE_LABELS[active];

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <div className="absolute inset-0 bg-white/5 animate-[reaction-flash_4.5s_ease-out_forwards]" />

      {label && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center animate-[fade-in_0.5s_ease-out,slide-up_0.5s_ease-out] z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-2xl">
            {label.title}
          </h2>
          <p className="text-white/60 mt-2 text-lg">{label.subtitle}</p>
        </div>
      )}

      {particles.map((p) => (
        <ParticleItem key={`${p.type}-${p.id}`} particle={p} />
      ))}
    </div>
  );
}

function ParticleItem({ particle: p }: { particle: Particle }) {
  if (p.type === 'confetti') {
    return (
      <div
        className="absolute"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
        }}
      >
        <div
          style={{
            width: `${p.size * 0.5}px`,
            height: `${p.size * 0.7}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      </div>
    );
  }

  if (p.type === 'fireworks') {
    return (
      <div
        className="absolute"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
        }}
      >
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `firework-burst ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        />
      </div>
    );
  }

  if (p.type === 'hearts') {
    return (
      <div
        className="absolute"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          animation: `heart-float ${p.duration}s ease-out ${p.delay}s forwards`,
        }}
      >
        <span style={{ fontSize: `${p.size}px` }}>{p.emoji}</span>
      </div>
    );
  }

  if (p.type === 'stars') {
    return (
      <div
        className="absolute"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          animation: `star-fall ${p.duration}s ease-out ${p.delay}s forwards`,
        }}
      >
        <span style={{ fontSize: `${p.size}px` }}>{p.emoji}</span>
      </div>
    );
  }

  if (p.type === 'emoji_rain') {
    return (
      <div
        className="absolute"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          animation: `emoji-rain ${p.duration}s linear ${p.delay}s forwards`,
        }}
      >
        <span style={{ fontSize: `${p.size}px` }}>{p.emoji}</span>
      </div>
    );
  }

  return null;
}
