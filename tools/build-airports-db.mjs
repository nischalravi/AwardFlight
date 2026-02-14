import fs from "fs";

const URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
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

const res = await fetch(URL);
if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status}`);
const text = await res.text();

const airports = [];
for (const line of text.split("\n")) {
  if (!line.trim()) continue;
  const parts = parseCsvLine(line);
  const iata = normalizeIata(parts[4]);
  if (!iata) continue;

  airports.push({
    code: iata,
    city: parts[2] || "",
    country: parts[3] || "",
    airport: parts[1] || "",
  });
}

// de-dupe by IATA
const seen = new Set();
const deduped = [];
for (const a of airports) {
  if (seen.has(a.code)) continue;
  seen.add(a.code);
  deduped.push(a);
}

const out =
  `// Auto-generated from OpenFlights airports.dat\n` +
  `// Generated: ${new Date().toISOString()}\n` +
  `window.AIRPORTS_DB = ${JSON.stringify(deduped)};\n`;

fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/airports-database.js", out, "utf8");

console.log(`✅ Wrote public/airports-database.js with ${deduped.length} airports`);
