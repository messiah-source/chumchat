# CHUM.CHAT — Install Node.js + Docker Desktop
# Run as Administrator: Right-click -> "Run with PowerShell"
# Or in terminal: powershell -ExecutionPolicy Bypass -File install-prereqs.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHUM.CHAT — Prerequisites Installer  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Node.js ──────────────────────────────────────────────────────────

function Test-NodeInstalled {
    $n = Get-Command node -ErrorAction SilentlyContinue
    return $null -ne $n
}

function Get-NodeVersion {
    try { return (node --version 2>&1).Trim() } catch { return "" }
}

Write-Host "[Node.js]" -ForegroundColor Yellow
if (Test-NodeInstalled) {
    $v = Get-NodeVersion
    Write-Host "  Already installed: $v" -ForegroundColor Green
} else {
    Write-Host "  Not found. Installing Node.js 20 LTS..." -ForegroundColor Yellow

    # Try winget first (available on Windows 10 1709+)
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "  Using winget..." -ForegroundColor Gray
        winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -e
        if (Test-NodeInstalled) {
            Write-Host "  Node.js installed via winget!" -ForegroundColor Green
        }
    }

    # Fallback: direct download
    if (-not (Test-NodeInstalled)) {
        Write-Host "  Downloading Node.js 20 LTS installer..." -ForegroundColor Gray
        $nodeUrl = "https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi"
        $nodeInstaller = "$env:TEMP\node-v20.17.0-x64.msi"

        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing

            Write-Host "  Running installer silently..." -ForegroundColor Gray
            Start-Process msiexec -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart ADDLOCAL=ALL" -Wait -Verb RunAs

            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

            if (Test-NodeInstalled) {
                Write-Host "  Node.js installed!" -ForegroundColor Green
            } else {
                Write-Host "  Installed. RESTART terminal and re-run this script." -ForegroundColor Yellow
            }
        } catch {
            Write-Host ""
            Write-Host "  MANUAL INSTALL NEEDED:" -ForegroundColor Red
            Write-Host "  1. Go to: https://nodejs.org" -ForegroundColor White
            Write-Host "  2. Download LTS (v20.x)" -ForegroundColor White
            Write-Host "  3. Run installer, click Next everywhere" -ForegroundColor White
            Write-Host "  4. Re-run this script" -ForegroundColor White
        }
    }
}

Write-Host ""

# ── Check Docker ────────────────────────────────────────────────────────────

function Test-DockerInstalled {
    $d = Get-Command docker -ErrorAction SilentlyContinue
    return $null -ne $d
}

function Test-DockerRunning {
    try {
        $result = docker info 2>&1
        return $result -notmatch "error"
    } catch { return $false }
}

Write-Host "[Docker Desktop]" -ForegroundColor Yellow
if (Test-DockerInstalled) {
    if (Test-DockerRunning) {
        $dv = (docker --version 2>&1).Trim()
        Write-Host "  Already installed and running: $dv" -ForegroundColor Green
    } else {
        Write-Host "  Installed but not running." -ForegroundColor Yellow
        Write-Host "  Start Docker Desktop from the taskbar or Start Menu." -ForegroundColor White
    }
} else {
    Write-Host "  Not found. Downloading Docker Desktop..." -ForegroundColor Yellow

    $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker Desktop Installer.exe"
    $dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Host "  Downloading (~600MB, please wait)..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller -UseBasicParsing

        Write-Host "  Launching Docker Desktop installer..." -ForegroundColor Gray
        Write-Host "  Follow the installer — click OK/Next on all prompts." -ForegroundColor White
        Write-Host "  If asked about WSL2 — click Install." -ForegroundColor White
        Start-Process $dockerInstaller -Wait

        Write-Host ""
        Write-Host "  Docker Desktop installed!" -ForegroundColor Green
        Write-Host "  IMPORTANT: Restart your computer, then start Docker Desktop." -ForegroundColor Yellow
    } catch {
        Write-Host ""
        Write-Host "  MANUAL INSTALL NEEDED:" -ForegroundColor Red
        Write-Host "  1. Go to: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor White
        Write-Host "  2. Download 'Docker Desktop for Windows'" -ForegroundColor White
        Write-Host "  3. Run installer (requires restart)" -ForegroundColor White
        Write-Host "  4. After restart, open Docker Desktop and wait for it to start" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# ── Final check ─────────────────────────────────────────────────────────────

$nodeOk   = Test-NodeInstalled
$dockerOk = Test-DockerInstalled

Write-Host ""
Write-Host "Status:" -ForegroundColor White
Write-Host "  Node.js  : $(if ($nodeOk) { '✓ OK' } else { '✗ MISSING' })" -ForegroundColor $(if ($nodeOk) { 'Green' } else { 'Red' })
Write-Host "  Docker   : $(if ($dockerOk) { '✓ OK' } else { '✗ MISSING' })" -ForegroundColor $(if ($dockerOk) { 'Green' } else { 'Red' })
Write-Host ""

if ($nodeOk -and $dockerOk) {
    Write-Host "All prerequisites ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: run setup.ps1" -ForegroundColor Cyan
    Write-Host "  cd $PSScriptRoot" -ForegroundColor White
    Write-Host "  .\setup.ps1" -ForegroundColor White
} else {
    Write-Host "Install missing tools above, then re-run this script." -ForegroundColor Yellow
    Write-Host "After Docker install you may need to RESTART your PC." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
