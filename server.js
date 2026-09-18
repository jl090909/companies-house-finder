const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Load configuration from environment variables or config.json
let ENV, API_KEY, API_BASE_URL;

if (process.env.COMPANIES_HOUSE_API_KEY) {
  // Production: Use environment variables
  ENV = process.env.ENVIRONMENT || 'live';
  API_KEY = process.env.COMPANIES_HOUSE_API_KEY;
  API_BASE_URL = process.env.API_BASE_URL || 'https://api.company-information.service.gov.uk';
} else {
  // Development: Load from config.json
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
    ENV = config.environment || 'sandbox';
    API_KEY = config[ENV].api_key;
    API_BASE_URL = config[ENV].base_url;
  } catch (error) {
    console.error('ERROR: Cannot load configuration. Set COMPANIES_HOUSE_API_KEY environment variable for production or provide config.json for development.');
    process.exit(1);
  }
}

// Validate API key
if (API_KEY === 'PASTE_YOUR_LIVE_API_KEY_HERE') {
  console.error('ERROR: Live API key not configured. Update config.json with your live API key.');
}

// Create axios instance with auth (sandbox)
const chApi = axios.create({
  baseURL: API_BASE_URL,
  auth: {
    username: API_KEY,
    password: ''
  }
});

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Search companies by name
app.get('/api/search/name', async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Use sandbox API
    const response = await chApi.get('/search/companies', {
      params: {
        q: query,
        items_per_page: 50
      }
    });

    // If no results, provide demo data
    if (!response.data.items || response.data.items.length === 0) {
      return res.json({
        total_results: 0,
        items: [],
        note: 'Sandbox environment - no test data available. To search real companies, create an API key for the live environment.'
      });
    }

    res.json({
      total_results: response.data.total_results || 0,
      items: response.data.items || []
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Search failed',
      message: error.message
    });
  }
});

// Get company details by company number
app.get('/api/company/:companyNumber', async (req, res) => {
  const { companyNumber } = req.params;

  if (!companyNumber) {
    return res.status(400).json({ error: 'Company number is required' });
  }

  try {
    const response = await chApi.get(`/company/${companyNumber}`);
    res.json(response.data);
  } catch (error) {
    console.error('Company lookup error:', error.message);
    
    // Return a helpful message for sandbox
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'This company number does not exist in the sandbox environment. Use 00000006 (Rolls-Royce) for testing with the live API.',
        sandbox_note: 'Sandbox environment does not contain real company data'
      });
    }

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Company lookup failed',
      message: error.message
    });
  }
});

// Get company charges
app.get('/api/company/:companyNumber/charges', async (req, res) => {
  const { companyNumber } = req.params;

  if (!companyNumber) {
    return res.status(400).json({ error: 'Company number is required' });
  }

  try {
    const response = await chApi.get(`/company/${companyNumber}/charges`);
    res.json({
      total_count: response.data.total_count || 0,
      items: response.data.items || []
    });
  } catch (error) {
    console.error('Charges lookup error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Charges lookup failed',
      message: error.message
    });
  }
});

// Get company officers
app.get('/api/company/:companyNumber/officers', async (req, res) => {
  const { companyNumber } = req.params;

  if (!companyNumber) {
    return res.status(400).json({ error: 'Company number is required' });
  }

  try {
    const response = await chApi.get(`/company/${companyNumber}/officers`);
    res.json({
      total_count: response.data.total_count || 0,
      items: response.data.items || []
    });
  } catch (error) {
    console.error('Officers lookup error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Officers lookup failed',
      message: error.message
    });
  }
});

// Get company persons with significant control
app.get('/api/company/:companyNumber/psc', async (req, res) => {
  const { companyNumber } = req.params;

  if (!companyNumber) {
    return res.status(400).json({ error: 'Company number is required' });
  }

  try {
    const response = await chApi.get(`/company/${companyNumber}/persons-with-significant-control`);
    res.json({
      total_count: response.data.total_count || 0,
      items: response.data.items || []
    });
  } catch (error) {
    console.error('PSC lookup error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'PSC lookup failed',
      message: error.message
    });
  }
});

// Get company filings
app.get('/api/company/:companyNumber/filings', async (req, res) => {
  const { companyNumber } = req.params;

  if (!companyNumber) {
    return res.status(400).json({ error: 'Company number is required' });
  }

  try {
    const response = await chApi.get(`/company/${companyNumber}/filing-history`, {
      params: {
        items_per_page: 20
      }
    });

    res.json({
      total_count: response.data.total_count || 0,
      items: response.data.items || []
    });
  } catch (error) {
    console.error('Filings lookup error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Filings lookup failed',
      message: error.message
    });
  }
});

// Get individual charge details
app.get('/api/company/:companyNumber/charge/:chargeId', async (req, res) => {
  const { companyNumber, chargeId } = req.params;

  if (!companyNumber || !chargeId) {
    return res.status(400).json({ error: 'Company number and charge ID are required' });
  }

  try {
    const decodedChargeId = decodeURIComponent(chargeId);
    const response = await chApi.get(`/company/${companyNumber}/charges/${decodedChargeId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Charge detail lookup error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Charge detail lookup failed',
      message: error.message
    });
  }
});

// Get filing document
app.get('/api/company/:companyNumber/filing/*', async (req, res) => {
  const { companyNumber } = req.params;
  const filingPath = req.params[0]; // Everything after /filing/

  if (!companyNumber || !filingPath) {
    return res.status(400).json({ error: 'Company number and filing path are required' });
  }

  try {
    const response = await chApi.get(`/company/${companyNumber}/filing-history/${filingPath}`);
    res.json(response.data);
  } catch (error) {
    console.error('Filing lookup error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Filing lookup failed',
      message: error.message
    });
  }
});

// Serve charges report page
app.get('/charges-report', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'charges-report.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Companies House Finder App');
  console.log(`${'='.repeat(60)}`);
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Environment: ${ENV.toUpperCase()}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`${'='.repeat(60)}\n`);
});
