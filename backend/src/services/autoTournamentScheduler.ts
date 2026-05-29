import { prisma } from '../config/database';

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function getNextScheduledTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

export async function executeAutoTournamentTemplate(templateId: string): Promise<{ created: boolean; title?: string; error?: string }> {
  const template = await prisma.autoTournamentTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) return { created: false, error: 'Template not found' };
  if (!template.isActive) return { created: false, error: 'Template is inactive' };

  if (template.lastCreatedAt && isToday(template.lastCreatedAt)) {
    return { created: false, error: 'Already created today' };
  }

  const startsAt = getNextScheduledTime(template.scheduledTime || '18:00');
  const regEndsAt = new Date(startsAt.getTime() - 2 * 60 * 60 * 1000);

  const placementPoints = template.placementPoints
    ? JSON.stringify(template.placementPoints)
    : undefined;

  await prisma.tournament.create({
    data: {
      title: template.title,
      description: template.description,
      bannerUrl: template.bannerUrl,
      prizePool: template.prizePool,
      entryFee: template.entryFee,
      mode: template.mode,
      slots: template.slots,
      status: 'UPCOMING',
      startsAt,
      registrationEndsAt: regEndsAt,
      mapName: template.mapName,
      rules: template.rules,
      format: template.format,
      totalRounds: template.totalRounds,
      killPoints: template.killPoints,
      placementPoints,
      hostId: template.createdBy,
    },
  });

  await prisma.autoTournamentTemplate.update({
    where: { id: templateId },
    data: { lastCreatedAt: new Date() },
  });

  console.log(`[AutoTournament] Created "${template.title}" — starts at ${startsAt.toISOString()}`);
  return { created: true, title: template.title };
}

export async function executeAllAutoTemplates(): Promise<{ created: number; errors: number }> {
  const templates = await prisma.autoTournamentTemplate.findMany({
    where: { isActive: true },
  });

  let created = 0;
  let errors = 0;

  for (const template of templates) {
    if (template.lastCreatedAt && isToday(template.lastCreatedAt)) continue;

    try {
      const result = await executeAutoTournamentTemplate(template.id);
      if (result.created) created++;
      if (result.error) errors++;
    } catch (err) {
      console.error(`[AutoTournament] Error processing template ${template.id}:`, err);
      errors++;
    }
  }

  if (created > 0) {
    console.log(`[AutoTournament] Created ${created} tournament(s) (${errors} errors)`);
  }

  return { created, errors };
}

export function startAutoTournamentScheduler(): void {
  console.log('[AutoTournament] Initializing scheduler...');

  executeAllAutoTemplates().catch((err) =>
    console.error('[AutoTournament] Initial execution error:', err)
  );

  const CHECK_INTERVAL = 60 * 60 * 1000;
  setInterval(() => {
    executeAllAutoTemplates().catch((err) =>
      console.error('[AutoTournament] Scheduled execution error:', err)
    );
  }, CHECK_INTERVAL);

  console.log('[AutoTournament] Scheduler active — checking every 60 minutes');
}
