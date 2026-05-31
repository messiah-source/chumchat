# CHUM.CHAT — First-time setup script
# Run once: .\setup.ps1
# Requires: Node.js 20+, Docker Desktop

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host "=== CHUM.CHAT SETUP ===" -ForegroundColor Cyan
Write-Host ""

# --- Check prerequisites ---
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org (v20+)" -ForegroundColor Red
    exit 1
}
$nodeVer = node --version
Write-Host "  Node.js: $nodeVer" -ForegroundColor Green

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "ERROR: Docker not found. Install Docker Desktop from https://docker.com" -ForegroundColor Red
    exit 1
}
$dockerVer = docker --version
Write-Host "  Docker: $dockerVer" -ForegroundColor Green

# --- Copy .env ---
Write-Host ""
Write-Host "[2/6] Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path "$Root\.env")) {
    Copy-Item "$Root\.env.example" "$Root\.env"
    Write-Host "  Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host "  .env already exists, skipping" -ForegroundColor Gray
}

if (-not (Test-Path "$Root\backend\.env")) {
    Copy-Item "$Root\.env.example" "$Root\backend\.env"
    # Fix DATABASE_URL to use localhost (not container hostname)
    (Get-Content "$Root\backend\.env") -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://chumchat:chumchat_dev@localhost:5432/chumchat' | Set-Content "$Root\backend\.env"
    Write-Host "  Created backend/.env" -ForegroundColor Green
}

# --- Start DB + Redis ---
Write-Host ""
Write-Host "[3/6] Starting PostgreSQL and Redis (Docker)..." -ForegroundColor Yellow

Set-Location $Root
docker-compose up -d postgres redis

Write-Host "  Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
$retries = 0
do {
    Start-Sleep -Seconds 2
    $retries++
    try {
        $ready = docker-compose exec -T postgres pg_isready -U chumchat 2>&1
    } catch {
        $ready = ""
    }
} until ($ready -match "accepting connections" -or $retries -gt 15)

if ($retries -gt 15) {
    Write-Host "  WARNING: PostgreSQL might not be ready yet, proceeding anyway..." -ForegroundColor Yellow
} else {
    Write-Host "  PostgreSQL ready!" -ForegroundColor Green
}

# --- Install backend deps ---
Write-Host ""
Write-Host "[4/6] Installing backend dependencies..." -ForegroundColor Yellow

Set-Location "$Root\backend"
npm install

Write-Host "  Generating Prisma client..." -ForegroundColor Gray
npx prisma generate

Write-Host "  Running database migrations..." -ForegroundColor Gray
npx prisma migrate dev --name full_init

Write-Host "  Seeding database..." -ForegroundColor Gray
npx ts-node prisma/seed.ts

Write-Host "  Backend deps ready!" -ForegroundColor Green

# --- Install frontend deps ---
Write-Host ""
Write-Host "[5/6] Installing frontend dependencies..." -ForegroundColor Yellow

Set-Location "$Root\frontend"
npm install

Write-Host "  Frontend deps ready!" -ForegroundColor Green

# --- Done ---
Write-Host ""
Write-Host "[6/6] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=== NEXT STEP ===" -ForegroundColor Cyan
Write-Host "Run: .\start-dev.ps1" -ForegroundColor White
Write-Host ""

Set-Location $Root
