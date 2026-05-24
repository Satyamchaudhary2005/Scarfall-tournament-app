import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function useGoogleAuth() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const login = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (response) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        });
        const profile = await res.json();

        const { user, token } = await authApi.googleAuth({
          googleId: profile.sub,
          email: profile.email,
          username: profile.name,
          avatarUrl: profile.picture,
        });

        setAuth(user, token);
        toast.success('Signed in with Google!');
        router.push('/');
      } catch (err: any) {
        toast.error(err.message || 'Google sign-in failed');
      }
    },
    onError: () => {
      toast.error('Google sign-in failed');
    },
  });

  return { signInWithGoogle: login };
}
