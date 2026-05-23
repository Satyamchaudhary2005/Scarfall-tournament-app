import { prisma } from './config/database';
import { hashPassword } from './utils/helpers';

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@scarfall.gg' },
    update: {},
    create: {
      username: 'Admin',
      email: 'admin@scarfall.gg',
      passwordHash: adminPassword,
      role: 'ADMIN',
      points: 10000,
      wins: 50,
      matchesPlayed: 200,
    },
  });
  console.log(`✓ Admin user created: ${admin.username}`);

  // Create sample users
  const users = [
    { username: 'ShadowStrike', email: 'shadow@example.com', points: 8500, kills: 1200, deaths: 400, wins: 45, matchesPlayed: 180 },
    { username: 'PhantomX', email: 'phantom@example.com', points: 7200, kills: 980, deaths: 350, wins: 38, matchesPlayed: 150 },
    { username: 'BlazeFury', email: 'blaze@example.com', points: 6800, kills: 890, deaths: 420, wins: 32, matchesPlayed: 140 },
    { username: 'NightHawk', email: 'nighthawk@example.com', points: 6100, kills: 750, deaths: 300, wins: 28, matchesPlayed: 120 },
    { username: 'StormBreaker', email: 'storm@example.com', points: 5400, kills: 680, deaths: 380, wins: 22, matchesPlayed: 110 },
    { username: 'CrimsonTide', email: 'crimson@example.com', points: 4800, kills: 590, deaths: 310, wins: 18, matchesPlayed: 95 },
    { username: 'IronClad', email: 'iron@example.com', points: 4200, kills: 520, deaths: 290, wins: 15, matchesPlayed: 85 },
    { username: 'VenomStrike', email: 'venom@example.com', points: 3800, kills: 480, deaths: 260, wins: 12, matchesPlayed: 78 },
    { username: 'FrostByte', email: 'frost@example.com', points: 3200, kills: 410, deaths: 240, wins: 10, matchesPlayed: 65 },
    { username: 'ThunderBolt', email: 'thunder@example.com', points: 2800, kills: 350, deaths: 220, wins: 8, matchesPlayed: 55 },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const password = await hashPassword('player123');
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { ...userData, passwordHash: password, role: 'USER' },
    });
    createdUsers.push(user);
  }
  console.log(`✓ ${users.length} sample users created`);

  // Create clans
  const clans = [
    { name: 'Phoenix Rising', tag: 'PHNX', leader: createdUsers[0], color: '#ff1f1f' },
    { name: 'Shadow Elite', tag: 'SHDW', leader: createdUsers[1], color: '#6b21a8' },
    { name: 'Fury Squad', tag: 'FURY', leader: createdUsers[2], color: '#ea580c' },
  ];

  for (let i = 0; i < clans.length; i++) {
    const clan = await prisma.clan.upsert({
      where: { tag: clans[i].tag },
      update: {},
      create: {
        name: clans[i].name,
        tag: clans[i].tag,
        leaderId: clans[i].leader.id,
        color: clans[i].color,
        points: 5000 - i * 500,
        wins: 30 - i * 5,
        matchesPlayed: 100 - i * 10,
      },
    });
    await prisma.user.update({
      where: { id: clans[i].leader.id },
      data: { clanId: clan.id, clanRole: 'LEADER' },
    });
  }
  console.log(`✓ ${clans.length} clans created`);

  // Create sample tournaments
  const tournaments = [
    {
      title: 'ScarFall Pro League - Season 1',
      prizePool: '₹1,00,000',
      entryFee: 'Free',
      mode: 'SQUAD' as const,
      slots: 100,
      status: 'REGISTRATION_OPEN' as const,
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      hostId: admin.id,
    },
    {
      title: 'Weekend Warrior Cup #4',
      prizePool: '₹25,000',
      entryFee: '₹50',
      mode: 'DUO' as const,
      slots: 64,
      status: 'REGISTRATION_OPEN' as const,
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      registrationEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      hostId: admin.id,
    },
    {
      title: 'Solo Showdown #12',
      prizePool: '₹10,000',
      entryFee: '₹20',
      mode: 'SOLO' as const,
      slots: 50,
      status: 'UPCOMING' as const,
      startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      registrationEndsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      hostId: admin.id,
    },
    {
      title: 'Clan Wars Championship',
      prizePool: '₹50,000',
      entryFee: 'Free',
      mode: 'SQUAD' as const,
      slots: 32,
      status: 'LIVE' as const,
      startsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      hostId: admin.id,
    },
  ];

  for (const tournament of tournaments) {
    await prisma.tournament.create({ data: tournament });
  }
  console.log(`✓ ${tournaments.length} tournaments created`);

  // Create leaderboard entries
  for (let i = 0; i < createdUsers.length; i++) {
    await prisma.leaderboardEntry.create({
      data: {
        userId: createdUsers[i].id,
        score: createdUsers[i].points,
        kills: createdUsers[i].kills,
        deaths: createdUsers[i].deaths,
        wins: createdUsers[i].wins,
        matchesPlayed: createdUsers[i].matchesPlayed,
        type: 'GLOBAL',
      },
    });
  }
  console.log(`✓ ${createdUsers.length} leaderboard entries created`);

  console.log('\n✅ Database seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
