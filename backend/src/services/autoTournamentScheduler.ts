import { prisma } from '../config/database';

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function getTodayAtTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function getTimeWindow(time: Date): { start: Date; end: Date } {
  const start = new Date(time);
  start.setSeconds(0, 0);
  const end = new Date(time);
  end.setSeconds(59, 999);
  return { start, end };
}

export async function executeAutoTournamentTemplate(templateId: string): Promise<{ created: number; title?: string; error?: string }> {
  const template = await prisma.autoTournamentTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) return { created: 0, error: 'Template not found' };
  if (!template.isActive) return { created: 0, error: 'Template is inactive' };

  const timeSlots = (template.scheduledTime || '18:00')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  let created = 0;

  for (const slot of timeSlots) {
    const parts = slot.split('|').map(s => s.trim());
    const timeStr = parts[0];
    const customTitle = parts[1] || null;

    const startsAt = getTodayAtTime(timeStr);
    const { start, end } = getTimeWindow(startsAt);
    const title = customTitle || template.title;

    const existing = await prisma.tournament.findFirst({
      where: {
        title,
        startsAt: { gte: start, lte: end },
      },
    });

    if (existing) continue;

    const regEndsAt = new Date(startsAt.getTime() - 2 * 60 * 60 * 1000);

    const placementPoints = template.placementPoints
      ? JSON.stringify(template.placementPoints)
      : undefined;

    await prisma.tournament.create({
      data: {
        title,
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

    created++;
  }

  if (created > 0) {
    await prisma.autoTournamentTemplate.update({
      where: { id: templateId },
      data: { lastCreatedAt: new Date() },
    });
  }

  return { created, title: template.title };
}

export async function executeAllAutoTemplates(): Promise<{ created: number; errors: number }> {
  const templates = await prisma.autoTournamentTemplate.findMany({
    where: { isActive: true },
  });

  let created = 0;
  let errors = 0;

  for (const template of templates) {
    try {
      const result = await executeAutoTournamentTemplate(template.id);
      if (result.created > 0) created += result.created;
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
