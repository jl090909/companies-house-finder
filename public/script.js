let currentCompanyNumber = null;
let currentResults = []; // Store all current results for sorting/filtering
let currentSortColumn = null;
let currentSortAscending = true;
let currentFilters = {
  status: [] // Array of selected status values
};

// Search by company name
async function searchByName() {
  const query = document.getElementById('companyName').value.trim();
  if (!query) {
    showError('Please enter a company name');
    return;
  }
  performSearch(`/api/search/name?query=${encodeURIComponent(query)}`);
}

// Search by company number
async function searchByNumber() {
  const companyNumber = document.getElementById('companyNumber').value.trim();
  if (!companyNumber) {
    showError('Please enter a company number');
    return;
  }
  performSearch(`/api/company/${companyNumber}`);
}

// Perform the search request
async function performSearch(endpoint) {
  showLoading();
  hideError();
  hideResults();
  hideDetails();

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Error: ${response.status}`);
    }

    const data = await response.json();

    // If single company result
    if (data.company_number) {
      currentCompanyNumber = data.company_number;
      showCompanyDetails(data);
      hideLoading();
      return;
    }

    // If search results
    if (data.items) {
      displaySearchResults(data.items, data.total_results);
    } else {
      showError('No results found');
    }

    hideLoading();
  } catch (error) {
    hideLoading();
    showError(`Search failed: ${error.message}`);
  }
}

// Display search results
function displaySearchResults(companies, total) {
  // Store results for sorting/filtering
  currentResults = companies.map(c => ({
    ...c,
    statusCategory: categorizeStatus(c.company_status || 'Unknown')
  }));
  
  // Reset sort and filters
  currentSortColumn = null;
  currentSortAscending = true;
  currentFilters.status = [];
  
  // Clear filter checkboxes
  document.querySelectorAll('.status-filters input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  if (companies.length === 0) {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    
    const emptyState = document.createElement('div');
    emptyState.style.padding = '40px 20px';
    emptyState.style.textAlign = 'center';
    emptyState.style.background = '#fff8e1';
    emptyState.innerHTML = `
      <div style="color: #666;">
        <h3 style="margin-bottom: 15px; color: #d97706;">ℹ️ Sandbox Environment</h3>
        <p style="margin-bottom: 15px;">The search returned no results because this is the <strong>sandbox test environment</strong>.</p>
        <p style="margin-bottom: 15px;">The sandbox contains limited test data. To search real companies:</p>
        <ol style="text-align: left; max-width: 500px; margin: 20px auto; color: #555;">
          <li>Get an API key for the <strong>live environment</strong></li>
          <li>Update the API key in the server.js file</li>
          <li>Change the API URL from sandbox to live</li>
          <li>Restart the server</li>
        </ol>
        <p style="margin-top: 20px; font-size: 0.9em; color: #888;">
          <strong>Demo:</strong> Try entering company number <strong>00000006</strong> to see how the app works!
        </p>
      </div>
    `;
    
    resultsList.appendChild(emptyState);
    document.getElementById('results').classList.remove('hidden');
    return;
  }

  // Render the results with toolbar
  renderResults(total);
  document.getElementById('results').classList.remove('hidden');
}

// Categorize status for filtering
function categorizeStatus(status) {
  if (!status) return 'unknown';
  const lower = status.toLowerCase();
  if (lower.includes('dissolved')) return 'dissolved';
  if (lower.includes('inactive')) return 'inactive';
  return 'active';
}

// Render results with current sort and filters applied
function renderResults(total) {
  let filtered = currentResults;
  
  // Apply filters
  if (currentFilters.status.length > 0) {
    filtered = filtered.filter(c => currentFilters.status.includes(c.statusCategory));
  }
  
  // Apply sorting
  if (currentSortColumn) {
    filtered = filtered.sort((a, b) => {
      let aVal = a[currentSortColumn];
      let bVal = b[currentSortColumn];
      
      if (currentSortColumn === 'title') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      
      if (aVal < bVal) return currentSortAscending ? -1 : 1;
      if (aVal > bVal) return currentSortAscending ? 1 : -1;
      return 0;
    });
  }

  const resultsList = document.getElementById('resultsList');
  
  // Find and keep the toolbar, remove only the company cards
  let heading = resultsList.querySelector('div[style*="background: #f8f9ff"]');
  if (heading && !heading.classList.contains('results-toolbar')) {
    heading.remove();
  }
  
  // Remove old company cards
  resultsList.querySelectorAll('.company-card').forEach(card => card.remove());
  
  // Calculate total for display
  const displayTotal = total || currentResults.length;
  
  const heading2 = document.createElement('div');
  heading2.style.padding = '20px';
  heading2.style.background = '#f8f9ff';
  heading2.style.borderBottom = '1px solid #e0e0e0';
  heading2.innerHTML = `<strong>Showing ${filtered.length} result${filtered.length !== 1 ? 's' : ''}</strong> ${displayTotal > currentResults.length && currentFilters.status.length === 0 ? `(of ${displayTotal} total)` : ''}`;
  resultsList.appendChild(heading2);

  filtered.forEach(company => {
    const card = document.createElement('div');
    card.className = 'company-card';
    
    const status = company.company_status || 'Unknown';
    const statusClass = company.statusCategory;

    card.innerHTML = `
      <div class="company-name">${company.title}</div>
      <div class="company-number">Company Number: ${company.company_number}</div>
      <div class="company-status ${statusClass}">${status}</div>
    `;
    
    card.onclick = () => viewCompanyDetails(company.company_number);
    resultsList.appendChild(card);
  });
}

// Sort results by column
function sortResults(column) {
  if (currentSortColumn === column) {
    // Toggle ascending/descending
    currentSortAscending = !currentSortAscending;
  } else {
    // New column, start with ascending
    currentSortColumn = column;
    currentSortAscending = true;
  }
  
  // Update button active states
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderResults();
}

// Apply filters
function applyFilters() {
  const checkboxes = document.querySelectorAll('.status-filters input[type="checkbox"]:checked');
  currentFilters.status = Array.from(checkboxes).map(cb => cb.value);
  renderResults();
}

// Reset sort and filters
function resetSortFilter() {
  currentSortColumn = null;
  currentSortAscending = true;
  currentFilters.status = [];
  
  // Clear all checkboxes
  document.querySelectorAll('.status-filters input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Clear active sort button
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  renderResults();
}

// View full company details
async function viewCompanyDetails(companyNumber) {
  currentCompanyNumber = companyNumber;
  showLoading();
  
  try {
    const response = await fetch(`/api/company/${companyNumber}`);
    if (!response.ok) {
      throw new Error('Failed to load company details');
    }
    
    const data = await response.json();
    showCompanyDetails(data);
  } catch (error) {
    hideLoading();
    showError(`Failed to load company details: ${error.message}`);
  }
}

// Show full company details
async function showCompanyDetails(company) {
  hideResults();
  
  const detailsContent = document.getElementById('detailsContent');
  
  // Basic info
  let html = `
    <div class="detail-section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">${company.company_name}</h2>
        <button onclick="generateChargesReport('${company.company_number}', '${company.company_name}')" style="padding: 10px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.95em;">
          📊 View Charges Report
        </button>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Company Number</div>
          <div class="detail-item-value">${company.company_number}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Company Type</div>
          <div class="detail-item-value">${company.type || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Status</div>
          <div class="detail-item-value">${company.company_status || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Incorporation Date</div>
          <div class="detail-item-value">${company.date_of_creation || 'N/A'}</div>
        </div>
      </div>
    </div>
  `;

  // Address
  if (company.registered_office_address) {
    const addr = company.registered_office_address;
    html += `
      <div class="detail-section">
        <h2>Registered Address</h2>
        <div class="detail-item">
          <div class="detail-item-value">
            ${addr.address_line_1 || ''}<br>
            ${addr.address_line_2 || ''}<br>
            ${addr.city || ''}<br>
            ${addr.postal_code || ''}<br>
            ${addr.country || ''}
          </div>
        </div>
      </div>
    `;
  }

  // Additional info
  if (company.sic_codes && company.sic_codes.length > 0) {
    html += `
      <div class="detail-section">
        <h2>Business Activities (SIC Codes)</h2>
        <div class="detail-item">
          <div class="detail-item-value">${company.sic_codes.join(', ')}</div>
        </div>
      </div>
    `;
  }

  detailsContent.innerHTML = html;

  // Load additional data
  loadCharges(company.company_number, detailsContent);
  loadOfficers(company.company_number, detailsContent);

  document.getElementById('companyDetails').classList.remove('hidden');
  hideLoading();
}

// Load and display charges
async function loadCharges(companyNumber, container) {
  try {
    const response = await fetch(`/api/company/${companyNumber}/charges`);
    const data = await response.json();

    let html = `
      <div class="detail-section">
        <h2>Charges & Debentures</h2>
        <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 6px;">
          <strong style="display: block; margin-bottom: 10px;">Filter by Status:</strong>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="charge-filter" value="outstanding" checked onchange="filterCharges('${companyNumber}', 'charges-container-${companyNumber}')" style="cursor: pointer; width: 16px; height: 16px;">
              <span>Outstanding</span>
            </label>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="charge-filter" value="satisfied" onchange="filterCharges('${companyNumber}', 'charges-container-${companyNumber}')" style="cursor: pointer; width: 16px; height: 16px;">
              <span>Satisfied</span>
            </label>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="charge-filter" value="fully-satisfied" onchange="filterCharges('${companyNumber}', 'charges-container-${companyNumber}')" style="cursor: pointer; width: 16px; height: 16px;">
              <span>Fully Satisfied</span>
            </label>
          </div>
        </div>
        <div id="charges-container-${companyNumber}"></div>
      </div>
    `;

    // Store original data for filtering
    window.chargesData = window.chargesData || {};
    window.chargesData[companyNumber] = data.items || [];
    
    let chargesHtml = '';
    if (data.items && data.items.length > 0) {
      // Filter to outstanding by default
      const filteredCharges = data.items.filter(c => c.status === 'outstanding');
      chargesHtml += `<p style="margin-bottom: 15px;"><strong>Total: ${filteredCharges.length} of ${data.total_count} charges</strong></p>`;
      
      filteredCharges.forEach((charge, index) => {
        chargesHtml += `
          <div class="charge-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9f9f9;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="margin: 0; font-size: 1.1em;">Charge #${charge.charge_number}</h3>
              <span style="background: ${charge.status === 'outstanding' ? '#e8f5e9' : charge.status === 'satisfied' ? '#f3e5f5' : '#fff3e0'}; color: ${charge.status === 'outstanding' ? '#2e7d32' : charge.status === 'satisfied' ? '#6a1b9a' : '#e65100'}; padding: 4px 12px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">
                ${charge.status.toUpperCase()}
              </span>
            </div>
            
            <div style="margin-bottom: 12px;">
              <strong>Type:</strong> ${charge.classification?.description || 'N/A'}
            </div>
            
            <div style="margin-bottom: 12px;">
              <strong>Created:</strong> ${charge.created_on || 'N/A'} 
              ${charge.delivered_on ? `<strong style="margin-left: 20px;">Delivered:</strong> ${charge.delivered_on}` : ''}
            </div>
            
            ${charge.persons_entitled && charge.persons_entitled.length > 0 ? `
              <div style="margin-bottom: 12px;">
                <strong>Persons Entitled (Creditor):</strong>
                <ul style="margin: 8px 0 0 20px; padding-left: 0;">
                  ${charge.persons_entitled.map(p => `<li>${p.name || 'N/A'}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${charge.particulars?.description ? `
              <div style="margin-bottom: 12px;">
                <strong>Particulars (What is Charged):</strong>
                <div style="background: white; padding: 10px; border-left: 3px solid #1976d2; margin-top: 8px; font-style: italic; color: #555;">
                  ${charge.particulars.description}
                </div>
              </div>
            ` : ''}
            
            ${charge.secured_details?.description ? `
              <div style="margin-bottom: 12px;">
                <strong>Amount Secured:</strong>
                <div style="background: white; padding: 10px; border-left: 3px solid #388e3c; margin-top: 8px; color: #333;">
                  ${charge.secured_details.description}
                </div>
              </div>
            ` : ''}
            
            ${charge.transactions && charge.transactions.length > 0 ? `
              <div style="margin-top: 12px;">
                <strong>Filing History:</strong>
                <ul style="margin: 8px 0 0 20px; padding-left: 0; font-size: 0.95em;">
                  ${charge.transactions.map(t => {
                    const filingPath = t.links?.filing ? t.links.filing.split('/filing-history/')[1] : null;
                    return `
                    <li>
                      <strong>${t.filing_type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong> 
                      - ${t.delivered_on || 'N/A'}
                      ${filingPath ? ` <a href="/api/company/${companyNumber}/filing/${filingPath}" target="_blank" style="color: #1976d2; text-decoration: none; font-size: 0.9em; margin-left: 10px;">📄 View Filing</a>` : ''}
                    </li>
                  `;
                  }).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${charge.links?.self ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
                <a href="/api/company/${companyNumber}/charge/${encodeURIComponent(charge.links.self.split('/').pop())}" target="_blank" style="color: #1976d2; text-decoration: none; font-weight: bold; display: inline-block; padding: 8px 12px; background: #e3f2fd; border-radius: 4px;">
                  🔗 View Full Charge Details
                </a>
              </div>
            ` : ''}
          </div>
        `;
      });
    } else {
      chargesHtml += '<div class="empty-message" style="padding: 20px; text-align: center; color: #666;">No charges found</div>';
    }

    container.innerHTML += html;
    document.getElementById(`charges-container-${companyNumber}`).innerHTML = chargesHtml;
  } catch (error) {
    console.error('Error loading charges:', error);
  }
}

// Format filing data for readable display
function formatFilingData(filingData, filingPath, companyNumber) {
  if (!filingData) return '<span style="color: #999;">No filing data</span>';
  
  const type = filingData.type || 'N/A';
  const category = filingData.category || 'N/A';
  const description = filingData.description || 'No description';
  const chargeNumber = filingData.charge_number || 'N/A';
  const link = filingPath && companyNumber ? `<a href="/api/company/${companyNumber}/filing/${filingPath}" target="_blank" style="color: #1976d2; text-decoration: none; display: inline-block; margin-top: 6px; font-weight: 500;">📄 View Full Filing →</a>` : '';
  
  return `
    <div style="line-height: 1.5; color: #333;">
      <div><strong style="color: #555;">Type:</strong> ${type}</div>
      <div><strong style="color: #555;">Category:</strong> ${category}</div>
      <div style="margin-top: 6px;"><strong style="color: #555;">Description:</strong></div>
      <div style="background: white; padding: 6px; margin: 4px 0; border-left: 2px solid #1976d2; font-size: 0.9em;">${description}</div>
      <div><strong style="color: #555;">Charge #:</strong> ${chargeNumber}</div>
      ${link}
    </div>
  `;
}

// Format charge details for readable display
function formatChargeDetails(chargeDetails, chargeId, companyNumber) {
  if (!chargeDetails) return '<span style="color: #999;">No charge details</span>';
  
  const particulars = chargeDetails.particulars?.description || 'No particulars available';
  const link = chargeId && companyNumber ? `<a href="/api/company/${companyNumber}/charge/${encodeURIComponent(chargeId)}" target="_blank" style="color: #1976d2; text-decoration: none; display: inline-block; margin-top: 6px; font-weight: 500;">🔗 View Full Details →</a>` : '';
  
  return `
    <div style="line-height: 1.5; color: #333;">
      <div><strong style="color: #555;">Particulars:</strong></div>
      <div style="background: white; padding: 6px; margin: 6px 0; border-left: 2px solid #388e3c; font-size: 0.9em; line-height: 1.4;">${particulars}</div>
      ${link}
    </div>
  `;
}

// Sort charges table by column
function sortChargesTable(column) {
  if (!window.chargesReportData) return;

  const data = window.chargesReportData;
  
  // Toggle sort direction if same column clicked
  if (data.sortColumn === column) {
    data.sortDirection = data.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    data.sortColumn = column;
    data.sortDirection = 'asc';
  }

  // Sort charges
  const sortedCharges = [...data.chargesWithDetails].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    // Handle nested properties
    if (column === 'type') {
      aVal = a.classification?.description || '';
      bVal = b.classification?.description || '';
    }

    // Handle null/undefined
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';

    // Numeric sort for charge numbers
    if (column === 'charge_number') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    }

    // String comparison
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
      return data.sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    // Numeric comparison
    return data.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Update sort indicators
  document.querySelectorAll('[id^="sort-"]').forEach(el => {
    el.textContent = '';
  });
  
  const sortIndicator = document.getElementById(`sort-${column}`);
  if (sortIndicator) {
    sortIndicator.textContent = data.sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  // Re-render table with sorted data
  const tbody = document.querySelector('#chargesTableBody');
  if (!tbody) return;

  const statusColor = (status) => status === 'outstanding' ? '#2e7d32' : status === 'satisfied' ? '#6a1b9a' : '#e65100';
  const statusBg = (status) => status === 'outstanding' ? '#e8f5e9' : status === 'satisfied' ? '#f3e5f5' : '#fff3e0';

  let tableRows = '';
  sortedCharges.forEach((charge, index) => {
    const personsEntitled = charge.persons_entitled?.map(p => p.name).join(', ') || 'N/A';
    
    tableRows += `
      <tr id="charge-row-${charge.charge_number}" style="border-bottom: 1px solid #e0e0e0; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
        <td style="padding: 12px 15px; border-right: 1px solid #e0e0e0; font-weight: 500; text-align: left; vertical-align: top;">${charge.charge_number}</td>
        <td style="padding: 12px 15px; border-right: 1px solid #e0e0e0; text-align: left; vertical-align: top;">${charge.classification?.description || 'N/A'}</td>
        <td style="padding: 12px 15px; border-right: 1px solid #e0e0e0; white-space: nowrap; text-align: left; vertical-align: top;">${charge.created_on || 'N/A'}</td>
        <td style="padding: 12px 15px; border-right: 1px solid #e0e0e0; white-space: nowrap; text-align: left; vertical-align: top;">${charge.delivered_on || 'N/A'}</td>
        <td style="padding: 12px 15px; border-right: 1px solid #e0e0e0; text-align: left; vertical-align: top;">
          <span style="background: ${statusBg(charge.status)}; color: ${statusColor(charge.status)}; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 0.85em;">
            ${charge.status.toUpperCase()}
          </span>
        </td>
        <td style="padding: 12px 15px; border-right: 1px solid #e0e0e0; font-size: 0.9em; color: #555; text-align: left; vertical-align: top;">
          <div>${personsEntitled}</div>
        </td>
        <td id="particulars-${charge.charge_number}" style="padding: 12px 15px; border-right: 1px solid #e0e0e0; font-size: 0.9em; color: #666; text-align: left; vertical-align: top;">
          ${charge.particulars_loaded ? `<div style="line-height: 1.4; white-space: normal;">${charge.particulars_text}</div>` : '<span style="color: #999;">⏳ Loading...</span>'}
        </td>
        <td id="secured-${charge.charge_number}" style="padding: 12px 15px; border-right: 1px solid #e0e0e0; font-size: 0.9em; color: #666; text-align: left; vertical-align: top;">
          ${charge.secured_loaded ? `<div style="line-height: 1.4; white-space: normal;">${charge.secured_text}</div>` : '<span style="color: #999;">⏳ Loading...</span>'}
        </td>
        <td id="filing-data-${charge.charge_number}" style="padding: 12px 15px; border-right: 1px solid #e0e0e0; font-size: 0.85em; color: #666; text-align: left; vertical-align: top; max-height: 180px; overflow-y: auto;">
          ${charge.filing_loaded ? charge.filing_text : '<span style="color: #999;">⏳ Loading...</span>'}
        </td>
        <td id="charge-details-${charge.charge_number}" style="padding: 12px 15px; font-size: 0.85em; color: #666; text-align: left; vertical-align: top; max-height: 180px; overflow-y: auto;">
          ${charge.details_loaded ? charge.details_text : '<span style="color: #999;">⏳ Loading...</span>'}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = tableRows;
}

// Generate charges report (opens in new tab)
async function generateChargesReport(companyNumber, companyName) {
  try {
    const response = await fetch(`/api/company/${companyNumber}/charges`);
    const data = await response.json();
    
    const charges = data.items || [];
    
    if (charges.length === 0) {
      alert('No charges found for this company');
      return;
    }

    // Store charges data in localStorage
    localStorage.setItem('chargesReportData', JSON.stringify({
      charges: charges,
      companyNumber: companyNumber,
      companyName: companyName
    }));

    // Open charges report in new tab
    window.open('/charges-report', 'ChargesReport_' + companyNumber, 'width=1400,height=900');
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Error generating charges report');
  }
}

// Filter charges by status
function filterCharges(companyNumber, containerId) {
  const container = document.getElementById(`charges-container-${companyNumber}`);
  const allCharges = window.chargesData[companyNumber] || [];
  
  // Get selected statuses
  const selectedStatuses = Array.from(document.querySelectorAll('.charge-filter:checked')).map(cb => cb.value);
  
  if (selectedStatuses.length === 0) {
    container.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center; color: #666;">Please select at least one status</div>';
    return;
  }
  
  // Filter charges
  const filteredCharges = allCharges.filter(charge => selectedStatuses.includes(charge.status));
  
  let html = '';
  
  if (filteredCharges.length > 0) {
    html += `<p style="margin-bottom: 15px;\"><strong>Total: ${filteredCharges.length} charges</strong></p>`;
    
    filteredCharges.forEach((charge, index) => {
      html += `
        <div class="charge-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9f9f9;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 1.1em;">Charge #${charge.charge_number}</h3>
            <span style="background: ${charge.status === 'outstanding' ? '#e8f5e9' : charge.status === 'satisfied' ? '#f3e5f5' : '#fff3e0'}; 
                         color: ${charge.status === 'outstanding' ? '#2e7d32' : charge.status === 'satisfied' ? '#6a1b9a' : '#e65100'}; 
                         padding: 4px 12px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">
              ${charge.status.toUpperCase()}
            </span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong>Type:</strong> ${charge.classification?.description || 'N/A'}
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong>Created:</strong> ${charge.created_on || 'N/A'} 
            ${charge.delivered_on ? `<strong style="margin-left: 20px;">Delivered:</strong> ${charge.delivered_on}` : ''}
          </div>
          
          ${charge.persons_entitled && charge.persons_entitled.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <strong>Persons Entitled (Creditor):</strong>
              <ul style="margin: 8px 0 0 20px; padding-left: 0;">
                ${charge.persons_entitled.map(p => `<li>${p.name || 'N/A'}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${charge.particulars?.description ? `
            <div style="margin-bottom: 12px;">
              <strong>Particulars (What is Charged):</strong>
              <div style="background: white; padding: 10px; border-left: 3px solid #1976d2; margin-top: 8px; font-style: italic; color: #555;">
                ${charge.particulars.description}
              </div>
            </div>
          ` : ''}
          
          ${charge.secured_details?.description ? `
            <div style="margin-bottom: 12px;">
              <strong>Amount Secured:</strong>
              <div style="background: white; padding: 10px; border-left: 3px solid #388e3c; margin-top: 8px; color: #333;">
                ${charge.secured_details.description}
              </div>
            </div>
          ` : ''}
          
          ${charge.transactions && charge.transactions.length > 0 ? `
            <div style="margin-top: 12px;">
              <strong>Filing History:</strong>
              <ul style="margin: 8px 0 0 20px; padding-left: 0; font-size: 0.95em;">
                ${charge.transactions.map(t => {
                  const filingPath = t.links?.filing ? t.links.filing.split('/filing-history/')[1] : null;
                  return `
                  <li>
                    <strong>${t.filing_type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong> 
                    - ${t.delivered_on || 'N/A'}
                    ${filingPath ? ` <a href="/api/company/${companyNumber}/filing/${filingPath}" target="_blank" style="color: #1976d2; text-decoration: none; font-size: 0.9em; margin-left: 10px;">📄 View Filing</a>` : ''}
                  </li>
                `;
                }).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${charge.links?.self ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
              <a href="/api/company/${companyNumber}/charge/${encodeURIComponent(charge.links.self.split('/').pop())}" target="_blank" style="color: #1976d2; text-decoration: none; font-weight: bold; display: inline-block; padding: 8px 12px; background: #e3f2fd; border-radius: 4px;">
                🔗 View Full Charge Details
              </a>
            </div>
          ` : ''}
        </div>
      `;
    });
  } else {
    html += '<div class="empty-message" style="padding: 20px; text-align: center; color: #666;">No charges found with selected status</div>';
  }
  
  container.innerHTML = html;
}

// Load and display officers
async function loadOfficers(companyNumber, container) {
  try {
    const response = await fetch(`/api/company/${companyNumber}/officers`);
    const data = await response.json();

    let html = `
      <div class="detail-section">
        <h2>Officers & Directors</h2>
    `;

    if (data.items && data.items.length > 0) {
      html += `<p style="margin-bottom: 15px;"><strong>Total: ${data.total_count} officers</strong></p>`;
      html += '<ul class="officers-list">';
      
      data.items.forEach(officer => {
        html += `
          <li>
            <strong>${officer.name}</strong><br>
            <strong>Role:</strong> ${officer.officer_role}<br>
            <strong>Appointed:</strong> ${officer.appointed_on || 'N/A'}
            ${officer.resigned_on ? `<br><strong>Resigned:</strong> ${officer.resigned_on}` : ''}
          </li>
        `;
      });
      
      html += '</ul>';
    } else {
      html += '<div class="empty-message">No officers found</div>';
    }

    html += '</div>';
    container.innerHTML += html;
  } catch (error) {
    console.error('Error loading officers:', error);
  }
}

// UI Helper functions
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error').classList.add('hidden');
}

function showResults() {
  document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
  document.getElementById('results').classList.add('hidden');
}

function showDetails() {
  document.getElementById('companyDetails').classList.remove('hidden');
}

function hideDetails() {
  document.getElementById('companyDetails').classList.add('hidden');
}

function goBack() {
  hideDetails();
  showResults();
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('companyName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchByName();
  });

  document.getElementById('companyNumber').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchByNumber();
  });
});
