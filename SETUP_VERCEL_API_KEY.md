# Fix: "Search failed: Invalid Authorization header" Error

## Problem
The search functionality shows error: **"Search failed: Invalid Authorization header"**

This means the Companies House API key is not configured in your Vercel environment.

## Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Click on your **companies-house-finder** project

### Step 2: Add Environment Variables
1. Click **Settings** → **Environment Variables**
2. Add the following variables (copy/paste exactly):

#### Variable 1: API Key
- **Key:** `COMPANIES_HOUSE_API_KEY`
- **Value:** `57848355-b21f-4571-aafd-4df048cf7045`
- **Environments:** Check ✓ Production, ✓ Preview, ✓ Development
- Click **Save**

#### Variable 2: Environment
- **Key:** `ENVIRONMENT`
- **Value:** `live`
- **Environments:** Check ✓ Production, ✓ Preview, ✓ Development
- Click **Save**

#### Variable 3: API Base URL
- **Key:** `API_BASE_URL`
- **Value:** `https://api.company-information.service.gov.uk`
- **Environments:** Check ✓ Production, ✓ Preview, ✓ Development
- Click **Save**

### Step 3: Redeploy
1. After adding all three variables, look for the **Redeploy** button at the top of the page
2. Click **Redeploy** to redeploy with the new environment variables
3. Wait 30-60 seconds for the redeploy to complete

## Test It
Once redeployed, go to: https://companies-house-finder.vercel.app/

Try searching for:
- Company name: "Rolls" 
- OR Company number: "00000006"

You should see results! 🎉

## Troubleshooting

**Still seeing "Invalid Authorization header"?**
- Make sure all 3 environment variables are added
- Make sure they're set for **all 3 environments** (Production, Preview, Development)
- Make sure you clicked **Redeploy** after adding the variables
- Wait another 30-60 seconds - deployment can take time
- Try a hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

**Nothing shows up but no error?**
- The API key might be from a sandbox environment
- Try searching for test company: "00000006" (Rolls-Royce, works with live API)

## How It Works

Your local `config.json` has the API key, but Vercel's serverless environment can't access files on disk. 

The app now reads:
1. **Environment variables** (from Vercel) - preferred for production
2. **config.json** (for local development) - fallback

This is why you need to set the env vars in Vercel for the app to work there.

## Need Help?

If something still doesn't work:
1. Check Vercel deployment logs: Dashboard → Project → Deployments → Latest → Logs
2. Verify no typos in the environment variable values (especially the API key)
3. Make sure you're testing on the production URL: https://companies-house-finder.vercel.app/
