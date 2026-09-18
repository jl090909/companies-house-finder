# Companies House Finder - Setup Guide

## Current Status
✅ Server running on `http://localhost:3000`  
✅ Currently using **SANDBOX** environment  
✅ Configuration-based setup for easy environment switching  

## To Switch to Live API

### Step 1: Get Your Live API Key
Visit Companies House Developer Hub and create a new application for the **live environment** (not sandbox).

### Step 2: Update config.json
Open `config.json` and replace `PASTE_YOUR_LIVE_API_KEY_HERE` with your live API key:

```json
{
  "sandbox": {
    "api_key": "2f5e4d05-55ca-461f-9df9-a6f5385a5410",
    "base_url": "https://api-sandbox.company-information.service.gov.uk"
  },
  "live": {
    "api_key": "YOUR_LIVE_API_KEY_HERE",
    "base_url": "https://api.company-information.service.gov.uk"
  },
  "environment": "live"
}
```

### Step 3: Change Environment
Change `"environment": "sandbox"` to `"environment": "live"` in config.json

### Step 4: Restart Server
```bash
# Kill current server (Ctrl+C)
# Then restart:
node server.js
```

## Features
- ✅ Search by company name
- ✅ Search by company number
- ✅ View company details
- ✅ View registered address
- ✅ View business activities (SIC codes)
- ✅ View charges on properties
- ✅ View officers & directors
- ✅ View recent filings

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search/name?query=...` | GET | Search companies by name |
| `/api/company/:number` | GET | Get company details |
| `/api/company/:number/charges` | GET | Get property charges |
| `/api/company/:number/officers` | GET | Get directors/officers |
| `/api/company/:number/filings` | GET | Get filing history |
| `/api/health` | GET | Health check |

## File Structure
```
c:\Users\Administrator\
├── server.js           # Express backend
├── package.json        # Dependencies
├── config.json         # Configuration (sandbox/live)
└── public/
    ├── index.html      # Frontend HTML
    ├── style.css       # Styling
    └── script.js       # Client-side logic
```

## Troubleshooting

**No search results?**
- You're using sandbox - it has no pre-loaded data
- Switch to live environment for real data
- Or try company number: 00000006

**401 Unauthorized?**
- Check API key in config.json
- Verify it matches your Companies House dashboard
- Ensure correct environment (sandbox vs live)

**404 Not Found?**
- Company doesn't exist in current environment
- Try a different company number
