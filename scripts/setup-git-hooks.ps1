# PowerShell script for Windows users to setup Git hooks and secret scanning

Write-Host "🔒 Setting up secret scanning protection for VacciChain..." -ForegroundColor Cyan

# Check if gitleaks is installed
$gitleaksInstalled = Get-Command gitleaks -ErrorAction SilentlyContinue

if (-not $gitleaksInstalled) {
    Write-Host "📦 Installing gitleaks..." -ForegroundColor Yellow
    
    # Check if winget is available
    $wingetInstalled = Get-Command winget -ErrorAction SilentlyContinue
    
    if ($wingetInstalled) {
        Write-Host "Installing via winget..." -ForegroundColor Gray
        winget install gitleaks
    } else {
        Write-Host "❌ winget not found. Please install gitleaks manually:" -ForegroundColor Red
        Write-Host "   1. Download from: https://github.com/gitleaks/gitleaks/releases" -ForegroundColor Yellow
        Write-Host "   2. Extract gitleaks.exe to a folder in your PATH" -ForegroundColor Yellow
        Write-Host "   Or install winget and run this script again" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Gitleaks installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Gitleaks is already installed" -ForegroundColor Green
    gitleaks version
}

# Check if pre-commit is installed
$precommitInstalled = Get-Command pre-commit -ErrorAction SilentlyContinue

if (-not $precommitInstalled) {
    Write-Host "📦 Installing pre-commit..." -ForegroundColor Yellow
    
    # Check if pip is available
    $pipInstalled = Get-Command pip -ErrorAction SilentlyContinue
    
    if ($pipInstalled) {
        pip install pre-commit
    } else {
        Write-Host "❌ pip not found. Please install Python and pip first." -ForegroundColor Red
        Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Pre-commit installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Pre-commit is already installed" -ForegroundColor Green
}

# Install pre-commit hooks
Write-Host "🔧 Installing pre-commit hooks..." -ForegroundColor Cyan
pre-commit install

# Run initial scan
Write-Host "🔍 Running initial gitleaks scan..." -ForegroundColor Cyan
$scanResult = gitleaks detect --source . --verbose --redact

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ No secrets detected in repository" -ForegroundColor Green
} else {
    Write-Host "⚠️  Secrets detected! Please review and remove them before committing." -ForegroundColor Yellow
    Write-Host "   Run 'gitleaks detect --source . --verbose' for details" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. The pre-commit hook will now scan for secrets before each commit"
Write-Host "   2. To manually scan: gitleaks detect --source . --verbose"
Write-Host "   3. To scan specific files: gitleaks protect --staged"
Write-Host "   4. GitHub Actions will scan on every push and PR"
Write-Host ""
Write-Host "🔒 Your repository is now protected against accidental secret commits!" -ForegroundColor Green
