# CSE23 Department Representative Elections

A secure, modern voting web application for CSE23 batch representative elections built with Next.js 14, TypeScript, and PostgreSQL.

## 🚀 Features

- **Secure Authentication**: Google OAuth integration restricted to CSE Gmail accounts
- **Role-Based Access Control**: Three roles (voter, admin, super_admin) with distinct permissions
- **Flexible Voting**: Select up to 10 candidates per election
- **Editable Ballots**: Voters can modify their choices until the election deadline
- **Real-Time Statistics**: Live vote tracking for administrators
- **Results Visibility Control**: Granular control over when and who can view results
- **Modern UI**: Dark, futuristic CSE23-themed interface with Tailwind CSS
- **Production-Ready**: Built with security best practices and type safety

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud Project with OAuth credentials

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```powershell
# Navigate to project directory
cd "d:\Coding\CSE Department Representative Election"

# Install dependencies
npm install
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Save the Client ID and Client Secret

### 3. Configure Environment Variables

```powershell
# Copy the example env file
Copy-Item .env.example .env

# Edit .env with your values
notepad .env
```

Update the following in `.env`:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/cse23_election?schema=public"

# NextAuth - Generate a random secret
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth - From Google Cloud Console
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email domain restriction
ALLOWED_EMAIL_DOMAIN="cse.du.ac.bd"
```

To generate `NEXTAUTH_SECRET`:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Set Up Database

```powershell
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Optional: Open Prisma Studio to view/edit data
npx prisma studio
```

### 5. Create Super Admin User

After your first login, manually update your user role in the database:

```sql
-- Connect to your PostgreSQL database
-- Update your user to super_admin role
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'your-email@cse.du.ac.bd';
```

Or use Prisma Studio (run `npx prisma studio`) to update the role visually.

### 6. Run Development Server

```powershell
npm run dev
```

Visit http://localhost:3000

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth configuration
│   │   ├── admin/                  # Admin API routes
│   │   │   ├── elections/          # Election management
│   │   │   ├── candidates/         # Candidate management
│   │   │   ├── statistics/         # Vote statistics
│   │   │   └── ballots/            # Ballot mapping
│   │   ├── vote/                   # Voting API
│   │   ├── candidates/             # Get candidates
│   │   └── elections/              # Get elections
│   ├── admin/                      # Admin dashboard pages
│   │   ├── elections/[id]/         # Manage election candidates
│   │   ├── statistics/             # View statistics
│   │   └── ballots/                # View voter-candidate mapping
│   ├── vote/                       # Voting page
│   ├── results/                    # Results page
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   └── globals.css                 # Global styles
├── components/
│   ├── Navigation.tsx              # Navigation component
│   └── Providers.tsx               # Session provider
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   ├── prisma.ts                   # Prisma client
│   └── session.ts                  # Session helpers
└── types/
    └── next-auth.d.ts              # NextAuth type extensions

prisma/
└── schema.prisma                   # Database schema
```

## 🔐 Security Features

- **Parameterized Queries**: All database queries use Prisma ORM (no SQL injection)
- **CSRF Protection**: Built-in with NextAuth
- **Role-Based Access**: Server-side role verification on all protected routes
- **Email Whitelist**: Only @cse.du.ac.bd emails can access
- **Session-Based Voting**: Voter ID always taken from session, never from client
- **Transaction Safety**: Ballot updates are atomic operations
- **Time-Based Validation**: Votes locked after election end time

## 👥 User Roles

### Voter (Default)
- Can vote in active elections
- Can modify vote before deadline
- Can view results (when made public)

### Admin
- Everything voters can do
- After election ends and `resultsVisible` is true:
  - View detailed statistics
  - View voter-candidate mapping

### Super Admin
- Everything admins can do
- Create/edit/delete elections
- Add/remove candidates
- View live statistics during election
- View voter-candidate mapping anytime
- Toggle results visibility flags

## 📊 Database Schema

### User
- `id`, `email`, `indexNumber`, `name`, `role`, `createdAt`

### Election
- `id`, `name`, `description`, `startTime`, `endTime`
- `resultsVisible`, `publicResultsVisible`, `createdAt`

### Candidate
- `id`, `electionId`, `userId`, `name`, `indexNumber`, `email`, `bio`, `photoUrl`

### Ballot
- `id`, `electionId`, `voterId`, `createdAt`, `updatedAt`
- **Unique constraint**: (electionId, voterId)

### BallotChoice
- `id`, `ballotId`, `candidateId`
- Max 10 choices per ballot (enforced by API)

## 🎨 Theme Customization

The app uses a custom CSE23 theme defined in `tailwind.config.ts`:

- **Navy Background**: Deep navy blue (#0a1628)
- **Cyan Accents**: Glowing cyan for highlights (#00d9ff)
- **Yellow CSE23**: Signature yellow for branding (#ffd700)
- **Circuit Pattern**: Subtle grid background effect

## 🚀 Deployment (Vercel + Postgres)

### 1. Prepare for Deployment

```powershell
# Ensure all changes are committed
git init
git add .
git commit -m "Initial commit"
```

### 2. Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Set up Vercel Postgres or use external PostgreSQL

### 3. Set Up Production Database

```powershell
# Run migrations on production
npx prisma migrate deploy
```

### 4. Update OAuth Redirect URIs

Add your production URL to Google OAuth settings:
- `https://your-domain.vercel.app/api/auth/callback/google`

## 📝 API Endpoints

### Public
- `GET /api/elections` - List all elections
- `GET /api/candidates?electionId=X` - Get election candidates

### Authenticated
- `POST /api/vote` - Submit/update vote
- `GET /api/vote?electionId=X` - Get user's ballot

### Admin Only
- `POST /api/admin/elections` - Create election
- `PATCH /api/admin/elections` - Update election
- `DELETE /api/admin/elections?id=X` - Delete election
- `POST /api/admin/candidates` - Add candidate
- `DELETE /api/admin/candidates?id=X` - Remove candidate
- `GET /api/admin/statistics?electionId=X` - Get vote statistics
- `GET /api/admin/ballots?electionId=X` - Get voter-candidate mapping

## 🧪 Testing Workflow

1. Create test election with future dates
2. Add test candidates
3. Test voting flow:
   - Login with CSE email
   - Select candidates (0-10)
   - Submit vote
   - Modify vote
   - Verify before deadline
4. Test time-based locks:
   - Change election end time to past
   - Verify votes are locked
5. Test role-based access:
   - Toggle visibility flags
   - Test different user roles

## 🔧 Common Commands

```powershell
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Create and apply migration
npx prisma migrate reset # Reset database (warning: deletes data)
npx prisma studio        # Open Prisma Studio GUI
npx prisma db push       # Push schema without migration
```

## 📄 License

This project is built for CSE23 batch elections at the University of Moratuwa.

## 🤝 Support

For issues or questions, contact the super admin or create an issue in the repository.

---

Built with ❤️ for CSE23
