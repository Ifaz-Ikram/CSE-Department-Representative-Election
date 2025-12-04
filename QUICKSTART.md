# Quick Start Guide - CSE23 Elections

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Configure Environment
```powershell
# Copy example env file
Copy-Item .env.example .env

# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Edit .env with your values
notepad .env
```

Required values in `.env`:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generated secret from above
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### Step 3: Set Up Database
```powershell
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### Step 4: Start Development Server
```powershell
npm run dev
```

Visit: http://localhost:3000

### Step 5: Make Yourself Super Admin

After first login:

**Option A: Using Prisma Studio (GUI)**
```powershell
npx prisma studio
```
- Navigate to `users` table
- Find your user
- Change `role` to `super_admin`
- Save

**Option B: Using SQL**
```sql
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'your-email@cse.du.ac.bd';
```

## 🎯 First Tasks as Super Admin

1. **Create an Election**
   - Go to Admin Dashboard
   - Click "Create Election"
   - Set name, dates, and description

2. **Add Candidates**
   - Click "Manage Candidates" on your election
   - Add candidate details

3. **Test Voting**
   - Go to Vote page
   - Select candidates (up to 10)
   - Submit vote

4. **View Results**
   - Go to Admin Dashboard
   - Click "View Statistics"
   - Toggle visibility settings

## 🔧 Common Issues

### "Cannot connect to database"
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Test connection: `npx prisma db pull`

### "OAuth Error"
- Verify Google OAuth credentials
- Check redirect URI: `http://localhost:3000/api/auth/callback/google`
- Ensure Google+ API is enabled

### "Unauthorized" after login
- Check if your email ends with correct domain
- Verify `ALLOWED_EMAIL_DOMAIN` in `.env`

## 📚 Learn More

- Full setup guide: See `README.md`
- Database schema: See `prisma/schema.prisma`
- API documentation: See README.md → API Endpoints section

## 🎨 Customization

### Change Theme Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  navy: { DEFAULT: '#0a1628' },
  cyan: { DEFAULT: '#00d9ff' },
  // ... customize here
}
```

### Change Allowed Email Domain
Edit `.env`:
```env
ALLOWED_EMAIL_DOMAIN="your-domain.com"
```

### Adjust Vote Limit
Edit `src/app/api/vote/route.ts`:
```typescript
// Change from 10 to your desired limit
candidateIds: z.array(z.string()).min(0).max(10)
```

## 📞 Need Help?

- Check README.md for detailed documentation
- Review code comments in source files
- Test with Prisma Studio for database issues

---

Happy coding! 🎉
