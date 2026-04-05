# CSE Department Representative Election

Web-based election system for the CSE23 batch (University of Moratuwa), built with Next.js, NextAuth, Prisma, and PostgreSQL.

## Overview

This application supports:

- Google sign-in for authorized CSE23 accounts
- Whitelist-based voter access control
- Election creation and scheduling
- Candidate management (with preset save/load support)
- Ballot submission and ballot updates before deadline
- Role-based results visibility
- Admin audit logs, exports, and user role management

## Implemented Features

### Authentication and Access

- Google OAuth via NextAuth
- Email restriction to `*.23@cse.mrt.ac.lk`
- Whitelist check against `VoterRegistry` before access
- Session/JWT-based auth with role loaded from database

### Voting

- Voters can select up to 10 candidates per election
- Voters can update their ballot until election end time
- `My Votes` page shows each user’s submitted ballots
- Candidate stream/language fields are stored and displayed as metadata

### Election Administration

- Create, edit, delete, and extend elections (`super_admin`)
- Add, edit, delete candidates (`super_admin`)
- Save candidate presets and load presets into elections (`super_admin`)
- Toggle:
  - `resultsVisible` (admin-side visibility)
  - `publicResultsVisible` (stored election flag for public visibility state)

### Results and Visibility

- `super_admin`: can view results and ballot mappings at any time
- `admin`:
  - Results blocked during active elections
  - Results allowed after election end (with `resultsVisible` control)
- `voter`:
  - Results are blocked from the results page and statistics API in current implementation

### Monitoring, Safety, and Operations

- Rate limiting with Upstash Redis (if configured)
- CSP and security headers via middleware
- Input sanitization utilities for admin mutations
- Audit logging for election, candidate, vote, and user-role actions
- CSV exports for results, statistics, voters, and ballots (ballots: `super_admin` only)

## Tech Stack

- Next.js `15`
- React `19`
- TypeScript `5`
- NextAuth `4`
- Prisma `7` + PostgreSQL
- Tailwind CSS `3`
- Sentry (`@sentry/nextjs`, optional)
- Upstash Redis (`@upstash/ratelimit`, optional)

## Roles

| Capability | voter | admin | super_admin |
|---|---:|---:|---:|
| Sign in and vote | Yes | Yes | Yes |
| View own ballots (`/my-votes`) | Yes | Yes | Yes |
| Access admin dashboard | No | Yes | Yes |
| Manage elections | No | No | Yes |
| Manage candidates | No | View only | Yes |
| Change user roles | No | No | Yes |
| View audit logs | No | Yes | Yes |
| View statistics during active election | No | No | Yes |
| View statistics after election end | No | Yes | Yes |
| View ballot mapping page (`/admin/ballots`) | No | Conditional | Yes |

## Key Pages

- `/` - login/landing page
- `/vote` - ballot selection and submission
- `/my-votes` - user ballot history
- `/results` - results page with role/visibility checks
- `/admin` - admin dashboard
- `/admin/elections/[id]` - candidate management for an election
- `/admin/statistics?electionId=...` - election statistics
- `/admin/ballots?electionId=...` - ballot mapping view
- `/admin/users` - user role management
- `/admin/audit-log` - audit trail viewer

## API Surface (Current)

### Public (authenticated users)

- `GET /api/elections`
- `GET /api/candidates?electionId=...`
- `GET /api/vote?electionId=...`
- `POST /api/vote`
- `GET /api/my-votes`

### Admin / Super Admin

- `GET /api/registry`
- `POST|PATCH|DELETE /api/admin/elections`
- `PATCH /api/admin/elections/[id]/extend`
- `POST|PUT|DELETE /api/admin/candidates`
- `GET|POST|PUT|DELETE /api/admin/presets`
- `GET /api/admin/statistics`
- `GET /api/admin/ballots`
- `GET|PATCH /api/admin/users`
- `GET /api/admin/audit-logs`
- `GET /api/admin/export?electionId=...&type=results|statistics|voters|ballots`

## Local Development

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL
- Google OAuth credentials

### Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your values, then:

```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

App runs at `http://localhost:3000`.

### Useful Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production server
npm run lint     # lint
npx prisma studio
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

PowerShell helpers are also included:

- `setup.ps1`
- `dev.ps1`

## Environment Variables

Required:

- `DATABASE_URL`
- `DIRECT_URL` (used by Prisma migrations)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`

## Notes

- Automated tests are not currently included in this repository.
- This project is intended for internal election operations for the target batch.
