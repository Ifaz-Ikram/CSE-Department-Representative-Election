# Maintenance & Operations Guide

## Daily Operations

### Monitoring Active Elections

Check election status daily:
```powershell
# Using Prisma Studio
npx prisma studio

# Or query directly
# Navigate to elections table
# Check startTime and endTime for active elections
```

### Backup Database

**Automated Backup (Recommended)**

Set up automated daily backups via your hosting provider or use:

```bash
# PostgreSQL backup script
pg_dump -U username -h hostname -d database_name > backup_$(date +%Y%m%d).sql
```

**Manual Backup**

```powershell
# Connect to your database
pg_dump -U your_username -h your_host -d cse23_election > backup.sql
```

## Common Administrative Tasks

### 1. Promote User to Admin/Super Admin

**Method A: Prisma Studio (GUI)**
```powershell
npx prisma studio
# Navigate to users table
# Find user by email
# Change role to 'admin' or 'super_admin'
# Save
```

**Method B: SQL Query**
```sql
-- Make user an admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@cse.du.ac.bd';

-- Make user a super admin
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'user@cse.du.ac.bd';
```

### 2. Manually Lock/Unlock Election Results

```sql
-- Show results to admins
UPDATE elections 
SET results_visible = true 
WHERE id = 'election-id-here';

-- Make results public to all voters
UPDATE elections 
SET public_results_visible = true 
WHERE id = 'election-id-here';

-- Hide results
UPDATE elections 
SET results_visible = false, 
    public_results_visible = false 
WHERE id = 'election-id-here';
```

### 3. Extend Election Deadline

**Option A: Through Admin UI**
1. Login as super_admin
2. Go to Admin Dashboard
3. Click on election
4. Update end time

**Option B: SQL Query**
```sql
UPDATE elections 
SET end_time = '2025-12-31 23:59:59' 
WHERE id = 'election-id-here';
```

### 4. Reset a User's Vote

```sql
-- Find ballot ID
SELECT id FROM ballots 
WHERE voter_id = 'user-id' 
AND election_id = 'election-id';

-- Delete ballot choices
DELETE FROM ballot_choices 
WHERE ballot_id = 'ballot-id-from-above';

-- Delete ballot
DELETE FROM ballots 
WHERE id = 'ballot-id-from-above';
```

### 5. View Vote Statistics

```sql
-- Count total votes per election
SELECT 
    e.name,
    COUNT(b.id) as total_votes
FROM elections e
LEFT JOIN ballots b ON e.id = b.election_id
GROUP BY e.id, e.name;

-- Count votes per candidate
SELECT 
    c.name,
    c.index_number,
    COUNT(bc.id) as vote_count
FROM candidates c
LEFT JOIN ballot_choices bc ON c.id = bc.candidate_id
WHERE c.election_id = 'election-id-here'
GROUP BY c.id, c.name, c.index_number
ORDER BY vote_count DESC;
```

## Troubleshooting

### Issue: Users Can't Login

**Possible Causes:**
1. Google OAuth credentials incorrect
2. Email domain not allowed
3. NextAuth configuration error

**Solutions:**
```powershell
# Check environment variables
Get-Content .env | Select-String "GOOGLE"
Get-Content .env | Select-String "ALLOWED_EMAIL_DOMAIN"

# Verify OAuth redirect URIs in Google Console match NEXTAUTH_URL
```

### Issue: Votes Not Submitting

**Possible Causes:**
1. Election has ended
2. Database connection issue
3. Transaction timeout

**Check:**
```sql
-- Check election status
SELECT 
    name, 
    start_time, 
    end_time, 
    NOW() as current_time,
    CASE 
        WHEN NOW() < start_time THEN 'Not Started'
        WHEN NOW() > end_time THEN 'Ended'
        ELSE 'Active'
    END as status
FROM elections;

-- Check for hanging transactions
SELECT * FROM pg_stat_activity 
WHERE state != 'idle';
```

### Issue: Database Performance Slow

**Check Database Stats:**
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries (if logging enabled)
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Solutions:**
- Add indexes if missing
- Increase connection pool size
- Optimize queries
- Consider read replicas

### Issue: Application Crashes

**Check Logs:**

**Vercel:**
```
# View in Vercel dashboard → Logs
```

**PM2:**
```bash
pm2 logs cse23-election
pm2 monit
```

**Common Fixes:**
```powershell
# Restart application
pm2 restart cse23-election

# Clear cache and rebuild
Remove-Item -Recurse -Force .next
npm run build
pm2 restart cse23-election
```

## Database Maintenance

### Vacuum Database (PostgreSQL)

```sql
-- Reclaim storage and optimize
VACUUM ANALYZE;

-- Full vacuum (locks tables, do during maintenance window)
VACUUM FULL;
```

