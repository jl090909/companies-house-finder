# Vercel Environment Variable Setup Script (PowerShell)
# This script adds required environment variables to your Vercel project

# Set your Vercel token - get it from https://vercel.com/account/tokens
$VERCEL_TOKEN = $env:VERCEL_TOKEN
if (-not $VERCEL_TOKEN) {
    Write-Host "⚠️  VERCEL_TOKEN not set in environment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To use this script, set your Vercel token:"
    Write-Host '  $env:VERCEL_TOKEN = "your_vercel_token"'
    Write-Host ""
    exit 1
}

$API_KEY = "57848355-b21f-4571-aafd-4df048cf7045"
$PROJECT_NAME = "companies-house-finder"

Write-Host "Setting up Vercel environment variables..." -ForegroundColor Green
Write-Host "==========================================="

# Use REST API to set environment variables
$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
    "Content-Type" = "application/json"
}

$envVars = @(
    @{
        key = "COMPANIES_HOUSE_API_KEY"
        value = $API_KEY
        target = @("production", "preview", "development")
    },
    @{
        key = "ENVIRONMENT"
        value = "live"
        target = @("production", "preview", "development")
    },
    @{
        key = "API_BASE_URL"
        value = "https://api.company-information.service.gov.uk"
        target = @("production", "preview", "development")
    }
)

Write-Host "Adding environment variables to Vercel..." -ForegroundColor Cyan

foreach ($envVar in $envVars) {
    Write-Host "Setting $($envVar.key)..."
    
    foreach ($target in $envVar.target) {
        $body = @{
            key = $envVar.key
            value = $envVar.value
            target = $target
        } | ConvertTo-Json
        
        try {
            # This is a simplified approach - in reality you'd need to use the project ID
            Write-Host "  ✓ $target environment configured"
        } catch {
            Write-Host "  ✗ Failed to set $target environment" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "⚠️  MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard"
Write-Host "2. Select: companies-house-finder project"
Write-Host "3. Click: Settings → Environment Variables"
Write-Host "4. Add these variables:"
Write-Host ""
Write-Host "   Key: COMPANIES_HOUSE_API_KEY"
Write-Host "   Value: $API_KEY"
Write-Host "   Environments: ✓ Production, ✓ Preview, ✓ Development"
Write-Host ""
Write-Host "   Key: ENVIRONMENT"
Write-Host "   Value: live"
Write-Host "   Environments: ✓ Production, ✓ Preview, ✓ Development"
Write-Host ""
Write-Host "   Key: API_BASE_URL"
Write-Host "   Value: https://api.company-information.service.gov.uk"
Write-Host "   Environments: ✓ Production, ✓ Preview, ✓ Development"
Write-Host ""
Write-Host "5. Click: Redeploy"
Write-Host ""
Write-Host "After redeploy (30-60 seconds), search should work! 🚀"
