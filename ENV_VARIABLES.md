# Environment Variables Documentation

This file documents all environment variables used in the CSE23 Elections application.

## Required Variables

### Database Configuration

#### `DATABASE_URL`
- **Type**: Connection String
- **Required**: Yes
- **Description**: PostgreSQL database connection string
- **Format**: `postgresql://username:password@host:port/database?schema=public`
- **Example**: `postgresql://postgres:mypassword@localhost:5432/cse23_election?schema=public`
- **Production**: Use managed database URL (e.g., Vercel Postgres, AWS RDS)

### Authentication Configuration

#### `NEXTAUTH_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: Base URL of your application
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.vercel.app` (or your actual domain)
- **Note**: Must match the domain where the app is deployed

#### `NEXTAUTH_SECRET`
- **Type**: String (Base64 encoded)
- **Required**: Yes
- **Description**: Secret key for signing and encrypting tokens
- **Generate**: Run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- **Security**: MUST be different for development and production
- **Length**: Minimum 32 characters (base64 encoded 32 bytes recommended)
- **Example**: `jWx+7MzKq8sF9P2kL5nT3vY6uB4wE8aD1cH0gR7iN9=`

### Google OAuth Configuration

#### `GOOGLE_CLIENT_ID`
- **Type**: String
- **Required**: Yes
- **Description**: Google OAuth 2.0 Client ID
- **Get From**: [Google Cloud Console](https://console.cloud.google.com/)
- **Setup**:
  1. Create project in Google Cloud Console
  2. Enable Google+ API
  3. Create OAuth 2.0 credentials
  4. Add authorized redirect URI
- **Format**: `xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`

#### `GOOGLE_CLIENT_SECRET`
- **Type**: String
- **Required**: Yes
- **Description**: Google OAuth 2.0 Client Secret
- **Get From**: Same as Client ID (Google Cloud Console)
- **Security**: Keep this secret and never commit to version control
- **Format**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Application Configuration

#### `ALLOWED_EMAIL_DOMAIN`
- **Type**: String
- **Required**: No (defaults to "cse.du.ac.bd")
- **Description**: Email domain restriction for login
- **Default**: `cse.du.ac.bd`
- **Example**: `university.edu`, `company.com`
- **Usage**: Only emails ending with `@{ALLOWED_EMAIL_DOMAIN}` can log in

## Environment-Specific Configurations

### Development (.env.local or .env)

```env
# Database - Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/cse23_election?schema=public"

# NextAuth - Local development
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-min-32-chars-use-generated"

# Google OAuth - Development credentials
GOOGLE_CLIENT_ID="your-dev-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-dev-client-secret"

# Email Domain
ALLOWED_EMAIL_DOMAIN="cse.du.ac.bd"
```

### Production (Vercel Environment Variables)

```env
# Database - Managed PostgreSQL (Vercel Postgres, AWS RDS, etc.)
DATABASE_URL="postgresql://user:pass@prod-host:5432/prod_db?schema=public"

# NextAuth - Production domain
NEXTAUTH_URL="https://your-production-domain.vercel.app"
NEXTAUTH_SECRET="production-secret-DIFFERENT-from-dev-use-generated"

# Google OAuth - Production credentials
GOOGLE_CLIENT_ID="your-prod-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-prod-client-secret"

# Email Domain
ALLOWED_EMAIL_DOMAIN="cse.du.ac.bd"
```

## Security Best Practices

### 1. Secret Management
- ✅ Never commit `.env` files to version control (already in `.gitignore`)
- ✅ Use different secrets for development and production
- ✅ Rotate secrets periodically
- ✅ Use environment variable management tools (Vercel, AWS Secrets Manager, etc.)

### 2. Database Security
- ✅ Use connection pooling for production
- ✅ Enable SSL for database connections in production
- ✅ Restrict database access by IP (whitelist application servers)
- ✅ Use read-only database users where applicable

### 3. OAuth Configuration
- ✅ Separate OAuth credentials for development and production
- ✅ Restrict redirect URIs to known domains
- ✅ Enable only necessary OAuth scopes
- ✅ Monitor OAuth usage in Google Cloud Console

## Setting Up Environment Variables

### Local Development

1. Copy the example file:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Generate `NEXTAUTH_SECRET`:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. Edit `.env` with your values:
   ```powershell
   notepad .env
   ```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable:
   - Variable name (e.g., `DATABASE_URL`)
   - Value (paste your value)
   - Select environment: Production, Preview, Development
4. Click "Save"

### Manual Server Deployment

1. SSH into your server
2. Navigate to project directory
3. Create `.env` file:
   ```bash
   nano .env
   ```
4. Paste all environment variables
5. Save and exit (Ctrl+X, Y, Enter)
6. Ensure file permissions are restrictive:
   ```bash
   chmod 600 .env
   ```

## Troubleshooting

### "Missing environment variable" Error
- Ensure all required variables are set in `.env`
- Restart the development server after changing `.env`
- For production, ensure variables are set in hosting platform

### "Invalid database URL" Error
- Check DATABASE_URL format
- Ensure PostgreSQL is running (development)
- Verify database credentials
- Test connection: `npx prisma db pull`

### "OAuth error" / "Redirect URI mismatch"
- Verify NEXTAUTH_URL matches your domain
- Check Google OAuth redirect URIs include:
  - Dev: `http://localhost:3000/api/auth/callback/google`
  - Prod: `https://your-domain/api/auth/callback/google`

### "Unauthorized" after login
- Check ALLOWED_EMAIL_DOMAIN matches your email domain
- Verify Google OAuth is returning email in profile
- Ensure NextAuth session is configured correctly

## Validation Checklist

Before deploying, verify:

- [ ] All required variables are set
- [ ] NEXTAUTH_SECRET is 32+ characters and different from development
- [ ] DATABASE_URL points to correct database
- [ ] NEXTAUTH_URL matches deployment domain
- [ ] Google OAuth credentials are for production
- [ ] OAuth redirect URIs include production domain
- [ ] ALLOWED_EMAIL_DOMAIN is correct
- [ ] All secrets are stored securely (not in code)

## Reference Links

- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)
- [Google OAuth Setup](https://console.cloud.google.com/)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

Last Updated: 2025-12-04
