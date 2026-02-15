import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

// Robust CSV-ish parser for airports.dat (quoted fields may contain commas)
function splitCsvLine(line) {
  const parts = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch; // keep quotes for now (we'll clean later)
      continue;
    }
    if (ch === "," && !inQuotes) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function cleanField(s) {
  return String(s ?? "")
    .trim()
    .replace(/^"+|"+$/g, "")  // strip wrapping quotes
    .replace(/\\"/g, '"');    // unescape quotes
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  console.log("Fetching:", SOURCE_URL);
  const res = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Fetch failed: HTTP ${res.status}`);
  }

  const text = await res.text();
  const lines = text.split("\n");

  const airports = [];
  for (const line of lines) {
    if (!line.trim()) continue;

    const p = splitCsvLine(line);

    // airports.dat format:
    // 0:id, 1:name, 2:city, 3:country, 4:IATA, 5:ICAO, 6:lat, 7:lon, ...
    const airportName = cleanField(p[1]);
    const city = cleanField(p[2]);
    const country = cleanField(p[3]);
    const iata = cleanField(p[4]);
    const lat = toNum(cleanField(p[6]));
    const lng = toNum(cleanField(p[7]));

    if (!iata || iata === "\\N" || iata.length !== 3) continue;

    airports.push({
      code: iata.toUpperCase(),
      city,
      country,
      airport: airportName,
      lat,
      lng
    });
  }

  // Sort for nicer autocomplete ranking (by code then city)
  airports.sort((a, b) => (a.code.localeCompare(b.code) || a.city.localeCompare(b.city)));

  const outPath = path.join(__dirname, "..", "public", "airports-database.js");

  // Minified output to keep bundle small
  const payload = `// Auto-generated from OpenFlights airports.dat\n// Generated: ${new Date().toISOString()}\nwindow.AIRPORTS_DB=${JSON.stringify(airports)};\n`;

  await fs.writeFile(outPath, payload, "utf8");

  console.log(`✅ Wrote ${airports.length} airports to ${outPath}`);
}

main().catch((err) => {
  console.error("❌ build-airports-db failed:", err);
  process.exit(1);
});
