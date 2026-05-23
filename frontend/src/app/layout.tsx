import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'ScarFall Esports - India\'s Competitive ScarFall Hub',
    template: '%s | ScarFall Esports',
  },
  description:
    'India\'s premier competitive gaming platform for ScarFall 2.0. Join tournaments, climb leaderboards, and compete with the best players in the country.',
  keywords: [
    'ScarFall',
    'ScarFall 2.0',
    'Esports',
    'Mobile Gaming',
    'Battle Royale',
    'Tournaments',
    'India Gaming',
  ],
  openGraph: {
    title: 'ScarFall Esports - India\'s Competitive ScarFall Hub',
    description:
      'India\'s premier competitive gaming platform for ScarFall 2.0. Join tournaments, climb leaderboards, and compete with the best.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-white/90">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
