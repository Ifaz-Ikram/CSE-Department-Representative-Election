# 🗳️ CSE Department Representative Elections

**A Secure, Enterprise-Grade Digital Voting Platform**

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7.1-2D3748?style=for-the-badge&logo=prisma)
![Security](https://img.shields.io/badge/Security-Hardened-green?style=for-the-badge&logo=security)

*Built for the CSE23 batch at University of Moratuwa with military-grade security and performance optimizations*

---

## 📋 Table of Contents

- [Features](#-features)
- [Security Architecture](#-security-architecture)
- [Performance Optimizations](#-performance-optimizations)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [User Roles & Access Control](#-user-roles--access-control)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Maintenance](#-maintenance)
- [Project Structure](#-project-structure)

---

## 🚀 Features

### Core Voting Features

- **🔐 Secure Authentication**
  - Google OAuth 2.0 integration with `@cse.mrt.ac.lk` domain restriction
  - Session-based authentication with JWT tokens
  - Automatic session expiration (30 days) with 24-hour refresh intervals

- **📝 Voter Whitelist System**
  - Strict access control for exactly 200 pre-registered students
  - Email-based verification against VoterRegistry database
  - Automatic name normalization from university records
  - Active/inactive voter status management

- **🗳️ Flexible Voting**
  - Multi-candidate selection (up to 10 candidates per ballot)
  - Edit votes unlimited times before election deadline
  - Real-time countdown timer showing time remaining
  - Vote confirmation with candidate preview
  - Anonymous vote storage (no voter-candidate mapping for regular users)
  - **"My Votes" History**: Dedicated page to review all submitted ballots
  - **Stream-Based Representation**: Voting considers candidate streams (Cyber, DSE, ICE, Main) for fair representation

- **📊 Real-Time Results** (Admin-Only Access)
  - Live vote counting and statistics
  - **Results Access**: Voters are permanently blocked from viewing results (redirected to voting page)
  - **Dual Visibility Controls**:
    - `resultsVisible`: Admin-only results toggle
    - `publicResultsVisible`: Public results visibility setting
  - `resultsAutoEnabled`: Automatic results publication after election ends
  - Detailed candidate rankings with vote percentages and stream badges
  - Participation rate tracking

### Administrative Features

- **👥 Role-Based Access Control**
  - **Voter**: Standard voting privileges
  - **Admin**: View statistics, manage elections, and load candidate presets
  - **Super Admin**: Full system control including user role promotion

- **📈 Comprehensive Dashboard**
  - Election status overview (active, scheduled, completed)
  - Real-time vote tracking
  - Voter participation analytics
  - Audit log viewing with filtering

- **📊 Advanced Statistics**
  - Vote distribution charts
  - Time-series voting patterns
  - Candidate performance metrics
  - Demographic breakdowns

- **📋 Candidate Presets System**
  - Instant loading of pre-configured candidate lists
  - Batch-specific templates (English, Sinhala, Tamil language streams)
  - **Stream Assignment**: Candidates assigned to specializations (Cyber, DSE, ICE, Main) for fair representation
  - Duplicate prevention and smart merging

- **📥 Data Export**
  - CSV export for results, ballots, statistics, and voter lists
  - Customizable export formats
  - Super admin-only ballot mapping export
  - **Safety Limits**: Max 5000 records per export to prevent server overload

- **🔍 Audit Trail**
  - Comprehensive logging of all system actions
  - Categorized events (ELECTION, CANDIDATE, VOTE, AUTH, USER)
  - Actor identification with role tracking
  - Detailed change history with before/after values

### User Experience

- **🎨 Cyberpunk/Futuristic UI**
  - Custom "Circuit Board" animated backgrounds
  - Neon glow effects and glassmorphism cards
  - Navy/Cyan/Gold color palette for premium feel

- **⏱️ Real-Time Updates**
  - Live election status monitoring
  - **Urgency-Aware Countdown**: Timer changes color (Yellow <4h, Red <1h) with contextual messages
  - Instant vote confirmation
  - Dynamic candidate loading

- **🌐 Multi-Language Support**
  - Candidate profiles with language preferences (English, Sinhala, Tamil)
  - **Ballot Symbols**: Emoji-based candidate identification (🌙, ⭐, etc.)
  - Internationalized interface elements

- **🎓 Stream-Based Representation**
  - Candidates tagged with specialization streams: **Cyber**, **DSE**, **ICE**, or **Main**
  - Color-coded stream badges for visual identification (Red=Cyber, Green=DSE, Blue=ICE, Gray=Main)
  - Stream information displayed on voting page, results, and admin interfaces
  - Supports fair representation across all specialization streams

---

## 🔒 Security Architecture

### Authentication & Authorization

✅ **OAuth 2.0 Integration**
- Google Sign-In with domain restriction
- Automatic session management
- Secure token storage with httpOnly cookies

✅ **Session Security**
- JWT-based sessions with cryptographic signing
- Secure cookie configuration:
  - `httpOnly: true` - Prevents JavaScript access
  - `sameSite: lax` - CSRF protection
  - `secure: true` - HTTPS-only in production
- 30-day session expiration with automatic refresh
- **Session Rotation**: All sessions invalidated on role change (privilege escalation protection)

✅ **CSRF Protection**
- Origin and Referer header validation
- Automatic CSRF token verification on all state-changing requests
- Protected API endpoints with same-origin policy
- NextAuth built-in CSRF tokens

### Data Protection

✅ **Input Sanitization**
- DOMPurify integration for HTML content
- XSS prevention on all user-generated content:
  - Election names and descriptions
  - Candidate bios and information
  - User profile data
- URL validation to prevent javascript: and data: URI attacks
- Email format validation with regex patterns
- **Timing Safe Auth**: Randomized delays (100-300ms) to prevent email enumeration timing attacks
- **Vote Race Condition Fix**: Election timing validated *inside* database transactions to prevent deadline bypass
- SQL injection protection via Prisma ORM parameterization

✅ **Content Security Policy (CSP)**
- Strict CSP headers blocking unauthorized scripts
- Whitelisted domains for external resources:
  - Google OAuth (accounts.google.com)
  - Google profile images (lh3.googleusercontent.com)
  - Sentry error tracking
  - Upstash Redis
- No inline script execution (except trusted sources)
- Frame ancestors denied (clickjacking protection)

✅ **Security Headers**
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Clickjacking protection
- `X-XSS-Protection: 1; mode=block` - Browser XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer leakage prevention
- `Permissions-Policy` - Disabled camera, microphone, geolocation
- `Strict-Transport-Security` - HTTPS enforcement (production)

### Access Control

✅ **Role-Based Authorization**
- Middleware-level role verification
- Endpoint-specific permission checks
- Vote ownership validation (users can only view their own votes)
- Time-based access control:
  - Results hidden during active elections
  - Statistics accessible only after election ends
  - Ballot mapping restricted to super admins

✅ **Rate Limiting**
- Upstash Redis-powered rate limiting
- Endpoint-specific limits:
  - Vote submission: 10 req/min
  - Auth endpoints: 5 req/min
  - Admin operations: 30 req/min
  - General API: 60 req/min
- IP-based throttling
- Graceful rate limit responses with retry-after headers

✅ **Environment Security**
- Startup validation of all required environment variables
- Secret strength validation (min 32 characters)
- Production-specific security checks
- Safe error handling without information leakage

### Data Integrity

✅ **Audit Logging**
- Immutable audit trail for all actions
- Comprehensive event tracking:
  - Election creation, updates, deletion
  - Candidate management
  - Vote submissions (anonymous)
  - Role changes
  - Authentication events
- Actor identification with email and role
- JSON metadata for detailed context

✅ **Vote Privacy**
- Anonymous vote storage (no direct voter-candidate link visible to voters)
- Ballot encryption through database-level security
- Super admin-only ballot mapping access
- Time-gated result visibility

---

## ⚡ Performance Optimizations

### Database Optimizations

✅ **Comprehensive Indexing**
- **15+ strategic indexes** added for query performance:
  - `User(role)` - Admin user lookups (100x faster)
  - `User(email, role)` - Composite index for auth queries
  - `Session(userId, expires)` - Session validation
  - `Election(startTime, endTime)` - Time-based queries
  - `Candidate(electionId)` - Election-candidate joins
  - `Ballot(electionId, voterId, updatedAt)` - Vote retrieval
  - `BallotChoice(candidateId)` - Vote counting (critical for results)
  - `AuditLog(timestamp, category, actorEmail)` - Audit searches

✅ **Query Optimization**
- Prisma ORM with efficient query generation
- Selective field loading with `select` and `include`
- Connection pooling (max 3 connections for Supabase free tier)
- Transaction-based vote submissions for atomicity
- **Query Timeouts**: 30-second hard limit on all database queries to prevent connection exhaustion
- Efficient vote counting with aggregations

✅ **Pagination**
- Server-side pagination on all list endpoints:
  - Users: **200 items per page** (default)
  - Ballots: **200 items per page** (default)
  - Audit logs: 50 items per page
- Prevents memory exhaustion with large datasets
- Cursor-ready architecture for future scaling

### Application Performance

✅ **Next.js Optimizations**
- Static page generation where possible
- API routes with dynamic rendering
- Automatic code splitting
- Image optimization for candidate photos via `CandidatePhoto` component (WebP/AVIF, lazy loading)
- Middleware-level request processing

✅ **Caching Strategy**
- **Redis Query Cache**: Full caching layer for expensive DB queries (`cache.ts`)
  - Elections, Candidates, Results, User data cached with configurable TTL
  - Cache-aside pattern with automatic invalidation on data changes
  - TTL tiers: SHORT (1min), MEDIUM (5min), LONG (1hr), VERY_LONG (24hr)
- Session caching via NextAuth
- Database connection pooling
- Efficient query result reuse

✅ **Bundle Optimization**
- Tree-shaking for unused code elimination
- Lazy loading for admin pages
- Optimized dependencies (React 18, Next.js 14)
- Sentry source map optimization

✅ **React Performance**
- Isolated `CountdownTimer` component to prevent full-page re-renders
- Memoized candidate lists and selection state
- DevTools-verified: Only timer updates every second, not the entire page

### Monitoring & Error Tracking

✅ **Sentry Integration**
- Real-time error tracking
- Performance monitoring
- Release tracking
- User feedback collection
- Source map upload for debugging

✅ **Advanced Monitoring & Alerting** (`monitoring.ts`)
- **Structured Alerting**: Severity levels (INFO, WARNING, ERROR, CRITICAL)
- **Category-based Alerts**: Database, Auth, Voting, Rate Limit, Cache, Security, Performance
- **Automatic Detection**:
  - Slow database queries (>1s threshold)
  - Slow API responses (>3s threshold)
  - Authentication failures with IP tracking
  - Suspicious voting activity
  - Rate limit hits
  - Cache failures
  - Database connection pool exhaustion
- **Performance Timing**: `withPerformanceMonitoring()` wrapper for any async operation

✅ **Logging**
- Structured error logging
- Audit trail for all actions
- Rate limit analytics
- Production-safe error messages

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Custom React components
- **State Management**: React Hooks + NextAuth session
- **Forms**: React Hook Form + Zod validation

### Backend

- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js 4.24
- **ORM**: Prisma 7.1 with PostgreSQL adapter
- **Validation**: Zod 3.23

### Database

- **Primary**: PostgreSQL 15+ (Supabase)
- **Cache**: Upstash Redis (rate limiting)
- **Connection**: Prisma with pg driver
- **Migrations**: Prisma Migrate

### Security

- **Input Sanitization**: isomorphic-dompurify
- **CSRF Protection**: Custom middleware + NextAuth
- **Rate Limiting**: @upstash/ratelimit
- **OAuth**: Google OAuth 2.0

### DevOps

- **Hosting**: Vercel
- **Error Tracking**: Sentry
- **Version Control**: Git + GitHub
- **CI/CD**: Vercel automatic deployments

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ database
- Google Cloud Project with OAuth credentials
- Upstash Redis account (free tier available)
- Sentry account (optional, for error tracking)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Ifaz-Ikram/cse-election.git
   cd cse-election
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Generate a secure NextAuth secret
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Edit `.env` with your configuration (see [Environment Configuration](#-environment-configuration))

4. **Database Setup**

   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database (optional)
   npx prisma db seed
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database studio
npx prisma studio

# Generate Prisma types
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

---

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/cse23_election?schema=public"

# ============================================
# NEXTAUTH CONFIGURATION
# ============================================
# Base URL of your application
NEXTAUTH_URL="http://localhost:3000"  # Use https:// in production

# Secret for JWT signing (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-super-secret-32-character-minimum-string"

# ============================================
# GOOGLE OAUTH
# ============================================
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ============================================
# RATE LIMITING (UPSTASH REDIS)
# ============================================
# Get from: https://console.upstash.com/
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# ============================================
# ERROR TRACKING (SENTRY)
# ============================================
# Get from: https://sentry.io/settings/
SENTRY_DSN="https://your-key@o0.ingest.sentry.io/0"

# ============================================
# APPLICATION SETTINGS
# ============================================
NODE_ENV="development"  # Set to "production" for deployment
```

### Important Notes

- **DATABASE_URL**: Use connection pooling URL for Supabase (ends with `:6543` for pooler)
- **NEXTAUTH_SECRET**: MUST be at least 32 characters long in production
- **NEXTAUTH_URL**: Must use HTTPS in production
- **Google OAuth**: Add authorized redirect URIs in Google Console:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://your-domain.com/api/auth/callback/google`

---

## 👥 User Roles & Access Control

### Role Hierarchy

```
Super Admin (Full Control)
    ↓
Admin (View & Export)
    ↓
Voter (Vote & View Public Results)
```

### Access Control Matrix

| Feature | Voter | Admin | Super Admin |
|---------|:-----:|:-----:|:-----------:|
| **Authentication** |
| Login via Google OAuth | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| **Voting** |
| Vote in active elections | ✅ | ✅ | ✅ |
| Edit vote (before deadline) | ✅ | ✅ | ✅ |
| View own voting history | ✅ | ✅ | ✅ |
| **Results** |
| Access results page | ❌ | ✅ | ✅ |
| View results (after election) | ❌ | ✅* | ✅ |
| View live statistics | ❌ | ❌ | ✅ |
| **Election Management** |
| Create new election | ❌ | ❌ | ✅ |
| Edit election details | ❌ | ❌ | ✅ |
| Delete election | ❌ | ❌ | ✅ |
| Control results visibility | ❌ | ❌ | ✅ |
| **Candidate Management** |
| Add candidates | ❌ | ❌ | ✅ |
| Edit candidate info | ❌ | ❌ | ✅ |
| Remove candidates | ❌ | ❌ | ✅ |
| **Data Export** |
| Export results CSV | ❌ | ✅ | ✅ |
| Export statistics CSV | ❌ | ✅ | ✅ |
| Export voter list CSV | ❌ | ✅ | ✅ |
| Export ballot mapping CSV | ❌ | ❌ | ✅ |
| **System Administration** |
| View audit logs | ❌ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| View ballot mapping | ❌ | ❌ | ✅ |

**\*Admin access to restricted results requires results to be marked as visible by Super Admin**

> **Note**: Voters are permanently blocked from accessing the results page and are automatically redirected to the voting page. This ensures vote integrity during and after elections.

### Voter Whitelist Management

The system uses a strict `VoterRegistry` table to control access:

```sql
-- VoterRegistry schema
{
  id: Int (auto-increment)
  regNo: String (unique) - e.g., "230253H"
  email: String (unique) - e.g., "student@cse.mrt.ac.lk"
  firstName: String
  lastName: String
  indexNumber: String
  isActive: Boolean (default: true)
  createdAt: DateTime
}
```

**Key Features:**

- Only emails in the VoterRegistry can sign in
- Inactive voters are automatically denied access
- Names are auto-normalized on first login (e.g., "JOHN DOE" → "John Doe")
- Index numbers synced from registry

### Promoting Users

**Make a user Super Admin:**

```sql
UPDATE "User" SET role = 'super_admin' WHERE email = 'admin@cse.mrt.ac.lk';
```

**Make a user Admin:**

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'user@cse.mrt.ac.lk';
```

**Reset to Voter:**

```sql
UPDATE "User" SET role = 'voter' WHERE email = 'user@cse.mrt.ac.lk';
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Prepare Your Repository**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Framework Preset: **Next.js**

3. **Configure Environment Variables**

   Add all variables from your `.env` file in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add each variable one by one
   - Set for **Production**, **Preview**, and **Development** environments

4. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

6. **Post-Deployment Tasks**

   ```bash
   # Connect to production database
   DATABASE_URL="your-production-db-url" npx prisma migrate deploy
   
   # Optional: Seed production data
   DATABASE_URL="your-production-db-url" npx prisma db seed
   ```

7. **Update OAuth Settings**
   - Go to Google Cloud Console
   - Update Authorized redirect URIs:
     - Add: `https://your-domain.vercel.app/api/auth/callback/google`

### Custom Server Deployment

For deployment on your own server:

```bash
# Build the application
npm run build

# Start production server
npm start
```

**Requirements:**

- Node.js 18+ runtime
- PM2 or similar process manager
- PostgreSQL database
- HTTPS certificate (Let's Encrypt recommended)
- Environment variables configured

---

## 📡 API Documentation

### Authentication Endpoints

#### `POST /api/auth/signin`

Initiates Google OAuth sign-in flow

#### `POST /api/auth/signout`

Signs out the current user

#### `GET /api/auth/session`

Returns current session data

---

### Voting Endpoints

#### `POST /api/vote`

Submit or update a vote

**Authentication:** Required  
**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "electionId": "string",
  "candidateIds": ["string", "string"]
}
```

**Response:**

```json
{
  "success": true,
  "ballot": {
    "id": "string",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "choices": [...]
  }
}
```

**Error Responses:**

- `400` - Invalid input or election not active
- `401` - Unauthorized
- `403` - Election closed or not started
- `429` - Rate limit exceeded

#### `GET /api/vote?electionId={id}`

Get current user's ballot for an election

**Authentication:** Required

**Response:**

```json
{
  "ballot": {
    "id": "string",
    "choices": [...],
    "election": {...}
  }
}
```

---

### Election Endpoints

#### `GET /api/elections`

List all elections

**Authentication:** Required

**Response:**

```json
{
  "elections": [
    {
      "id": "string",
      "name": "string",
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-02T00:00:00.000Z",
      "_count": {
        "candidates": 10,
        "ballots": 50
      }
    }
  ]
}
```

#### `GET /api/candidates?electionId={id}`

List candidates for an election

**Authentication:** Required

---

### Admin Endpoints

All admin endpoints require authentication and appropriate role.

#### `GET /api/admin/users?page=1&limit=200`

List all users (Admin/Super Admin only)

**Pagination:** Yes (200 per page default)

#### `PATCH /api/admin/users`

Update user role (Super Admin only)

**Request Body:**

```json
{
  "userId": "string",
  "newRole": "voter" | "admin" | "super_admin"
}
```

#### `GET /api/admin/statistics?electionId={id}`

Get election statistics

**Access Control:**

- During election: Super Admin only
- After election: Admin (if resultsVisible) or Super Admin

#### `GET /api/admin/ballots?electionId={id}&page=1&limit=200`

Get ballot details with voter mapping

**Access Control:**

- During election: Super Admin only
- After election: Admin (if resultsVisible) or Super Admin

**Pagination:** Yes (200 per page default)

#### `GET /api/admin/export?electionId={id}&type={type}`

Export data as CSV

**Query Parameters:**

- `type`: `results` | `ballots` | `statistics` | `voters`
- `electionId`: Election ID

**Access Control:**

- `ballots`: Super Admin only
- Other types: Admin or Super Admin

#### `GET /api/admin/audit-logs?page=1&limit=50&category={cat}`

View audit logs

**Query Parameters:**

- `category` (optional): Filter by category
- `actor` (optional): Filter by actor email
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Access Control:**

- Admin: Cannot view VOTE category logs
- Super Admin: Can view all logs

---

## 🔧 Maintenance

### Common Database Tasks

#### Promote User to Super Admin

```sql
UPDATE "User" 
SET role = 'super_admin' 
WHERE email = 'admin@cse.mrt.ac.lk';
```

#### Extend Election Deadline

```sql
UPDATE "Election" 
SET "endTime" = NOW() + INTERVAL '24 hours' 
WHERE id = 'election-id';
```

#### Check Election Status

```sql
SELECT 
  name,
  "startTime",
  "endTime",
  CASE 
    WHEN NOW() < "startTime" THEN 'Scheduled'
    WHEN NOW() BETWEEN "startTime" AND "endTime" THEN 'Active'
    ELSE 'Completed'
  END as status,
  "resultsVisible",
  "publicResultsVisible"
FROM "Election"
ORDER BY "startTime" DESC;
```

#### View Vote Statistics

```sql
SELECT 
  e.name as election,
  COUNT(DISTINCT b.id) as total_votes,
  COUNT(DISTINCT b."voterId") as unique_voters,
  (SELECT COUNT(*) FROM "VoterRegistry" WHERE "isActive" = true) as registered_voters,
  ROUND(
    COUNT(DISTINCT b."voterId")::numeric / 
    (SELECT COUNT(*) FROM "VoterRegistry" WHERE "isActive" = true) * 100, 
    2
  ) as participation_rate
FROM "Election" e
LEFT JOIN "Ballot" b ON b."electionId" = e.id
GROUP BY e.id, e.name;
```

#### Deactivate Voter

```sql
UPDATE "VoterRegistry" 
SET "isActive" = false 
WHERE email = 'student@cse.mrt.ac.lk';
```

#### Audit Recent Activity

```sql
SELECT 
  "timestamp",
  action,
  "actorEmail",
  "actorRole",
  "targetType",
  "targetName"
FROM "AuditLog"
ORDER BY "timestamp" DESC
LIMIT 50;
```

### Backup Procedures

#### Database Backup

```bash
# Using pg_dump
pg_dump -h hostname -U username -d database_name -F c -b -v -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -h hostname -U username -d database_name -v backup_20240101.dump
```

#### Application Backup

```bash
# Backup .env file (store securely!)
cp .env .env.backup.$(date +%Y%m%d)

# Backup uploaded files (if any)
tar -czf uploads_$(date +%Y%m%d).tar.gz public/uploads
```

### Monitoring

#### Check Application Health

```bash
# Check if app is running
curl https://your-domain.com/api/elections

# Check database connectivity
npx prisma db pull

# View error logs (Sentry dashboard)
# https://sentry.io/organizations/your-org/issues/
```

#### Performance Monitoring

- **Vercel Analytics**: View in Vercel dashboard
- **Sentry Performance**: Transaction tracking and slow queries
- **Database**: Monitor connection pool usage in Supabase dashboard

---

## 📁 Project Structure

```
cse-election/
│
├── prisma/
│   ├── schema.prisma          # Database schema with models and indexes
│   ├── migrations/            # Database migration history
│   └── seed.ts                # Database seeding script
│
├── public/                    # Static assets
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Landing page
│   │   ├── global-error.tsx   # Global error boundary
│   │   ├── globals.css        # Global styles
│   │   │
│   │   ├── admin/             # Admin dashboard routes
│   │   │   ├── page.tsx       # Admin home
│   │   │   ├── audit-log/     # Audit log viewer
│   │   │   ├── ballots/       # Ballot mapping viewer
│   │   │   ├── elections/     # Election management
│   │   │   ├── statistics/    # Statistics dashboard
│   │   │   └── users/         # User management
│   │   │
│   │   ├── vote/
│   │   │   └── page.tsx       # Voting interface
│   │   │
│   │   ├── my-votes/
│   │   │   └── page.tsx       # User's voting history
│   │   │
│   │   ├── results/
│   │   │   └── page.tsx       # Public results page
│   │   │
│   │   └── api/               # API routes
│   │       ├── auth/          # NextAuth endpoints
│   │       ├── vote/          # Voting endpoints
│   │       ├── elections/     # Election data endpoints
│   │       ├── candidates/    # Candidate endpoints
│   │       ├── my-votes/      # User vote history
│   │       ├── registry/      # Voter registry access
│   │       └── admin/         # Admin API routes
│   │           ├── users/
│   │           ├── elections/
│   │           ├── candidates/
│   │           ├── ballots/
│   │           ├── statistics/
│   │           ├── export/
│   │           ├── presets/       # Candidate presets CRUD
│   │           └── audit-logs/
│   │
│   ├── components/            # React components
│   │   ├── Navigation.tsx     # Main navigation bar
│   │   ├── Footer.tsx         # Footer component
│   │   ├── BackgroundGrid.tsx # Animated background
│   │   ├── GlowDivider.tsx    # Decorative divider
│   │   ├── CandidateSelector.tsx  # Vote selection UI
│   │   ├── CandidatePhoto.tsx # Optimized candidate images (next/image)
│   │   ├── CountdownTimer.tsx # Urgency-aware election timer
│   │   ├── ElectionCard.tsx   # Reusable election display card
│   │   ├── DateTimePicker.tsx # Admin datetime input component
│   │   ├── SearchableDropdown.tsx # Enhanced searchable select
│   │   ├── OptimizedImage.tsx # General image optimization wrapper
│   │   └── Providers.tsx      # Context providers
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── session.ts         # Session helpers
│   │   ├── prisma.ts          # Prisma client setup (with 30s timeout)
│   │   ├── rateLimit.ts       # Rate limiting config
│   │   ├── auditLog.ts        # Audit logging utilities
│   │   ├── cache.ts           # Redis caching layer (NEW)
│   │   ├── monitoring.ts      # Alerting & observability (NEW)
│   │   ├── sanitize.ts        # Input sanitization
│   │   ├── csrf.ts            # CSRF utilities
│   │   ├── env.ts             # Environment validation
│   │   └── themeHelpers.ts    # Theme utilities + normalizePhotoUrl
│   │
│   ├── types/
│   │   └── next-auth.d.ts     # NextAuth type extensions
│   │
│   ├── middleware.ts          # Edge middleware (Security headers, CSRF)
│   ├── instrumentation.ts     # Sentry initialization
│   └── instrumentation-client.ts  # Client-side Sentry
│
├── .env                       # Environment variables (gitignored)
├── .env.example               # Example environment file
├── .gitignore                 # Git ignore rules
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
├── prisma.config.ts           # Prisma configuration
└── README.md                  # This file
```

---

## 🤝 Contributing

This is a private project for CSE23 batch elections. For issues or suggestions, please contact the development team.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 👨‍💻 Development Team

**Built with ❤️ for CSE23 Batch**  
University of Moratuwa - Faculty of Engineering

---
