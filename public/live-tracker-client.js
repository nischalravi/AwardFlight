/* public/live-tracker-client.js
   - Airport autocomplete via <datalist id="airportOptions">
   - Allows searching by city/airport name, extracts IATA on submit
   - Uses AwardGlobe (public/globe-3d.js) for 3D rendering
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
    globeStatus: $("globeStatus"),
    globeSub: $("globeSub"),
    pillRoute: $("pillRoute"),
    pillCount: $("pillCount"),
    pillUpdated: $("pillUpdated"),
    trackerSection: $("trackerSection"),
    formCard: $("formCard"),
    airportOptions: $("airportOptions"),
  };

  // -----------------------
  // Helpers
  // -----------------------
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
    els.globeStatus.textContent = loading ? "Loading" : els.globeStatus.textContent;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  // Accept values like:
  // - "BOS"
  // - "BOS - Boston Logan International Airport (United States)"
  // - "Boston (BOS)"
  function extractIata(value) {
    const v = String(value || "").trim().toUpperCase();
    if (!v) return "";
    // exact 3-letter
    if (/^[A-Z]{3}$/.test(v)) return v;
    // find first IATA-like code
    const m = v.match(/\b([A-Z]{3})\b/);
    return m ? m[1] : "";
  }

  function normFlightNumber(v) {
    return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function feetFromAltitude(alt) {
    if (alt == null || Number.isNaN(Number(alt))) return "—";
    const n = Number(alt);
    return n >= 1000 ? `${Math.round(n / 1000)}k ft` : `${Math.round(n)} ft`;
  }

  function kmhFromKnots(knots) {
    if (knots == null || Number.isNaN(Number(knots))) return "—";
    return `${Math.round(Number(knots) * 1.852)} km/h`;
  }

  // -----------------------
  // Airport dataset -> datalist
  // -----------------------
  function pickAirportDataset() {
    // Support multiple possible globals
    // You have AIRPORT_DATA_GUIDE.js in /public — it likely defines one of these.
    return (
      window.AIRPORTS ||
      window.AIRPORT_DATA ||
      window.AIRPORT_DATA_GUIDE ||
      window.AIRPORT_GUIDE ||
      null
    );
  }

  function normalizeAirportItem(a) {
    if (!a) return null;
    // Allow a bunch of shapes
    const iata =
      (a.iata || a.IATA || a.code || a.Code || a.iata_code || a.iataCode || "").toString().trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(iata)) return null;

    const city = (a.city || a.municipality || a.town || "").toString().trim();
    const name = (a.name || a.airport || a.airport_name || "").toString().trim();
    const country = (a.country || a.iso_country || a.countryName || "").toString().trim();

    const primary = city || name || "";
    const secondary = country ? `, ${country}` : "";
    const label = primary ? `${primary}${secondary}` : (country || "");

    return { iata, label, name, city, country };
  }

  function buildAirportDatalist() {
    if (!els.airportOptions) return;

    const raw = pickAirportDataset();
    if (!raw) {
      // Not fatal: user can still enter IATA manually
      console.warn("No airport dataset found on window.* (AIRPORTS / AIRPORT_DATA_GUIDE etc).");
      return;
    }

    const list = Array.isArray(raw) ? raw : (raw.airports || raw.data || []);
    if (!Array.isArray(list) || !list.length) {
      console.warn("Airport dataset found but is empty/unknown shape.");
      return;
    }

    // Build options
    els.airportOptions.innerHTML = "";
    const frag = document.createDocumentFragment();

    // Limit for performance
    const MAX = 8000;
    let count = 0;

    for (const item of list) {
      const a = normalizeAirportItem(item);
      if (!a) continue;

      const opt = document.createElement("option");
      // Put IATA in value (best compatibility) and show name in label-like text
      // Many browsers show only value; so we embed name in value too:
      opt.value = `${a.iata} - ${a.label || a.name || a.city || ""}`.trim();

      frag.appendChild(opt);
      count++;
      if (count >= MAX) break;
    }

    els.airportOptions.appendChild(frag);
  }

  // On blur/change: if they selected "BOS - ..." convert input to "BOS"
  function attachAirportInputBehavior(inputEl) {
    if (!inputEl) return;

    inputEl.addEventListener("change", () => {
      const code = extractIata(inputEl.value);
      if (code) inputEl.value = code;
    });

    inputEl.addEventListener("blur", () => {
      const code = extractIata(inputEl.value);
      if (code) inputEl.value = code;
    });
  }

  // -----------------------
  // Render list
  // -----------------------
  function renderFlightsList(from, to, flights) {
    els.flightsList.innerHTML = "";

    if (!flights.length) {
      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#8a99b3; font-weight:800;">No live flights found</div>
          <div style="color:#8a99b3; margin-top:6px; font-size:0.92rem;">
            No aircraft currently flying <strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong>.
          </div>
        </div>
      `;
      return;
    }

    for (const f of flights) {
      const num = f.number || f.id || "—";
      const airline = f.airline || "N/A";
      const alt = feetFromAltitude(f.altitude);
      const spd = kmhFromKnots(f.speed);
      const hdg = (f.heading != null && !Number.isNaN(Number(f.heading))) ? `${Math.round(f.heading)}°` : "—";

      const card = document.createElement("div");
      card.className = "lt-flightCard";
      card.innerHTML = `
        <div class="lt-flightTop">
          <div class="lt-flightNum">${escapeHtml(num)}</div>
          <div class="lt-badge">${escapeHtml(airline)}</div>
        </div>
        <div class="lt-flightRoute">${escapeHtml(f.origin || from)} → ${escapeHtml(f.destination || to)}</div>
        <div class="lt-metrics">
          <div><span>Altitude</span><strong>${escapeHtml(alt)}</strong></div>
          <div><span>Speed</span><strong>${escapeHtml(spd)}</strong></div>
          <div><span>Heading</span><strong>${escapeHtml(hdg)}</strong></div>
        </div>
      `;
      els.flightsList.appendChild(card);
    }
  }

  // -----------------------
  // API call
  // -----------------------
  async function fetchFlightsByRoute(from, to) {
    const url = `/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error(`API returned non-JSON (HTTP ${res.status}). Check /api/live/route deployment.`);
    }

    if (!res.ok || data?.success === false) {
      throw new Error(data?.error || `Live route error (HTTP ${res.status})`);
    }

    return Array.isArray(data.flights) ? data.flights : [];
  }

  // -----------------------
  // Search flow
  // -----------------------
  async function runSearch({ scrollIntoView = true } = {}) {
    clearError();

    const from = extractIata(els.from.value);
    const to = extractIata(els.to.value);
    const flightNumber = normFlightNumber(els.flightNumber.value);

    if (!from || !to) {
      showError("Type an airport (city/name) and select it, or enter a valid 3-letter IATA (e.g., JFK, LHR).");
      return;
    }
    if (from === to) {
      showError("Origin and destination cannot be the same.");
      return;
    }

    els.pillRoute.textContent = `${from} → ${to}`;
    els.pillCount.textContent = `Searching…`;
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
        flights = flights.filter((f) => normFlightNumber(f.number || "").includes(flightNumber));
      }

      els.pillCount.textContent = `${flights.length} flight${flights.length === 1 ? "" : "s"}`;
      els.pillUpdated.textContent = `Updated ${niceTime()}`;
      els.globeStatus.textContent = flights.length ? "Live" : "No flights";

      renderFlightsList(from, to, flights);

      // ✅ Plot on globe (this was missing before if globe-3d.js didn't init)
      if (window.AwardGlobe && typeof window.AwardGlobe.setFlights === "function") {
        window.AwardGlobe.setFlights(flights);
      } else {
        console.warn("AwardGlobe not available. Check that globe-3d.js is loaded after globe.gl.");
      }
    } catch (err) {
      console.error(err);
      els.pillCount.textContent = "Search failed";
      els.globeStatus.textContent = "Error";
      showError(err.message || "Search failed");

      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#ffd2cf; font-weight:900;">Search failed</div>
          <div style="color:#8a99b3; margin-top:6px;">${escapeHtml(err.message || "")}</div>
        </div>
      `;

      if (window.AwardGlobe && typeof window.AwardGlobe.clear === "function") {
        window.AwardGlobe.clear();
      }
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // Buttons
  // -----------------------
  els.btnTrack.addEventListener("click", () => runSearch({ scrollIntoView: true }));

  els.btnModify.addEventListener("click", () => {
    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 200);
  });

  els.btnNew.addEventListener("click", () => {
    els.from.value = "";
    els.to.value = "";
    els.flightNumber.value = "";
    clearError();
    els.flightsList.innerHTML = "";
    els.pillRoute.textContent = "—";
    els.pillCount.textContent = "0 flights";
    els.pillUpdated.textContent = "Not searched";
    els.globeStatus.textContent = "Idle";
    els.globeSub.textContent = "Search a route to plot flights. Drag to rotate.";

    if (window.AwardGlobe && typeof window.AwardGlobe.clear === "function") {
      window.AwardGlobe.clear();
    }

    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 200);
  });

  // Enter triggers search
  [els.from, els.to, els.flightNumber].forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch({ scrollIntoView: true });
      }
    });
  });

  // -----------------------
  // Init on load
  // -----------------------
  window.addEventListener("DOMContentLoaded", () => {
    // init globe early (so it renders immediately)
    try {
      if (window.AwardGlobe && typeof window.AwardGlobe.init === "function") {
        window.AwardGlobe.init("globe");
      }
    } catch (e) {
      console.error(e);
    }

    // build airport suggestions
    buildAirportDatalist();
    attachAirportInputBehavior(els.from);
    attachAirportInputBehavior(els.to);
  });
})();
