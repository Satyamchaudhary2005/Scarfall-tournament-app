import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPrize(prize: string) {
  return prize;
}

export function calculateKd(kills: number, deaths: number) {
  if (deaths === 0) return kills;
  return (kills / deaths).toFixed(2);
}

export function calculateWinRate(wins: number, matches: number) {
  if (matches === 0) return '0';
  return ((wins / matches) * 100).toFixed(1);
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function getInitials(name: string) {
  return name
    .split(/[\s_]+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'LIVE':
      return 'text-green-500';
    case 'REGISTRATION_OPEN':
      return 'text-blue-500';
    case 'UPCOMING':
      return 'text-yellow-500';
    case 'COMPLETED':
      return 'text-gray-500';
    case 'CANCELLED':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
}

export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'LIVE':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'REGISTRATION_OPEN':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'UPCOMING':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'COMPLETED':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}
