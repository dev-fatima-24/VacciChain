# PowerShell script to test security headers on VacciChain frontend and backend
# Usage: .\scripts\test-security-headers.ps1 [FrontendURL] [BackendURL]
# Default URLs: http://localhost:3000 and http://localhost:4000

param(
    [string]$FrontendUrl = "http://localhost:3000",
    [string]$BackendUrl = "http://localhost:4000"
)

Write-Host "🔒 VacciChain Security Headers Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a header exists and display it
function Test-Header {
    param(
        [string]$Url,
        [string]$HeaderName,
        [string]$ExpectedValue = ""
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -ErrorAction Stop
        $header = $response.Headers[$HeaderName]
        
        if ($header) {
            Write-Host "✓ " -ForegroundColor Green -NoNewline
            Write-Host "${HeaderName}: $header"
            
            if ($ExpectedValue -and $header -match $ExpectedValue) {
                Write-Host "  → Contains expected value: $ExpectedValue" -ForegroundColor Green
            } elseif ($ExpectedValue) {
                Write-Host "  ⚠ Expected to contain: $ExpectedValue" -ForegroundColor Yellow
            }
            return $true
        } else {
            Write-Host "✗ " -ForegroundColor Red -NoNewline
            Write-Host "${HeaderName}: " -NoNewline
            Write-Host "NOT FOUND" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ " -ForegroundColor Red -NoNewline
        Write-Host "${HeaderName}: " -NoNewline
        Write-Host "ERROR - Could not connect to $Url" -ForegroundColor Red
        return $false
    }
}

# Test Frontend
Write-Host "Testing Frontend: $FrontendUrl" -ForegroundColor Blue
Write-Host "----------------------------------------"

$frontendPass = $true
$frontendPass = (Test-Header -Url $FrontendUrl -HeaderName "Content-Security-Policy" -ExpectedValue "default-src") -and $frontendPass
$frontendPass = (Test-Header -Url $FrontendUrl -HeaderName "X-Frame-Options" -ExpectedValue "DENY") -and $frontendPass
$frontendPass = (Test-Header -Url $FrontendUrl -HeaderName "X-Content-Type-Options" -ExpectedValue "nosniff") -and $frontendPass
$frontendPass = (Test-Header -Url $FrontendUrl -HeaderName "Referrer-Policy" -ExpectedValue "strict-origin-when-cross-origin") -and $frontendPass
$frontendPass = (Test-Header -Url $FrontendUrl -HeaderName "X-XSS-Protection" -ExpectedValue "1; mode=block") -and $frontendPass
$frontendPass = (Test-Header -Url $FrontendUrl -HeaderName "Permissions-Policy") -and $frontendPass

Write-Host ""

# Test Backend API
Write-Host "Testing Backend API: $BackendUrl/health" -ForegroundColor Blue
Write-Host "----------------------------------------"

$backendPass = $true
$backendPass = (Test-Header -Url "$BackendUrl/health" -HeaderName "X-Frame-Options" -ExpectedValue "DENY") -and $backendPass
$backendPass = (Test-Header -Url "$BackendUrl/health" -HeaderName "X-Content-Type-Options" -ExpectedValue "nosniff") -and $backendPass
$backendPass = (Test-Header -Url "$BackendUrl/health" -HeaderName "Referrer-Policy" -ExpectedValue "strict-origin-when-cross-origin") -and $backendPass
$backendPass = (Test-Header -Url "$BackendUrl/health" -HeaderName "X-XSS-Protection" -ExpectedValue "1; mode=block") -and $backendPass
$backendPass = (Test-Header -Url "$BackendUrl/health" -HeaderName "Content-Security-Policy") -and $backendPass

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan

# Summary
if ($frontendPass -and $backendPass) {
    Write-Host "✓ All security headers are properly configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Blue
    Write-Host "1. Test with securityheaders.com for comprehensive analysis"
    Write-Host "2. Test with Mozilla Observatory: https://observatory.mozilla.org/"
    Write-Host "3. Verify CSP doesn't break functionality in browser console"
    exit 0
} else {
    Write-Host "✗ Some security headers are missing or misconfigured" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure Docker containers are running: docker compose up"
    Write-Host "2. Check Nginx configuration: frontend/nginx.conf"
    Write-Host "3. Check backend middleware: backend/src/middleware/securityHeaders.js"
    Write-Host "4. Restart services after configuration changes"
    exit 1
}
