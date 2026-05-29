'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { clanApi } from '@/services/api';
import { Button } from '@/components/ui';
import { WalletDropdown } from '@/components/ui/WalletDropdown';
import { cn } from '@/lib/utils';
import { isNativeApp } from '@/utils/platform';
import {
  Menu,
  X,
  Trophy,
  LayoutDashboard,
  Users,
  Swords,
  LogOut,
  User,
  ChevronDown,
  Mail,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home', icon: null },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/leaderboard', label: 'Leaderboard', icon: Swords },
  { href: '/clans', label: 'Clans', icon: Users },
  { href: '/download', label: 'Download', icon: Download },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isNativeApp());
  }, []);

  const visibleLinks = navLinks.filter(l => !(inApp && l.href === '/download'));

  const clansHref = user?.clanId ? `/clans/${user.clanId}` : '/clans';

  // Fetch pending invites count
  const { data: invitesData } = useQuery({
    queryKey: ['clan-invites'],
    queryFn: () => clanApi.getMyInvites(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const pendingInvitesCount = invitesData?.invites?.length || 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-surface/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="TournaX" className="w-8 h-8 rounded-lg" />
            <span className="text-white font-bold text-lg hidden sm:block">
              Tourna<span className="text-primary">X</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const effectiveHref = link.label === 'Clans' ? clansHref : link.href;
              return (
                <Link
                  key={link.href}
                  href={effectiveHref}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <WalletDropdown />
                <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {user.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white/80 hidden sm:block">
                    {user.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4 text-white/50" />
                          <span className="text-sm">Profile</span>
                        </Link>
                        {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                          <Link
                            href="/organizer/tournaments"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Trophy className="w-4 h-4 text-white/50" />
                            <span className="text-sm">My Tournaments</span>
                          </Link>
                        )}
                          <Link
                            href="/clans/invites"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors relative"
                          >
                            <Mail className="w-4 h-4 text-white/50" />
                            <span className="text-sm">Clan Invites</span>
                            {pendingInvitesCount > 0 && (
                              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-primary text-white rounded-full min-w-[18px] text-center">
                                {pendingInvitesCount}
                              </span>
                            )}
                          </Link>
                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-white/50" />
                            <span className="text-sm">Admin Panel</span>
                          </Link>
                        )}
                        <hr className="my-1 border-white/5" />
                        <button
                          onClick={logout}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors w-full text-left text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {isMobileOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface/95 backdrop-blur-xl border-b border-white/5"
          >
            <div className="px-4 py-3 space-y-1">
              {visibleLinks.map((link) => {
                const isActive = pathname === link.href;
                const effectiveHref = link.label === 'Clans' ? clansHref : link.href;
                const effectiveActive = link.label === 'Clans'
                  ? pathname.startsWith('/clans')
                  : isActive;
                return (
                  <Link
                    key={link.href}
                    href={effectiveHref}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      effectiveActive
                        ? 'text-white bg-white/10'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <Link
                  href="/clans/invites"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Clan Invites
                  {pendingInvitesCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-primary text-white rounded-full">
                      {pendingInvitesCount}
                    </span>
                  )}
                </Link>
              )}
              {!isAuthenticated && (
                <div className="pt-3 space-y-2">
                  <Link href="/auth/login" className="block w-full">
                    <Button variant="secondary" className="w-full">Login</Button>
                  </Link>
                  <Link href="/auth/signup" className="block w-full">
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
