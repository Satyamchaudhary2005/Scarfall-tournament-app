import { prisma } from './config/database';

interface TournamentData {
  title: string;
  description: string;
  prizePool: string;
  entryFee: string;
  mode: string;
  slots: number;
  format: string;
  totalRounds: number;
  killPoints: number;
  placementPoints?: string;
  status: string;
  startsAt: Date;
  registrationEndsAt?: Date;
  mapName?: string;
  rules?: string;
}

async function main() {
  console.log('🧹 Deleting all existing tournaments and related data...');

  // Delete in correct order to respect foreign keys
  await prisma.stageMatchTeam.deleteMany({});
  await prisma.stageMatch.deleteMany({});
  await prisma.tournamentStage.deleteMany({});
  await prisma.roundScore.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.tournamentRegistration.deleteMany({});
  await prisma.tournament.deleteMany({});

  console.log('✓ All existing tournaments deleted');

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.error('❌ No admin user found. Please run seed.ts first.');
    process.exit(1);
  }

  console.log(`✓ Using admin: ${admin.username} (${admin.id})`);

  // ─── Niche Tournament Definitions ────────────────────────────────────

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const threeWeeks = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

  // Placement points array: [1st, 2nd, 3rd, 4th, ..., 16th]
  const defaultPlacement = JSON.stringify([15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0]);

  // Helper to create dates at different hours
  const atHour = (base: Date, hour: number) => {
    const d = new Date(base);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const tournaments: TournamentData[] = [
    // ═══ MULTI TOURNAMENT (Multi-round & Multi-stage) ═══
    {
      title: 'BGMI Pro League - Season 5',
      description: 'The ultimate BGMI multi-round tournament featuring 8 rounds of intense battle royale action. Compete across 4 weeks with cumulative scoring. Top 16 teams advance to the Grand Finals.',
      prizePool: '₹1,50,000',
      entryFee: '₹100',
      mode: 'SQUAD',
      slots: 48,
      format: 'MULTI_ROUND',
      totalRounds: 8,
      killPoints: 2,
      placementPoints: defaultPlacement,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(twoWeeks, 16),
      registrationEndsAt: atHour(twoWeeks, 15),
      mapName: 'Erangel, Miramar, Sanhok',
      rules: '8 rounds, cumulative scoring. Top 2 placement points. 2 points per kill. Top 16 overall qualify for finals.',
    },
    {
      title: 'Free Fire World Series - Open Qualifier',
      description: 'Multi-stage Free Fire tournament. Stage 1: Open Qualifier (top 24 advance). Stage 2: Semi Finals (top 12 advance). Stage 3: Grand Finals - winner takes the crown!',
      prizePool: '₹2,00,000',
      entryFee: '₹50',
      mode: 'SQUAD',
      slots: 64,
      format: 'MULTI_STAGE',
      totalRounds: 1,
      killPoints: 1,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(threeWeeks, 14),
      registrationEndsAt: atHour(twoWeeks, 23),
      mapName: 'Bermuda, Kalahari, Alpine',
      rules: '3-stage format. Open Qualifier → Semi Finals → Grand Finals. Elimination-based advancement.',
    },
    {
      title: 'BGMI Ranked Push - 6 Round Series',
      description: 'A 6-round BGMI multi-round tournament designed for ranked point grinding. Consistent performance across all rounds wins the championship.',
      prizePool: '₹75,000',
      entryFee: '₹75',
      mode: 'DUO',
      slots: 40,
      format: 'MULTI_ROUND',
      totalRounds: 6,
      killPoints: 2,
      placementPoints: defaultPlacement,
      status: 'UPCOMING',
      startsAt: atHour(threeWeeks, 18),
      registrationEndsAt: atHour(threeWeeks, 17),
      mapName: 'Erangel, Miramar, Sanhok, Vikendi',
      rules: '6 rounds. Best 4 scores count. 2 points per kill.',
    },
    {
      title: 'Free Fire Clash Squad - Multi Round Cup',
      description: 'Free Fire Clash Squad formatted multi-round tournament. 4 rounds of 4v4 action with buy-phase strategy. Most consistent team wins.',
      prizePool: '₹50,000',
      entryFee: 'Free',
      mode: 'SQUAD',
      slots: 32,
      format: 'MULTI_ROUND',
      totalRounds: 4,
      killPoints: 1,
      placementPoints: JSON.stringify([10, 8, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0]),
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(nextWeek, 19),
      registrationEndsAt: atHour(nextWeek, 18),
      mapName: 'Bermuda, Kalahari',
      rules: '4 rounds of Clash Squad format. Buy weapons between rounds. 1 point per kill.',
    },

    // ═══ SINGLE MATCH (Single elimination, one match) ═══
    {
      title: 'BGMI Solo Showdown #1',
      description: 'One match, 100 players, winner takes all. Classic battle royale solo match with no second chances. Last squad standing wins the prize.',
      prizePool: '₹25,000',
      entryFee: '₹25',
      mode: 'SOLO',
      slots: 100,
      format: 'SINGLE',
      totalRounds: 1,
      killPoints: 1,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(tomorrow, 20),
      registrationEndsAt: atHour(tomorrow, 19),
      mapName: 'Erangel',
      rules: 'Single match. Winner takes all based on placement + kills.',
    },
    {
      title: 'Free Fire Clash Squad - Quick Match',
      description: 'Quick single-match Free Fire clash. Two teams battle in a best-of-3 Clash Squad format. Fast-paced, intense, winner takes the prize pool.',
      prizePool: '₹10,000',
      entryFee: '₹20',
      mode: 'SQUAD',
      slots: 16,
      format: 'SINGLE',
      totalRounds: 1,
      killPoints: 1,
      status: 'UPCOMING',
      startsAt: atHour(tomorrow, 22),
      mapName: 'Bermuda',
      rules: 'Best of 3 Clash Squad rounds. Single elimination bracket.',
    },
    {
      title: 'BGMI Duo Face-off',
      description: 'Single match duo tournament. 50 duos drop into Erangel. One match decides the champions. High stakes, high rewards.',
      prizePool: '₹15,000',
      entryFee: '₹30',
      mode: 'DUO',
      slots: 50,
      format: 'SINGLE',
      totalRounds: 1,
      killPoints: 1,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(nextWeek, 21),
      registrationEndsAt: atHour(nextWeek, 20),
      mapName: 'Erangel',
      rules: 'Single match duo mode. Placement + kill-based scoring.',
    },

    // ═══ FREE ENTRY (No entry fee) ═══
    {
      title: 'BGMI Free Entry Showdown',
      description: 'FREE to enter! Compete in a full BGMI battle royale match with no entry fee. Win real prizes without spending a rupee. Open to all skill levels.',
      prizePool: '₹20,000',
      entryFee: 'Free',
      mode: 'SQUAD',
      slots: 100,
      format: 'SINGLE',
      totalRounds: 1,
      killPoints: 1,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(nextWeek, 18),
      registrationEndsAt: atHour(nextWeek, 17),
      mapName: 'Erangel',
      rules: 'Free entry. Single match. Top 3 squads win prizes.',
    },
    {
      title: 'Free Fire Open For All #3',
      description: 'No entry fee required! Join this Free Fire battle royale and showcase your skills. Great for beginners and pros alike. Practice and win!',
      prizePool: '₹10,000',
      entryFee: 'Free',
      mode: 'SQUAD',
      slots: 50,
      format: 'SINGLE',
      totalRounds: 1,
      killPoints: 1,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(tomorrow, 17),
      registrationEndsAt: atHour(tomorrow, 16),
      mapName: 'Bermuda',
      rules: 'Free for all. Top 5 teams get prize money.',
    },
    {
      title: 'BGMI Beginners Cup',
      description: 'FREE entry tournament designed for new and intermediate players. A safe space to gain tournament experience without the entry fee pressure. All skill levels welcome!',
      prizePool: '₹5,000',
      entryFee: 'Free',
      mode: 'DUO',
      slots: 30,
      format: 'SINGLE',
      totalRounds: 1,
      killPoints: 1,
      status: 'UPCOMING',
      startsAt: atHour(twoWeeks, 15),
      mapName: 'Sanhok',
      rules: 'Free entry. Beginners encouraged! Top duo wins.',
    },
    {
      title: 'Free Fire Weekend Free-For-All',
      description: 'Weekend special! Zero entry fee Free Fire tournament. Bring your squad and compete for exciting prizes. No strings attached — just pure competition.',
      prizePool: '₹8,000',
      entryFee: 'Free',
      mode: 'SQUAD',
      slots: 40,
      format: 'MULTI_ROUND',
      totalRounds: 3,
      killPoints: 1,
      placementPoints: defaultPlacement,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(twoWeeks, 20),
      registrationEndsAt: atHour(twoWeeks, 19),
      mapName: 'Bermuda, Kalahari, Alpine',
      rules: 'Free entry. 3 rounds. Best combined score wins.',
    },

    // ═══ EARN PER KILL (killPoints > 0 focused) ═══
    {
      title: 'BGMI Kill Race - 100 per Kill',
      description: 'EVERY KILL COUNTS! Earn ₹100 for each elimination. This high-kill tournament rewards aggressive play. No placement camping — frag your way to the top!',
      prizePool: '₹50,000+',
      entryFee: '₹50',
      mode: 'SOLO',
      slots: 100,
      format: 'MULTI_ROUND',
      totalRounds: 3,
      killPoints: 5,
      placementPoints: defaultPlacement,
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(nextWeek, 20),
      registrationEndsAt: atHour(nextWeek, 19),
      mapName: 'Erangel, Miramar',
      rules: '₹100 per kill! 3 rounds. 5 points per kill. Placement points extra. Top killer bonus.',
    },
    {
      title: 'Free Fire Frag Fest - Kill Masters Only',
      description: 'The tournament that pays per kill! Each elimination earns you points and prize money. Show your fragging skills and become the Kill Master.',
      prizePool: '₹30,000',
      entryFee: '₹30',
      mode: 'SQUAD',
      slots: 52,
      format: 'MULTI_ROUND',
      totalRounds: 4,
      killPoints: 4,
      placementPoints: JSON.stringify([12, 10, 8, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0]),
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(twoWeeks, 19),
      registrationEndsAt: atHour(twoWeeks, 18),
      mapName: 'Bermuda, Alpine, Kalahari',
      rules: '4 rounds. 4 points per kill. Squad kill count combined. Top killer bonus prize.',
    },
    {
      title: 'BGMI Duo Kill Leaderboard',
      description: 'Duo tournament with heavy kill rewards. Each kill = 3 points. Climb the kill leaderboard and earn your share of the prize pool. Frag or be fragged!',
      prizePool: '₹20,000',
      entryFee: '₹40',
      mode: 'DUO',
      slots: 50,
      format: 'MULTI_ROUND',
      totalRounds: 3,
      killPoints: 3,
      placementPoints: defaultPlacement,
      status: 'UPCOMING',
      startsAt: atHour(twoWeeks, 21),
      registrationEndsAt: atHour(twoWeeks, 20),
      mapName: 'Erangel, Sanhok, Vikendi',
      rules: '3 rounds. 3 points per kill. Combined duo kills count.',
    },
    {
      title: 'Free Fire Kill Booyah Clash',
      description: 'Earn per kill in this high-octane Free Fire tournament. Every elimination adds to your score. Top fraggers get bonus prizes regardless of placement.',
      prizePool: '₹15,000',
      entryFee: 'Free',
      mode: 'SQUAD',
      slots: 40,
      format: 'MULTI_ROUND',
      totalRounds: 2,
      killPoints: 3,
      placementPoints: JSON.stringify([10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      status: 'REGISTRATION_OPEN',
      startsAt: atHour(nextWeek, 23),
      registrationEndsAt: atHour(nextWeek, 22),
      mapName: 'Bermuda, Kalahari',
      rules: 'FREE to enter! 2 rounds. 3 points per kill. Top fragging squad bonus.',
    },
  ];

  // ─── Create Tournaments ───────────────────────────────────────────────

  console.log(`\n📋 Creating ${tournaments.length} niche tournaments...\n`);

  for (const t of tournaments) {
    const created = await prisma.tournament.create({
      data: {
        ...t,
        startsAt: t.startsAt,
        registrationEndsAt: t.registrationEndsAt ?? null,
        hostId: admin.id,
      },
    });

    const typeLabel =
      t.format === 'MULTI_ROUND' || t.format === 'MULTI_STAGE'
        ? '📊 Multi'
        : t.format === 'SINGLE' && t.entryFee === 'Free'
        ? '🆓 Free'
        : t.killPoints > 2
        ? '💰 EPK'
        : '🎯 Single';

    console.log(`  ${typeLabel} | ${created.title.padEnd(40)} | ₹${created.prizePool.padEnd(10)} | ${created.mode.padEnd(5)} | ${created.slots} slots`);
  }

  console.log(`\n✅ ${tournaments.length} niche tournaments created successfully!`);
  console.log('\n📊 Category Breakdown:');
  console.log(`   Multi Tournament: ${tournaments.filter(t => ['MULTI_ROUND', 'MULTI_STAGE'].includes(t.format)).length}`);
  console.log(`   Single Match:     ${tournaments.filter(t => t.format === 'SINGLE' && t.entryFee !== 'Free' && t.killPoints <= 1).length}`);
  console.log(`   Free Entry:       ${tournaments.filter(t => t.entryFee === 'Free').length}`);
  console.log(`   Earn Per Kill:    ${tournaments.filter(t => t.killPoints > 2).length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
