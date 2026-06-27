import type { Metadata } from 'next';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';
import '@/styles/globals.css';
import { Providers } from './providers';
import { LiveReactionOverlay } from '@/components/home/LiveReactionOverlay';

const ServiceWorkerRegister = dynamic(
  () => import('@/components/sw-register'),
  { ssr: false }
);

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
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'TournaX - India\'s Competitive Gaming Hub',
    description:
      'India\'s premier competitive gaming platform. Join tournaments across any game, climb leaderboards, and compete with the best.',
    type: 'website',
    locale: 'en_IN',
    images: ['/logo.png'],
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
        <ServiceWorkerRegister />
        <LiveReactionOverlay />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
