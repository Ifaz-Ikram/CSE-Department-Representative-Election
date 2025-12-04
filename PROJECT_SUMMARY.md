# Project Summary - CSE23 Department Representative Elections

## 📋 Project Overview

A production-ready, secure voting web application built for CSE23 batch representative elections. The system allows ~200 students to vote for up to 10 candidates per election with full ballot editability until the deadline.

## 🏗️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom CSE23 dark theme
- **Authentication**: NextAuth.js (Auth.js) with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel-ready (or any Node.js hosting)

## ✨ Key Features Implemented

### Authentication & Authorization
- ✅ Google OAuth integration with CSE Gmail restriction
- ✅ Three-tier role system: voter, admin, super_admin
- ✅ Server-side session management
- ✅ Email domain whitelist enforcement

### Voting System
- ✅ Multi-candidate selection (0-10 candidates)
- ✅ Editable ballots before deadline
- ✅ Atomic transaction-based vote updates
- ✅ Time-based vote locking (after election end)
- ✅ One ballot per voter per election (DB constraint)

### Admin Features
- ✅ Election management (CRUD operations)
- ✅ Candidate management
- ✅ Live statistics during elections (super_admin only)
- ✅ Voter-candidate mapping visibility
- ✅ Granular results visibility control
- ✅ Role-based dashboard access

### Security
- ✅ Parameterized queries (Prisma ORM - no SQL injection)
- ✅ CSRF protection (NextAuth built-in)
- ✅ Server-side role validation on all protected routes
- ✅ Session-based voter identification (never trust client)
- ✅ HTTPS-ready configuration
- ✅ Secure cookie handling

### UI/UX
- ✅ Dark, futuristic CSE23 theme
- ✅ Responsive design (mobile-friendly)
- ✅ Real-time feedback on vote submission
- ✅ Clear election status indicators
- ✅ Intuitive admin dashboard
- ✅ Accessible form controls

## 📁 Project Structure

```
CSE Department Representative Election/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # Authentication
│   │   │   ├── admin/                # Admin endpoints
│   │   │   ├── vote/                 # Voting endpoint
│   │   │   ├── candidates/           # Candidate listing
│   │   │   └── elections/            # Election listing
│   │   ├── admin/                    # Admin pages
│   │   │   ├── elections/[id]/       # Candidate management
│   │   │   ├── statistics/           # Vote statistics
│   │   │   ├── ballots/              # Ballot mapping
│   │   │   └── page.tsx              # Admin dashboard
│   │   ├── vote/                     # Voting page
│   │   ├── results/                  # Results page
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── Navigation.tsx            # Nav component
│   │   └── Providers.tsx             # Session provider
│   ├── lib/
│   │   ├── auth.ts                   # Auth config
│   │   ├── prisma.ts                 # Prisma client
│   │   └── session.ts                # Session helpers
│   └── types/
│       └── next-auth.d.ts            # Type extensions
├── prisma/
│   └── schema.prisma                 # Database schema
├── public/                           # Static assets
├── .env.example                      # Environment template
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config
├── next.config.mjs                   # Next.js config
├── README.md                         # Full documentation
├── QUICKSTART.md                     # Quick start guide
├── DEPLOYMENT.md                     # Deployment checklist
├── setup.ps1                         # Setup script
└── dev.ps1                           # Dev helper script
```

## 🗄️ Database Schema

### Tables
1. **users** - User accounts with roles
2. **elections** - Election configurations
3. **candidates** - Candidate information
4. **ballots** - User votes (one per user per election)
5. **ballot_choices** - Selected candidates (many-to-many)

### Key Relationships
- User → Ballots (one-to-many)
- User → Candidates (one-to-many, as candidate)
- Election → Candidates (one-to-many)
- Election → Ballots (one-to-many)
- Ballot → BallotChoices → Candidates (many-to-many)

## 🔐 Security Implementation

1. **Input Validation**: Zod schemas validate all API inputs
2. **SQL Injection Prevention**: Prisma ORM with parameterized queries
3. **Authentication**: NextAuth with secure session management
4. **Authorization**: Role-based access control on all protected routes
5. **CSRF**: Built-in protection from NextAuth
6. **XSS Prevention**: React's built-in XSS protection
7. **Rate Limiting**: Recommended for production (not implemented)

## 🚦 Access Control Matrix

| Feature | Voter | Admin | Super Admin |
|---------|-------|-------|-------------|
| Vote | ✅ | ✅ | ✅ |
| Edit Vote (before deadline) | ✅ | ✅ | ✅ |
| View Results (public) | ✅ | ✅ | ✅ |
| View Results (restricted) | ❌ | ✅* | ✅ |
| View Statistics | ❌ | ✅* | ✅ |
| View Voter Mapping | ❌ | ✅* | ✅ |
| Create Election | ❌ | ❌ | ✅ |
| Manage Candidates | ❌ | ❌ | ✅ |
| Toggle Visibility | ❌ | ❌ | ✅ |

*Admin access after `resultsVisible=true`

## 📊 API Endpoints

### Public
- `GET /api/elections` - List elections
- `GET /api/candidates` - Get candidates

### Authenticated
- `POST /api/vote` - Submit/update vote
- `GET /api/vote` - Get user's ballot

### Admin/Super Admin
- `POST /api/admin/elections` - Create election
- `PATCH /api/admin/elections` - Update election
- `DELETE /api/admin/elections` - Delete election
- `POST /api/admin/candidates` - Add candidate
- `DELETE /api/admin/candidates` - Remove candidate
- `GET /api/admin/statistics` - Get vote statistics
- `GET /api/admin/ballots` - Get voter-candidate mapping

## 🎨 Theme Configuration

The app features a custom CSE23 dark futuristic theme:

- **Navy Background**: #0a1628 (deep navy blue)
- **Cyan Accents**: #00d9ff (glowing cyan highlights)
- **Yellow Branding**: #ffd700 ("CSE23" signature color)
- **Circuit Pattern**: Subtle grid background effect
- **Glow Effects**: Text and border glow on interactive elements

## 📦 Dependencies

### Core
- next@14.2.15
- react@18.3.1
- typescript@5.x

### Authentication
- next-auth@4.24.10
- @next-auth/prisma-adapter@1.0.7

### Database
- @prisma/client@5.22.0
- prisma@5.22.0

### Validation
- zod@3.23.8

### Styling
- tailwindcss@3.4.14

## 🚀 Getting Started

1. **Quick Setup**: Run `.\setup.ps1` (PowerShell)
2. **Manual Setup**: See `QUICKSTART.md`
3. **Full Documentation**: See `README.md`

## 📝 Documentation Files

- **README.md** - Complete setup and usage guide
- **QUICKSTART.md** - 5-minute quick start
- **DEPLOYMENT.md** - Production deployment checklist
- **.env.example** - Environment variables template

## 🔄 Development Workflow

```powershell
# Start development
npm run dev

# Open Prisma Studio (DB GUI)
npx prisma studio

# Run migrations
npx prisma migrate dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Configure `.env` with database and OAuth credentials
3. Run migrations: `npx prisma migrate dev`
4. Start dev server: `npm run dev`
5. Make first user super_admin
6. Create election and candidates
7. Test voting flow
8. Deploy to production

## 📞 Support

For detailed instructions, troubleshooting, and deployment guides, refer to the documentation files in this project.

---

**Built for CSE23 Batch | University of Dhaka**
