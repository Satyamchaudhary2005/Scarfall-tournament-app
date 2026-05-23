# Changelog

All notable changes to ScarFall Esports Platform will be documented in this file.

## [1.1.0] — 2026-05-23

### Added
- **Wallet System**: In-app wallet with deposit/withdraw functionality
  - `POST /api/wallet/deposit` — deposit money
  - `POST /api/wallet/withdraw` — withdraw money
  - `GET /api/wallet` — balance + transaction history
  - `GET /api/wallet/transactions` — full transaction list
- **WalletDropdown Component**: Premium UI in navbar with:
  - Custom SVG credit card logo
  - Animated balance counter
  - Deposit/Withdraw tabs with quick amount presets
  - Transaction history with type-specific icons
  - Glassmorphism design with red theme
- **Auth Fallback**: Login/signup now tries backend first, falls back to Supabase for existing users

### Changed
- Updated Prisma schema with `Wallet` and `Transaction` models
- Login page now uses backend auth primarily, Supabase as fallback
- Signup page now uses backend auth primarily, Supabase as fallback

### Fixed
- Login failing for Supabase-only users

## [1.0.0] — 2026-05-20

### Added
- **Authentication**
  - Email/password registration and login
  - JWT token-based sessions (7-day expiry)
  - Google & Discord OAuth integration
  - Supabase auth support
  - Profile management (username, avatar, banner)

- **Tournaments**
  - Full CRUD with prize pools, entry fees, modes (SOLO/DUO/SQUAD)
  - Status workflow: UPCOMING → REGISTRATION_OPEN → LIVE → COMPLETED / CANCELLED
  - Individual and clan registration
  - Filtering by status, mode, search
  - Pagination

- **Clans**
  - Full CRUD with name, tag, logo, banner, color
  - Invite system (send, accept, decline, cancel)
  - Join request system (apply, approve, reject)
  - Member management (kick, transfer leadership)
  - Activity log timeline
  - Clan leaderboard

- **Leaderboards**
  - Global player leaderboard (points, K/D ratio)
  - Seasonal leaderboard
  - Clan leaderboard

- **Admin Dashboard**
  - Platform statistics with auto-refresh
  - User management (role change, ban, delete)
  - Tournament management (create, edit, status, delete)
  - Clan management (view members, disband)
  - Report management (resolve, ban, dismiss)
  - Broadcast notifications

- **Real-Time**
  - Socket.io integration
  - Tournament status change notifications
  - New notification toasts

- **UI/UX**
  - Dark esports theme with red accents
  - Responsive mobile-first design
  - Animated page transitions (Framer Motion)
  - Scroll-triggered animations
  - Custom design system (Button, Card, Input, Badge)
