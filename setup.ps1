# CSE23 Elections - Setup Script
# Run this script to set up your development environment

Write-Host "================================" -ForegroundColor Cyan
Write-Host "CSE23 Elections - Setup Wizard" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Cyan
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node -v
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm -v
    Write-Host "✓ npm found: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Cyan

if (Test-Path .env) {
    Write-Host "✓ .env file found" -ForegroundColor Green
    Write-Host "  Please ensure all values are configured correctly" -ForegroundColor Yellow
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Yellow
    Write-Host "  Copying .env.example to .env..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "  IMPORTANT: Edit .env and configure:" -ForegroundColor Red
    Write-Host "  - DATABASE_URL (PostgreSQL connection string)" -ForegroundColor Yellow
    Write-Host "  - NEXTAUTH_SECRET (generate with: node -e ""console.log(require('crypto').randomBytes(32).toString('base64'))"")" -ForegroundColor Yellow
    Write-Host "  - GOOGLE_CLIENT_ID (from Google Cloud Console)" -ForegroundColor Yellow
    Write-Host "  - GOOGLE_CLIENT_SECRET (from Google Cloud Console)" -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "Have you configured .env? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please configure .env and run this script again" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
$runMigration = Read-Host "Do you want to run database migrations now? (y/n)"

if ($runMigration -eq "y") {
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    npx prisma migrate dev --name init
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database migrations completed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to run migrations" -ForegroundColor Red
        Write-Host "  Please check your DATABASE_URL and ensure PostgreSQL is running" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Skipping database migrations" -ForegroundColor Yellow
    Write-Host "  Run 'npx prisma migrate dev --name init' when ready" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "3. Sign in with your CSE Gmail account" -ForegroundColor White
Write-Host "4. Update your user role to 'super_admin' in the database" -ForegroundColor White
Write-Host "   - Use Prisma Studio: npx prisma studio" -ForegroundColor Yellow
Write-Host "   - Or SQL: UPDATE users SET role = 'super_admin' WHERE email = 'your-email@cse.du.ac.bd';" -ForegroundColor Yellow
Write-Host ""
Write-Host "For detailed documentation, see README.md" -ForegroundColor Cyan
Write-Host ""
