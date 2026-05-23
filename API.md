# API Reference

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Auth Endpoints

#### POST /auth/signup
Register a new user.

```json
{
  "username": "PlayerOne",
  "email": "player@example.com",
  "password": "securepassword123"
}
```

**Response** `201`:
```json
{
  "message": "Account created successfully",
  "user": { "id": "uuid", "username": "PlayerOne", "email": "player@example.com", "role": "USER" },
  "token": "jwt_token_here"
}
```

#### POST /auth/login
Login with email and password.

```json
{ "email": "admin@scarfall.gg", "password": "admin123" }
```

**Response** `200`:
```json
{
  "message": "Login successful",
  "user": { "id": "uuid", "username": "Admin", "email": "admin@scarfall.gg", "role": "ADMIN" },
  "token": "jwt_token_here"
}
```

#### POST /auth/oauth/google
Google OAuth authentication.

```json
{
  "googleId": "google_id",
  "email": "user@gmail.com",
  "username": "GoogleUser",
  "avatarUrl": "https://..."
}
```

#### POST /auth/oauth/discord
Discord OAuth authentication.

```json
{
  "discordId": "discord_id",
  "email": "user@discord.com",
  "username": "DiscordUser",
  "avatarUrl": "https://..."
}
```

#### POST /auth/supabase
Supabase auth sync.

```json
{
  "supabaseId": "supabase_id",
  "email": "user@example.com",
  "username": "SupabaseUser",
  "avatarUrl": "https://..."
}
```

#### GET /auth/profile
Get authenticated user's profile. *(Auth required)*

