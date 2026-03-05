# DEVELOPMENT PLAN

---

## Principle Auto Group
### GA4 Analytics Dashboard

*Live Web Application for Dealership Analytics*
*Google Cloud Platform | React | GA4 Data API*

*Prepared: March 2026 — Version 1.0*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture](#architecture)
3. [Dashboard Features](#dashboard-features)
4. [Google Cloud Platform Setup](#google-cloud-platform-setup)
5. [GitHub Repository Structure](#github-repository-structure)
6. [Implementation Sprints](#implementation-sprints)
7. [Future Expansion Roadmap](#future-expansion-roadmap)
8. [Getting Started: What Happens Next](#getting-started-what-happens-next)
9. [Appendix: Store Configuration](#appendix-store-configuration)

---

## Executive Summary

This document outlines the complete development plan for building a live GA4 analytics dashboard for Principle Auto Group. The dashboard will serve as a real-time monitoring and educational tool for dealership web marketing performance across two stores: Principle Toyota of Hernando and Principle INFINITI of Boerne.

The application will be a hosted web app on Google Cloud Platform, accessible only to authorized team members via Google OAuth. It will pull fresh GA4 data on each load, highlight areas needing attention against automotive industry benchmarks, and provide plain-English explanations and step-by-step improvement recommendations.

> **Key Goal:** Build a dashboard that turns raw GA4 data into actionable insights for a team that is learning web marketing, with smart highlighting of problems and built-in guidance on how to fix them.

### What We Are Building

- A web application hosted on Google Cloud Platform (Cloud Run)
- Google OAuth authentication restricting access to 2–5 authorized team members
- Real-time GA4 data for both dealerships, switchable via a store dropdown
- 6-tab interface: Overview + Good/Bad/Ugly, Traffic, Engagement, Conversions, Audience, and Technical
- Smart issue detection that surfaces problems ranked by severity (Critical, High, Medium, Low)
- Educational expandable panels explaining every metric in plain English
- Expansion-ready architecture for Google Ads, CRM/DMS, and inventory data in future phases

### Technology Stack Overview

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + TypeScript | Component-based UI, type safety, strong ecosystem |
| Charts | Chart.js 4.x | Matches existing audit reports, lightweight, flexible |
| Styling | Tailwind CSS | Rapid dark-theme styling, consistent with audit design system |
| Backend API | Node.js + Express | JavaScript full-stack, fast GA4 API proxy, simple auth middleware |
| Data Source | GA4 Data API (v1beta) | Same API used by current audit reports via Analytics MCP |
| Hosting | Google Cloud Run | Serverless containers, auto-scaling, pay-per-use, zero ops |
| Auth | Google OAuth 2.0 + IAP | Google accounts your team already has, enterprise-grade security |
| Database | Firestore (optional) | Cache layer for faster loads, stores historical snapshots |
| CI/CD | GitHub Actions | Automated testing and deployment on every push |
| Repo | GitHub | Version control, project board, sprint tracking |

---

## Architecture

### System Overview

The application follows a standard three-tier architecture: a React frontend served as static files, a Node.js backend API that handles authentication and GA4 data fetching, and Google Cloud infrastructure for hosting and security.

| Component | Description | Runs On |
|-----------|------------|---------|
| React Frontend | Single-page app with 6 tabs, store switcher, dark theme, Chart.js charts | Cloud Run (static) |
| Node.js API | Express server: auth middleware, GA4 Data API calls, analysis engine | Cloud Run (container) |
| GA4 Data API | Google Analytics reporting API providing sessions, users, events, etc. | Google Cloud (managed) |
| Identity-Aware Proxy | Google IAP gates access, only authorized Google accounts can reach the app | Google Cloud (managed) |
| Firestore (Phase 2) | Optional caching + historical data storage for trend analysis | Google Cloud (managed) |

### Data Flow

Here is how data moves through the system from the moment a user opens the dashboard:

1. User opens the dashboard URL in their browser
2. Google Identity-Aware Proxy checks their Google account against the authorized list
3. If authorized, the React frontend loads (fast static files from Cloud Run)
4. Frontend calls the backend API: `GET /api/dashboard-data?store=all`
5. Backend authenticates the request, then makes 5 parallel GA4 Data API calls per store (10 total)
6. Backend runs the analysis engine: compares metrics against automotive benchmarks, detects issues
7. Backend returns combined data + analysis results as JSON to the frontend
8. Frontend renders charts, KPI cards, issue cards, and educational panels
9. User switches stores via dropdown — frontend re-renders from cached data (no new API call)

### GA4 API Calls (Per Store)

Each store requires 5 API calls to the GA4 Data API. Both stores are fetched in parallel, so all 10 calls complete in roughly 10–15 seconds.

| Call | Dimensions | Metrics | Purpose |
|------|-----------|---------|---------|
| Traffic | sessionDefaultChannelGroup, date | sessions, totalUsers, newUsers, conversions, engagementRate | Channel breakdown + daily trend |
| Engagement | deviceCategory, pagePath | sessions, engagementRate, bounceRate, avgSessionDuration, screenPageViewsPerSession | Device + top pages |
| Conversions | eventName, date | eventCount, conversions, totalUsers | Events table + daily trend |
| Audience | city, region | sessions, totalUsers, engagementRate, avgSessionDuration | Geo breakdown + bot detection |
| YoY Comparison | sessionDefaultChannelGroup | sessions, totalUsers, conversions | Year-over-year growth arrows |

### Analysis Engine

The backend includes an analysis module that compares raw GA4 data against automotive industry benchmarks. This is what powers the smart highlighting and the Needs Attention cards on every tab.

| Check | Benchmark | Severity |
|-------|-----------|----------|
| Unassigned channel traffic | < 5% of total sessions | CRITICAL if > 10%, HIGH if > 5% |
| Bot traffic detection | Engagement < 40% from unexpected foreign city | HIGH |
| Conversion tracking break | Daily conversions drop > 40% day-over-day | CRITICAL |
| Low organic search share | Should be > 15% of traffic | MEDIUM |
| Low site-wide conversion rate | Should be > 1.5% | MEDIUM |
| High bounce rate | Should be < 40% | MEDIUM |
| Phantom events (misconfigured) | Event count vs unique users ratio > 5x | HIGH |
| Low engagement rate | Should be > 55% | LOW |

---

## Dashboard Features

### Navigation and Layout

The dashboard uses a tab-based layout with a persistent top navigation bar. The store switcher dropdown sits in the header and instantly toggles between dealerships without reloading the page (both stores' data is pre-loaded). The active store's accent color changes the UI theme: Toyota uses red (#dc2626) and INFINITI uses indigo (#6366f1).

### Tab 1: Overview + Good/Bad/Ugly

- 4 headline KPI cards: total sessions, total users, total leads, site-wide conversion rate
- Year-over-year arrows on each KPI (green up, red down)
- 3 green callout cards highlighting the store's biggest wins
- 3 red callout cards highlighting the store's biggest problems
- Ranked quick-wins table: 5 actions sorted by effort vs. impact
- Links to deep-dive tabs for each section

### Tab 2: Traffic Deep Dive

- Needs Attention alert cards at top (e.g., unassigned traffic > 10%, bot traffic detected)
- KPI row: sessions, users, new users, YoY growth percentage
- 90-day daily sessions line chart
- Channel breakdown: two doughnut charts (traffic share and leads share) plus a full data table
- Expandable educational panels explaining each channel in plain English

### Tab 3: Engagement Deep Dive

- Needs Attention cards (low engagement channels, high bounce rate)
- KPI row: avg session duration, pages per session, bounce rate, engagement rate
- Device performance grouped bar chart + table
- Top 10 pages table with engagement metrics for each

### Tab 4: Conversions Deep Dive

- Needs Attention cards (tracking breaks, low conversion rate)
- KPI row: hard leads, VDP views, VDP-to-lead rate, site-wide conversion rate
- Macro vs. micro conversion breakdown chart
- Full events table with event classification badges (lead, engagement, system)
- Daily conversion trend line with color-coded tracking break detection

### Tab 5: Audience Deep Dive

- Needs Attention cards (bot traffic cities, unexpected geographic patterns)
- Top cities horizontal bar chart with flagged entries (primary market, bot, anomaly badges)
- Device split pie chart
- Geographic strategy tips and recommendations

### Tab 6: Technical Deep Dive

- Needs Attention cards for critical tracking issues
- Summary KPIs: tracking health status, bot traffic percentage, unassigned percentage, phantom events count
- Full issues table with severity badges (Critical, High, Medium, Low)
- Expandable How to Fix panels with step-by-step instructions for each issue

### Smart Highlighting System

Every tab runs its data through the analysis engine and surfaces a **Needs Attention** section at the top, sorted by severity. Each issue card includes two expandable sections:

- **What This Means:** A plain-English explanation of why this matters, written for someone learning web marketing
- **How to Fix It:** Step-by-step instructions for resolving the issue, with screenshots or links where applicable

Issues are color-coded and ranked: CRITICAL (red, pulsing), HIGH (orange), MEDIUM (yellow), LOW (blue). This ensures the most important problems are always visible at a glance.

### Design System

The dashboard reuses the proven dark-theme design system from the existing static GA4 audit reports:

| Element | Value | Notes |
|---------|-------|-------|
| Background | #0f1117 | Main page background |
| Card Background | #1a1d27 | Content cards and panels |
| Card Hover | #222639 | Interactive hover state |
| Border | #2a2e3d | Card and section borders |
| Text Primary | #e2e8f0 | Main body text |
| Text Muted | #94a3b8 | Secondary/label text |
| Toyota Accent | #dc2626 | Red for Toyota store |
| INFINITI Accent | #6366f1 | Indigo for INFINITI store |
| Success | #22c55e | Positive metrics |
| Danger | #ef4444 | Negative metrics / critical issues |
| Warning | #eab308 | Medium-severity issues |
| Chart Library | Chart.js 4.4.1 | Line, doughnut, bar, grouped bar charts |

---

## Google Cloud Platform Setup

This section covers everything that needs to be configured in your existing GCP project. Claude Code will handle nearly all of this via the gcloud CLI, which is already authenticated and pointed at your project.

### APIs to Enable

The following Google Cloud APIs need to be enabled in your project. Claude Code will run these commands:

| API | Purpose | gcloud Command |
|-----|---------|---------------|
| Cloud Run API | Host the application containers | `gcloud services enable run.googleapis.com` |
| Artifact Registry API | Store Docker container images | `gcloud services enable artifactregistry.googleapis.com` |
| Cloud Build API | Build containers from source | `gcloud services enable cloudbuild.googleapis.com` |
| Identity-Aware Proxy API | Restrict access to authorized users | `gcloud services enable iap.googleapis.com` |
| Analytics Data API | Pull GA4 reporting data | Already enabled (used by Analytics MCP) |
| Firestore API (Phase 2) | Cache data for faster loads | `gcloud services enable firestore.googleapis.com` |

### Authentication: Google OAuth + IAP

Google Identity-Aware Proxy (IAP) is the simplest way to restrict access to your dashboard. It sits in front of Cloud Run and requires users to sign in with a Google account that you have authorized. No custom login page needed — Google handles everything.

#### How It Works

1. User navigates to your dashboard URL (e.g., dashboard.principleauto.com)
2. IAP intercepts the request and checks if the user is signed into a Google account
3. If not signed in, IAP redirects to Google's standard sign-in page
4. After sign-in, IAP checks if that Google account is on the authorized list
5. If authorized, the user proceeds to the dashboard. If not, they see an access denied page

#### Setup Steps (Claude Code Will Handle)

1. Create an OAuth consent screen in the GCP project
2. Create OAuth 2.0 credentials (client ID and secret)
3. Enable IAP on the Cloud Run service
4. Add authorized user email addresses to the IAP access list
5. Configure a custom domain (optional but recommended)

> For your team of 2–5 people, you will simply add each person's Google email address to the IAP access list. Adding or removing a team member takes one command.

### Cloud Run Configuration

Cloud Run is a serverless container platform. You push a Docker container, and Google handles scaling, SSL certificates, and infrastructure. You only pay when the dashboard is actively being used.

| Setting | Value | Reason |
|---------|-------|--------|
| Region | us-central1 | Low latency for US-based team |
| Memory | 512 MB | Sufficient for data processing + API calls |
| CPU | 1 vCPU | Handles concurrent GA4 API calls |
| Min Instances | 0 | Scales to zero when not in use (cost savings) |
| Max Instances | 3 | Handles team of 2–5 without over-provisioning |
| Timeout | 60 seconds | Allows time for 10 parallel GA4 API calls |
| Concurrency | 80 | Multiple requests per instance |
| Auto-scaling | Enabled | Spins up on demand, shuts down when idle |

### Estimated Monthly Cost

For a team of 2–5 people checking the dashboard a few times per week, the expected cost is extremely low:

| Service | Estimated Monthly Cost | Notes |
|---------|----------------------|-------|
| Cloud Run | $0 – $5 | Free tier covers 2M requests/month; your usage will be minimal |
| Artifact Registry | < $1 | Stores your container image |
| IAP | $0 | No additional charge for IAP itself |
| GA4 Data API | $0 | Free within standard quotas (10,000 requests/day) |
| Custom Domain (optional) | $0 – $12/year | If you register a domain; free if using default Cloud Run URL |
| Firestore (Phase 2) | $0 – $1 | Free tier covers 50K reads/day |
| **Total Estimate** | **$0 – $10/month** | **Likely stays within free tier for this team size** |

---

## GitHub Repository Structure

Claude Code will create the GitHub repository, set up the project board, and configure the sprint structure. Here is the planned repository layout:

### Repository Layout

| Path | Contents |
|------|----------|
| `/` | README.md, package.json, Dockerfile, .env.example, .github/workflows |
| `/src/client/` | React frontend: components, pages, hooks, styles, utils |
| `/src/client/pages/` | OverviewPage, TrafficPage, EngagementPage, ConversionsPage, AudiencePage, TechnicalPage |
| `/src/client/components/` | KPICard, ChartContainer, IssueCard, StoreSelector, TabNav, EducationalPanel |
| `/src/server/` | Express API: routes, middleware, services |
| `/src/server/services/` | ga4Service.js (API calls), analysisEngine.js (benchmarks), cacheService.js |
| `/src/server/middleware/` | auth.js (IAP validation), errorHandler.js, rateLimiter.js |
| `/src/shared/` | TypeScript types, constants, benchmark definitions |
| `/tests/` | Unit tests (Jest) + integration tests |
| `/infrastructure/` | Terraform or gcloud scripts for GCP setup |
| `/.github/workflows/` | CI/CD: test on PR, deploy on merge to main |

### Branching Strategy

The repository will use a simple trunk-based development flow suitable for a small team:

- **main:** Production branch. Merging to main triggers automatic deployment to Cloud Run
- **develop:** Integration branch for combining features before promoting to main
- **feature/\*:** Short-lived branches for individual features or fixes (e.g., feature/traffic-tab, fix/bot-detection)

Every pull request to develop or main requires passing CI checks (lint, type check, tests) before merging.

### CI/CD Pipeline (GitHub Actions)

Two automated workflows will run via GitHub Actions:

#### On Pull Request

- Run ESLint and TypeScript type checking
- Run unit tests (Jest)
- Build the application to catch compile errors
- Block merge if any step fails

#### On Merge to Main

- Run full test suite
- Build Docker container
- Push container to Google Artifact Registry
- Deploy to Cloud Run (zero-downtime rolling update)
- Run smoke test against the deployed URL

---

## Implementation Sprints

The project is divided into 6 sprints, each roughly 1–2 weeks of effort. Claude Code will create these as milestones on the GitHub project board, with individual tasks as issues.

> Claude Code will handle the majority of the coding work. Your role is primarily reviewing what it builds, testing in the browser, and providing feedback. You should not need to write code yourself.

### Sprint 1: Foundation (Week 1–2)

**Goal: Get the project scaffolded, deployed to Cloud Run, and accessible with Google OAuth.**

| Task | Description | Estimate |
|------|------------|----------|
| Initialize repository | Create GitHub repo, set up project board, add README and .env.example | 1 hour |
| Scaffold React + Express | Create project structure with TypeScript, configure build pipeline | 2 hours |
| Create Dockerfile | Multi-stage build: build frontend, serve via Express backend | 1 hour |
| Set up GCP infrastructure | Enable APIs, create Artifact Registry repo, configure Cloud Run service | 2 hours |
| Configure Google OAuth + IAP | Create OAuth consent screen, credentials, enable IAP, add authorized users | 2 hours |
| Set up GitHub Actions CI/CD | PR checks (lint, test, build) + deploy-on-merge pipeline | 2 hours |
| Deploy hello world | Push initial app to Cloud Run, verify IAP login works end-to-end | 1 hour |
| Configure custom domain (optional) | Map your domain to Cloud Run service with SSL | 1 hour |

**Sprint 1 Deliverable:** A deployed web app at a URL that requires Google sign-in. Shows a placeholder page confirming auth works.

### Sprint 2: Data Layer + Overview Tab (Week 3–4)

**Goal: Pull live GA4 data for both stores and build the Overview + Good/Bad/Ugly tab.**

| Task | Description | Estimate |
|------|------------|----------|
| Build GA4 service | Server-side module that makes 5 parallel API calls per store using GA4 Data API | 3 hours |
| Build analysis engine | Compare metrics against automotive benchmarks, generate issue list with severity | 3 hours |
| Create API endpoint | GET /api/dashboard-data returns combined data + analysis for both stores | 1 hour |
| Build navigation shell | Tab bar, store switcher dropdown, header, responsive layout | 2 hours |
| Build KPI card component | Reusable component: value, label, YoY arrow (green/red), sparkline | 1 hour |
| Build issue card component | Severity badge, expandable What This Means + How to Fix panels | 2 hours |
| Build Overview page | 4 KPI cards, 3 green + 3 red callouts, quick-wins table | 3 hours |
| Implement store switching | Client-side toggle that re-renders with other store's data + accent color change | 1 hour |
| Write tests | Unit tests for analysis engine benchmarks, API endpoint tests | 2 hours |

**Sprint 2 Deliverable:** Overview tab with live GA4 data, store switching, KPI cards with YoY arrows, and Good/Bad/Ugly callouts.

### Sprint 3: Traffic + Engagement Tabs (Week 5–6)

**Goal: Build the Traffic and Engagement deep-dive tabs with charts and educational content.**

| Task | Description | Estimate |
|------|------------|----------|
| Build chart components | Reusable Chart.js wrappers: line, doughnut, horizontal bar, grouped bar | 3 hours |
| Build data table component | Sortable, styled table with badges and conditional formatting | 2 hours |
| Build educational panel | Expandable What is this? component with plain-English explanations | 1 hour |
| Build Traffic page | Needs Attention section, KPIs, daily trend chart, channel doughnuts + table | 4 hours |
| Write traffic educational content | Plain-English explanations for each channel, what good looks like | 2 hours |
| Build Engagement page | Needs Attention section, KPIs, device bar chart, top 10 pages table | 3 hours |
| Write engagement educational content | Explain bounce rate, engagement rate, pages/session in plain English | 1 hour |
| Write tests | Component tests, chart rendering tests | 2 hours |

**Sprint 3 Deliverable:** Traffic and Engagement tabs fully functional with charts, tables, issue cards, and educational explainers.

### Sprint 4: Conversions + Audience + Technical Tabs (Week 7–8)

**Goal: Build the remaining three deep-dive tabs, completing the core dashboard.**

| Task | Description | Estimate |
|------|------------|----------|
| Build Conversions page | Needs Attention, KPIs, macro/micro chart, events table with badges, daily trend | 4 hours |
| Conversion tracking break detection | Color-coded daily chart that highlights drops > 40% day-over-day | 2 hours |
| Write conversion educational content | Explain lead types, VDP views, form submissions, phone calls | 2 hours |
| Build Audience page | Needs Attention, cities bar chart with bot/anomaly badges, device pie chart | 3 hours |
| Bot traffic detection UI | Flag cities with < 40% engagement from unexpected countries, show alert cards | 2 hours |
| Build Technical page | Issues summary KPIs, full issues table with severity badges, How to Fix expandables | 3 hours |
| Write technical fix guides | Step-by-step instructions for each issue type (tracking, GTM, unassigned, etc.) | 3 hours |
| Write tests | Analysis engine edge cases, bot detection logic, tracking break detection | 2 hours |

**Sprint 4 Deliverable:** All 6 tabs complete and functional. Core dashboard is feature-complete.

### Sprint 5: Polish + Performance (Week 9–10)

**Goal: Optimize load times, refine the UI, add loading states, error handling, and mobile responsiveness.**

| Task | Description | Estimate |
|------|------------|----------|
| Add loading states | Skeleton screens while GA4 data loads, progress indicator | 2 hours |
| Error handling | Graceful fallbacks if GA4 API fails, retry logic, user-friendly error messages | 2 hours |
| Mobile responsiveness | Responsive layout at 768px breakpoint, stacked KPI cards, scrollable tables | 3 hours |
| Add data caching | Server-side cache (5-minute TTL) to avoid redundant GA4 API calls | 2 hours |
| Performance optimization | Code splitting, lazy-load tabs, optimize Chart.js bundle size | 2 hours |
| Add refresh button | Manual refresh that clears cache and pulls fresh data | 1 hour |
| Date range display | Show the 90-day date range in the header, last-updated timestamp | 1 hour |
| Cross-browser testing | Verify Chrome, Safari, Firefox, Edge compatibility | 2 hours |
| Accessibility pass | Keyboard navigation, ARIA labels, color contrast verification | 2 hours |

**Sprint 5 Deliverable:** Production-quality dashboard with fast load times, error handling, mobile support, and polished UI.

### Sprint 6: Testing + Launch (Week 11–12)

**Goal: Final testing, data accuracy verification, team onboarding, and production launch.**

| Task | Description | Estimate |
|------|------------|----------|
| Data accuracy verification | Compare dashboard numbers against GA4 interface and static audit reports | 3 hours |
| End-to-end testing | Full user journey: login, view all tabs, switch stores, check all charts | 2 hours |
| Security audit | Verify IAP blocks unauthorized users, API keys are not exposed, HTTPS enforced | 2 hours |
| Add team members to IAP | Add all 2–5 authorized Google accounts to the IAP access list | 30 min |
| Create user guide | Short document explaining how to use the dashboard, what each tab shows | 2 hours |
| Team walkthrough | Live walkthrough with the team showing how to read and act on the data | 1 hour |
| Monitor first week | Watch for errors in Cloud Run logs, fix any issues that surface | Ongoing |
| Celebrate launch | Dashboard is live and the team is using it | Priceless |

**Sprint 6 Deliverable:** Dashboard live in production, team onboarded, monitoring in place.

---

## Future Expansion Roadmap

The architecture is designed so new data sources plug in cleanly without changing existing tabs. Each expansion adds a new service module, analysis rules, and (optionally) a new tab.

### Phase 2: Data Caching + Historical Trends

- Add Firestore to store daily snapshots of GA4 data
- Enable month-over-month and quarter-over-quarter trend charts
- Show historical issue tracking (was this problem getting better or worse?)
- Faster page loads from cached data with background refresh

### Phase 3: Google Ads Integration

- Connect Google Ads API to pull campaign performance data
- New Advertising tab: spend, impressions, clicks, CPC, conversion rate by campaign
- Cross-reference GA4 traffic with Google Ads spend to calculate true ROI
- Smart highlighting: campaigns with high spend but low conversions

### Phase 4: CRM/DMS Integration

- Connect Tekion or other DMS to pull lead-to-sale data
- New Sales Pipeline tab: leads by source, close rate, revenue attribution
- Connect the dots from web visit to showroom visit to sale
- Calculate true cost-per-sale by marketing channel

### Phase 5: Inventory Integration

- Connect vAuto or inventory system for stock data
- New Inventory tab: days on lot, VDP views per vehicle, merchandising quality scores
- Smart matching: which vehicles are getting web attention vs. sitting on the lot
- Pricing recommendations based on market data and web engagement

### Phase 6: Multi-Store Scaling

- Add additional dealership stores to the dashboard
- Cross-store comparison views and benchmarking
- Group-level rollup metrics and executive summary
- Role-based access: GMs see their store, executives see all stores

---

## Getting Started: What Happens Next

Here is the exact sequence of events to kick off this project. Claude Code will handle steps 1 through 4 once you give the green light.

### Step 1: Claude Code Sets Up the GitHub Repository

- Create a new repository (e.g., principle-auto/ga4-dashboard) on your GitHub account
- Initialize with README, .gitignore, TypeScript config, and project structure
- Create a GitHub project board with columns: Backlog, To Do, In Progress, Review, Done
- Create milestones for each of the 6 sprints
- Create issues for every task in the sprint tables above

### Step 2: Claude Code Sets Up GCP Infrastructure

- Enable required APIs (Cloud Run, Artifact Registry, Cloud Build, IAP)
- Create Artifact Registry repository for Docker images
- Create a service account for the application with GA4 Data API read access
- Configure OAuth consent screen and credentials

### Step 3: Claude Code Scaffolds the Application

- Create the React + Express + TypeScript project skeleton
- Configure Dockerfile and docker-compose for local development
- Set up GitHub Actions CI/CD workflows
- Deploy initial hello-world version to Cloud Run

### Step 4: Claude Code Enables IAP and Adds Your Team

- Enable Identity-Aware Proxy on the Cloud Run service
- Add your Google account and team members to the authorized access list
- Verify end-to-end: you can sign in with your Google account and see the app

### Step 5: You Verify Everything Works

- Open the dashboard URL in your browser
- Confirm Google sign-in works and you see the placeholder page
- Confirm unauthorized accounts are blocked
- Give Claude Code the thumbs up to start Sprint 2 (building the real dashboard)

> That's it. Once you hand this document to Claude Code and say "set it up," it will handle the repository creation, GCP configuration, and initial deployment. Your job is to review, test, and provide feedback as it builds each sprint.

---

## Appendix: Store Configuration

| Property | Toyota of Hernando | INFINITI of Boerne |
|----------|-------------------|-------------------|
| GA4 Property ID | 358670218 | 308058481 |
| GA4 Account ID | 260898760 | 64038346 |
| Dashboard Accent Color | #dc2626 (Red) | #6366f1 (Indigo) |
| Primary Market | Hernando, MS area | San Antonio / Boerne, TX area |
| Known Issues | Bot traffic (Lanzhou), tracking break ~Jan 27, unassigned 12.6% | form_submission misconfigured, low organic 5.8%, unassigned 9.3% |
| Website Platform | Dealer Inspire (asc_ events) | Dealer.com (mcm_ events) |
