const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { FlightRadar24API } = require('flightradarapi');

const app = express();
const PORT = process.env.PORT || 3000;
const fr24 = new FlightRadar24API();

// ===== ENV (no hardcoding) =====
const AMADEUS_BASE_URL = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
  console.warn('⚠️ Missing AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET in env. Amadeus routes will fail.');
}

// ===== Security middleware =====
app.use(helmet());
app.use(express.json());

// ===== CORS lockdown =====
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, cb) {
    // Allow curl/postman (no origin)
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true); // fallback: allow all if not configured (dev)
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'), false);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== Rate limiting for API =====
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false
}));

// ===== Static hosting =====
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ============================================
// Validation helpers
// ============================================
function isIata(code) {
  return typeof code === 'string' && /^[A-Za-z]{3}$/.test(code.trim());
}
function normIata(code) {
  return String(code || '').trim().toUpperCase();
}
function isISODate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function safeInt(v, fallback = 1) {
  const n = Number(v);
  return Number.isInteger(n) ? n : fallback;
}

// ============================================
// AMADEUS TOKEN CACHING
// ============================================
let amadeusToken = null;
let tokenExpiry = 0;

async function getAmadeusToken() {
  if (amadeusToken && Date.now() < tokenExpiry) return amadeusToken;

  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error('Amadeus credentials not configured');
  }

  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', AMADEUS_CLIENT_ID);
  body.append('client_secret', AMADEUS_CLIENT_SECRET);

  try {
    const response = await axios.post(
      `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );

    const token = response.data?.access_token;
    const expiresIn = response.data?.expires_in;

    if (!token || !expiresIn) throw new Error('No access token in response');

    amadeusToken = token;
    // refresh 30 seconds early
    tokenExpiry = Date.now() + (Math.max(30, expiresIn - 30) * 1000);

    console.log('✅ Amadeus token obtained');
    return amadeusToken;
  } catch (error) {
    const status = error.response?.status;
    console.error('❌ Amadeus auth failed:', status || '', error.message);
    throw new Error('Amadeus authentication failed');
  }
}

// ============================================
// AMADEUS SEARCH
// ============================================
app.get('/api/amadeus/search', async (req, res) => {
  const from = normIata(req.query.from);
  const to = normIata(req.query.to);
  const date = String(req.query.date || '').trim();
  const adults = safeInt(req.query.adults, 1);

  if (!isIata(from) || !isIata(to)) {
    return res.status(400).json({ error: 'from/to must be valid 3-letter IATA codes' });
  }
  if (!isISODate(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  if (adults < 1 || adults > 9) {
    return res.status(400).json({ error: 'adults must be between 1 and 9' });
  }

  try {
    console.log(`🔍 Amadeus Search: ${from} → ${to} on ${date}`);

    const token = await getAmadeusToken();

    const response = await axios.get(
      `${AMADEUS_BASE_URL}/v2/shopping/flight-offers`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          originLocationCode: from,
          destinationLocationCode: to,
          departureDate: date,
          adults,
          max: 50,
          currencyCode: 'USD'
        },
        timeout: 15000
      }
    );

    const offers = Array.isArray(response.data?.data) ? response.data.data : [];
    if (offers.length === 0) {
      return res.json({ success: true, count: 0, flights: [], message: 'No flights found for this route' });
    }

    const flights = offers.map((offer, index) => {
      const outbound = offer.itineraries?.[0];
      const segs = outbound?.segments || [];
      const first = segs[0];
      const last = segs[segs.length - 1];
      const airlineCode = offer.validatingAirlineCodes?.[0] || 'XX';

      return {
        id: index + 1,
        airline: getAirlineName(airlineCode),
        airlineCode,
        // NOTE: Random flight number is misleading; better to omit or derive from segments
        code: airlineCode,
        aircraft: first?.aircraft?.code || 'Unknown',
        logo: '✈',
        logoColor: getAirlineColor(airlineCode),
        price: Math.round(parseFloat(offer.price?.total || '0')),
        currency: offer.price?.currency || 'USD',
        departTime: first ? formatTime(first.departure.at) : null,
        arriveTime: last ? formatTime(last.arrival.at) : null,
        departAirport: first ? first.departure.iataCode : from,
        arriveAirport: last ? last.arrival.iataCode : to,
        duration: outbound?.duration ? formatDuration(outbound.duration) : null,
        stops: Math.max(0, segs.length - 1),
        stopInfo: segs.length <= 1 ? 'Non-stop' : `${segs.length - 1} stop${segs.length - 1 > 1 ? 's' : ''}`,
        departTimeCategory: first ? getTimeCategory(first.departure.at) : null,

        // IMPORTANT: these are not real award miles (Amadeus = cash fares)
        awardMiles: estimateAwardMiles(airlineCode),
        transferPartners: getTransferPartners(airlineCode),

        // keep raw segments for future UI improvements
        segments: segs.map(s => ({
          from: s.departure?.iataCode,
          to: s.arrival?.iataCode,
          departAt: s.departure?.at,
          arriveAt: s.arrival?.at,
          carrierCode: s.carrierCode,
          flightNumber: s.number
        }))
      };
    });

    console.log(`✅ Returning ${flights.length} flights from Amadeus`);
    res.json({ success: true, count: flights.length, flights });

  } catch (error) {
    const status = error.response?.status || 500;
    console.error('❌ Amadeus error:', status, error.message);

    // If token expired, clear it so next request refreshes
    if (status === 401) {
      amadeusToken = null;
      tokenExpiry = 0;
    }

    // Don’t leak upstream payload to client
    res.status(status).json({
      error: 'Amadeus API error',
      code: status,
      message: 'Search failed'
    });
  }
});

// ============================================
// KIWI SEARCH (make it optional / safe)
// ============================================
app.get('/api/kiwi/search', async (req, res) => {
  const from = normIata(req.query.from);
  const to = normIata(req.query.to);
  const date = String(req.query.date || '').trim();

  if (!isIata(from) || !isIata(to) || !isISODate(date)) {
    return res.status(400).json({ error: 'Invalid from/to/date' });
  }

  // If you don’t configure a key, return a clear response instead of failing
  const KIWI_KEY = process.env.KIWI_API_KEY;
  if (!KIWI_KEY) {
    return res.status(501).json({ error: 'Kiwi not configured', hint: 'Set KIWI_API_KEY in env' });
  }

  try {
    const response = await axios.get('https://api.tequila.kiwi.com/v2/search', {
      params: {
        fly_from: from,
        fly_to: to,
        date_from: date,
        date_to: date,
        adults: 1,
        limit: 50,
        curr: 'USD'
      },
      headers: { apikey: KIWI_KEY },
      timeout: 15000
    });

    const flights = (response.data?.data || []).map((flight, index) => ({
      id: index + 1,
      airline: flight.airlines?.[0] || 'Unknown',
      price: Math.round(flight.price || 0),
      from: flight.flyFrom,
      to: flight.flyTo,
      departTime: new Date(flight.dTimeUTC * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      arriveTime: new Date(flight.aTimeUTC * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      stops: (flight.route?.length || 1) - 1
    }));

    res.json({ success: true, count: flights.length, flights });
  } catch (error) {
    console.error('Kiwi error:', error.message);
    res.status(500).json({ error: 'Kiwi search failed' });
  }
});

// ============================================
// FLIGHTRADAR24 LIVE ROUTE (add caching)
// ============================================
let frCache = { at: 0, flights: [] };
const FR_CACHE_TTL_MS = 30 * 1000; // 30 seconds

app.get('/api/live/route', async (req, res) => {
  const from = normIata(req.query.from);
  const to = normIata(req.query.to);

  if (!isIata(from) || !isIata(to)) {
    return res.status(400).json({ error: 'from/to must be valid IATA' });
  }

  try {
    // cache global flight fetch to reduce load
    const now = Date.now();
    if (!frCache.flights.length || (now - frCache.at) > FR_CACHE_TTL_MS) {
      frCache.flights = await fr24.getFlights();
      frCache.at = now;
    }

    const filtered = frCache.flights.filter(f =>
      f.originAirportIata === from &&
      f.destinationAirportIata === to
    );

    const formatted = filtered.map(f => ({
      id: f.id,
      number: f.number,
      airline: f.airlineIcao,
      latitude: f.latitude,
      longitude: f.longitude,
      altitude: f.altitude,
      speed: f.groundSpeed,
      heading: f.heading,
      origin: f.originAirportIata,
      destination: f.destinationAirportIata
    }));

    res.json({ success: true, count: formatted.length, flights: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Live route lookup failed' });
  }
});

// ============================================
// HEALTH
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    apis: {
      flightRadar24: 'active',
      amadeus: amadeusToken ? 'authenticated' : 'not_authenticated'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Helper functions (kept from your original)
// ============================================
function getAirlineName(code) {
  const names = {
    'AF': 'Air France', 'BA': 'British Airways', 'LH': 'Lufthansa',
    'EK': 'Emirates', 'DL': 'Delta', 'AA': 'American Airlines',
    'UA': 'United', 'KL': 'KLM', 'IB': 'Iberia', 'AZ': 'ITA Airways',
    '6E': 'IndiGo', 'AI': 'Air India', 'SG': 'SpiceJet', 'AS': 'Alaska',
    'B6': 'JetBlue', 'F9': 'Frontier', 'NK': 'Spirit', 'WN': 'Southwest'
  };
  return names[code] || code;
}

function getAirlineColor(code) {
  const colors = {
    'AF': 'linear-gradient(135deg, #e74c3c, #c0392b)',
    'BA': 'linear-gradient(135deg, #3498db, #2980b9)',
    'LH': 'linear-gradient(135deg, #f39c12, #e67e22)',
    'EK': 'linear-gradient(135deg, #c0392b, #e74c3c)',
    'DL': 'linear-gradient(135deg, #e74c3c, #c0392b)',
    'AA': 'linear-gradient(135deg, #3498db, #2980b9)',
    'UA': 'linear-gradient(135deg, #3498db, #2980b9)',
    'AS': 'linear-gradient(135deg, #1abc9c, #16a085)',
    'B6': 'linear-gradient(135deg, #3498db, #2980b9)',
    'WN': 'linear-gradient(135deg, #e67e22, #d35400)'
  };
  return colors[code] || 'linear-gradient(135deg, #8e44ad, #9b59b6)';
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDuration(iso) {
  // supports PT#H#M, PT#H, PT#M
  const h = iso.match(/PT(\d+)H/);
  const m = iso.match(/PT(?:\d+H)?(\d+)M/);
  const hh = h ? Number(h[1]) : 0;
  const mm = m ? Number(m[1]) : 0;
  return `${hh}h ${mm}m`;
}

function getTimeCategory(iso) {
  const h = new Date(iso).getHours();
  return h >= 6 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : 'evening';
}

function estimateAwardMiles(code) {
  const miles = {
    'AF': { program: 'Flying Blue', economyClass: 25000, businessClass: 55000, firstClass: 90000 },
    'BA': { program: 'Avios', economyClass: 26000, businessClass: 68000, firstClass: 102000 },
    'LH': { program: 'Miles & More', economyClass: 30000, businessClass: 70000, firstClass: 110000 },
    'EK': { program: 'Skywards', economyClass: 40000, businessClass: 85000, firstClass: 180000 },
    'DL': { program: 'SkyMiles', economyClass: 30000, businessClass: 75000, firstClass: 120000 },
    'AA': { program: 'AAdvantage', economyClass: 30000, businessClass: 57500, firstClass: 85000 },
    'UA': { program: 'MileagePlus', economyClass: 30000, businessClass: 60000, firstClass: 88000 },
    'AS': { program: 'Mileage Plan', economyClass: 20000, businessClass: 50000, firstClass: 70000 },
    'B6': { program: 'TrueBlue', economyClass: 25000, businessClass: 60000, firstClass: 85000 }
  };
  return miles[code] || { program: 'Partner', economyClass: 30000, businessClass: 60000, firstClass: 100000 };
}

function getTransferPartners(code) {
  const partners = {
    'AF': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }, { name: 'Chase UR', ratio: '1:1', class: 'chase' }, { name: 'Citi TYP', ratio: '1:1', class: 'citi' }],
    'BA': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }, { name: 'Chase UR', ratio: '1:1', class: 'chase' }],
    'LH': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }, { name: 'Chase UR', ratio: '1:1', class: 'chase' }],
    'EK': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }],
    'DL': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }],
    'AA': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }, { name: 'Citi TYP', ratio: '1:1', class: 'citi' }],
    'UA': [{ name: 'Chase UR', ratio: '1:1', class: 'chase' }]
  };
  return partners[code] || [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }];
}

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
