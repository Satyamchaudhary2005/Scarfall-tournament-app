import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function useDiscordAuth() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const signInWithDiscord = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    if (!clientId) {
      toast.error('Discord OAuth not configured');
      return;
    }

    const redirectUri = window.location.origin;
    const scope = 'identify email';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope,
    });

    const width = 500;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      `https://discord.com/api/oauth2/authorize?${params}`,
      'discord-oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          return;
        }

        if (popup.location.origin !== window.location.origin) return;

        const hash = popup.location.hash.substring(1);
        const urlParams = new URLSearchParams(hash);
        const accessToken = urlParams.get('access_token');

        if (accessToken) {
          clearInterval(interval);
          popup.close();

          fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((res) => res.json())
            .then(async (profile) => {
              const avatarUrl = profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : undefined;

              const { user, token } = await authApi.discordAuth({
                discordId: profile.id,
                email: profile.email,
                username: profile.username,
                avatarUrl,
              });

              setAuth(user, token);
              toast.success('Signed in with Discord!');
              router.push('/');
            })
            .catch(() => toast.error('Failed to get Discord profile'));
        }
      } catch {
        // cross-origin errors expected until redirect
      }
    }, 500);
  }, [router, setAuth]);

  return { signInWithDiscord };
}
