'use client';

import { createClient } from '@/utils/supabase/client';
import { authApi } from './api';
import type { AuthResponse, User } from '@/types';

const supabase = createClient();

/**
 * Creates a local User object from Supabase session data (fallback when backend is unavailable)
 */
function createLocalUser(supabaseUser: any, username?: string): User {
  return {
    id: supabaseUser.id,
    username: username || supabaseUser.email?.split('@')[0] || 'Player',
    email: supabaseUser.email || '',
    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
    bannerUrl: null,
    role: 'USER',
    points: 0,
    kills: 0,
    deaths: 0,
    matchesPlayed: 0,
    wins: 0,
    clanId: null,
    clanRole: null,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  };
}

/**
 * Tries to sync the Supabase user with the backend.
 * Falls back to a local-only session if backend is unavailable.
 */
async function syncWithBackend(supabaseUser: any, username: string): Promise<AuthResponse> {
  try {
    return await authApi.supabaseAuth({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email!,
      username,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
    });
  } catch (error) {
    // Backend unavailable — create local session from Supabase data
    console.warn('Backend sync failed, using local Supabase session:', error);
    return {
      message: 'Signed in with Supabase',
      user: createLocalUser(supabaseUser, username),
      token: '',
    };
  }
}

/**
 * Try to re-sync with the backend using an existing Supabase session.
 * This recovers stale sessions where the token was empty (backend was down during login).
 */
export async function reSyncSupabaseAuth(): Promise<AuthResponse | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const supabaseUser = session.user;
    const username = supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'Player';

    return await authApi.supabaseAuth({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email!,
      username,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
    });
  } catch {
    return null;
  }
}

export const supabaseAuthService = {
  signup: async (email: string, password: string, username: string): Promise<AuthResponse> => {
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) throw error;
    if (!data.user) throw new Error('Signup failed. Please check if email confirmation is required.');

    // Sync with backend (non-blocking — falls back to local session if backend is down)
    return syncWithBackend(data.user, username);
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Login with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    const username = data.user.user_metadata?.username || data.user.email!.split('@')[0];

    // Sync with backend (non-blocking — falls back to local session if backend is down)
    return syncWithBackend(data.user, username);
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Supabase logout error:', error);
  },

  getSession: async () => {
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
