import type { Metadata } from 'next';
import Script from 'next/script';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'TournaX - India\'s Competitive Gaming Hub',
    template: '%s | TournaX',
  },
  description:
    'India\'s premier competitive gaming platform. Join tournaments across any game, climb leaderboards, and compete with the best players in the country.',
  keywords: [
    'TournaX',
    'Esports',
    'Gaming Tournaments',
    'Mobile Gaming',
    'PC Gaming',
    'Console Gaming',
    'Tournaments',
    'India Gaming',
  ],
  openGraph: {
    title: 'TournaX - India\'s Competitive Gaming Hub',
    description:
      'India\'s premier competitive gaming platform. Join tournaments across any game, climb leaderboards, and compete with the best.',
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
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
