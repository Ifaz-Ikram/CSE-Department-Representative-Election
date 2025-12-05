# CSE23 Department Representative Elections

A secure, modern, production-ready voting web application built for the CSE23 batch of University of Moratuwa.

## 🚀 Features

- **Secure Authentication**: Google OAuth restricted to `@cse.mrt.ac.lk` email domains.
- **Voter Whitelist**: Strict access control for exactly 200 pre-registered students.
- **Role-Based Access**:
    - **Voter**: Can vote and view public results.
    - **Admin**: Can view detailed statistics and voter mapping.
    - **Super Admin**: Can manage elections, candidates, and system settings.
- **Flexible Voting**: Multi-candidate selection (up to 10) with editable ballots until the deadline.
- **Real-Time Statistics**: Live vote tracking (Super Admin only).
- **Rate Limiting**: Implementation of Upstash Redis to prevent API abuse.
- **CSV Export**: Admins can export results, statistics, and full ballot data.
- **Error Tracking**: Integrated Sentry for real-time error monitoring.

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL Database
- Google Cloud Project (OAuth Credentials)
- Upstash Redis (for Rate Limiting)
- Sentry Account (for Error Tracking)

### Installation

1.  **Clone and Install**
    ```powershell
    git clone <repo-url>
    cd cse23-election
    npm install
    ```

2.  **Environment Setup**
    ```powershell
    # Copy example env
    Copy-Item .env.example .env
    
    # Generate NextAuth Secret
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    ```

3.  **Database Setup**
    ```powershell
    # Generate Prisma Client
    npx prisma generate
    
    # Run Migrations
    npx prisma migrate dev --name init
    
    # Seed Data (if applicable)
    npx prisma db seed
    ```

4.  **Run Development Server**
    ```powershell
    npm run dev
    ```
    Visit [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

Ensure your `.env` file is configured correctly:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"

# Auth
NEXTAUTH_URL="http://localhost:3000" # Use https://your-domain.com in production
NEXTAUTH_SECRET="your-generated-secret"
ALLOWED_EMAIL_DOMAIN="cse.mrt.ac.lk"

# Google OAuth
GOOGLE_CLIENT_ID="from-google-cloud-console"
GOOGLE_CLIENT_SECRET="from-google-cloud-console"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Error Tracking (Sentry)
SENTRY_DSN="https://your-key@sentry.io/project-id"
```

## 👥 User Roles & Whitelist

The system uses a strict whitelist (`VoterRegistry` table) to control access.

- **Voter**: Default role for whitelisted students.
- **Super Admin**: Set initially via seed or database update.
- **Name Normalization**: Student names are auto-normalized (e.g., "JOHN DOE" -> "John Doe") on first login.

### Access Control Matrix

| Feature | Voter | Admin | Super Admin |
| :--- | :---: | :---: | :---: |
| Vote | ✅ | ✅ | ✅ |
| Edit Vote (Active) | ✅ | ✅ | ✅ |
| View Public Results | ✅ | ✅ | ✅ |
| View Restricted Results | ❌ | ✅* | ✅ |
| View Statistics | ❌ | ✅* | ✅ |
| Create Election | ❌ | ❌ | ✅ |
| Manage Candidates | ❌ | ❌ | ✅ |
| Export CSV Data | ❌ | ✅ | ✅ |

*\*Admin access depends on election visibility settings.*

## 🚀 Deployment (Vercel)

1.  **Push to GitHub**: Ensure your repo is up to date.
2.  **Import to Vercel**: Select Next.js framework.
3.  **Configure Vars**: Add all environment variables from `.env`.
4.  **Deploy**: Vercel handles the build (`next build`).
5.  **Post-Deploy**:
    - Run `npx prisma migrate deploy` for production DB.
    - Update Google OAuth Redirect URI to `https://your-domain.vercel.app/api/auth/callback/google`.

## 🔧 Maintenance

### Common Tasks

**Promote User to Admin**
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'user@cse.mrt.ac.lk';
```

**emergency Vote Unlock**
If an election must be extended:
```sql
UPDATE elections SET end_time = NOW() + INTERVAL '24 hours' WHERE id = 'election-id';
```

**Check Election Status**
```sql
SELECT name, start_time, end_time, 
CASE WHEN NOW() BETWEEN start_time AND end_time THEN 'Active' ELSE 'Inactive' END 
FROM elections;
```

## 🏗️ Project Structure

```bash
src/
├── app/
│   ├── admin/          # Admin Dashboard & Statistics
│   ├── api/            # API Routes (Vote, Auth, Export)
│   ├── vote/           # Voter Interface
│   └── results/        # Public Results
├── components/         # Reusable UI Components
├── lib/                # Utilities (Auth, RateLimit, Email)
└── instrumentation.ts  # Sentry Integration
```

---
**Built for CSE23 Batch | University of Moratuwa**
