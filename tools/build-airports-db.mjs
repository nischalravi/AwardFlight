// Tool to rebuild airports-database.js from OpenFlights data
// Usage: node tools/build-airports-db.mjs

import { writeFileSync } from 'fs';

const url = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
const resp = await fetch(url);
const text = await resp.text();

const airports = [];
for (const line of text.split('\n')) {
  if (!line.trim()) continue;
  const parts = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    if (ch === ',' && !inQ) { parts.push(cur); cur = ''; } else { cur += ch; }
  }
  parts.push(cur);
  const clean = s => String(s || '').replace(/^"+|"+$/g, '');
  const iata = clean(parts[4]);
  if (iata && iata !== '\\N' && iata.length === 3) {
    airports.push({
      code: iata.toUpperCase(),
      city: clean(parts[2]),
      country: clean(parts[3]),
      airport: clean(parts[1]),
      lat: parseFloat(parts[6]) || 0,
      lng: parseFloat(parts[7]) || 0,
    });
  }
}

const js = `// Auto-generated from OpenFlights airports.dat\n// Generated: ${new Date().toISOString()}\nwindow.AIRPORTS_DB=${JSON.stringify(airports)};\n`;
writeFileSync('public/airports-database.js', js);
console.log(`✅ Written ${airports.length} airports to public/airports-database.js`);
