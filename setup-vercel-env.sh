#!/bin/bash
# Vercel Environment Variable Setup Script
# This script adds required environment variables to your Vercel project

# Set your Vercel token here or use: export VERCEL_TOKEN="your_token_here"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
API_KEY="57848355-b21f-4571-aafd-4df048cf7045"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: VERCEL_TOKEN environment variable not set"
  echo "Set it with: export VERCEL_TOKEN=\"your_vercel_token\""
  exit 1
fi

echo "Setting up Vercel environment variables..."
echo "==========================================="

# Set COMPANIES_HOUSE_API_KEY
echo "Adding COMPANIES_HOUSE_API_KEY..."
npx vercel env add COMPANIES_HOUSE_API_KEY --token=$VERCEL_TOKEN <<< "$API_KEY"

# Set ENVIRONMENT
echo "Adding ENVIRONMENT..."
npx vercel env add ENVIRONMENT --token=$VERCEL_TOKEN <<< "live"

# Set API_BASE_URL
echo "Adding API_BASE_URL..."
npx vercel env add API_BASE_URL --token=$VERCEL_TOKEN <<< "https://api.company-information.service.gov.uk"

echo ""
echo "✅ Environment variables set!"
echo "Now redeploying..."
npx vercel redeploy --prod --token=$VERCEL_TOKEN

echo ""
echo "✅ Deployment complete! Your app should now work."
