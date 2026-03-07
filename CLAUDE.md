# CLAUDE.md

## Project Overview

GA4 analytics dashboard for Principle Auto Group's two dealerships (Toyota and INFINITI). Full-stack TypeScript app with React frontend, Express backend, and Google Analytics 4 Data API integration. Deployed to Google Cloud Run.

**Live URL:** `https://ga4-dashboard-454058386823.us-central1.run.app`

## Quick Reference

```bash
npm run dev          # Start client (Vite :5173) + server (tsx :3000) concurrently
npm run build        # Build client (Vite) + server (tsc) to dist/
npm start            # Run production server from dist/server/index.js
npm test             # Run Jest tests (53 tests across 3 files)
npm run lint         # ESLint on src/
npm run type-check   # TypeScript strict check (tsconfig.json)
```

## Tech Stack

- **Frontend:** React 18, TypeScript 5.3, Vite 5, Tailwind CSS 3 (dark theme), Chart.js 4
- **Backend:** Express 4, TypeScript 5.3, @google-analytics/data (GA4 API)
- **Testing:** Jest 29, ts-jest
- **Infra:** Google Cloud Run, GitHub Actions CI/CD, Docker (node:20-alpine multi-stage)

## Project Structure

```
src/
├── shared/              # Shared types (types.ts) and constants (constants.ts)
├── server/
│   ├── index.ts         # Express app entry, routes, security headers
│   ├── middleware/auth.ts
│   ├── routes/
│   │   ├── auth.ts      # Google OAuth flow, session management
│   │   └── dashboard.ts # Dashboard API, 15-min in-memory cache
│   └── services/
│       ├── ga4Service.ts      # GA4 API calls (5 parallel fetches per store)
│       └── analysisEngine.ts  # 8 benchmark checks + callout generation
└── client/
    ├── main.tsx         # React DOM entry
    ├── App.tsx          # Root component with auth gating
    ├── hooks/           # useAuth, useDashboardData (with retry)
    ├── pages/           # 8 lazy-loaded pages (Overview, Traffic, etc.)
    └── components/      # Layout, KPICard, DataTable, charts/
tests/                   # analysisEngine, chartData, engagement tests
.github/workflows/       # deploy.yml (main→Cloud Run), pr-checks.yml
```

## Architecture

### Data Flow
1. Client authenticates via Google OAuth (cookie-based sessions, HMAC-SHA256 signed)
2. `GET /api/dashboard-data` checks 15-min in-memory cache
3. Cache miss triggers 5 parallel GA4 API calls per store (traffic, engagement, conversions, audience, YoY)
4. Analysis engine runs 8 benchmark checks, generates issues and callouts
5. Response cached and returned to client

### Two Stores
| Store | GA4 Property ID | Accent Color |
|-------|----------------|--------------|
| Principle Toyota of Hernando | 358670218 | Red (#dc2626) |
| Principle INFINITI of Boerne | 308058481 | Indigo (#6366f1) |

### Auth
- Google OAuth 2.0 with optional email whitelist (`ALLOWED_EMAILS` env var)
- Session tokens: `base64url(payload).hmac_signature` — no JWT dependency, uses Node.js crypto
- Secure httpOnly cookies, 7-day expiry

## Code Conventions

- **TypeScript strict mode** enabled for both client and server
- **Path aliases:** `@shared/*`, `@client/*`, `@server/*` (configured in tsconfig + vite + jest)
- **Separate tsconfigs:** `tsconfig.json` (client, ESNext modules) and `tsconfig.server.json` (server, CommonJS)
- **ESLint:** `@typescript-eslint/no-explicit-any` is warn (not error). Unused vars prefixed with `_` are allowed
- **Styling:** Tailwind CSS with custom `dashboard-*` color tokens. Dark theme only. Store-specific accent colors via `toyota` and `infiniti` color tokens
- **React patterns:** Tab-based navigation (not React Router), lazy-loaded pages with Suspense, all pages receive `data: StoreDashboardData` prop
- **No unused dependencies:** `react-router-dom` is installed but unused (tab nav used instead)

## Environment Variables

Required for local development (see `.env.example`):
```
GCP_PROJECT_ID, GA4_PROPERTY_ID_TOYOTA, GA4_PROPERTY_ID_INFINITI
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET
PORT (default 3000), NODE_ENV
```

## CI/CD

- **PR checks** (`pr-checks.yml`): lint → type-check → test → build
- **Deploy** (`deploy.yml`): On push to main → lint → type-check → test → Docker build → push to Artifact Registry → deploy to Cloud Run → smoke test `/api/health`
- Install command: `npm ci --legacy-peer-deps` (required due to peer dep conflicts)

## Testing

- 53 tests in `tests/` directory (analysisEngine, chartData, engagement)
- All tests are Node.js environment (not jsdom)
- Run with `npm test` or `npm run test:watch`
- CI uses `npm test -- --passWithNoTests`

## Known Gotchas

- Dockerfile CMD path is `dist/server/server/index.js` (nested server dir from tsc output)
- Cache is global, not per-store — both stores refresh together
- GA4 API has ~10-minute data latency
- Vite dev server proxies `/api/*` to localhost:3000
