/* public/live-tracker-client.js
   - Uses window.AwardGlobe (from globe-3d.js)
   - Adds airport autocomplete using AIRPORT_DATA_GUIDE.js (if present)
   - Route search + optional flight number filter
*/

(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    from: $("from"),
    to: $("to"),
    flightNumber: $("flightNumber"),
    btnTrack: $("btnTrack"),
    btnModify: $("btnModify"),
    btnNew: $("btnNew"),
    formError: $("formError"),
    flightsList: $("flightsList"),
    globeEl: $("globe"),
    globeStatus: $("globeStatus"),
    globeSub: $("globeSub"),
    pillRoute: $("pillRoute"),
    pillCount: $("pillCount"),
    pillUpdated: $("pillUpdated"),
    trackerSection: $("trackerSection"),
    formCard: $("formCard"),
  };

  function normIata(v) {
    return String(v || "").trim().toUpperCase();
  }
  function isIata(v) {
    return /^[A-Z]{3}$/.test(normIata(v));
  }
  function niceTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function showError(msg) {
    els.formError.style.display = "block";
    els.formError.textContent = msg;
  }
  function clearError() {
    els.formError.style.display = "none";
    els.formError.textContent = "";
  }
  function setLoading(loading) {
    els.btnTrack.disabled = loading;
    els.btnTrack.textContent = loading ? "🔄 Searching..." : "🔍 Track Live Flights";
    els.globeStatus.textContent = loading ? "Loading" : "Idle";
  }

  // ----------------------------
  // Airport Autocomplete
  // ----------------------------
  function normalizeText(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Accept a few likely shapes. Your AIRPORT_DATA_GUIDE.js might export different structures.
  function getAirportDataset() {
    const g = window.AIRPORT_DATA_GUIDE;
    if (!g) return [];
    if (Array.isArray(g)) return g;
    if (Array.isArray(g.airports)) return g.airports;
    if (Array.isArray(g.data)) return g.data;
    return [];
  }

  function airportLabel(a) {
    // Try best-effort fields
    const code = (a.iata || a.IATA || a.code || a.iata_code || "").toString().toUpperCase();
    const city = (a.city || a.municipality || a.name || a.location || "").toString();
    const airport = (a.airport || a.name || a.airportName || "").toString();
    const country = (a.country || a.country_name || a.iso_country || "").toString();
    const title = airport && airport !== city ? `${code} — ${city} (${airport})` : `${code} — ${city}`;
    const suffix = country ? `, ${country}` : "";
    return `${title}${suffix}`.trim();
  }

  function airportCode(a) {
    return (a.iata || a.IATA || a.code || a.iata_code || "").toString().toUpperCase();
  }

  function buildDatalist(inputEl, id) {
    let dl = document.getElementById(id);
    if (!dl) {
      dl = document.createElement("datalist");
      dl.id = id;
      document.body.appendChild(dl);
    }
    inputEl.setAttribute("list", id);
    return dl;
  }

  function attachAirportAutocomplete(inputEl, listId) {
    const dl = buildDatalist(inputEl, listId);
    const dataset = getAirportDataset();

    // If no dataset, do nothing (page still works with 3-letter IATA)
    if (!dataset.length) return;

    inputEl.addEventListener("input", () => {
      const q = normalizeText(inputEl.value);
      if (!q || q.length < 2) {
        dl.innerHTML = "";
        return;
      }

      // Find matches by code or city/name
      const matches = dataset
        .map((a) => {
          const code = airportCode(a);
          const label = airportLabel(a);
          const hay = normalizeText(`${code} ${label} ${a.city || ""} ${a.name || ""} ${a.country || ""}`);
          let score = 0;
          if (code.toLowerCase().startsWith(q)) score += 100;
          if (hay.includes(q)) score += 10;
          return { a, code, label, score };
        })
        .filter((m) => m.code && m.score > 0)
        .sort((x, y) => y.score - x.score)
        .slice(0, 10);

      dl.innerHTML = matches
        .map((m) => `<option value="${m.code}" label="${m.label.replace(/"/g, "&quot;")}"></option>`)
        .join("");
    });
  }

  // ----------------------------
  // Globe init
  // ----------------------------
  function initGlobe() {
    if (window.AwardGlobe && els.globeEl) {
      window.AwardGlobe.init(els.globeEl);
      window.AwardGlobe.clear();
    }
  }

  function plotFlights(flights) {
    if (!window.AwardGlobe) return;
    window.AwardGlobe.setFlights(flights || []);
  }

  // ----------------------------
  // Render flight list
  // ----------------------------
  function feet(alt) {
    const n = Number(alt);
    if (!Number.isFinite(n)) return "—";
    return n >= 1000 ? `${Math.round(n / 1000)}k ft` : `${Math.round(n)} ft`;
  }
  function kmh(knots) {
    const n = Number(knots);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n * 1.852)} km/h`;
  }
  function heading(h) {
    const n = Number(h);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n)}°`;
  }

  function renderFlightsList(from, to, flights) {
  els.flightsList.innerHTML = "";

  if (!flights.length) {
    els.flightsList.innerHTML = `
      <div class="lt-flightCard">
        <div style="color:#8a99b3; font-weight:800;">No live flights found</div>
        <div style="color:#8a99b3; margin-top:6px; font-size:0.9rem;">
          No aircraft currently flying <strong>${from} → ${to}</strong>.
        </div>
      </div>
    `;
    // clear selection on globe
    if (window.Globe3D?.setSelectedFlight) window.Globe3D.setSelectedFlight(null);
    const box = document.getElementById("selectedFlightBox");
    if (box) box.style.display = "none";
    return;
  }

  // default selection: first flight
  const defaultId = flights[0]?.id || null;
  if (window.Globe3D?.setFlights) window.Globe3D.setFlights(flights);
  if (window.Globe3D?.setSelectedFlight) window.Globe3D.setSelectedFlight(defaultId);

  const selectedBox = document.getElementById("selectedFlightBox");
  const selectedText = document.getElementById("selectedFlightText");
  if (selectedBox && selectedText) {
    selectedBox.style.display = "block";
    selectedText.textContent = flights[0]?.number || flights[0]?.id || "—";
  }

  flights.forEach((f, idx) => {
    const num = f.number || f.id || "—";
    const airline = f.airline || "N/A";
    const alt = feetFromAltitude(f.altitude);
    const spd = mphFromKnots(f.speed);
    const hdg = (f.heading != null && !Number.isNaN(Number(f.heading))) ? `${Math.round(f.heading)}°` : "—";

    const card = document.createElement("div");
    card.className = "lt-flightCard" + (idx === 0 ? " is-selected" : "");
    card.dataset.flightId = f.id;

    card.innerHTML = `
      <div class="lt-flightTop">
        <div class="lt-flightNum">${num}</div>
        <div class="lt-badge">${airline}</div>
      </div>
      <div class="lt-flightRoute">${f.origin || from} → ${f.destination || to}</div>
      <div class="lt-metrics">
        <div><span>Altitude</span><strong>${alt}</strong></div>
        <div><span>Speed</span><strong>${spd}</strong></div>
        <div><span>Heading</span><strong>${hdg}</strong></div>
      </div>
    `;

    card.addEventListener("click", () => {
      // UI highlight
      els.flightsList.querySelectorAll(".lt-flightCard").forEach((x) => x.classList.remove("is-selected"));
      card.classList.add("is-selected");

      // Update selected flight label
      if (selectedBox && selectedText) {
        selectedBox.style.display = "block";
        selectedText.textContent = num;
      }

      // Tell globe to focus on this one
      if (window.Globe3D?.setSelectedFlight) window.Globe3D.setSelectedFlight(f.id);
    });

    els.flightsList.appendChild(card);
  });
}

  // ----------------------------
  // API
  // ----------------------------
  async function fetchFlightsByRoute(from, to) {
    const url = `/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Live API returned non-JSON (check /api/live/route deployment).");
    }

    if (!res.ok || !data || data.success === false) {
      throw new Error(data?.error || `Live route error (HTTP ${res.status})`);
    }

    return Array.isArray(data.flights) ? data.flights : [];
  }

  // ----------------------------
  // Search Flow
  // ----------------------------
  async function runSearch({ scrollIntoView = true } = {}) {
    clearError();

    const from = normIata(els.from.value);
    const to = normIata(els.to.value);
    const flightNumber = normIata(els.flightNumber.value).replace(/\s+/g, "");

    if (!isIata(from) || !isIata(to)) {
      showError("Please enter valid 3-letter IATA codes (e.g., JFK, LHR). Use the dropdown suggestions.");
      return;
    }
    if (from === to) {
      showError("Origin and destination cannot be the same.");
      return;
    }

    els.pillRoute.textContent = `${from} → ${to}`;
    els.pillCount.textContent = "Searching…";
    els.pillUpdated.textContent = `Updated ${niceTime()}`;
    els.globeSub.textContent = `Showing live aircraft for ${from} → ${to}. Drag to rotate.`;
    els.globeStatus.textContent = "Loading";

    if (scrollIntoView) {
      els.trackerSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setLoading(true);

    try {
      let flights = await fetchFlightsByRoute(from, to);

      if (flightNumber) {
        flights = flights.filter((f) =>
          String(f.number || "")
            .toUpperCase()
            .replace(/\s+/g, "")
            .includes(flightNumber)
        );
      }

      els.pillCount.textContent = `${flights.length} flight${flights.length === 1 ? "" : "s"}`;
      els.pillUpdated.textContent = `Updated ${niceTime()}`;
      els.globeStatus.textContent = flights.length ? "Live" : "No flights";

      renderFlightsList(from, to, flights);
      plotFlights(flights); // <<< THIS is what actually draws dots & labels
    } catch (err) {
      console.error(err);
      els.pillCount.textContent = "Search failed";
      els.globeStatus.textContent = "Error";
      showError(err.message || "Search failed");
      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#ffd2cf; font-weight:900;">Search failed</div>
          <div style="color:#8a99b3; margin-top:6px;">${String(err.message || "").replace(/</g, "&lt;")}</div>
        </div>`;
      if (window.AwardGlobe) window.AwardGlobe.clear();
    } finally {
      setLoading(false);
    }
  }

  // Buttons
  els.btnTrack.addEventListener("click", () => runSearch({ scrollIntoView: true }));

  els.btnModify.addEventListener("click", () => {
    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 250);
  });

  els.btnNew.addEventListener("click", () => {
    els.from.value = "JFK";
    els.to.value = "LHR";
    els.flightNumber.value = "";
    clearError();
    els.flightsList.innerHTML = "";
    els.pillRoute.textContent = "—";
    els.pillCount.textContent = "0 flights";
    els.pillUpdated.textContent = "Not searched";
    els.globeStatus.textContent = "Idle";
    els.globeSub.textContent = "Search a route to plot flights. Drag to rotate.";
    if (window.AwardGlobe) window.AwardGlobe.clear();
    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 250);
  });

  // Enter key triggers search
  [els.from, els.to, els.flightNumber].forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch({ scrollIntoView: true });
      }
    });
  });

  // Keep iata inputs clean
  [els.from, els.to].forEach((inp) => {
    inp.addEventListener("input", () => {
      inp.value = normIata(inp.value).replace(/[^A-Z]/g, "").slice(0, 3);
    });
  });

  // Init
  window.addEventListener("DOMContentLoaded", () => {
    initGlobe();

    // Attach autocomplete (requires AIRPORT_DATA_GUIDE.js to be loaded)
    attachAirportAutocomplete(els.from, "airports_from_list");
    attachAirportAutocomplete(els.to, "airports_to_list");
  });
})();
