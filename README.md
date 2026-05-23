# ScarFall Esports Platform

India's premier competitive gaming platform for **ScarFall 2.0**. Built with Next.js 14, Express.js, and Prisma.

## Tech Stack

### Frontend
- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** with custom esports design system
- **Framer Motion** for animations
- **Zustand** for state management
- **TanStack React Query** for server state
- **Socket.io Client** for real-time features
- **Lucide React** for icons

### Backend
- **Node.js** + **Express.js**
- **SQLite** (dev) / **PostgreSQL** (prod) + **Prisma ORM**
- **JWT Authentication** + Google/Discord OAuth
- **Socket.io** for real-time communication
- **Zod** for input validation
- **bcryptjs** for password hashing

## Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev          # → http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev          # → http://localhost:3000
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@scarfall.gg | admin123 |
| User | shadow@example.com | player123 |
| User | phantom@example.com | player123 |

## Features

### Authentication
- Email/password registration and login
- Google & Discord OAuth integration
- JWT-based sessions (7-day expiry)
- Role-based access control (USER, MODERATOR, ADMIN)
- Profile management (avatar, banner)

### Tournaments
- Full CRUD with prize pools, entry fees, modes
- Modes: SOLO, DUO, SQUAD
- Status workflow: UPCOMING → REGISTRATION_OPEN → LIVE → COMPLETED / CANCELLED
- Individual and clan registration
- Filtering by status, mode, and search
- Pagination

### Clans
- Full CRUD with name, tag, logo, color
- Invite system: send, accept, decline, cancel
- Join request system: apply, approve, reject
- Member management: kick, transfer leadership
- Activity log timeline
- Clan leaderboard (by points)

### Wallet System
- In-app wallet with deposit and withdraw
- Quick amount presets (₹100/500/1000/5000)
- Transaction history with type icons
- Balance displayed in navbar
- Secure transactions via Prisma

### Leaderboards
- Global player leaderboard (by points, K/D)
- Seasonal leaderboard
- Clan leaderboard (by points)

### Admin Dashboard
- Platform overview stats (auto-refresh)
- User management (role change, ban, delete)
- Tournament management (create, edit, status)
- Clan management (view members, disband)
- Report management (resolve, ban, dismiss)
- Broadcast notifications

### Real-Time
- Socket.io for live updates
- Tournament status change notifications
- New notification toasts

## Project Structure

```
├── backend/
│   ├── prisma/              # Database schema & migrations
│   ├── src/
│   │   ├── config/          # App configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth & validation
│   │   ├── routes/          # API routes
│   │   ├── services/        # Socket.io, business logic
│   │   └── utils/           # Helpers, validators
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # Reusable components
│       │   ├── ui/          # Design system
│       │   ├── layout/      # Navbar, Footer
│       │   └── home/        # Homepage sections
│       ├── services/        # API client, Socket.io
│       ├── store/           # Zustand stores
│       ├── hooks/           # Custom hooks
│       ├── types/           # TypeScript types
│       ├── lib/             # Utilities
│       └── styles/          # Global CSS
│
└── README.md
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /signup | - | Register new user |
| POST | /login | - | Login with email/password |
| POST | /oauth/google | - | Google OAuth |
| POST | /oauth/discord | - | Discord OAuth |
| POST | /supabase | - | Supabase auth sync |
| GET | /profile | Required | Get profile |
| PATCH | /profile | Required | Update profile |

### Tournaments (`/api/tournaments`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Optional | List (filter by status, mode, search) |
| GET | /live | - | Upcoming/live tournaments (top 5) |
| GET | /my-registrations | Required | User's registrations |
| GET | /:id | Optional | Tournament detail |
| POST | / | Admin | Create tournament |
| PATCH | /:id | Admin | Update tournament |
| POST | /:id/register | Required | Register (SOLO) |
| POST | /:id/clan-register | Required | Register clan (DUO/SQUAD) |
| DELETE | /:id/register | Required | Unregister |

### Clans (`/api/clans`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | - | List clans (search, paginated) |
| GET | /leaderboard | - | Top 100 clans |
| GET | /invites | Required | User's pending invites |
| GET | /search-users | Required | Search users without clan |
| GET | /:id | - | Clan detail with members |
| POST | / | Required | Create clan |
| POST | /:id/invite | Leader | Send invite |
| PATCH | /:id | Leader | Update clan settings |
| DELETE | /:id | Leader | Delete clan |
| POST | /:id/join | Required | Join via accepted invite |
| POST | /:id/leave | Required | Leave clan |
| PATCH | /invites/:id/accept | Required | Accept invite |
| PATCH | /invites/:id/decline | Required | Decline invite |
| POST | /:id/apply | Required | Apply to join |
| POST | /join-requests/:id/approve | Leader | Approve join request |
| POST | /join-requests/:id/reject | Leader | Reject join request |

### Wallet (`/api/wallet`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Required | Get wallet balance + transactions |
| POST | /deposit | Required | Deposit money |
| POST | /withdraw | Required | Withdraw money |
| GET | /transactions | Required | Transaction history |

### Leaderboard (`/api/leaderboard`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /global | - | Global player leaderboard |
| GET | /seasonal | - | Seasonal leaderboard |
| GET | /clan | - | Clan leaderboard |

### Admin (`/api/admin`) — All require ADMIN role
| Method | Path | Description |
|--------|------|-------------|
| GET | /stats | Dashboard stats |
| GET | /users | List users |
| PATCH | /users/:id/ban | Toggle ban |
| PATCH | /users/:id/role | Update role |
| DELETE | /users/:id | Delete user |
| PATCH | /tournaments/:id/status | Update tournament status |
| DELETE | /tournaments/:id | Delete tournament |
| GET | /clans | List clans |
| DELETE | /clans/:id | Disband clan |
| GET | /reports | List reports |
| PATCH | /reports/:id/resolve | Resolve report |
| POST | /notifications/broadcast | Broadcast to all |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Required | Get notifications + unread count |
| PATCH | /:id/read | Required | Mark as read |
| PATCH | /read-all | Required | Mark all as read |

### Reports (`/api/reports`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | Required | Submit report |

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

## Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```

### Backend → Render
1. Push to GitHub
2. Create Web Service on Render
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `npm start`
5. Set env vars in Render dashboard

### Database → Supabase (PostgreSQL)
1. Create Supabase project
2. Copy PostgreSQL connection string
3. Update `DATABASE_URL` in backend env
4. Run `npx prisma db push`

## License

MIT
