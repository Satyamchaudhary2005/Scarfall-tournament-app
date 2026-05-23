import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createTournamentSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  bannerUrl: z.string().url().optional(),
  prizePool: z.string().optional(),
  entryFee: z.string().optional(),
  mode: z.enum(['SOLO', 'DUO', 'SQUAD']),
  slots: z.number().int().min(2).max(500),
  startsAt: z.string().datetime(),
  registrationStartsAt: z.string().datetime().optional(),
  registrationEndsAt: z.string().datetime().optional(),
  mapName: z.string().optional(),
  rules: z.string().optional(),
});

export const updateTournamentSchema = createTournamentSchema.partial();

export const createClanSchema = z.object({
  name: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_ ]+$/),
  tag: z.string().min(2).max(6).regex(/^[A-Z0-9]+$/),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
});

export const clanTournamentRegistrationSchema = z.object({
  clanId: z.string().uuid(),
  playingMembers: z.array(z.string().uuid()).min(1),
  substituteMembers: z.array(z.string().uuid()).max(3).optional(),
  teamName: z.string().max(100).optional(),
});

export const createReportSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.string().min(10).max(200),
  description: z.string().max(1000).optional(),
});

export const sendInviteSchema = z.object({
  username: z.string().min(1).max(30),
});
