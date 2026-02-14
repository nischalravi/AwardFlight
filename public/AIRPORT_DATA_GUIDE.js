/**
 * Airports DB builder (OpenFlights)
 * - Robust CSV parsing (handles commas inside quotes)
 * - Generates airports-database.js as a download (does NOT navigate the current tab)
 * - Caches parsed data in localStorage (30 days)
 */

(async function buildAirportsDatabase() {
  const SOURCE_URL =
    "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

  const CACHE_KEY = "awardflights_airports_v1";
  const CACHE_TS_KEY = "awardflights_airports_v1_ts";
  const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  // ---------- CSV parser (RFC4180-ish) ----------
  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        // Handle escaped quote ""
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }

      cur += ch;
    }

    out.push(cur);
    return out.map((s) => s.trim());
  }

  function normalizeIata(v) {
    const s = String(v || "").trim().toUpperCase();
    return /^[A-Z]{3}$/.test(s) ? s : "";
  }

  function loadCache() {
    try {
      const ts = Number(localStorage.getItem(CACHE_TS_KEY) || "0");
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      if (!ts || Date.now() - ts > CACHE_TTL_MS) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveCache(list) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }

  async function fetchAndParse() {
    const res = await fetch(SOURCE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch airports.dat (HTTP ${res.status})`);
    const text = await res.text();

    const airports = [];
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line || !line.trim()) continue;

      // airports.dat columns:
      // 0: Airport ID
      // 1: Name
      // 2: City
      // 3: Country
      // 4: IATA
      // 5: ICAO
      // 6: Latitude
      // 7: Longitude
      // 8: Altitude
      // 9: Timezone
      // 10: DST
      // 11: Tz database time zone
      // 12: type
      // 13: source

      const parts = parseCsvLine(line);
      const iata = normalizeIata(parts[4]);

      if (!iata) continue;

      airports.push({
        code: iata,
        city: (parts[2] || "").replace(/^"|"$/g, ""),
        country: (parts[3] || "").replace(/^"|"$/g, ""),
        airport: (parts[1] || "").replace(/^"|"$/g, ""),
      });
    }

    // De-dupe by code (keep first)
    const seen = new Set();
    const deduped = [];
    for (const a of airports) {
      if (seen.has(a.code)) continue;
      seen.add(a.code);
      deduped.push(a);
    }

    return deduped;
  }

  function downloadJsFile(airports) {
    const content =
      `// Auto-generated from OpenFlights airports.dat\n` +
      `// Generated: ${new Date().toISOString()}\n` +
      `window.AIRPORTS_DB = ${JSON.stringify(airports)};\n`;

    const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "airports-database.js"; // ✅ forces download
    a.style.display = "none";
    document.body.appendChild(a);

    // ✅ click + cleanup without navigating current tab
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
  }

  try {
    console.log("✈️ Airports DB: checking cache…");
    let airports = loadCache();

    if (!airports) {
      console.log("⬇️ Airports DB: fetching + parsing…");
      airports = await fetchAndParse();
      saveCache(airports);
      console.log(`✅ Parsed ${airports.length} airports (cached for 30 days)`);
    } else {
      console.log(`✅ Using cached airports: ${airports.length}`);
    }

    console.log("📦 Downloading airports-database.js…");
    downloadJsFile(airports);

    // Expose for immediate use
    window.AIRPORTS_DB = airports;
  } catch (err) {
    console.error("❌ Airports DB build failed:", err);
  }
})();
