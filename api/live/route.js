// api/live/route.js
const { FlightRadar24API } = require("flightradarapi");

const fr24 = new FlightRadar24API();

let cache = { at: 0, flights: [] };
const TTL_MS = 30 * 1000;

function isIata(code) {
  return typeof code === "string" && /^[A-Za-z]{3}$/.test(code.trim());
}
function normIata(code) {
  return String(code || "").trim().toUpperCase();
}

module.exports = async (req, res) => {
  // Basic CORS (optional)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Helpful CDN caching on Vercel edge (doesn't break your 30s in-memory cache)
  res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const from = normIata(req.query.from);
  const to = normIata(req.query.to);

  if (!isIata(from) || !isIata(to)) {
    return res.status(400).json({ error: "from/to must be valid 3-letter IATA codes" });
  }
  if (from === to) {
    return res.status(400).json({ error: "from and to cannot be the same" });
  }

  try {
    const now = Date.now();
    if (!cache.flights.length || now - cache.at > TTL_MS) {
      // This call is heavy; if it fails, we still want a clean JSON error
      cache.flights = await fr24.getFlights();
      cache.at = now;
    }

    const flights = cache.flights
      .filter((f) => f.originAirportIata === from && f.destinationAirportIata === to)
      .map((f) => ({
        id: f.id,
        number: f.number,
        airline: f.airlineIcao,
        latitude: f.latitude,
        longitude: f.longitude,
        altitude: f.altitude,
        speed: f.groundSpeed,
        heading: f.heading,
        origin: f.originAirportIata,
        destination: f.destinationAirportIata,
      }));

    return res.json({ success: true, count: flights.length, flights });
  } catch (err) {
    console.error("Live route error:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: "Live route lookup failed",
      hint: "Check Vercel function logs + confirm flightradarapi is in dependencies",
    });
  }
};