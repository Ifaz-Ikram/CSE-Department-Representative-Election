# Development Helper Scripts for CSE23 Elections
# Common commands for development workflow

param(
    [Parameter(Position=0)]
    [string]$Command
)

function Show-Menu {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "CSE23 Elections - Dev Tools" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor White
    Write-Host ""
    Write-Host "  dev          - Start development server" -ForegroundColor Green
    Write-Host "  build        - Build for production" -ForegroundColor Green
    Write-Host "  start        - Start production server" -ForegroundColor Green
    Write-Host "  studio       - Open Prisma Studio (DB GUI)" -ForegroundColor Green
    Write-Host "  migrate      - Run database migrations" -ForegroundColor Green
    Write-Host "  generate     - Generate Prisma Client" -ForegroundColor Green
    Write-Host "  reset        - Reset database (WARNING: deletes data)" -ForegroundColor Yellow
    Write-Host "  seed         - Seed database with test data" -ForegroundColor Green
    Write-Host "  lint         - Run ESLint" -ForegroundColor Green
    Write-Host "  clean        - Clean build artifacts" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 [command]" -ForegroundColor Cyan
    Write-Host ""
}

switch ($Command) {
    "dev" {
        Write-Host "Starting development server..." -ForegroundColor Cyan
        npm run dev
    }
    
    "build" {
        Write-Host "Building for production..." -ForegroundColor Cyan
        npm run build
    }
    
    "start" {
        Write-Host "Starting production server..." -ForegroundColor Cyan
        npm run start
    }
    
    "studio" {
        Write-Host "Opening Prisma Studio..." -ForegroundColor Cyan
        npx prisma studio
    }
    
    "migrate" {
        Write-Host "Running database migrations..." -ForegroundColor Cyan
        npx prisma migrate dev
    }
    
    "generate" {
        Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
        npx prisma generate
    }
    
    "reset" {
        Write-Host "WARNING: This will delete all data!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host "Resetting database..." -ForegroundColor Yellow
            npx prisma migrate reset
        } else {
            Write-Host "Cancelled" -ForegroundColor Green
        }
    }
    
    "seed" {
        Write-Host "Seeding database with test data..." -ForegroundColor Cyan
        Write-Host "Note: Implement seed script in prisma/seed.ts" -ForegroundColor Yellow
    }
    
    "lint" {
        Write-Host "Running ESLint..." -ForegroundColor Cyan
        npm run lint
    }
    
    "clean" {
        Write-Host "Cleaning build artifacts..." -ForegroundColor Cyan
        if (Test-Path ".next") {
            Remove-Item -Recurse -Force ".next"
            Write-Host "✓ Removed .next" -ForegroundColor Green
        }
        if (Test-Path "node_modules/.cache") {
            Remove-Item -Recurse -Force "node_modules/.cache"
            Write-Host "✓ Removed cache" -ForegroundColor Green
        }
        Write-Host "Clean complete" -ForegroundColor Green
    }
    
    default {
        Show-Menu
    }
}
