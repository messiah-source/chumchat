# CHUM.CHAT — Dev start script
# Run after setup.ps1: .\start-dev.ps1
# Opens backend + frontend in separate windows

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host "=== CHUM.CHAT DEV ===" -ForegroundColor Cyan
Write-Host ""

# --- Ensure DB is running ---
Write-Host "Starting PostgreSQL + Redis..." -ForegroundColor Yellow
Set-Location $Root
docker-compose up -d postgres redis

Start-Sleep -Seconds 1

# --- Backend ---
Write-Host "Starting backend on http://localhost:3001 ..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\backend'; Write-Host 'BACKEND' -ForegroundColor Cyan; npm run start:dev"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# --- Frontend ---
Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\frontend'; Write-Host 'FRONTEND' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=== RUNNING ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:3001/api" -ForegroundColor Cyan
Write-Host "  Prisma:    cd backend && npx prisma studio" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to open in browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:5173"
