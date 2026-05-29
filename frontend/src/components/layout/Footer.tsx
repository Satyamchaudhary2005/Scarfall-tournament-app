'use client';

import Link from 'next/link';
import { Swords, Users, Trophy, Mail, Github, Twitter, Gamepad2, Download } from 'lucide-react';

const quickLinks = [
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/leaderboard', label: 'Leaderboard', icon: Swords },
  { href: '/clans', label: 'Clans', icon: Users },
  { href: '/download', label: 'Download App', icon: Download },
];

const socialLinks = [
  { href: '#', label: 'Discord', icon: Gamepad2 },
  { href: '#', label: 'Twitter', icon: Twitter },
  { href: '#', label: 'Email', icon: Mail },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TX</span>
              </div>
              <span className="text-white font-bold text-lg">
                Tourna<span className="text-primary">X</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm max-w-md">
              India&apos;s premier competitive gaming platform. 
              Compete in tournaments across any game, climb the leaderboards, and prove you&apos;re the best.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} TournaX. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-white/30 text-sm">
            <span>Multi-game tournament platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