**Response**:
```json
{
  "user": {
    "id": "uuid", "username": "Admin", "email": "admin@scarfall.gg",
    "avatarUrl": null, "role": "ADMIN", "points": 10000, "kills": 0,
    "deaths": 0, "matchesPlayed": 200, "wins": 50,
    "clanId": null, "clanRole": null, "clan": null, "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /auth/profile
Update profile. *(Auth required)*

```json
{ "username": "NewName", "avatarUrl": "https://...", "bannerUrl": "https://..." }
```

---

## Tournaments

#### GET /tournaments
List tournaments with optional filters.

**Query params**: `?status=REGISTRATION_OPEN&mode=SOLO&search=battle&page=1&limit=12`

**Response**:
```json
{
  "tournaments": [{ "id": "uuid", "title": "ScarFall Pro League", "prizePool": "₹1,00,000", "mode": "SQUAD", "status": "REGISTRATION_OPEN", "slots": 100, "entryFee": "Free", "_count": { "registrations": 25 } }],
  "pagination": { "page": 1, "limit": 12, "total": 4, "totalPages": 1 }
}
```

#### GET /tournaments/live
Get upcoming/live tournaments (up to 5).

#### GET /tournaments/my-registrations
Get current user's registrations. *(Auth required)*

#### GET /tournaments/:id
Get single tournament with full registration details.

#### POST /tournaments
Create tournament. *(Admin/Mod only)*

```json
{
  "title": "New Tournament",
  "description": "Description here",
  "prizePool": "₹50,000",
  "entryFee": "₹100",
  "mode": "SQUAD",
  "slots": 64,
  "startsAt": "2026-06-01T10:00:00Z",
  "registrationEndsAt": "2026-05-30T23:59:59Z",
  "mapName": "Erangel",
  "rules": "Standard rules"
}
```

#### PATCH /tournaments/:id
Update tournament. *(Admin/Mod only)*

#### POST /tournaments/:id/register
Register for SOLO tournament. *(Auth required)*

```json
{ "teamName": "SoloWarrior" }
```

#### POST /tournaments/:id/clan-register
Register clan for DUO/SQUAD tournament. *(Auth required, clan leader)*

```json
{
  "clanId": "clan-uuid",
  "playingMembers": ["user-uuid-1", "user-uuid-2"],
  "substituteMembers": ["user-uuid-3"],
  "teamName": "Team Alpha"
}
```

#### DELETE /tournaments/:id/register
Unregister from tournament. *(Auth required)*

---

## Clans

#### GET /clans
List clans. `?search=phoenix&page=1&limit=20`

#### GET /clans/leaderboard
Top 100 clans by points.

#### GET /clans/invites
User's pending clan invites. *(Auth required)*

#### GET /clans/search-users
Search users without a clan. `?q=username` *(Auth required, min 2 chars)*

#### GET /clans/:id
Clan detail with members, stats, and activity logs.

#### POST /clans
Create clan. *(Auth required)*

```json
{
  "name": "Phoenix Rising",
  "tag": "PHNX",
  "description": "We rise from the ashes",
  "color": "#ff1f1f"
}
```

#### POST /clans/:id/invite
Send invite by username. *(Leader only)*

```json
{ "username": "PlayerName" }
```

#### PATCH /clans/:id
Update clan settings. *(Leader only)*

#### DELETE /clans/:id
Delete clan. *(Leader only)*

#### POST /clans/:id/join
Join clan via accepted invite. *(Auth required)*

#### POST /clans/:id/leave
Leave clan. *(Auth required, leader disbands if last member)*

#### PATCH /clans/invites/:id/accept
Accept clan invite. *(Auth required)*

#### PATCH /clans/invites/:id/decline
Decline clan invite. *(Auth required)*

#### POST /clans/:id/apply
Apply to join clan. *(Auth required)*

#### POST /clans/join-requests/:id/approve
Approve join request. *(Leader only)*

#### POST /clans/join-requests/:id/reject
Reject join request. *(Leader only)*

#### DELETE /clans/:clanId/members/:userId
Kick member. *(Leader only)*

#### POST /clans/:id/transfer-leadership
Transfer clan ownership. *(Leader only)*

```json
{ "newLeaderId": "user-uuid" }
```

#### GET /clans/:id/invites
Get clan's sent invites. *(Leader only)*

#### GET /clans/:id/join-requests
Get join requests. *(Leader only)*

#### GET /clans/:id/activity-logs
Get activity logs (last 50).

---

## Wallet

#### GET /wallet
Get wallet balance with recent 50 transactions. *(Auth required)*

**Response**:
```json
{
  "wallet": {
    "id": "uuid", "balance": 1500, "userId": "uuid",
    "transactions": [
      { "id": "uuid", "type": "DEPOSIT", "amount": 500, "status": "COMPLETED", "createdAt": "2026-05-23T..." }
    ]
  }
}
```

#### POST /wallet/deposit
Add money to wallet. *(Auth required)*

```json
{ "amount": 500 }
```

#### POST /wallet/withdraw
Withdraw money from wallet. *(Auth required)*

```json
{ "amount": 200 }
```

#### GET /wallet/transactions
Get all transactions (last 100). *(Auth required)*

**Transaction types**: `DEPOSIT`, `WITHDRAW`, `TOURNAMENT_FEE`, `TOURNAMENT_WINNING`, `CLAN_FEE`

---

## Leaderboard

#### GET /leaderboard/global
Global player leaderboard. `?search=shadow&page=1&limit=20`

#### GET /leaderboard/seasonal
Seasonal leaderboard. `?season=Season%201&page=1&limit=20`

#### GET /leaderboard/clan
Clan leaderboard. `?search=phoenix&page=1&limit=20`

---

## Admin *(ADMIN role required)*

#### GET /admin/stats
Platform overview stats.

```json
{
  "stats": {
    "totalUsers": 11, "totalClans": 3, "totalTournaments": 4,
    "totalMatches": 1103, "liveTournaments": 1, "pendingReports": 0
  }
}
```

#### GET /admin/users
List users. `?search=admin&page=1&limit=20`

#### PATCH /admin/users/:id/ban
Toggle user ban status.

#### PATCH /admin/users/:id/role
Update user role.

```json
{ "role": "MODERATOR" }
```

#### DELETE /admin/users/:id
Delete user with full cleanup.

#### GET /admin/tournaments/:id
Get tournament with all registrations.

#### PATCH /admin/tournaments/:id/status
Update tournament status.

```json
{ "status": "LIVE" }
```

#### DELETE /admin/tournaments/:id
Delete tournament.

#### GET /admin/clans
List all clans. `?search=phoenix&page=1&limit=20`

#### DELETE /admin/clans/:id
Disband clan with cleanup.

#### GET /admin/reports
List reports. `?status=PENDING&page=1&limit=20`

#### PATCH /admin/reports/:id/resolve
Resolve report.

```json
{ "status": "RESOLVED", "action": "WARN" }
```

#### POST /admin/notifications/broadcast
Broadcast notification to all users.

```json
{
  "title": "Server Maintenance",
  "message": "The server will be down for 2 hours.",
  "type": "SYSTEM",
  "link": "/announcements"
}
```

---

## Notifications *(Auth required)*

#### GET /notifications
Get last 50 notifications with unread count.

#### PATCH /notifications/:id/read
Mark single notification as read.

#### PATCH /notifications/read-all
Mark all notifications as read.

---

## Reports *(Auth required)*

#### POST /reports
Submit a report against another user.

```json
{
  "reportedId": "user-uuid",
  "reason": "Cheating in tournament match",
  "description": "They were using aimbots during the final round."
}
```

---

## Error Responses

```json
{ "error": "Invalid email or password" }
{ "error": "No token provided" }
{ "error": "Token expired" }
{ "error": "Insufficient permissions" }
{ "error": "Route not found" }
{ "error": "Internal server error" }
```

Validation errors include details:

```json
{
  "error": "Invalid input",
  "details": [{ "code": "too_small", "message": "Username must be at least 3 characters", "path": ["username"] }]
}
```

---

## WebSocket Events

Connect with JWT token:

```js
const socket = io('http://localhost:5000', {
  auth: { token: 'jwt_token' }
});
```

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join:tournament` | `{ tournamentId }` | Join tournament room |
| `leave:tournament` | `{ tournamentId }` | Leave tournament room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `notification:new` | `{ id, type, title, message }` | New notification |
| `tournament:update` | `{ tournament }` | Tournament updated |
| `tournament:status` | `{ tournamentId, status }` | Status changed |
| `leaderboard:update` | `{ leaderboard }` | Leaderboard changed |
