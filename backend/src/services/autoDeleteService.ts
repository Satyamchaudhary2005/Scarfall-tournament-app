import { prisma } from '../config/database';

export async function runAutoDelete(): Promise<number> {
  const now = new Date();

  const tournamentsToDelete = await prisma.tournament.findMany({
    where: {
      endsAt: { lte: now },
      status: { in: ['UPCOMING', 'COMPLETED'] },
    },
    select: { id: true, title: true },
  });

  const ids = tournamentsToDelete.map(t => t.id);

  if (ids.length === 0) return 0;

  await prisma.tournamentRegistration.deleteMany({
    where: { tournamentId: { in: ids } },
  });

  await prisma.roundScore.deleteMany({
    where: { round: { tournamentId: { in: ids } } },
  });

  await prisma.round.deleteMany({
    where: { tournamentId: { in: ids } },
  });

  await prisma.tournament.deleteMany({
    where: { id: { in: ids } },
  });

  for (const t of tournamentsToDelete) {
    console.log(`[AutoDelete] Deleted "${t.title}" (endsAt passed)`);
  }

  return ids.length;
}

export function startAutoDeleteScheduler(): void {
  console.log('[AutoDelete] Initializing scheduler...');

  runAutoDelete().catch(err =>
    console.error('[AutoDelete] Initial run error:', err)
  );

  setInterval(() => {
    runAutoDelete().catch(err =>
      console.error('[AutoDelete] Scheduled run error:', err)
    );
  }, 15 * 60 * 1000);

  console.log('[AutoDelete] Scheduler active — checking every 15 minutes');
}
