// api/amadeus/search.js
const axios = require("axios");

const AMADEUS_BASE_URL = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

function isIata(code) {
  return typeof code === "string" && /^[A-Za-z]{3}$/.test(code.trim());
}
function normIata(code) {
  return String(code || "").trim().toUpperCase();
}
function isISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function safeInt(v, fallback = 1) {
  const n = Number(v);
  return Number.isInteger(n) ? n : fallback;
}

// best-effort serverless cache
let cachedToken = null;
let cachedExpiry = 0;

async function getAmadeusToken() {
  if (cachedToken && Date.now() < cachedExpiry) return cachedToken;

  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error("Amadeus credentials not configured");
  }

  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");
  body.append("client_id", AMADEUS_CLIENT_ID);
  body.append("client_secret", AMADEUS_CLIENT_SECRET);

  const resp = await axios.post(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 15000
  });

  const token = resp.data?.access_token;
  const expiresIn = resp.data?.expires_in;

  if (!token || !expiresIn) throw new Error("No access token in response");

  cachedToken = token;
  cachedExpiry = Date.now() + Math.max(30, expiresIn - 30) * 1000;
  return cachedToken;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  // Optional CORS allowlist (mainly matters if you call API from other origins)
  const origin = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (origin && allowed.length && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const from = normIata(req.query.from);
  const to = normIata(req.query.to);
  const date = String(req.query.date || "").trim();
  const adults = safeInt(req.query.adults, 1);

  if (!isIata(from) || !isIata(to) || from === to) {
    return res.status(400).json({ error: "from/to must be valid IATA and not the same" });
  }
  if (!isISODate(date)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  if (adults < 1 || adults > 9) {
    return res.status(400).json({ error: "adults must be between 1 and 9" });
  }

  try {
    const token = await getAmadeusToken();

    const resp = await axios.get(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: from,
        destinationLocationCode: to,
        departureDate: date,
        adults,
        max: 50,
        currencyCode: "USD"
      },
      timeout: 15000
    });

    const offers = Array.isArray(resp.data?.data) ? resp.data.data : [];
    return res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json({ success: false, error: "Amadeus API error", code: status });
  }
};