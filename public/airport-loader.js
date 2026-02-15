/* public/airport-loader.js
   Loads airport database for autocomplete.
   Priority:
   1) public/airports-database.js -> window.AIRPORTS_DB
   2) cached localStorage
   3) fetch OpenFlights airports.dat (no downloading), cache it

   Also signals readiness:
   - window.__AIRPORTS_READY__ = true
   - window.dispatchEvent(new Event("airportsdb:ready"))
*/

(function () {
  const CACHE_KEY = "AWARD_AIRPORTS_DB_V1";
  const CACHE_TS_KEY = "AWARD_AIRPORTS_DB_V1_TS";
  const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  function signalReady() {
    window.__AIRPORTS_READY__ = true;
    window.dispatchEvent(new Event("airportsdb:ready"));
  }

  function setDb(db) {
    if (Array.isArray(db) && db.length) {
      window.AIRPORTS_DB = db;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(db));
        localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
      } catch (_) {}
      signalReady();
      return true;
    }
    return false;
  }

  function loadFromCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const ts = Number(localStorage.getItem(CACHE_TS_KEY) || 0);
      if (!raw || !ts) return null;
      if (Date.now() - ts > MAX_AGE_MS) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function parseOpenFlightsDat(text) {
    const lines = text.split("\n");
    const out = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = [];
      let cur = "";
      let inQ = false;

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQ = !inQ;
        if (ch === "," && !inQ) {
          parts.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      parts.push(cur);

      const clean = (s) => String(s || "").replace(/^"+|"+$/g, "").replace(/\\"/g, '"');

      const airportName = clean(parts[1]);
      const city = clean(parts[2]);
      const country = clean(parts[3]);
      const iata = clean(parts[4]);

      if (iata && iata !== "\\N" && iata.length === 3) {
        out.push({
          code: iata.toUpperCase(),
          city,
          country,
          airport: airportName,
        });
      }
    }
    return out;
  }

  async function fetchFromOpenFlights() {
    const url = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Airport fetch failed: HTTP ${res.status}`);
    const text = await res.text();
    return parseOpenFlightsDat(text);
  }

  async function init() {
    // If airports-database.js already loaded
    if (Array.isArray(window.AIRPORTS_DB) && window.AIRPORTS_DB.length) {
      signalReady();
      return;
    }

    // Cache
    const cached = loadFromCache();
    if (cached && cached.length) {
      window.AIRPORTS_DB = cached;
      signalReady();
      return;
    }

    // Fetch
    try {
      const db = await fetchFromOpenFlights();
      setDb(db);
    } catch (e) {
      console.warn("Airport loader failed:", e);
      // still signal so UI doesn't hang; it just won't autocomplete
      signalReady();
    }
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
