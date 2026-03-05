# GA4 Analytics Dashboard

**Principle Auto Group — Real-Time Dealership Web Analytics**

Live web application for monitoring GA4 analytics across dealerships with smart issue detection, educational insights, and automotive industry benchmarking.

**Live:** https://ga4-dashboard-454058386823.us-central1.run.app

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (dark theme) + Chart.js 4
- **Backend:** Node.js + Express + GA4 Data API (v1beta)
- **Auth:** Google OAuth 2.0 with HMAC-SHA256 session cookies
- **Hosting:** Google Cloud Run (scales to zero)
- **CI/CD:** GitHub Actions with Workload Identity Federation

## Stores

| Store | GA4 Property ID | Accent Color |
|-------|----------------|--------------|
| Principle Toyota of Hernando | 358670218 | Red (#dc2626) |
| Principle INFINITI of Boerne | 308058481 | Indigo (#6366f1) |

## Quick Start

```bash
npm install --legacy-peer-deps
cp .env.example .env        # Fill in your values
npm run dev                  # Client on :5173, server on :3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run client + server in development |
| `npm run build` | Production build (client + server) |
| `npm start` | Start production server |
| `npm test` | Run 53 tests |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript type check |

## Project Structure

```
src/
  client/          # React frontend (pages, components, hooks)
  server/          # Express backend (routes, services, middleware)
  shared/          # Shared types and constants
tests/             # Jest test files (53 tests)
docs/              # Development plan and project status report
.github/workflows/ # CI/CD pipeline
```

## Documentation

- **[Project Status & Handoff Report](docs/PROJECT-STATUS.md)** — Architecture, troubleshooting, known issues, and full technical reference
- **[Development Plan](docs/GA4-Dashboard-Development-Plan.md)** — Original sprint plan and feature specifications

## Status

All 6 sprints complete. Dashboard is live with Google OAuth login and email-based access restriction.
