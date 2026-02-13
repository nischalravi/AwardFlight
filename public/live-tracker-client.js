/* public/live-tracker-client.js
   - Fixes UI (no giant empty area)
   - Reliable globe rendering (requires three + globe.gl loaded in HTML)
   - Route search + optional flight-number filter
   - Mobile friendly
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
    globe: $("globe"),
    globeStatus: $("globeStatus"),
    globeSub: $("globeSub"),
    pillRoute: $("pillRoute"),
    pillCount: $("pillCount"),
    pillUpdated: $("pillUpdated"),
    trackerSection: $("trackerSection"),
    formCard: $("formCard"),
  };

  // -----------------------
  // Helpers
  // -----------------------
  function normIata(v) {
    return String(v || "").trim().toUpperCase();
  }
  function isIata(v) {
    return /^[A-Z]{3}$/.test(normIata(v));
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
    els.globeStatus.textContent = loading ? "Loading" : "Live";
  }
  function niceTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function feetFromAltitude(alt) {
    // flightradarapi altitude is usually feet already; if not, still show readable.
    if (alt == null || Number.isNaN(Number(alt))) return "—";
    const n = Number(alt);
    return n >= 1000 ? `${Math.round(n / 1000)}k ft` : `${Math.round(n)} ft`;
  }
  function mphFromKnots(knots) {
    if (knots == null || Number.isNaN(Number(knots))) return "—";
    return `${Math.round(Number(knots) * 1.15078)} mph`;
  }

  // -----------------------
  // Globe init (Globe.gl)
  // -----------------------
  let globeInstance = null;

  function initGlobeOnce() {
    if (globeInstance) return;
    if (!window.Globe) {
      console.warn("Globe.gl not loaded");
      return;
    }

    globeInstance = Globe()(els.globe)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#0a0f1e")
      .pointAltitude(0.02)
      .pointRadius(0.25)
      .pointColor(() => "#c5ff68")
      .pointsData([]); // start empty

    // Make it feel nice on load
    globeInstance.controls().enableDamping = true;
    globeInstance.controls().dampingFactor = 0.08;
    globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

    // Handle resize
    window.addEventListener("resize", () => {
      try {
        globeInstance.width([els.globe.clientWidth]);
        globeInstance.height([els.globe.clientHeight]);
      } catch (_) {}
    });
  }

  function plotFlightsOnGlobe(flights) {
    initGlobeOnce();
    if (!globeInstance) return;

    const pts = flights
      .filter((f) => typeof f.latitude === "number" && typeof f.longitude === "number")
      .map((f) => ({
        lat: f.latitude,
        lng: f.longitude,
        size: 0.35,
        id: f.id,
        number: f.number,
      }));

    globeInstance.pointsData(pts);

    // Auto center a bit if we have at least 1 point
    if (pts.length) {
      const avgLat = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
      const avgLng = pts.reduce((a, p) => a + p.lng, 0) / pts.length;
      globeInstance.pointOfView({ lat: avgLat, lng: avgLng, altitude: 1.8 }, 900);
    }
  }

  // -----------------------
  // Render list
  // -----------------------
  function renderFlightsList(from, to, flights) {
    els.flightsList.innerHTML = "";

    if (!flights.length) {
      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#8a99b3; font-weight:700;">No live flights found</div>
          <div style="color:#8a99b3; margin-top:6px; font-size:0.9rem;">
            No aircraft currently flying <strong>${from} → ${to}</strong>.
          </div>
        </div>
      `;
      return;
    }

    flights.forEach((f) => {
      const num = f.number || f.id || "—";
      const airline = f.airline || "N/A";
      const alt = feetFromAltitude(f.altitude);
      const spd = mphFromKnots(f.speed);
      const hdg = (f.heading != null && !Number.isNaN(Number(f.heading))) ? `${Math.round(f.heading)}°` : "—";

      const card = document.createElement("div");
      card.className = "lt-flightCard";
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
      els.flightsList.appendChild(card);
    });
  }

  // -----------------------
  // API call
  // -----------------------
  async function fetchFlightsByRoute(from, to) {
    const url = `/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });

    // If Vercel returns HTML (404 page), JSON.parse will throw.
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("API returned non-JSON. Check that /api/live/route is deployed on Vercel.");
    }

    if (!res.ok || !data || data.success === false) {
      throw new Error(data?.error || `Live route error (HTTP ${res.status})`);
    }

    return Array.isArray(data.flights) ? data.flights : [];
  }

  // -----------------------
  // Search flow
  // -----------------------
  async function runSearch({ scrollIntoView = true } = {}) {
    clearError();

    const from = normIata(els.from.value);
    const to = normIata(els.to.value);
    const flightNumber = normIata(els.flightNumber.value).replace(/\s+/g, "");

    if (!isIata(from) || !isIata(to)) {
      showError("Please enter valid 3-letter IATA codes (e.g., JFK, LHR).");
      return;
    }
    if (from === to) {
      showError("Origin and destination cannot be the same.");
      return;
    }

    // UI updates
    els.pillRoute.textContent = `${from} → ${to}`;
    els.pillCount.textContent = `Searching…`;
    els.pillUpdated.textContent = `Updated ${niceTime()}`;
    els.globeSub.textContent = `Showing live aircraft for ${from} → ${to}. Drag to rotate.`;

    if (scrollIntoView) {
      // Smoothly bring tracker into view
      els.trackerSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setLoading(true);

    try {
      let flights = await fetchFlightsByRoute(from, to);

      // Optional filter by flight number
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

      renderFlightsList(from, to, flights);
      plotFlightsOnGlobe(flights);

      els.globeStatus.textContent = flights.length ? "Live" : "No flights";
    } catch (err) {
      console.error(err);
      els.pillCount.textContent = `Search failed`;
      els.globeStatus.textContent = "Error";
      showError(err.message || "Search failed");

      // Also show error in results area so user sees it even on mobile
      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#ffd2cf; font-weight:800;">Search failed</div>
          <div style="color:#8a99b3; margin-top:6px;">${(err.message || "").replace(/</g, "&lt;")}</div>
        </div>
      `;
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // Button behaviors
  // -----------------------
  els.btnTrack.addEventListener("click", () => runSearch({ scrollIntoView: true }));

  els.btnModify.addEventListener("click", () => {
    // Bring focus back to form inputs
    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 250);
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
    initGlobeOnce();
    if (globeInstance) globeInstance.pointsData([]);
    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 250);
  });

  // Enter key should trigger search
  [els.from, els.to, els.flightNumber].forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch({ scrollIntoView: true });
      }
    });
  });

  // Make IATA inputs behave nicely
  [els.from, els.to].forEach((inp) => {
    inp.addEventListener("input", () => {
      inp.value = normIata(inp.value).replace(/[^A-Z]/g, "").slice(0, 3);
    });
  });

  // If your airport-loader.js exposes anything, hook it here
  // (This is safe even if airport-loader.js does nothing.)
  window.addEventListener("DOMContentLoaded", () => {
    initGlobeOnce();
    // Optional: auto-load initial sample
    // runSearch({ scrollIntoView: false });
  });
})();
