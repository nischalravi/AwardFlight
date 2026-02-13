// api/live/route.js
const { FlightRadar24API } = require("flightradarapi");
const fr24 = new FlightRadar24API();

let cache = { at: 0, flights: [] };
const TTL_MS = 30 * 1000;

// Airport coord cache
let airportCache = { at: 0, map: new Map() };
const AIRPORT_TTL = 24 * 60 * 60 * 1000;

function isIata(code) {
  return typeof code === "string" && /^[A-Za-z]{3}$/.test(code.trim());
}
function normIata(code) {
  return String(code || "").trim().toUpperCase();
}

// Haversine distance (km)
function havKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// distance from point P to segment AB in km (approx using haversine to endpoints + projection in 2D is overkill;
// use a cheap heuristic: min(dist to A,B) if projection unknown; for our use it’s fine)
function distToRouteKm(p, a, b) {
  // cheap: min distance to endpoints + mid point
  const mid = { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
  return Math.min(
    havKm(p.lat, p.lon, a.lat, a.lon),
    havKm(p.lat, p.lon, b.lat, b.lon),
    havKm(p.lat, p.lon, mid.lat, mid.lon)
  );
}

async function loadAirportMap() {
  const now = Date.now();
  if (airportCache.map.size && now - airportCache.at < AIRPORT_TTL) return airportCache.map;

  // OpenFlights airports.dat
  const url = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";
  const res = await fetch(url);
  const text = await res.text();

  const map = new Map();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const p = line.split(",").map((x) => x.replace(/"/g, ""));
    const iata = p[4];
    const lat = Number(p[6]);
    const lon = Number(p[7]);
    if (iata && iata.length === 3 && iata !== "\\N" && Number.isFinite(lat) && Number.isFinite(lon)) {
      map.set(iata.toUpperCase(), { lat, lon });
    }
  }

  airportCache = { at: now, map };
  return map;
}

module.exports = async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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

    const now = Date.now();
    if (!cache.flights.length || now - cache.at > TTL_MS) {
      cache.flights = await fr24.getFlights();
      cache.at = now;
    }

    // Strict match first
    let filtered = cache.flights.filter(
      (f) => f.originAirportIata === from && f.destinationAirportIata === to
    );

    // Fallback: “near the route” if strict returns nothing
    if (!filtered.length) {
      const airportMap = await loadAirportMap();
      const A = airportMap.get(from);
      const B = airportMap.get(to);

      if (A && B) {
        // include flights within ~500km of endpoints/mid (tuneable)
        filtered = cache.flights
          .filter((f) => Number.isFinite(f.latitude) && Number.isFinite(f.longitude))
          .map((f) => {
            const d = distToRouteKm({ lat: f.latitude, lon: f.longitude }, A, B);
            return { f, d };
          })
          .filter((x) => x.d <= 500)
          .sort((a, b) => a.d - b.d)
          .slice(0, 40)
          .map((x) => x.f);
      }
    }

    const flights = filtered.map((f) => ({
      id: f.id,
      number: f.number,
      airline: f.airlineIcao,
      latitude: f.latitude,
      longitude: f.longitude,
      altitude: f.altitude,
      speed: f.groundSpeed,
      heading: f.heading,
      origin: f.originAirportIata || from,
      destination: f.destinationAirportIata || to
    }));

    return res.json({ success: true, count: flights.length, flights });
  } catch (err) {
    console.error("Live route error:", err?.message || err);
    return res.status(500).json({ success: false, error: "Live route lookup failed" });
  }
};
