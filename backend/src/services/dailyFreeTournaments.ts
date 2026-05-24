import { prisma } from '../config/database';
import { hashPassword } from '../utils/helpers';

const FREE_TOURNAMENTS = [
  // BGMI Solo
  {
    title: '🎯 BGMI Free Solo Showdown',
    description: 'Daily free-to-enter BGMI Solo tournament. Compete against players across India and climb the leaderboard! Zero entry fee, real prizes.',
    prizePool: '₹2,500',
    mode: 'SOLO' as const,
    slots: 48,
    format: 'SINGLE' as const,
    mapName: 'Erangel',
  },
  {
    title: '🔥 BGMI Daily Solo Rush',
    description: 'Jump into the action with this free-entry Solo match. Top fraggers win big — every kill counts!',
    prizePool: '₹1,500',
    mode: 'SOLO' as const,
    slots: 48,
    format: 'MULTI_ROUND' as const,
    totalRounds: 3,
    killPoints: 2,
    mapName: 'Sanhok',
  },
  // BGMI Duo
  {
    title: '🤝 BGMI Duo Free Cup',
    description: 'Grab a teammate and enter this free DUO tournament. Work together, outlast the competition, and claim the prize!',
    prizePool: '₹3,000',
    mode: 'DUO' as const,
    slots: 50,
    format: 'SINGLE' as const,
    mapName: 'Miramar',
  },
  {
    title: '⚡ BGMI Duo Clash (Free Entry)',
    description: 'Free-entry DUO battle with multi-round format. Consistent performance across 3 matches wins you the crown!',
    prizePool: '₹2,000',
    mode: 'DUO' as const,
    slots: 40,
    format: 'MULTI_ROUND' as const,
    totalRounds: 3,
    killPoints: 1,
    mapName: 'Erangel',
  },
  // BGMI Squad
  {
    title: '👑 BGMI Squad Free Championship',
    description: 'The ultimate free-to-enter SQUAD experience! Bring your full team and dominate the battleground.',
    prizePool: '₹5,000',
    mode: 'SQUAD' as const,
    slots: 60,
    format: 'SINGLE' as const,
    mapName: 'Erangel',
  },
  {
    title: '🏆 BGMI Squad Open (Free)',
    description: 'Free-entry SQUAD tournament with a multi-round format. 3 rounds of intense battle royale action!',
    prizePool: '₹4,000',
    mode: 'SQUAD' as const,
    slots: 50,
    format: 'MULTI_ROUND' as const,
    totalRounds: 3,
    killPoints: 1,
    mapName: 'Sanhok',
  },
  // Free Fire Solo
  {
    title: '🎯 Free Fire Free Solo Cup',
    description: 'Daily free Free Fire Solo tournament. No entry fee — just drop in, frag out, and win!',
    prizePool: '₹2,000',
    mode: 'SOLO' as const,
    slots: 48,
    format: 'SINGLE' as const,
    mapName: 'Bermuda',
  },
  {
    title: '🔥 Free Fire Daily Solo Clash',
    description: 'Free-entry Solo with kill points enabled. Every elimination earns you points toward the prize!',
    prizePool: '₹1,500',
    mode: 'SOLO' as const,
    slots: 48,
    format: 'MULTI_ROUND' as const,
    totalRounds: 3,
    killPoints: 3,
    mapName: 'Kalahari',
  },
  // Free Fire Squad
  {
    title: '👑 Free Fire Squad Free Showdown',
    description: 'Gather your squad and compete in this free-entry tournament. Top teams take home bragging rights and prizes!',
    prizePool: '₹4,000',
    mode: 'SQUAD' as const,
    slots: 48,
    format: 'SINGLE' as const,
    mapName: 'Bermuda',
  },
  // Earn Per Kill (both games)
  {
    title: '💀 BGMI Kill Race (Free Entry)',
    description: 'FREE entry! Every kill earns you points in this multi-round kill race. Most aggressive player wins the prize pool!',
    prizePool: '₹3,000',
    mode: 'SOLO' as const,
    slots: 40,
    format: 'MULTI_ROUND' as const,
    totalRounds: 3,
    killPoints: 5,
    mapName: 'Livik',
  },
  {
    title: '💀 Free Fire Frag Fest (Free)',
    description: 'Free-to-enter kill race! 5 points per elimination — the frag master takes it all. No entry fee required!',
    prizePool: '₹2,500',
    mode: 'SOLO' as const,
    slots: 40,
    format: 'MULTI_ROUND' as const,
    totalRounds: 3,
    killPoints: 5,
    mapName: 'Bermuda',
  },
  {
    title: '🎯 BGMI Beginners Free Cup',
    description: 'New to competitive BGMI? Join this free-entry tournament designed for beginners. Learn, compete, and win!',
    prizePool: '₹1,000',
    mode: 'SOLO' as const,
    slots: 32,
    format: 'SINGLE' as const,
    mapName: 'Erangel',
  },
];

