# CHUM.CHAT — Stop dev environment
$Root = $PSScriptRoot
Set-Location $Root

Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "Stopped." -ForegroundColor Green
