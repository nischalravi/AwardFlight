/* public/airport-loader.js
   Loads airport data from OpenFlights airports.dat
   - Robust CSV parsing (handles commas inside quotes)
   - Caches in localStorage (30 days)
   - Exposes: window.AIRPORTS_DB (array)
              window.searchAirports(query, limit) (function)
*/

(function () {
  const AIRPORTS_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";
  const LS_KEY = "awardflights_airports_v1";
  const LS_TS_KEY = "awardflights_airports_v1_ts";
  const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

  function parseCsvLine(line) {
    // Minimal CSV parser for OpenFlights format: fields quoted with "
    const out = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        // Double quote inside quotes -> literal quote
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  }

  function normalize(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function scoreAirport(a, q) {
    const code = (a.code || "").toLowerCase();
    const city = normalize(a.city);
    const name = normalize(a.airport);
    const country = normalize(a.country);

    let score = 0;
    if (!q) return score;

    // Strong: code prefix
    if (code.startsWith(q)) score += 200;

    // Strong: city prefix (Boston should win for "bo" / "bos")
    if (city.startsWith(q)) score += 160;

    // Strong: airport name prefix
    if (name.startsWith(q)) score += 140;

    // Medium: contains
    if (city.includes(q)) score += 60;
    if (name.includes(q)) score += 50;
    if (country.includes(q)) score += 10;

    // Tiny bonus for common countries when query is short (helps US results)
    if (q.length <= 3 && (country === "united states" || country === "usa")) score += 5;

    return score;
  }

  async function loadAirports() {
    // Cache first
    try {
      const cached = localStorage.getItem(LS_KEY);
      const ts = Number(localStorage.getItem(LS_TS_KEY) || 0);
      if (cached && ts && Date.now() - ts < MAX_AGE_MS) {
        const airports = JSON.parse(cached);
        window.AIRPORTS_DB = airports;
        window.searchAirports = (q, limit = 10) => search(airports, q, limit);
        return airports;
      }
    } catch (_) {}

    // Fetch
    const res = await fetch(AIRPORTS_URL, { cache: "force-cache" });
    const text = await res.text();

    const airports = [];
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;

      const p = parseCsvLine(line);
      // OpenFlights airports.dat fields:
      // 0 id, 1 name, 2 city, 3 country, 4 IATA, 5 ICAO, 6 lat, 7 lon, 8 alt, 9 tz, 10 dst, 11 tzdb, 12 type, 13 source
      const iata = (p[4] || "").replace(/"/g, "").trim();
      if (!iata || iata === "\\N" || iata.length !== 3) continue;

      const airport = (p[1] || "").replace(/"/g, "").trim();
      const city = (p[2] || "").replace(/"/g, "").trim();
      const country = (p[3] || "").replace(/"/g, "").trim();
      const lat = Number((p[6] || "").replace(/"/g, "").trim());
      const lon = Number((p[7] || "").replace(/"/g, "").trim());

      airports.push({
        code: iata.toUpperCase(),
        airport,
        city,
        country,
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null
      });
    }

    // Save cache
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(airports));
      localStorage.setItem(LS_TS_KEY, String(Date.now()));
    } catch (_) {}

    window.AIRPORTS_DB = airports;
    window.searchAirports = (q, limit = 10) => search(airports, q, limit);
    return airports;
  }

  function search(airports, query, limit = 10) {
    const q = normalize(query);
    if (!q || q.length < 2) return [];

    return airports
      .map((a) => ({ a, s: scoreAirport(a, q) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, limit)
      .map((x) => x.a);
  }

  // Kick off load
  loadAirports().catch((e) => {
    console.warn("Airport loader failed:", e);
    window.AIRPORTS_DB = [];
    window.searchAirports = () => [];
  });
})();