### Check Database Size

```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'cse23_election';
```

### Optimize Indexes

```sql
-- Reindex all tables
REINDEX DATABASE cse23_election;

-- Or specific table
REINDEX TABLE ballots;
```

## Security Audits

### Monthly Security Checklist

- [ ] Review user roles (ensure only authorized super_admins)
- [ ] Check for suspicious voting patterns
- [ ] Review application logs for errors
- [ ] Verify SSL certificate validity
- [ ] Update dependencies: `npm outdated`
- [ ] Rotate NEXTAUTH_SECRET if needed
- [ ] Review OAuth application usage in Google Console
- [ ] Backup database
- [ ] Test disaster recovery process

### Audit User Roles

```sql
-- List all admins and super admins
SELECT 
    email, 
    name, 
    index_number, 
    role,
    created_at
FROM users
WHERE role IN ('admin', 'super_admin')
ORDER BY role, email;
```

### Check for Duplicate Votes (Should be 0)

```sql
-- This should return 0 rows (enforced by DB constraint)
SELECT 
    election_id, 
    voter_id, 
    COUNT(*) 
FROM ballots 
GROUP BY election_id, voter_id 
HAVING COUNT(*) > 1;
```

### Verify Vote Integrity

```sql
-- Check for ballots with more than 10 choices
SELECT 
    b.id,
    u.email,
    e.name as election_name,
    COUNT(bc.id) as choice_count
FROM ballots b
JOIN users u ON b.voter_id = u.id
JOIN elections e ON b.election_id = e.id
LEFT JOIN ballot_choices bc ON b.id = bc.ballot_id
GROUP BY b.id, u.email, e.name
HAVING COUNT(bc.id) > 10;
```

## Performance Optimization

### Add Missing Indexes

```sql
-- If queries are slow, consider adding indexes:

-- Index for finding user ballots
CREATE INDEX IF NOT EXISTS idx_ballots_election_voter 
ON ballots(election_id, voter_id);

-- Index for ballot choices
CREATE INDEX IF NOT EXISTS idx_ballot_choices_ballot 
ON ballot_choices(ballot_id);

-- Index for candidate lookups
CREATE INDEX IF NOT EXISTS idx_candidates_election 
ON candidates(election_id);
```

### Connection Pooling

Update Prisma configuration for production:

```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool settings
  // connection_limit: 10,
  // pool_timeout: 30,
});
```

## Scheduled Maintenance

### Weekly Tasks

- [ ] Review error logs
- [ ] Check disk space (database and application)
- [ ] Monitor active elections
- [ ] Review new user registrations

### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`
- [ ] Vacuum database
- [ ] Review and archive old elections
- [ ] Test backup restoration
- [ ] Update documentation

### After Each Election

- [ ] Verify final vote counts
- [ ] Generate final reports
- [ ] Archive election data (if needed)
- [ ] Collect feedback from users
- [ ] Update system based on feedback

## Emergency Procedures

### Election Needs to be Extended

```sql
-- Quick extension (add 24 hours)
UPDATE elections 
SET end_time = end_time + INTERVAL '24 hours' 
WHERE id = 'election-id';
```

### Database Connection Lost

```powershell
# Check database status
pg_isready -h hostname -p 5432

# Restart application
pm2 restart cse23-election

# If Vercel, redeploy or check Vercel status
```

### Suspected Vote Manipulation

1. **Immediately**: Lock the election
   ```sql
   UPDATE elections 
   SET end_time = NOW() 
   WHERE id = 'election-id';
   ```

2. **Export data** for investigation
   ```sql
   COPY (
     SELECT * FROM ballots WHERE election_id = 'election-id'
   ) TO '/tmp/ballots_backup.csv' CSV HEADER;
   ```

3. **Review audit trail**
   ```sql
   SELECT 
       b.id,
       u.email,
       b.created_at,
       b.updated_at,
       COUNT(bc.id) as choices
   FROM ballots b
   JOIN users u ON b.voter_id = u.id
   LEFT JOIN ballot_choices bc ON b.id = bc.ballot_id
   WHERE b.election_id = 'election-id'
   GROUP BY b.id, u.email, b.created_at, b.updated_at
   ORDER BY b.updated_at DESC;
   ```

## Contact Information

**Technical Lead**: [Your Name] - [your.email@cse.du.ac.bd]
**Database Admin**: [DBA Name] - [dba.email@cse.du.ac.bd]
**Batch Representative**: [Rep Name] - [rep.email@cse.du.ac.bd]

**Emergency Contacts**:
- Technical Issues: [Phone Number]
- Election Issues: [Phone Number]

---

Last Updated: 2025-12-04
