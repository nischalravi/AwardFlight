// ============================================
// SEARCH FUNCTIONALITY WITH PRICE/POINTS TOGGLE
// BACKEND INTEGRATION: /api/amadeus/search
// ============================================
//
// URL params supported:
//   from=JFK&to=SFO&date=2026-02-20&adults=2&cabin=BUSINESS
//
// Deployment support:
// - Same-origin (frontend served by same domain as backend): works by default
// - Cross-origin backend: set window.API_BASE = "https://your-backend-domain.com" before loading this script
//

const API_BASE = window.API_BASE || window.location.origin;

let currentFilters = {
  priceMax: 2000,
  stops: { 0: true, 1: true, 2: true }, // 2 = 2+ bucket
  airlines: {}, // dynamically filled from results
  departTime: { morning: true, afternoon: true, evening: true }
};

let currentView = 'price'; // 'price' or 'points'
let flightsData = [];      // source of truth

// ----------------------------
// UI helpers
// ----------------------------
function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setResultsStatus({ loading = false, error = null, message = null } = {}) {
  const container = document.getElementById('flights-container');
  const countElement = document.getElementById('results-count');

  if (countElement) countElement.textContent = loading ? '...' : (flightsData.length || 0);
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div style="padding:24px;color:#cbd5e1;">
        <div style="font-size:18px;margin-bottom:8px;">Loading flights…</div>
        <div style="opacity:0.8;">Fetching results from the server.</div>
      </div>`;
    return;
  }

  if (error) {
    container.innerHTML = `
      <div style="padding:24px;color:#fecaca;">
        <div style="font-size:18px;margin-bottom:8px;">Couldn’t load flights</div>
        <div style="opacity:0.9;">${escapeHtml(error)}</div>
        <div style="margin-top:12px;opacity:0.85;color:#cbd5e1;">Try again or change route/date.</div>
      </div>`;
    return;
  }

  if (message) {
    container.innerHTML = `
      <div style="padding:24px;color:#cbd5e1;">
        <div style="font-size:18px;margin-bottom:8px;">${escapeHtml(message)}</div>
      </div>`;
  }
}

function normalizeStopsBucket(stops) {
  if (typeof stops !== 'number') return 2;
  if (stops <= 0) return 0;
  if (stops === 1) return 1;
  return 2; // 2+ bucket
}

function parseDurationMinutes(durationStr) {
  if (!durationStr) return Number.MAX_SAFE_INTEGER;

  // ISO "PT7H30M"
  if (typeof durationStr === 'string' && durationStr.startsWith('PT')) {
    const h = (durationStr.match(/PT(\d+)H/) || [])[1];
    const m = (durationStr.match(/PT(?:\d+H)?(\d+)M/) || [])[1];
    return (h ? Number(h) : 0) * 60 + (m ? Number(m) : 0);
  }

  // "7h 30m"
  const hm = String(durationStr).match(/(\d+)\s*h(?:\s*(\d+)\s*m)?/i);
  if (hm) return Number(hm[1]) * 60 + (hm[2] ? Number(hm[2]) : 0);

  return Number.MAX_SAFE_INTEGER;
}

function parseTimeMinutes(timeStr) {
  // expects "7:15 PM"
  if (!timeStr) return Number.MAX_SAFE_INTEGER;
  const d = new Date(`1970-01-01 ${timeStr}`);
  if (Number.isNaN(d.getTime())) return Number.MAX_SAFE_INTEGER;
  return d.getHours() * 60 + d.getMinutes();
}

// ----------------------------
// Backend fetch
// ----------------------------
async function loadFlightsFromBackend({ from, to, date, adults }) {
  setResultsStatus({ loading: true });

  try {
    const url = new URL('/api/amadeus/search', API_BASE);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    url.searchParams.set('date', date);
    url.searchParams.set('adults', String(adults));

    const resp = await fetch(url.toString(), { method: 'GET' });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg = data?.error || data?.message || `HTTP ${resp.status}`;
      throw new Error(msg);
    }

    flightsData = Array.isArray(data?.flights) ? data.flights : [];

    // Build airline filters dynamically (enable all by default)
    currentFilters.airlines = {};
    flightsData.forEach(f => {
      if (f?.airline) currentFilters.airlines[f.airline] = true;
    });

    if (flightsData.length === 0) {
      setResultsStatus({ loading: false, message: data?.message || 'No flights found for this route.' });
      updateFilterCounts();
      return;
    }

    setResultsStatus({ loading: false });
    renderFlights();
  } catch (err) {
    flightsData = [];
    setResultsStatus({ loading: false, error: err?.message || 'Unknown error' });
    updateFilterCounts();
  }
}

// ----------------------------
// Rendering
// ----------------------------
function renderFlights() {
  const filteredFlights = flightsData.filter(flight => {
    if ((flight.price || 0) > currentFilters.priceMax) return false;

    const bucket = normalizeStopsBucket(flight.stops);
    if (currentFilters.stops[bucket] === false) return false;

    if (flight.airline && currentFilters.airlines[flight.airline] === false) return false;

    if (flight.departTimeCategory && currentFilters.departTime[flight.departTimeCategory] === false) return false;

    return true;
  });

  const container = document.getElementById('flights-container');
  const countElement = document.getElementById('results-count');

  if (countElement) countElement.textContent = filteredFlights.length;

  if (!container) return;

  container.innerHTML = filteredFlights.map(createFlightCard).join('');

  // Award details toggle
  document.querySelectorAll('.award-toggle').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const details = this.closest('.award-info')?.querySelector('.award-details-expanded');
      if (!details) return;
      details.classList.toggle('show');
      this.textContent = details.classList.contains('show') ? 'Hide Details ▲' : 'Show Details ▼';
    });
  });

  // Select buttons
  document.querySelectorAll('.btn-select').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      window.location.href = 'dashboard.html';
    });
  });

  updateFilterCounts();
}

function createFlightCard(flight) {
  const milesNeeded = flight?.awardMiles?.businessClass || 0;

  const displayMain =
    currentView === 'points'
      ? `${milesNeeded.toLocaleString()} pts`
      : `$${(flight.price || 0).toLocaleString()}`;

  const badgeStyle =
    currentView === 'points'
      ? 'background: linear-gradient(135deg, #4a9cff, #357abd); color: #ffffff;'
      : 'background: #c5ff68; color: #0a0f1e;';

  const partners = Array.isArray(flight.transferPartners) ? flight.transferPartners : [];

  return `
    <div class="flight-card">
      <div class="flight-header">
        <div class="airline-info">
          <div class="airline-logo" style="background:${flight.logoColor || 'linear-gradient(135deg, #8e44ad, #9b59b6)'};">
            ${flight.logo || '✈'}
          </div>
          <div class="airline-details">
            <div class="airline-name">${escapeHtml(flight.airline || 'Unknown Airline')}</div>
            <div class="flight-code">${escapeHtml(flight.code || flight.airlineCode || '—')} • ${escapeHtml(flight.aircraft || 'Unknown')}</div>
          </div>
        </div>

        <div class="price-info">
          <div class="price-badge" style="${badgeStyle}">${displayMain}</div>
          <div class="points-info">
            ${
              currentView === 'price'
                ? `or <span class="points-value">${milesNeeded.toLocaleString()} miles</span>`
                : `or <span class="points-value">$${(flight.price || 0).toLocaleString()}</span>`
            }
          </div>
        </div>
      </div>

      <div class="award-info">
        <div class="award-header">
          <div class="award-title">💎 Award Availability via ${escapeHtml(flight?.awardMiles?.program || 'Program')}</div>
          <button class="award-toggle">Show Details ▼</button>
        </div>

        <div class="award-details-expanded">
          <div class="award-options">
            <div class="award-option">
              <span class="award-airline">Economy</span>
              <span><span class="award-points">${(flight?.awardMiles?.economyClass || 0).toLocaleString()}</span><span class="award-miles-label">miles</span></span>
            </div>
            <div class="award-option">
              <span class="award-airline">Business</span>
              <span><span class="award-points">${(flight?.awardMiles?.businessClass || 0).toLocaleString()}</span><span class="award-miles-label">miles</span></span>
            </div>
            ${
              flight?.awardMiles?.firstClass
                ? `<div class="award-option">
                    <span class="award-airline">First Class</span>
                    <span><span class="award-points">${flight.awardMiles.firstClass.toLocaleString()}</span><span class="award-miles-label">miles</span></span>
                  </div>`
                : ''
            }
          </div>

          <div class="transfer-partners">
            <div class="transfer-label">✨ Transfer from these credit cards:</div>
            <div class="credit-cards">
              ${
                partners.length
                  ? partners.map(p => `
                      <div class="credit-card-badge ${escapeHtml(p.class || '')}" title="Transfer ratio: ${escapeHtml(p.ratio || '')}">
                        ${escapeHtml(p.name || '')}
                      </div>`).join('')
                  : `<div style="opacity:0.8;color:#cbd5e1;">No transfer partner data</div>`
              }
            </div>
          </div>
        </div>
      </div>

      <div class="flight-route">
        <div class="route-point">
          <div class="route-time">${escapeHtml(flight.departTime || '--:--')}</div>
          <div class="route-airport">${escapeHtml(flight.departAirport || '')}</div>
        </div>

        <div class="route-visual">
          <div class="route-duration">${escapeHtml(flight.duration || '')}</div>
          <div class="route-line"></div>
          <div class="route-stops">${escapeHtml(flight.stopInfo || '')}</div>
        </div>

        <div class="route-point">
          <div class="route-time">${escapeHtml(flight.arriveTime || '--:--')}</div>
          <div class="route-airport">${escapeHtml(flight.arriveAirport || '')}</div>
        </div>
      </div>

      <div class="flight-details">
        <div class="detail-item"><span>⚡</span><span>${escapeHtml(flight.legroom || 'Standard')}</span></div>
        <div class="detail-item"><span>📺</span><span>${flight.entertainment ? 'Entertainment' : 'No entertainment'}</span></div>
        <div class="detail-item"><span>🍽️</span><span>${escapeHtml(flight.meal || 'Meal info')}</span></div>
        <button class="btn-select">Select Flight</button>
      </div>
    </div>
  `;
}

function updateFilterCounts() {
  const counts = {
    stops: { 0: 0, 1: 0, 2: 0 },
    airlines: {},
    departTime: { morning: 0, afternoon: 0, evening: 0 }
  };

  flightsData.forEach(f => {
    if ((f.price || 0) > currentFilters.priceMax) return;

    const bucket = normalizeStopsBucket(f.stops);
    counts.stops[bucket]++;

    if (f.airline) counts.airlines[f.airline] = (counts.airlines[f.airline] || 0) + 1;

    const t = f.departTimeCategory;
    if (t && counts.departTime[t] !== undefined) counts.departTime[t]++;
  });

  document.querySelectorAll('.filter-option').forEach(option => {
    const label = option.querySelector('label span:first-child')?.textContent?.trim() || '';
    const countSpan = option.querySelector('.filter-count');
    if (!countSpan) return;

    if (label === 'Non-stop') countSpan.textContent = counts.stops[0] || 0;
    if (label === '1 Stop') countSpan.textContent = counts.stops[1] || 0;
    if (label === '2+ Stops') countSpan.textContent = counts.stops[2] || 0;

    if (counts.airlines[label] !== undefined) countSpan.textContent = counts.airlines[label];

    if (label.includes('Morning')) countSpan.textContent = counts.departTime.morning || 0;
    if (label.includes('Afternoon')) countSpan.textContent = counts.departTime.afternoon || 0;
    if (label.includes('Evening')) countSpan.textContent = counts.departTime.evening || 0;
  });
}

// ----------------------------
// Init
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  const from = (params.get('from') || 'JFK').toUpperCase();
  const to = (params.get('to') || 'MXP').toUpperCase();
  const date = params.get('date') || new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  const adults = Number(params.get('adults') || 1);

  // Header route
  const hf = document.getElementById('header-from');
  const ht = document.getElementById('header-to');
  if (hf) hf.textContent = from;
  if (ht) ht.textContent = to;

  // Filter toggles
  document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', function () {
      const checkbox = this.querySelector('.checkbox');
      checkbox.classList.toggle('checked');

      const filterType = this.dataset.filter;
      const filterValue = this.dataset.value;
      const isChecked = checkbox.classList.contains('checked');

      if (filterType === 'stops') {
        const key = Number(filterValue);
        currentFilters.stops[key] = isChecked;
      } else if (filterType === 'airline') {
        currentFilters.airlines[filterValue] = isChecked;
      } else if (filterType === 'time') {
        currentFilters.departTime[filterValue] = isChecked;
      }

      renderFlights();
    });
  });

  // Price slider
  const priceSlider = document.querySelector('.price-slider');
  if (priceSlider) {
    priceSlider.addEventListener('input', function () {
      currentFilters.priceMax = parseInt(this.value, 10);
      const priceRange = document.querySelector('.price-range span:last-child');
      if (priceRange) {
        priceRange.textContent = currentFilters.priceMax >= 2000 ? '$2,000+' : `$${currentFilters.priceMax.toLocaleString()}`;
      }
      renderFlights();
    });
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      const sortBy = this.value;

      if (sortBy === 'Lowest Price') {
        flightsData.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortBy === 'Fewest Miles') {
        flightsData.sort((a, b) => (a?.awardMiles?.businessClass || 0) - (b?.awardMiles?.businessClass || 0));
      } else if (sortBy === 'Shortest Duration') {
        flightsData.sort((a, b) => parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration));
      } else if (sortBy === 'Earliest Departure') {
        flightsData.sort((a, b) => parseTimeMinutes(a.departTime) - parseTimeMinutes(b.departTime));
      }

      renderFlights();
    });
  }

  // Price/Points Toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      currentView = this.textContent.includes('Points') ? 'points' : 'price';
      renderFlights();
    });
  });

  // Load flights
  loadFlightsFromBackend({ from, to, date, adults });
});

// Export (optional)
window.renderFlights = renderFlights;
console.log('✅ Search functionality ready (backend)');
