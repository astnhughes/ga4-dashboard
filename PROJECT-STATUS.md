# GA4 Dashboard — Project Status & Handoff Report

> **Last updated:** March 5, 2026
> **Status:** LIVE IN PRODUCTION
> **Live URL:** https://ga4-dashboard-454058386823.us-central1.run.app

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [File Inventory](#file-inventory)
5. [Authentication & Access Control](#authentication--access-control)
6. [GA4 Data Pipeline](#ga4-data-pipeline)
7. [Analysis Engine](#analysis-engine)
8. [Frontend Pages & Components](#frontend-pages--components)
9. [Infrastructure & Deployment](#infrastructure--deployment)
10. [Environment Variables & Secrets](#environment-variables--secrets)
11. [Development Setup](#development-setup)
12. [Testing](#testing)
13. [Sprint History](#sprint-history)
14. [Known Issues & Gotchas](#known-issues--gotchas)
15. [Open Items](#open-items)
16. [Troubleshooting Guide](#troubleshooting-guide)
17. [Future Development Ideas](#future-development-ideas)

---

## Project Overview

A real-time GA4 analytics dashboard built for **Principle Auto Group**, serving two dealership properties:

| Property | GA4 Property ID | Accent Color | Primary Market |
|----------|----------------|--------------|----------------|
| Principle Toyota of Hernando | 358670218 | #dc2626 (red) | Hernando, MS |
| Principle INFINITI of Boerne | 308058481 | #6366f1 (indigo) | San Antonio / Boerne, TX |

The dashboard pulls data from GA4 via the Data API, runs it through an analysis engine with 8 automotive industry benchmark checks, and renders it as an interactive dark-themed dashboard with 6 tab views plus a guide page.

**Key capabilities:**
- 4 headline KPIs with year-over-year comparisons
- Channel breakdown, device analysis, top pages, event tracking, city-level audience data
- Automated issue detection (critical/high/medium/low severity)
- Good callouts, bad callouts, and quick-win recommendations
- Educational panels explaining every metric in plain English
- Google OAuth login with email-based access restriction
- 15-minute server-side cache
- Lazy-loaded pages with skeleton loading states

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.3.3 | Type safety |
| Vite | 5.0.10 | Build tool & dev server |
| Tailwind CSS | 3.4.0 | Styling (dark theme) |
| Chart.js | 4.4.1 | Charts |
| react-chartjs-2 | 5.2.0 | React Chart.js bindings |
| react-router-dom | 6.21.0 | Installed but not used as router (tab-based nav) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Express | 4.18.2 | HTTP server |
| TypeScript | 5.3.3 | Type safety |
| @google-analytics/data | 4.8.0 | GA4 Data API v1beta |
| Node.js crypto | built-in | HMAC-SHA256 session signing |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Google Cloud Run | Container hosting (scales to zero) |
| Google Artifact Registry | Docker image storage |
| GitHub Actions | CI/CD pipeline |
| Workload Identity Federation | Keyless GCP auth from GitHub Actions |
| Docker (node:20-alpine) | Multi-stage container build |

### Dev Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| Jest | 29.7.0 | Test runner |
| ts-jest | 29.1.1 | TypeScript Jest transform |
| ESLint | 8.56.0 | Linting |
| tsx | 4.7.0 | Dev server (watch mode) |
| concurrently | 8.2.2 | Run client + server in parallel |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  React App (Vite build) → Lazy-loaded pages             │
│  useAuth hook → checks /api/auth/me on mount            │
│  useDashboardData hook → fetches /api/dashboard-data    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                   Cloud Run (Express)                   │
│                                                         │
│  ┌─── Public Routes ───┐  ┌─── Protected Routes ───┐   │
│  │ GET  /api/health     │  │ GET /api/dashboard-data│   │
│  │ GET  /api/auth/login │  │ GET /api/store/:id     │   │
│  │ GET  /api/auth/cbk   │  │ POST /api/refresh      │   │
│  │ GET  /api/auth/me    │  └────────┬───────────────┘   │
│  │ POST /api/auth/logout│           │ requireAuth()     │
│  └──────────────────────┘           │ middleware         │
│                                     │                    │
│  ┌──────────────────────────────────▼───────────────┐   │
│  │           15-min In-Memory Cache                  │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │ cache miss                     │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │           GA4 Service (5 parallel API calls)      │   │
│  │  • fetchTrafficData     → channels, daily trend   │   │
│  │  • fetchEngagementData  → devices, top pages      │   │
│  │  • fetchConversionData  → events, daily convs     │   │
│  │  • fetchAudienceData    → cities                  │   │
│  │  • fetchYoYData         → year-over-year KPIs     │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │           Analysis Engine (8 checks)              │   │
│  │  • Unassigned traffic   • Bot traffic detection   │   │
│  │  • Conversion breaks    • Low organic search      │   │
│  │  • Low conversion rate  • High bounce rate        │   │
│  │  • Phantom events       • Low engagement          │   │
│  │  + Good callouts, bad callouts, quick wins        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              GA4 Data API v1beta
         (Service Account auth via ADC)
```

### Request Flow
1. User visits Cloud Run URL → gets static React app (SPA)
2. React app calls `GET /api/auth/me` → returns user or 401
3. If 401 → show Login page → user clicks "Sign in with Google"
4. OAuth flow: Google consent → callback → HMAC-signed session cookie
5. Authenticated: React calls `GET /api/dashboard-data`
6. Server checks 15-min cache → if miss, runs 5 parallel GA4 API calls per store (10 total)
7. Raw data parsed → analysis engine runs 8 benchmark checks → response returned
8. Frontend renders KPIs, charts, tables, issues, callouts

---

## File Inventory

### Source Files (~3,800 lines)

```
src/
├── shared/
│   ├── types.ts                 # All TypeScript interfaces (123 lines)
│   └── constants.ts             # Store configs, benchmarks, date range (32 lines)
│
├── server/
│   ├── index.ts                 # Express app setup, routes, security headers (54 lines)
│   ├── routes/
│   │   ├── auth.ts              # OAuth login/callback/me/logout (188 lines)
│   │   └── dashboard.ts         # Dashboard data + cache + refresh (106 lines)
│   ├── services/
│   │   ├── ga4Service.ts        # GA4 API calls + data parsing (492 lines)
│   │   └── analysisEngine.ts    # 8 benchmark checks + callouts (378 lines)
│   └── middleware/
│       └── auth.ts              # requireAuth middleware (19 lines)
│
├── client/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component with auth gating (95 lines)
│   ├── pages/
│   │   ├── Login.tsx            # Google sign-in page (46 lines)
│   │   ├── Overview.tsx         # KPIs, charts, issues, callouts
│   │   ├── Traffic.tsx          # Channel breakdown, trends
│   │   ├── Engagement.tsx       # Device + page analysis
│   │   ├── Conversions.tsx      # Events, lead tracking
│   │   ├── Audience.tsx         # City-level geographic data
│   │   ├── Technical.tsx        # All events + technical detail
│   │   └── Guide.tsx            # Educational user guide
│   ├── components/
│   │   ├── Layout.tsx           # Header, tabs, store switcher, user menu (180 lines)
│   │   ├── KPICard.tsx          # Metric card with YoY badge
│   │   ├── DataTable.tsx        # Sortable data table
│   │   ├── IssueCard.tsx        # Issue display with severity badge
│   │   ├── EducationalPanel.tsx # Expandable educational sections
│   │   ├── Skeleton.tsx         # Loading skeleton animations
│   │   └── charts/
│   │       ├── LineChart.tsx     # Time-series line charts
│   │       ├── BarChart.tsx      # Horizontal/vertical bar charts
│   │       └── DoughnutChart.tsx # Doughnut/pie charts
│   └── hooks/
│       ├── useAuth.ts           # Auth state management (40 lines)
│       └── useDashboardData.ts  # Dashboard data fetching with refresh
```

### Config Files

```
Root/
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # Client TypeScript config
├── tsconfig.server.json         # Server TypeScript config (lib: ES2020, no DOM)
├── vite.config.ts               # Vite config with dev proxy
├── tailwind.config.js           # Tailwind with custom dark theme tokens
├── postcss.config.js            # PostCSS with Tailwind + Autoprefixer
├── jest.config.ts               # Jest with ts-jest
├── .eslintrc.json               # ESLint rules (relaxed for dashboard)
├── Dockerfile                   # Multi-stage build (node:20-alpine)
├── docker-compose.yml           # Local Docker development
├── .dockerignore                # Docker build exclusions
├── .env.example                 # Environment variable template
├── .gitignore                   # Git exclusions
└── .github/
    └── workflows/
        └── deploy.yml           # CI/CD: test → build → push → deploy → smoke test
```

### Test Files

```
tests/
├── analysisEngine.test.ts       # 12 tests for all 8 benchmark checks
├── chartData.test.ts            # 29 tests for chart data processing
└── engagement.test.ts           # 12 tests for engagement calculations
```

**Total: 53 tests passing**

---

## Authentication & Access Control

### Flow
1. User visits app → `useAuth` hook calls `GET /api/auth/me`
2. No session cookie → returns 401 → app shows Login page
3. User clicks "Sign in with Google" → redirected to `GET /api/auth/login`
4. Server builds Google OAuth URL with `response_type=code`, `scope=email profile`
5. User completes Google consent → redirected to `GET /api/auth/callback`
6. Server exchanges authorization code for tokens at `https://oauth2.googleapis.com/token`
7. Server fetches user info from `https://www.googleapis.com/oauth2/v3/userinfo`
8. Server checks `ALLOWED_EMAILS` env var (if set) — rejects unauthorized emails with 403
9. Server creates HMAC-SHA256 signed session token (7-day expiry)
10. Sets HTTP-only cookie: `session=<base64url-payload>.<hmac-signature>`
11. Redirects to `/` (production) or `http://localhost:5173/` (development)

### Session Token Format
```
<base64url(JSON payload)>.<HMAC-SHA256 signature>
```
Payload: `{ email, name, picture, exp }` where `exp` is Unix timestamp (Date.now() + 7 days)

### Security Properties
- HTTP-only cookie (no JavaScript access)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)
- No external JWT library — pure Node.js `crypto.createHmac`
- Express `trust proxy` set for Cloud Run (correct `req.protocol` behind load balancer)

### Authorized Users (ALLOWED_EMAILS on Cloud Run)
```
austin.hughes@principleauto.com
msmith@principleauto.com
dlund@principleauto.com
ken.hess@principleautomotive.com
garrett.mcdonald@principleauto.com
bill.mckibbin@principleauto.com
mark@crranch.net
```

### Modifying Authorized Users
To add/remove users, update the Cloud Run env var:
```bash
gcloud run services update ga4-dashboard \
  --region us-central1 \
  --update-env-vars "^||^ALLOWED_EMAILS=email1@example.com,email2@example.com,..."
```
Note: The `^||^` prefix is required because gcloud uses commas as delimiters for multiple env vars. This sets `||` as the delimiter instead.

---

## GA4 Data Pipeline

### API Calls (per store, 5 parallel)

| Function | Dimensions | Metrics | Purpose |
|----------|-----------|---------|---------|
| `fetchTrafficData` | sessionDefaultChannelGroup, date | sessions, totalUsers, newUsers, conversions, engagementRate | Channel breakdown + daily trend |
| `fetchEngagementData` | deviceCategory, pagePath | sessions, engagementRate, bounceRate, averageSessionDuration, screenPageViewsPerSession | Device + page analysis |
| `fetchConversionData` | eventName, date | eventCount, conversions, totalUsers | Event tracking + daily conversions |
| `fetchAudienceData` | city, region | sessions, totalUsers, engagementRate, averageSessionDuration | Geographic analysis |
| `fetchYoYData` | sessionDefaultChannelGroup | sessions, totalUsers, conversions | Year-over-year comparison |

### Data Flow
1. **Fetch**: 5 parallel `analyticsClient.runReport()` calls per store, 2 stores = 10 API calls
2. **Parse**: Raw GA4 response rows → typed data structures (ChannelData, DeviceData, etc.)
3. **Analyze**: 8 benchmark checks → Issue objects with severity, explanation, fix steps
4. **Cache**: In-memory with 15-minute TTL
5. **Respond**: JSON with `stores`, `lastUpdated`, `cached` flag

### Date Range
- Current: last 90 days (configurable via `DATE_RANGE_DAYS` in constants.ts)
- YoY comparison: same 90-day window from previous year

### Service Account Authentication
The GA4 Data API authenticates via Application Default Credentials (ADC). On Cloud Run, this uses the service account assigned to the service:
```
ga4-dashboard@infiniti-489300.iam.gserviceaccount.com
```
This service account has **Viewer** role on both GA4 properties.

---

## Analysis Engine

### 8 Benchmark Checks

| Check | Threshold | Severity | What It Detects |
|-------|-----------|----------|-----------------|
| Unassigned Traffic | >10% critical, >5% high | critical/high | Tracking misconfiguration hiding channel attribution |
| Bot Traffic | Low engagement from known bot cities | high | Spam/bot sessions from Lanzhou, Ashburn, Boardman, etc. |
| Conversion Break | Drop to 0 or >40% day-over-day | critical | Tracking code removal or GTM container changes |
| Low Organic Search | <15% of total traffic | medium | Poor SEO performance |
| Low Conversion Rate | <1.5% | medium | Below automotive industry benchmark |
| High Bounce Rate | >40% weighted average | medium | Poor landing page experience |
| Phantom Events | Lead events with >5x count/user ratio | high | Duplicate tracking or automated event firing |
| Low Engagement | <55% engagement rate | low | Content not resonating with visitors |

### Configurable Benchmarks (src/shared/constants.ts)
```typescript
export const BENCHMARKS = {
  unassignedTrafficCritical: 0.1,
  unassignedTrafficHigh: 0.05,
  botEngagementThreshold: 0.4,
  conversionDropThreshold: 0.4,
  organicSearchMinShare: 0.15,
  siteConversionRate: 0.015,
  bounceRateMax: 0.4,
  phantomEventRatio: 5,
  engagementRateMin: 0.55,
};
```

### Automotive Event Classification
Events are classified as `lead`, `engagement`, or `system`:
- **Lead events**: form_submission, phone_call, chat_start, contact_dealer, get_directions, schedule_service, request_quote, asc_form_submission, mcm_form_submission
- **Engagement events**: page_view, scroll, click, file_download, video_start, vehicle_detail_page, vdp_view, srp_view
- **System events**: everything else

### Primary Market Detection
Cities are flagged as `primary-market` based on store:
- **Toyota of Hernando**: hernando, southaven, olive branch, horn lake, memphis
- **INFINITI of Boerne**: boerne, san antonio, fair oaks, helotes, leon valley

---

## Frontend Pages & Components

### Pages

| Tab | Component | Key Features |
|-----|-----------|-------------|
| Overview | `Overview.tsx` | 4 KPI cards with YoY, session trend chart, issues list, good/bad callouts, quick wins |
| Traffic | `Traffic.tsx` | Channel breakdown bar chart, channel data table, traffic source education |
| Engagement | `Engagement.tsx` | Device comparison, top pages table, session duration analysis |
| Conversions | `Conversions.tsx` | Daily conversion trend, event table with classification, lead funnel education |
| Audience | `Audience.tsx` | City-level table with flags (primary-market, bot, anomaly), geographic insights |
| Technical | `Technical.tsx` | Full event table, system events, event health analysis |
| Guide | `Guide.tsx` | 20+ educational panels explaining metrics and GA4 concepts |

### Reusable Components

| Component | Purpose |
|-----------|---------|
| `Layout.tsx` | App shell: header, store switcher, tab nav, date range, cache status, user menu |
| `KPICard.tsx` | Metric card with value, label, YoY change badge (green/red), optional trend sparkline |
| `DataTable.tsx` | Sortable table with column definitions, number formatting |
| `IssueCard.tsx` | Issue display with severity badge, "What This Means" and "How to Fix" sections |
| `EducationalPanel.tsx` | Expandable section with educational content |
| `Skeleton.tsx` | Loading skeleton animations matching real layout |
| `LineChart.tsx` | Chart.js line chart wrapper with theme integration |
| `BarChart.tsx` | Chart.js bar chart (horizontal/vertical) with formatValue prop |
| `DoughnutChart.tsx` | Chart.js doughnut chart wrapper |

### Design System (Tailwind)
Dark theme with custom tokens defined in `tailwind.config.js`:
- `dashboard-bg`: #0f1117 (near-black background)
- `dashboard-card`: #1a1d27 (card background)
- `dashboard-card-hover`: #22252f
- `dashboard-border`: #2a2d37
- `dashboard-text-primary`: #e4e4e7
- `dashboard-text-muted`: #a1a1aa
- `success`: #22c55e, `danger`: #ef4444, `warning`: #f59e0b

---

## Infrastructure & Deployment

### Cloud Run Configuration
| Setting | Value |
|---------|-------|
| Service Name | ga4-dashboard |
| Region | us-central1 |
| Image | us-central1-docker.pkg.dev/infiniti-489300/ga4-dashboard/ga4-dashboard:\<sha\> |
| Service Account | ga4-dashboard@infiniti-489300.iam.gserviceaccount.com |
| Memory | 512Mi |
| CPU | 1 |
| Min Instances | 0 (scales to zero) |
| Max Instances | 3 |
| Concurrency | 80 |
| Timeout | 60s |
| Auth | Allow unauthenticated (OAuth handled in-app) |

### CI/CD Pipeline (`.github/workflows/deploy.yml`)
Triggers on push to `main`:
1. **Checkout** → actions/checkout@v4
2. **Setup Node.js** → v20 with npm cache
3. **Install** → `npm ci --legacy-peer-deps`
4. **Lint** → `npm run lint`
5. **Type check** → `tsc --noEmit`
6. **Test** → `npm test -- --passWithNoTests`
7. **Auth to GCP** → Workload Identity Federation (keyless)
8. **Build Docker** → Multi-stage (node:20-alpine)
9. **Push to Artifact Registry** → Tagged with git SHA + latest
10. **Deploy to Cloud Run** → With `--update-env-vars` (preserves existing vars)
11. **Smoke test** → `curl /api/health` returns 200

### Docker Build (multi-stage)
```
Stage 1 (builder): node:20-alpine
  → npm ci → vite build → tsc -p tsconfig.server.json

Stage 2 (production): node:20-alpine
  → npm ci --omit=dev → COPY dist/client + dist/server
  → NODE_ENV=production, PORT=8080
  → CMD ["node", "dist/server/server/index.js"]
```

### Workload Identity Federation
GitHub Actions authenticates to GCP without service account keys:
- WIF Pool: `github-actions`
- WIF Provider: `github-repo`
- Service Account: stored in `WIF_SERVICE_ACCOUNT` GitHub secret
- Provider: stored in `WIF_PROVIDER` GitHub secret

---

## Environment Variables & Secrets

### GitHub Secrets (6 configured)
| Secret | Purpose |
|--------|---------|
| `GCP_PROJECT_ID` | infiniti-489300 |
| `WIF_PROVIDER` | Workload Identity Federation provider resource name |
| `WIF_SERVICE_ACCOUNT` | WIF service account email |
| `OAUTH_CLIENT_ID` | Google OAuth client ID for login |
| `OAUTH_CLIENT_SECRET` | Google OAuth client secret |
| `SESSION_SECRET` | HMAC-SHA256 key for session token signing |

### Cloud Run Env Vars (4 set)
| Variable | Source | Notes |
|----------|--------|-------|
| `GOOGLE_CLIENT_ID` | GitHub secret `OAUTH_CLIENT_ID` | Set by deploy workflow |
| `GOOGLE_CLIENT_SECRET` | GitHub secret `OAUTH_CLIENT_SECRET` | Set by deploy workflow |
| `SESSION_SECRET` | GitHub secret `SESSION_SECRET` | Set by deploy workflow |
| `ALLOWED_EMAILS` | Set manually via gcloud CLI | NOT in deploy workflow — preserved by `--update-env-vars` |

### OAuth Redirect URIs (GCP Console)
- `https://ga4-dashboard-454058386823.us-central1.run.app/api/auth/callback`
- `http://localhost:3000/api/auth/callback`

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm
- A `.env` file (copy from `.env.example`)

### Quick Start
```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy env file and fill in values
cp .env.example .env

# Run in development (client on :5173, server on :3000)
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run type-check

# Production build
npm run build
npm start
```

### Vite Dev Proxy
In development, the Vite dev server (port 5173) proxies `/api` requests to the Express server (port 3000). This is configured in `vite.config.ts`.

### Local OAuth
To test OAuth locally:
1. Create OAuth credentials in GCP Console
2. Add `http://localhost:3000/api/auth/callback` as authorized redirect URI
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
4. After OAuth callback, the server redirects to `http://localhost:5173/` (dev mode)

---

## Testing

### Test Files
| File | Tests | Coverage |
|------|-------|----------|
| `tests/analysisEngine.test.ts` | 12 | All 8 benchmark checks + edge cases |
| `tests/chartData.test.ts` | 29 | Chart data processing, formatting, sorting |
| `tests/engagement.test.ts` | 12 | Engagement calculations, device metrics |

### Running Tests
```bash
npm test                    # Run all tests once
npm run test:watch          # Watch mode
npm test -- --verbose       # Verbose output
```

### Test Configuration
- Jest with ts-jest transform
- Module aliases resolved via `moduleNameMapper` in `jest.config.ts`
- `--passWithNoTests` flag in CI to avoid failure on empty test runs

---

## Sprint History

### Sprint 1: Project Foundation (8 issues, all closed)
- Scaffold React + Express + TypeScript project
- Add Dockerfile, docker-compose, CI/CD workflows
- Configure Tailwind dark theme, ESLint, Jest

### Sprint 2: Core Dashboard (9 issues, all closed)
- GA4 service with 5 parallel API calls
- Analysis engine with 8 benchmark checks
- Dashboard API with 15-minute cache
- Overview page with KPIs, charts, issues

### Sprint 3: Traffic + Engagement (8 issues, all closed)
- Traffic page with channel breakdown charts
- Engagement page with device + page analysis
- Chart components (Line, Bar, Doughnut)
- DataTable with sortable columns

### Sprint 4: Conversions + Audience + Technical (8 issues, all closed)
- Conversions page with event classification
- Audience page with city-level data + flags
- Technical page with all events
- Tests for chart data and engagement

### Sprint 5: Polish & Performance (7 issues, all closed)
- Mobile responsive design
- Lazy loading with Suspense
- Skeleton loading states
- Error handling and retry logic
- Performance optimization

### Sprint 6: Testing & Deployment (9 issues)
- [x] #42 Accessibility improvements
- [x] #45 Security headers
- [x] #47 User guide page
- [ ] #41 Cross-browser testing (ATX)
- [ ] #43 Data accuracy verification (ATX)
- [ ] #44 End-to-end testing (ATX)
- [ ] #46 Add team members to IAP (ATX)
- [ ] #48 Team walkthrough (ATX)
- [ ] #49 Monitor first week (ATX)

### Post-Sprint: Authentication (added after Sprint 6)
- Google OAuth 2.0 login flow
- HMAC-SHA256 session tokens
- Email-based access restriction
- Service account configuration fix

---

## Known Issues & Gotchas

### Critical: ALLOWED_EMAILS Not in Deploy Workflow
The `ALLOWED_EMAILS` env var is set manually on Cloud Run and is NOT part of the deploy workflow. The deploy uses `--update-env-vars` which **merges** (does not replace) env vars, so it is preserved across deploys. However, if the Cloud Run service is ever deleted and recreated, ALLOWED_EMAILS will need to be re-set manually.

### TypeScript Server vs Client Configs
The server (`tsconfig.server.json`) has `lib: ["ES2020"]` without DOM types. This means `fetch().json()` returns `unknown`, not `any`. Any new server code using fetch must add type assertions:
```typescript
const data = (await response.json()) as { expected: string };
```

### npm --legacy-peer-deps
Required everywhere (local install, CI, Docker) due to a ts-jest peer dependency conflict. Always use `npm ci --legacy-peer-deps` or `npm install --legacy-peer-deps`.

### gcloud Comma Delimiter
When updating env vars that contain commas (like ALLOWED_EMAILS), use the custom delimiter syntax:
```bash
gcloud run services update SERVICE --update-env-vars "^||^KEY=value,with,commas"
```

### Cloud Run Service Account
The Cloud Run service MUST have `--service-account` explicitly set. Without it, Cloud Run defaults to the Compute Engine default service account, which does NOT have GA4 API access. This caused a production incident during initial deploy.

### Chart.js Type Compatibility
The `BarChart` component's `formatValue` prop must accept `(value: number | string) => string` because Chart.js passes both types during label formatting.

### Layout TABS Type
The `TABS` array in Layout.tsx needs an explicit type annotation `{ id: string; label: string; disabled?: boolean }[]` because TypeScript can't infer the optional `disabled` property when no entries have it.

---

## Open Items

### ATX (User) Tasks
| Issue | Title | Status |
|-------|-------|--------|
| #41 | Cross-browser testing | Open |
| #43 | Data accuracy verification | Open |
| #44 | End-to-end testing | Open |
| #46 | Add team members to IAP | Open |
| #48 | Team walkthrough | Open |
| #49 | Monitor first week | Open |

### Potential Improvements (not scoped)
- Add ALLOWED_EMAILS as a GitHub secret and include in deploy workflow
- Firestore caching (Phase 2 — env var placeholder exists)
- Custom domain setup
- Date range picker (currently fixed at 90 days)
- Data export (CSV/PDF)
- Scheduled email reports
- Additional stores (currently hardcoded for 2 stores)

---

## Troubleshooting Guide

### "Failed to load dashboard" after login
1. Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision" --limit=20 --format="table(timestamp,textPayload)"`
2. Most likely cause: GA4 API permission denied
3. Verify service account: `gcloud run services describe ga4-dashboard --region us-central1 --format="value(spec.template.spec.serviceAccountName)"`
4. Should show: `ga4-dashboard@infiniti-489300.iam.gserviceaccount.com`
5. Verify GA4 property access: Check both GA4 properties have the service account added as Viewer

### OAuth "redirect_uri_mismatch"
1. Go to GCP Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
2. Verify authorized redirect URIs include: `https://ga4-dashboard-454058386823.us-central1.run.app/api/auth/callback`
3. For local dev: `http://localhost:3000/api/auth/callback`

### "Access denied" after login
1. User's email is not in ALLOWED_EMAILS
2. Check current value: `gcloud run services describe ga4-dashboard --region us-central1 --format="yaml(spec.template.spec.containers[0].env)"`
3. Update: `gcloud run services update ga4-dashboard --region us-central1 --update-env-vars "^||^ALLOWED_EMAILS=email1,email2,..."`

### Deploy fails at ESLint
The `.eslintrc.json` relaxes several rules. If new lint errors appear, check:
- `react/no-unescaped-entities` → turned off
- `@typescript-eslint/no-explicit-any` → warning only
- Unused vars with `_` prefix are allowed

### Deploy succeeds but site shows old version
1. Check Cloud Run revision: the deploy might have succeeded but the revision isn't serving traffic
2. Check smoke test output in GitHub Actions logs
3. Hard refresh the browser (Cmd+Shift+R) — could be browser cache

### ALLOWED_EMAILS disappeared
If env var was lost (e.g., someone ran `--set-env-vars` instead of `--update-env-vars`):
```bash
gcloud run services update ga4-dashboard \
  --region us-central1 \
  --update-env-vars "^||^ALLOWED_EMAILS=austin.hughes@principleauto.com,msmith@principleauto.com,dlund@principleauto.com,ken.hess@principleautomotive.com,garrett.mcdonald@principleauto.com,bill.mckibbin@principleauto.com,mark@crranch.net"
```

### Data looks wrong or stale
1. Click the "Refresh" button in the dashboard header to force a cache bust
2. This calls `POST /api/refresh` which clears the 15-minute cache
3. If still wrong, check GA4 property data directly in GA4 console

---

## Future Development Ideas

### Phase 2 (Firestore Cache)
Replace in-memory cache with Firestore for persistence across Cloud Run cold starts. The `.env.example` already has a `FIRESTORE_COLLECTION` placeholder.

### Additional Stores
The architecture supports adding stores by:
1. Adding entries to `STORES` in `src/shared/constants.ts`
2. Adding GA4 property IDs
3. Granting service account access to new properties
4. The frontend auto-renders store switcher buttons from the STORES object

### Date Range Picker
Currently hardcoded to 90 days. Adding a date range picker would require:
1. Frontend date picker component
2. Passing date range as query params to API
3. Updating GA4 service to accept dynamic date ranges
4. Updating cache key to include date range

### Scheduled Reports
Could add email reports using Cloud Scheduler → Cloud Run endpoint → generate report → send via email API.

---

## Commit History (oldest → newest)

```
07ac93d Initial commit: README and development plan
1698c9c Add .gitignore and .env.example
53e1f33 Scaffold React + Express + TypeScript project structure
a32a68e Add Dockerfile, docker-compose, and .dockerignore
370e6ae Add GitHub Actions CI/CD workflows (PR checks + deploy)
4ffd623 Fix server build: update rootDir and static file paths
3aff74f Add GA4 service and analysis engine for Sprint 2
906f5ac Add dashboard API endpoints with caching
2ce7053 Build Sprint 2 frontend: navigation shell, KPI cards, issues, Overview
eefe5d0 Add Sprint 2 tests for analysis engine (12 tests passing)
a2ce931 Add Sprint 3: Traffic + Engagement tabs with charts and education
eff3886 Add Sprint 3 tests: chart data, sorting, engagement calculations
dc13a5a Add Sprint 4: Conversions, Audience, Technical pages + tests
b6f72f2 Add Sprint 5: Polish, performance, and mobile responsiveness
cc64347 Add Sprint 6: Accessibility, security headers, user guide
e8090d7 Fix ESLint errors blocking CI/CD deployment
37ae03c Add Google OAuth login flow
23b5e6a Fix TypeScript strict types for fetch responses in auth routes
e3b4bcc Set Cloud Run service account in deploy workflow
```

---

## GitHub Project Board

**URL:** https://github.com/users/astnhughes/projects/2

All 49 issues are tracked on this board with Sprint, Priority, Size, Category, and Owner fields. 43 issues are closed (Done), 6 remain open (all assigned to ATX/user for manual testing and team onboarding).
