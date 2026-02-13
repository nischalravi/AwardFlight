/* public/live-tracker-client.js
   Fixes:
   - Uses globe-3d.js (globeSetFlights/globeClear) instead of duplicating Globe init (prevents mis-centering + blank canvas)
   - Fixes resize bug (your old code passed arrays to width/height)
   - Properly plots flights + shows status + updates pills
   - Adds optional Flight Number filter (already in your HTML)
   - Auto-populates IATA from URL params (?from=JFK&to=LHR&flight=BA178) if present
   - Stronger API response checks + better error surface
   Requirements:
   - live-tracker.html has IDs: from, to, flightNumber, btnTrack, btnModify, btnNew, formError,
     flightsList, pillRoute, pillCount, pillUpdated, trackerSection, formCard, globeStatus, globeHint
   - public/globe-3d.js loaded AFTER globe.gl and AFTER this file (or at least after trackFlightsByRoute exists)
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
    pillRoute: $("pillRoute"),
    pillCount: $("pillCount"),
    pillUpdated: $("pillUpdated"),
    trackerSection: $("trackerSection"),
    formCard: $("formCard"),
    globeStatus: $("globeStatus"),
    globeHint: $("globeHint"),
  };

  // -----------------------
  // Helpers
  // -----------------------
  const normIata = (v) => String(v || "").trim().toUpperCase();
  const isIata = (v) => /^[A-Z]{3}$/.test(normIata(v));
  const normFlight = (v) =>
    String(v || "").trim().toUpperCase().replace(/\s+/g, "");

  function niceTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function setPills({ route = "—", countText = "0 flights", updated = "Not searched" } = {}) {
    if (els.pillRoute) els.pillRoute.textContent = route;
    if (els.pillCount) els.pillCount.textContent = countText;
    if (els.pillUpdated) els.pillUpdated.textContent = updated;
  }

  function showError(msg) {
    if (!els.formError) return;
    els.formError.style.display = "block";
    els.formError.textContent = msg;
  }

  function clearError() {
    if (!els.formError) return;
    els.formError.style.display = "none";
    els.formError.textContent = "";
  }

  function setLoading(loading) {
    if (!els.btnTrack) return;
    els.btnTrack.disabled = !!loading;
    els.btnTrack.textContent = loading ? "🔄 Searching..." : "🔍 Track Live Flights";

    if (els.globeStatus) els.globeStatus.textContent = loading ? "Loading…" : "Idle";
    if (els.globeHint && loading) els.globeHint.textContent = "Fetching flights…";
  }

  function feetLabel(alt) {
    if (alt == null || Number.isNaN(Number(alt))) return "—";
    const n = Number(alt);
    return n >= 1000 ? `${Math.round(n / 1000)}k ft` : `${Math.round(n)} ft`;
  }

  function kmhLabelFromKnots(kn) {
    if (kn == null || Number.isNaN(Number(kn))) return "—";
    return `${Math.round(Number(kn) * 1.852)} km/h`;
  }

  function hdgLabel(h) {
    if (h == null || Number.isNaN(Number(h))) return "—";
    return `${Math.round(Number(h))}°`;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[c]));
  }

  // -----------------------
  // Rendering
  // -----------------------
  function renderFlightsList(from, to, flights) {
    if (!els.flightsList) return;
    els.flightsList.innerHTML = "";

    if (!flights || !flights.length) {
      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#8a99b3; font-weight:800;">No live flights found</div>
          <div style="color:#8a99b3; margin-top:6px; font-size:0.95rem;">
            No aircraft currently flying <strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong>.
          </div>
        </div>
      `;
      return;
    }

    flights.forEach((f) => {
      const num = f.number || f.id || "—";
      const airline = f.airline || "N/A";

      const card = document.createElement("div");
      card.className = "lt-flightCard";
      card.innerHTML = `
        <div class="lt-flightTop">
          <div class="lt-flightNum">${escapeHtml(num)}</div>
          <div class="lt-badge">${escapeHtml(airline)}</div>
        </div>
        <div class="lt-flightRoute">${escapeHtml(f.origin || from)} → ${escapeHtml(f.destination || to)}</div>
        <div class="lt-metrics">
          <div><span>Altitude</span><strong>${feetLabel(f.altitude)}</strong></div>
          <div><span>Speed</span><strong>${kmhLabelFromKnots(f.speed)}</strong></div>
          <div><span>Heading</span><strong>${hdgLabel(f.heading)}</strong></div>
        </div>
      `;

      // Optional: click selects on globe (if globe-3d.js exposes selection handler)
      card.addEventListener("click", () => {
        if (typeof window.onGlobeSelectFlight === "function") window.onGlobeSelectFlight(f);
      });

      els.flightsList.appendChild(card);
    });
  }

  function renderErrorCard(message) {
    if (!els.flightsList) return;
    els.flightsList.innerHTML = `
      <div class="lt-flightCard">
        <div style="color:#ffd2cf; font-weight:900;">Search failed</div>
        <div style="color:#8a99b3; margin-top:6px;">${escapeHtml(message)}</div>
      </div>
    `;
  }

  // -----------------------
  // API call (uses trackFlightsByRoute from globe-3d.js or your helper)
  // -----------------------
  async function getFlights(from, to) {
    // Prefer the helper if present
    if (typeof window.trackFlightsByRoute === "function") {
      const r = await window.trackFlightsByRoute(from, to);
      if (!r || !r.success) {
        const msg = r?.error || "Live route request failed";
        throw new Error(msg);
      }
      return Array.isArray(r.flights) ? r.flights : [];
    }

    // Fallback (shouldn’t happen if your setup is correct)
    const url = `/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!ct.includes("application/json")) {
      throw new Error(`API returned non-JSON (HTTP ${res.status}). Is /api/live/route deployed?`);
    }

    const data = JSON.parse(text);
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

    const from = normIata(els.from?.value);
    const to = normIata(els.to?.value);
    const flightFilter = normFlight(els.flightNumber?.value);

    if (!isIata(from) || !isIata(to)) {
      showError("Please enter valid 3-letter IATA codes (e.g., JFK, LHR).");
      return;
    }
    if (from === to) {
      showError("Origin and destination cannot be the same.");
      return;
    }

    setPills({
      route: `${from} → ${to}`,
      countText: "Searching…",
      updated: `Updated ${niceTime()}`,
    });

    if (els.globeStatus) els.globeStatus.textContent = "Loading…";
    if (els.globeHint) els.globeHint.textContent = `Fetching flights for ${from} → ${to}…`;

    if (scrollIntoView && els.trackerSection) {
      els.trackerSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setLoading(true);

    try {
      let flights = await getFlights(from, to);

      // Optional flight number filter (loose)
      if (flightFilter) {
        flights = flights.filter((f) => {
          const n = normFlight(f.number);
          return n.includes(flightFilter) || n.endsWith(flightFilter);
        });
      }

      setPills({
        route: `${from} → ${to}`,
        countText: `${flights.length} flight${flights.length === 1 ? "" : "s"}`,
        updated: `Updated ${niceTime()}`,
      });

      renderFlightsList(from, to, flights);

      // Plot on globe via globe-3d.js (single source of truth)
      if (typeof window.globeSetFlights === "function") {
        await window.globeSetFlights({ from, to, flightNumber: flightFilter });
      } else {
        // If globe-3d.js isn't loaded, at least don't crash
        if (els.globeStatus) els.globeStatus.textContent = flights.length ? "Live" : "No flights";
        if (els.globeHint) els.globeHint.textContent = "Globe not available (globe-3d.js missing).";
      }

      if (els.globeStatus) els.globeStatus.textContent = flights.length ? "Live" : "No flights";
    } catch (err) {
      console.error(err);
      setPills({
        route: `${from} → ${to}`,
        countText: "Search failed",
        updated: `Updated ${niceTime()}`,
      });

      if (els.globeStatus) els.globeStatus.textContent = "Error";
      if (els.globeHint) els.globeHint.textContent = "Couldn’t load live flights.";
      showError(err.message || "Search failed");
      renderErrorCard(err.message || "Search failed");

      if (typeof window.globeClear === "function") window.globeClear();
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // Controls
  // -----------------------
  function bindUI() {
    if (els.btnTrack) els.btnTrack.addEventListener("click", () => runSearch({ scrollIntoView: true }));

    if (els.btnModify) {
      els.btnModify.addEventListener("click", () => {
        if (!els.formCard) return;
        els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => els.from?.focus(), 250);
      });
    }

    if (els.btnNew) {
      els.btnNew.addEventListener("click", () => {
        if (els.from) els.from.value = "JFK";
        if (els.to) els.to.value = "LHR";
        if (els.flightNumber) els.flightNumber.value = "";
        clearError();

        if (els.flightsList) els.flightsList.innerHTML = "";
        setPills({ route: "—", countText: "0 flights", updated: "Not searched" });

        if (els.globeStatus) els.globeStatus.textContent = "Idle";
        if (els.globeHint) els.globeHint.textContent = "Search a route to plot flights. Drag to rotate.";

        if (typeof window.globeClear === "function") window.globeClear();

        if (els.formCard) els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => els.from?.focus(), 250);
      });
    }

    // Enter triggers search
    [els.from, els.to, els.flightNumber].filter(Boolean).forEach((inp) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          runSearch({ scrollIntoView: true });
        }
      });
    });

    // Force IATA formatting
    [els.from, els.to].filter(Boolean).forEach((inp) => {
      inp.addEventListener("input", () => {
        inp.value = normIata(inp.value).replace(/[^A-Z]/g, "").slice(0, 3);
      });
    });

    // Flight number formatting (lenient)
    if (els.flightNumber) {
      els.flightNumber.addEventListener("input", () => {
        els.flightNumber.value = normFlight(els.flightNumber.value).slice(0, 10);
      });
    }
  }

  function applyQueryParams() {
    const p = new URLSearchParams(window.location.search);
    const qFrom = normIata(p.get("from"));
    const qTo = normIata(p.get("to"));
    const qFlight = normFlight(p.get("flight"));

    if (qFrom && els.from) els.from.value = isIata(qFrom) ? qFrom : els.from.value;
    if (qTo && els.to) els.to.value = isIata(qTo) ? qTo : els.to.value;
    if (qFlight && els.flightNumber) els.flightNumber.value = qFlight;

    // Auto-search if both are present
    if (isIata(qFrom) && isIata(qTo)) {
      setTimeout(() => runSearch({ scrollIntoView: false }), 120);
    }
  }

  // -----------------------
  // Boot
  // -----------------------
  window.addEventListener("DOMContentLoaded", () => {
    bindUI();
    applyQueryParams();

    // Safe defaults
    if (els.from && !els.from.value) els.from.value = "JFK";
    if (els.to && !els.to.value) els.to.value = "LHR";

    if (els.globeStatus && !els.globeStatus.textContent) els.globeStatus.textContent = "Idle";
    if (els.globeHint && !els.globeHint.textContent) {
      els.globeHint.textContent = "Search a route to plot flights. Drag to rotate.";
    }

    // If globe script is loaded, ensure it initializes
    if (typeof window.globeSetFlights === "function") {
      // no-op; globe-3d.js auto-inits on DOMContentLoaded too
    }
  });
})();
