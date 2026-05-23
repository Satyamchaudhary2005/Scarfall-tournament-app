# Contributing

Thank you for your interest in ScarFall Esports Platform! Here's how you can contribute.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/scarfall-esports.git
   ```
3. Set up the project:
   ```bash
   cd backend && npm install && npx prisma generate && npx prisma db push && npm run db:seed
   cd ../frontend && npm install
   ```
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Code Style
- **TypeScript** — strict mode enabled
- **Backend** — use existing patterns (controllers, routes, services)
- **Frontend** — use existing component patterns (ui/ components)
- No commented-out code
- No console.log in production code

### Commit Guidelines
Use clear, descriptive commit messages:
- `feat: add wallet deposit system`
- `fix: resolve login redirect issue`
- `refactor: extract auth middleware`
- `docs: update API endpoints`

### Testing
- No test suite currently configured
- Manually test new features by running both servers
- Verify API endpoints return expected responses

## Project Structure

### Adding a New API Endpoint
1. Add logic in `backend/src/controllers/`
2. Define route in `backend/src/routes/`
3. Register route in `backend/src/index.ts`
4. Add Zod validation in `backend/src/utils/validators.ts` if needed

### Adding a New Frontend Page
1. Create page in `frontend/src/app/` (App Router convention)
2. Add API client method in `frontend/src/services/api.ts`
3. Add types in `frontend/src/types/index.ts`
4. Create UI components in `frontend/src/components/`

### Adding a New Database Model
1. Add model in `backend/prisma/schema.prisma`
2. Run `npx prisma db push`
3. Run `npx prisma generate`

## Pull Request Process

1. Update documentation if adding new features
2. Ensure both servers start without errors
3. Create a PR with a clear title and description
4. Wait for review

## Need Help?

Open an issue or reach out to the maintainers.
