# Architecture

## System Overview

```
┌─────────────┐      HTTP/WebSocket      ┌──────────────┐      Prisma      ┌──────────┐
│  Frontend   │ ◄──────────────────────► │   Backend    │ ◄─────────────► │  SQLite  │
│  Next.js 14 │    localhost:3000/5000   │  Express.js  │                  │ /Postgres│
│  App Router │                          │  Socket.io   │                  │          │
└─────────────┘                          └──────────────┘                  └──────────┘
```

## Frontend Architecture

### Layer Structure

```
app/                          # Next.js App Router pages
├── page.tsx                  # Homepage
├── auth/                     # Login, Signup
├── tournaments/              # List, Detail
├── clans/                    # List, Detail, Create, Invites
├── leaderboard/              # Global, Seasonal, Clan
├── profile/                  # User profile
└── admin/                    # Admin dashboard

components/
├── ui/                       # Design system (Button, Card, Input, Badge, WalletDropdown)
├── layout/                   # Navbar, Footer
└── home/                     # HeroSection, StatsSection, etc.

services/
├── api.ts                    # HTTP client (fetch), all API methods
├── socket.ts                 # Socket.io singleton
└── supabase-auth.ts          # Supabase auth fallback

store/
└── authStore.ts              # Zustand auth state (persisted to localStorage)

hooks/
└── useSocket.ts              # Socket connection hook

types/
└── index.ts                  # All TypeScript interfaces
```

### State Management
- **Zustand** with `persist` middleware for auth state
- **TanStack React Query** for all server data (caching, refetching)
- localStorage for JWT token

### Data Flow
1. User action → component calls API service
2. API service sends fetch request with JWT
3. Backend validates, processes, returns JSON
4. React Query updates cache → UI re-renders
5. Socket.io pushes real-time updates

## Backend Architecture

### Layer Structure

```
src/
├── index.ts                  # Express app setup, route registration
├── seed.ts                   # Database seeder

├── config/
│   ├── index.ts              # Environment config
│   └── database.ts           # Prisma client singleton

├── middleware/
│   └── auth.ts               # authenticate, requireRole, optionalAuth

├── controllers/
│   ├── auth.controller.ts    # Signup, login, OAuth, profile
│   ├── tournament.controller.ts  # Tournament CRUD, registration
│   ├── clan.controller.ts    # Clan CRUD, invites, members
│   ├── admin.controller.ts   # Dashboard, user/tournament/clan management
│   ├── leaderboard.controller.ts  # Global, seasonal, clan leaderboards
│   └── wallet.controller.ts  # Deposit, withdraw, balance, transactions

├── routes/
│   ├── auth.routes.ts
│   ├── tournament.routes.ts
│   ├── clan.routes.ts
│   ├── admin.routes.ts
│   ├── leaderboard.routes.ts
│   ├── notification.routes.ts
│   ├── report.routes.ts
│   └── wallet.routes.ts

├── services/
│   └── socket.ts             # Socket.io init, room management, emit helpers

└── utils/
    ├── helpers.ts            # JWT, bcrypt, pagination, stat calculations
    └── validators.ts         # Zod schemas for all inputs
```

### Authentication Flow
1. User sends credentials to `/api/auth/login`
2. Server validates with Zod, finds user, compares bcrypt hash
3. Server returns JWT `{ userId, role }` signed with secret
4. Frontend stores token in localStorage
5. Subsequent requests include `Authorization: Bearer <token>`
6. Middleware verifies JWT, attaches user to `req.user`

### Database Schema

```
User ────┬── Clan (member)
         ├── Clan (leader)
         ├── Tournament (host)
         ├── TournamentRegistration
         ├── Wallet ──── Transaction[]
         ├── LeaderboardEntry
         ├── Notification (sent/received)
         ├── Report (reported/reporter)
         └── ClanActivityLog / ClanInvite / ClanJoinRequest
```

### Real-Time (Socket.io)
- Authenticated users join `user:{userId}` room
- Clients join `tournament:{tournamentId}` room for live updates
- Server emits: `notification:new`, `tournament:update`, `tournament:status`, `leaderboard:update`

## Security

- **Helmet** for HTTP headers
- **CORS** restricted to frontend origin
- **JWT** with 7-day expiry
- **bcrypt** (12 rounds) for password hashing
- **Zod** validation on all inputs
- Role-based access (USER, MODERATOR, ADMIN)
- No sensitive data in error messages

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | SQLite (dev) / PostgreSQL (prod) | Zero-config dev, scalable prod |
| ORM | Prisma | Type-safe queries, migrations |
| Auth | JWT | Stateless, simple, no sessions |
| State | Zustand + React Query | Lightweight, proven pattern |
| Styling | TailwindCSS | Rapid development, consistent design |
| Animation | Framer Motion | React-native animation library |
| Real-time | Socket.io | Reliable, fallback to polling |
| Validation | Zod | TypeScript-first, composable |
