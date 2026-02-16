/* public/airport-loader.js
   Loads airport database for autocomplete.
   Priority:
   1) public/airports-database.js -> window.AIRPORTS_DB
   2) cached localStorage
   3) fetch OpenFlights airports.dat, cache it
*/
(function () {
  const CACHE_KEY = "AWARD_AIRPORTS_DB_V1";
  const CACHE_TS_KEY = "AWARD_AIRPORTS_DB_V1_TS";
  const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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
      if (!raw || !ts || Date.now() - ts > MAX_AGE_MS) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch { return null; }
  }

  function parseOpenFlightsDat(text) {
    const out = [];
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const parts = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQ = !inQ;
        if (ch === "," && !inQ) { parts.push(cur); cur = ""; } else { cur += ch; }
      }
      parts.push(cur);
      const clean = s => String(s || "").replace(/^"+|"+$/g, "").replace(/\\"/g, '"');
      const iata = clean(parts[4]);
      if (iata && iata !== "\\N" && iata.length === 3) {
        out.push({
          code: iata.toUpperCase(),
          city: clean(parts[2]),
          country: clean(parts[3]),
          airport: clean(parts[1]),
          lat: parseFloat(parts[6]) || 0,
          lng: parseFloat(parts[7]) || 0,
        });
      }
    }
    return out;
  }

  async function init() {
    if (Array.isArray(window.AIRPORTS_DB) && window.AIRPORTS_DB.length) { signalReady(); return; }
    const cached = loadFromCache();
    if (cached && cached.length) { window.AIRPORTS_DB = cached; signalReady(); return; }
    try {
      const url = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDb(parseOpenFlightsDat(await res.text()));
    } catch (e) {
      console.warn("Airport loader failed:", e);
      signalReady();
    }
  }

  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", init);
  else init();
})();
