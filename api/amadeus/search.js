const express = require('express');
const router = express.Router();

// Amadeus API credentials from env
const AMADEUS_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_BASE = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

let tokenCache = { token: null, expires: 0 };

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires - 60000) return tokenCache.token;
  if (!AMADEUS_KEY || !AMADEUS_SECRET) throw new Error('Amadeus API credentials not configured');

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${AMADEUS_KEY}&client_secret=${AMADEUS_SECRET}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || 'Auth failed');
  tokenCache = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

function formatDuration(iso) {
  if (!iso) return '';
  const h = (iso.match(/(\d+)H/) || [])[1] || 0;
  const m = (iso.match(/(\d+)M/) || [])[1] || 0;
  return `${h}h ${m}m`;
}

function formatTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

router.get('/search', async (req, res) => {
  try {
    const { from, to, date, adults = '1' } = req.query;
    if (!from || !to || !date) return res.status(400).json({ error: 'Missing from, to, or date' });

    const token = await getToken();
    const url = new URL(`${AMADEUS_BASE}/v2/shopping/flight-offers`);
    url.searchParams.set('originLocationCode', from);
    url.searchParams.set('destinationLocationCode', to);
    url.searchParams.set('departureDate', date);
    url.searchParams.set('adults', adults);
    url.searchParams.set('max', '20');
    url.searchParams.set('currencyCode', 'USD');

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const data = await resp.json();

    if (!resp.ok) {
      const msg = data?.errors?.[0]?.detail || data?.error_description || 'Amadeus API error';
      return res.status(resp.status).json({ error: msg });
    }

    const offers = data?.data || [];
    const dictionaries = data?.dictionaries || {};

    const flights = offers.map(offer => {
      const seg = offer.itineraries?.[0]?.segments || [];
      const first = seg[0] || {};
      const last = seg[seg.length - 1] || {};
      const carrier = first.carrierCode || '';
      const airlineName = dictionaries?.carriers?.[carrier] || carrier;

      return {
        airline: airlineName,
        airlineCode: carrier,
        code: `${carrier}${first.number || ''}`,
        price: parseFloat(offer.price?.total) || 0,
        departTime: formatTime(first.departure?.at),
        arriveTime: formatTime(last.arrival?.at),
        departAirport: first.departure?.iataCode || from,
        arriveAirport: last.arrival?.iataCode || to,
        duration: formatDuration(offer.itineraries?.[0]?.duration),
        stops: Math.max(0, seg.length - 1),
        stopInfo: seg.length === 1 ? 'Non-stop' : `${seg.length - 1} stop${seg.length > 2 ? 's' : ''}`,
        aircraft: dictionaries?.aircraft?.[first.aircraft?.code] || first.aircraft?.code || '',
      };
    });

    res.json({ flights, count: flights.length, message: flights.length ? null : 'No flights found for this route/date.' });
  } catch (err) {
    console.error('Amadeus search error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
