// public/airport-loader.js
// Autocomplete + "city/airport name -> IATA" resolver for Live Tracker.
// Requires public/airports-database.js which must define: window.AIRPORTS_DB = [...]

(function () {
  const MAX_RESULTS = 8;

  function norm(s) {
    return String(s || "").trim();
  }
  function normKey(s) {
    return norm(s).toLowerCase();
  }
  function isIata(s) {
    const v = norm(s).toUpperCase();
    return /^[A-Z]{3}$/.test(v) ? v : null;
  }

  function getDb() {
    const db = window.AIRPORTS_DB;
    return Array.isArray(db) ? db : [];
  }

  // Return best matches for a query (by code, city, airport name, country)
  function searchAirports(q) {
    const db = getDb();
    const query = normKey(q);
    if (!query) return [];

    const scored = [];
    for (const a of db) {
      if (!a) continue;
      const code = norm(a.code).toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) continue;

      const city = norm(a.city || a.name);
      const airport = norm(a.airport);
      const country = norm(a.country);

      const hay = `${code} ${city} ${airport} ${country}`.toLowerCase();

      if (!hay.includes(query)) continue;

      // simple scoring: code startsWith highest, then city startsWith, then contains
      let score = 10;
      if (code.toLowerCase() === query) score = 0;
      else if (code.toLowerCase().startsWith(query)) score = 1;
      else if (city.toLowerCase().startsWith(query)) score = 2;
      else if (airport.toLowerCase().startsWith(query)) score = 3;
      else score = 6;

      scored.push({
        score,
        code,
        city,
        airport,
        country
      });
    }

    scored.sort((a, b) => a.score - b.score || a.code.localeCompare(b.code));
    return scored.slice(0, MAX_RESULTS);
  }

  // Public resolver: "Boston" -> "BOS" if we find a strong match
  function resolveToIata(input) {
    const direct = isIata(input);
    if (direct) return direct;

    const results = searchAirports(input);

    // If only one result, use it
    if (results.length === 1) return results[0].code;

    // If first result is much better (score) than second, choose it
    if (results.length >= 2 && results[0].score + 1 < results[1].score) {
      return results[0].code;
    }

    // Otherwise can't confidently auto-resolve
    return null;
  }

  function renderSuggest(box, results, onPick) {
    if (!box) return;
    if (!results.length) {
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }

    box.innerHTML = results
      .map((r, idx) => {
        const main = r.city || r.airport || "";
        const sub = [r.country, r.airport].filter(Boolean).join(" • ");
        return `
          <button type="button" data-idx="${idx}">
            <span class="lt-s-code">${r.code}</span>
            <span>
              <div class="lt-s-main">${escapeHtml(main)}</div>
              <div class="lt-s-sub">${escapeHtml(sub)}</div>
            </span>
          </button>
        `;
      })
      .join("");

    box.style.display = "block";

    box.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-idx"));
        const picked = results[idx];
        if (picked) onPick(picked);
      });
    });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function attachAutocomplete(inputId, suggestId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestId);
    if (!input || !box) return;

    let current = [];

    function close() {
      box.style.display = "none";
      box.innerHTML = "";
      current = [];
    }

    input.addEventListener("input", () => {
      const q = input.value;

      // If they've typed a clean IATA, don't spam suggestions.
      if (isIata(q)) {
        close();
        input.value = isIata(q);
        return;
      }

      current = searchAirports(q);
      renderSuggest(box, current, (picked) => {
        input.value = picked.code;            // IMPORTANT: input becomes IATA code
        input.dataset.city = picked.city || "";
        input.dataset.airport = picked.airport || "";
        input.dataset.country = picked.country || "";
        close();

        // let other scripts know an airport was chosen
        input.dispatchEvent(new CustomEvent("airport:selected", { detail: picked }));
      });
    });

    input.addEventListener("blur", () => {
      // Small delay so click can register
      setTimeout(() => {
        // Try to resolve name -> IATA on blur if they typed full text
        const resolved = resolveToIata(input.value);
        if (resolved) input.value = resolved;
        close();
      }, 120);
    });

    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (e.target === input || box.contains(e.target)) return;
      close();
    });
  }

  function init() {
    const db = getDb();
    if (!db.length) {
      console.warn("AIRPORTS_DB missing. Ensure public/airports-database.js loads and sets window.AIRPORTS_DB.");
      return;
    }

    window.resolveToIata = resolveToIata;
    attachAutocomplete("from", "fromSuggest");
    attachAutocomplete("to", "toSuggest");

    console.log(`✅ airport-loader ready (${db.length} airports)`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
