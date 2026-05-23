'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/services/api';


interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateUser: (user: User) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      setAuth: (user: User, token: string) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: async (): Promise<void> => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      fetchProfile: async () => {
        try {
          const token = get().token || localStorage.getItem('token');
          if (!token) {
            set({ isLoading: false });
            return;
          }

          const { user } = await authApi.getProfile();
          set({ user, isAuthenticated: true, isLoading: false, token });
        } catch {
          // Backend unavailable — keep existing local session if we have one
          const existingUser = get().user;
          if (existingUser) {
            set({ isLoading: false });
          } else {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },

      initialize: async () => {
        const token = get().token || localStorage.getItem('token');
        const existingUser = get().user;

        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const { user } = await authApi.getProfile();
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch {
          // Backend unavailable — keep existing session if we have one
          if (existingUser) {
            set({ isLoading: false });
          } else {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        }
      },
    }),
    {
      name: 'scarfall-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