// BGMI / Free Fire rotation pool for variety
const BANNER_POOL = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
  'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b2c1f?w=800&q=80',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0); // 6 PM IST
  return d;
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Creates a batch of free tournaments for the day.
 * Designed to be called once per day (at midnight or server start).
 */
export async function createDailyFreeTournaments(): Promise<{ created: number; names: string[] }> {
  const created: string[] = [];

  // Find or use the admin user
  let admin = await prisma.user.findUnique({ where: { email: 'admin@scarfall.gg' } });
  if (!admin) {
    // Create admin if doesn't exist
    const pw = await hashPassword('admin123');
    admin = await prisma.user.create({
      data: {
        username: 'Admin',
        email: 'admin@scarfall.gg',
        passwordHash: pw,
        role: 'ADMIN',
        points: 10000,
      },
    });
  }

  // Pick 6 tournaments for today (mix of modes & formats)
  const todayBatch = FREE_TOURNAMENTS
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  for (const tpl of todayBatch) {
    const startsAt = daysFromNow(Math.floor(Math.random() * 3) + 1); // 1-3 days from now
    const regEndsAt = new Date(startsAt.getTime() - 2 * 60 * 60 * 1000); // 2hr before start

    await prisma.tournament.create({
      data: {
        title: tpl.title,
        description: tpl.description,
        bannerUrl: pick(BANNER_POOL),
        prizePool: tpl.prizePool,
        entryFee: 'Free',
        mode: tpl.mode,
        slots: tpl.slots,
        status: 'UPCOMING',
        startsAt,
        registrationEndsAt: regEndsAt,
        mapName: tpl.mapName,
        format: tpl.format,
        totalRounds: (tpl as any).totalRounds || 1,
        killPoints: (tpl as any).killPoints || 1,
        hostId: admin.id,
      },
    });

    created.push(tpl.title);
  }

  console.log(`[DailyFreeTournaments] Created ${created.length} free tournaments for today`);
  created.forEach((t) => console.log(`  → ${t}`));

  return { created: created.length, names: created };
}

/**
 * Run once on startup and then every 24 hours.
 * We check if there are already upcoming free tournaments to avoid duplicates.
 */
export async function startDailyFreeTournamentScheduler(): Promise<void> {
  console.log('[DailyFreeTournaments] Initializing scheduler...');

  // Run initial check — only create if fewer than 3 free upcoming tournaments exist
  const existingFreeUpcoming = await prisma.tournament.count({
    where: {
      entryFee: 'Free',
      status: { in: ['UPCOMING', 'REGISTRATION_OPEN'] },
    },
  });

  console.log(`[DailyFreeTournaments] Existing free upcoming tournaments: ${existingFreeUpcoming}`);

  if (existingFreeUpcoming < 4) {
    console.log('[DailyFreeTournaments] Low on free tournaments — creating daily batch...');
    await createDailyFreeTournaments();
  } else {
    console.log('[DailyFreeTournaments] Sufficient free tournaments exist, skipping initial creation.');
  }

  // Schedule daily check
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      await createDailyFreeTournaments();
    } catch (err) {
      console.error('[DailyFreeTournaments] Error creating daily batch:', err);
    }
  }, TWENTY_FOUR_HOURS);

  console.log('[DailyFreeTournaments] Scheduler active — next batch in 24 hours');
}
