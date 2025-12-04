# Deployment Checklist - CSE23 Elections

## Pre-Deployment Checklist

### 1. Code & Configuration
- [ ] All environment variables are documented in `.env.example`
- [ ] No sensitive data in code (API keys, passwords, etc.)
- [ ] All console.log statements removed or replaced with proper logging
- [ ] Error handling is comprehensive
- [ ] TypeScript compilation succeeds without errors
- [ ] ESLint passes without critical errors

### 2. Database
- [ ] Prisma schema is up to date
- [ ] All migrations are tested
- [ ] Database indexes are optimized
- [ ] Backup strategy is in place
- [ ] Connection pooling is configured (if needed)

### 3. Authentication & Security
- [ ] Google OAuth credentials for production domain
- [ ] `NEXTAUTH_URL` points to production domain
- [ ] `NEXTAUTH_SECRET` is cryptographically secure (32+ bytes)
- [ ] CSRF protection is enabled (default in NextAuth)
- [ ] Rate limiting considered for API endpoints
- [ ] CORS configured properly
- [ ] HTTPS enforced

### 4. Testing
- [ ] Manual testing of all user flows
  - [ ] Login/logout
  - [ ] Voting flow (create, update, lock after deadline)
  - [ ] Admin election creation
  - [ ] Candidate management
  - [ ] Statistics viewing
  - [ ] Role-based access control
- [ ] Test with different user roles (voter, admin, super_admin)
- [ ] Test time-based features (election start/end)
- [ ] Test error scenarios (invalid data, unauthorized access)

### 5. Performance
- [ ] Images optimized
- [ ] Build size is reasonable
- [ ] Database queries are optimized (use indexes)
- [ ] No N+1 query problems
- [ ] Consider caching for frequently accessed data

### 6. User Management
- [ ] Plan for initial user role assignment
- [ ] Document process for promoting users to admin/super_admin
- [ ] Whitelist of valid voter emails is prepared
- [ ] Email domain restriction is correct

## Deployment Steps

### Option A: Vercel Deployment

1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CSE23 Elections"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Set Up Vercel Project**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next

3. **Configure Environment Variables**
   Add all variables from `.env`:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `ALLOWED_EMAIL_DOMAIN`

4. **Set Up Database**
   
   **Option 1: Vercel Postgres**
   - Enable Vercel Postgres in your project
   - Copy `DATABASE_URL` to environment variables
   - Run migrations:
     ```bash
     npx prisma migrate deploy
     ```

   **Option 2: External PostgreSQL**
   - Use your existing PostgreSQL instance
   - Ensure it's accessible from Vercel
   - Update `DATABASE_URL` in Vercel environment variables

5. **Update Google OAuth**
   - Go to Google Cloud Console
   - Add production redirect URI:
     `https://your-domain.vercel.app/api/auth/callback/google`

6. **Deploy**
   - Vercel will auto-deploy on push to main
   - Or manually deploy from Vercel dashboard

7. **Post-Deployment Tasks**
   - Test the production deployment
   - Promote your account to super_admin:
     - Connect to production database
     - Run: `UPDATE users SET role = 'super_admin' WHERE email = 'your-email@cse.du.ac.bd';`
   - Create initial election and candidates

### Option B: Manual Server Deployment

1. **Server Requirements**
   - Node.js 18+
   - PostgreSQL 12+
   - Nginx (recommended for reverse proxy)
   - SSL certificate (Let's Encrypt recommended)

2. **Server Setup**
   ```bash
   # Clone repository
   git clone <repo-url>
   cd cse23-election

   # Install dependencies
   npm install

   # Build application
   npm run build

   # Set up environment variables
   cp .env.example .env
   nano .env  # Edit with production values

   # Run migrations
   npx prisma migrate deploy

   # Start application
   npm start
   # Or use PM2 for process management:
   # npm install -g pm2
   # pm2 start npm --name "cse23-election" -- start
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment Verification

- [ ] Test login with CSE email
- [ ] Test voting flow end-to-end
- [ ] Verify role-based access control
- [ ] Test admin features
- [ ] Check database connectivity
- [ ] Monitor error logs
- [ ] Test on multiple devices/browsers
- [ ] Verify SSL certificate
- [ ] Test email domain restriction

## Monitoring & Maintenance

### Set Up Monitoring
- [ ] Enable Vercel Analytics (if using Vercel)
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor database performance
- [ ] Set up uptime monitoring
- [ ] Configure backup schedule

### Regular Maintenance
- [ ] Monitor server/database resources
- [ ] Review error logs weekly
- [ ] Keep dependencies updated
- [ ] Backup database regularly
- [ ] Monitor active elections

## Rollback Plan

If issues occur after deployment:

1. **Vercel**: Revert to previous deployment
   - Go to Deployments tab
   - Click on previous successful deployment
   - Click "Promote to Production"

2. **Manual Server**: 
   ```bash
   git revert HEAD
   npm install
   npm run build
   pm2 restart cse23-election
   ```

## Support Contacts

- Super Admin: [Your Email]
- Database Admin: [DBA Email]
- Server Admin: [Server Admin Email]

## Notes

- Keep this checklist updated as new features are added
- Document any deployment issues and resolutions
- Share credentials securely (use password manager)
- Schedule maintenance windows for database migrations

---

Last Updated: [Current Date]
Deployment Date: ___________
Deployed By: ___________
