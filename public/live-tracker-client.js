/* public/live-tracker-client.js
   - Autocomplete (IATA or city/airport) using window.AIRPORTS_DB
   - Route search + optional flight number filter
   - Click a flight card to track it on the globe
   - Uses window.Globe3D from globe-3d.js
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
  };

  const norm = (s) => String(s || "").trim();
  const up = (s) => norm(s).toUpperCase();
  const isIata = (s) => /^[A-Z]{3}$/.test(up(s));
  const niceTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  // -----------------------
  // Airport DB
  // -----------------------
  function getDb() {
    const db = window.AIRPORTS_DB;
    return Array.isArray(db) ? db : [];
  }

  function scoreAirport(a, qRaw) {
    const q = String(qRaw || "").toLowerCase();
    if (!q) return 0;

    const code = String(a.code || "").toUpperCase();
    const city = String(a.city || "").toLowerCase();
    const airport = String(a.airport || "").toLowerCase();
    const country = String(a.country || "").toLowerCase();

    let s = 0;

    // Strong preference to exact/starts-with matches
    if (code.startsWith(q.toUpperCase())) s += 250;
    if (city.startsWith(q)) s += 160;
    if (airport.startsWith(q)) s += 120;

    // Contains matches
    if (city.includes(q)) s += 60;
    if (airport.includes(q)) s += 45;
    if (country.includes(q)) s += 10;

    // Slight bias for common/major airports if present
    if (code === q.toUpperCase()) s += 300;

    return s;
  }

  function resolveToIata(userInput) {
    const raw = norm(userInput);
    if (!raw) return null;

    if (isIata(raw)) return up(raw);

    const db = getDb();
    if (!db.length) return null;

    const best = db
      .map((a) => ({ a, s: scoreAirport(a, raw) }))
      .filter((x) => x.a.code && x.s > 0)
      .sort((x, y) => y.s - x.s)[0];

    return best?.a?.code ? String(best.a.code).toUpperCase() : null;
  }

  // -----------------------
  // Custom dropdown autocomplete
  // -----------------------
  function attachAutocomplete(inputEl) {
    // Wrap input in a positioned container
    const parent = inputEl.parentElement;
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    parent.insertBefore(wrap, inputEl);
    wrap.appendChild(inputEl);

    const dropdown = document.createElement("div");
    dropdown.style.position = "absolute";
    dropdown.style.left = "0";
    dropdown.style.right = "0";
    dropdown.style.top = "calc(100% + 8px)";
    dropdown.style.zIndex = "9999";
    dropdown.style.display = "none";
    dropdown.style.background = "#0a0f1e";
    dropdown.style.border = "1px solid #2a3644";
    dropdown.style.borderRadius = "14px";
    dropdown.style.overflow = "hidden";
    dropdown.style.boxShadow = "0 25px 80px rgba(0,0,0,0.45)";
    wrap.appendChild(dropdown);

    function close() {
      dropdown.style.display = "none";
      dropdown.innerHTML = "";
    }

    function render(matches) {
      dropdown.innerHTML = "";
      if (!matches.length) return close();

      dropdown.style.display = "block";

      matches.forEach(({ a }) => {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "72px 1fr";
        row.style.gap = "12px";
        row.style.padding = "12px";
        row.style.cursor = "pointer";
        row.style.borderBottom = "1px solid rgba(42,54,68,0.7)";

        row.onmouseenter = () => (row.style.background = "rgba(197,255,104,0.06)");
        row.onmouseleave = () => (row.style.background = "transparent");

        const code = document.createElement("div");
        code.textContent = String(a.code || "").toUpperCase();
        code.style.color = "#c5ff68";
        code.style.fontWeight = "900";
        code.style.fontSize = "1rem";

        const meta = document.createElement("div");

        const line1 = document.createElement("div");
        line1.textContent = `${a.city || "—"}${a.country ? `, ${a.country}` : ""}`;
        line1.style.color = "#ffffff";
        line1.style.fontWeight = "800";

        const line2 = document.createElement("div");
        line2.textContent = a.airport ? `${a.airport} (${String(a.code || "").toUpperCase()})` : "";
        line2.style.color = "#8a99b3";
        line2.style.marginTop = "2px";
        line2.style.fontWeight = "700";

        meta.appendChild(line1);
        meta.appendChild(line2);

        row.appendChild(code);
        row.appendChild(meta);

        row.addEventListener("click", () => {
          inputEl.value = String(a.code || "").toUpperCase(); // API expects IATA
          close();
          inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        });

        dropdown.appendChild(row);
      });

      if (dropdown.lastChild) dropdown.lastChild.style.borderBottom = "none";
    }

    inputEl.addEventListener("input", () => {
      const db = getDb();
      const q = norm(inputEl.value);

      // If DB not ready yet, do nothing
      if (!db.length || q.length < 2) return close();

      const matches = db
        .map((a) => ({ a, s: scoreAirport(a, q) }))
        .filter((x) => x.a.code && x.s > 0)
        .sort((x, y) => y.s - x.s)
        .slice(0, 8);

      render(matches);
    });

    inputEl.addEventListener("blur", () => setTimeout(close, 160));
    inputEl.addEventListener("focus", () => {
      if (norm(inputEl.value).length >= 2) inputEl.dispatchEvent(new Event("input"));
    });
  }

  // -----------------------
  // Flights list + selection
  // -----------------------
  const feet = (alt) => {
    const n = Number(alt);
    if (!Number.isFinite(n)) return "—";
    return n >= 1000 ? `${Math.round(n / 1000)}k ft` : `${Math.round(n)} ft`;
  };
  const kmh = (knots) => {
    const n = Number(knots);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n * 1.852)} km/h`;
  };
  const head = (h) => {
    const n = Number(h);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n)}°`;
  };

  function renderFlightsList(fromIata, toIata, flights) {
    els.flightsList.innerHTML = "";

    if (!flights.length) {
      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#8a99b3; font-weight:800;">No live flights found</div>
          <div style="color:#8a99b3; margin-top:6px; font-size:0.9rem;">
            No aircraft currently flying <strong>${fromIata} → ${toIata}</strong>.
          </div>
        </div>
      `;
      window.Globe3D?.setFlights?.([]);
      window.Globe3D?.setSelectedFlight?.(null);
      return;
    }

    window.Globe3D?.setFlights?.(flights);
    window.Globe3D?.setSelectedFlight?.(flights[0]?.id || null);

    flights.forEach((f, idx) => {
      const num = f.number || f.id || "—";
      const airline = f.airline || "—";

      const card = document.createElement("div");
      card.className = "lt-flightCard" + (idx === 0 ? " is-selected" : "");
      card.style.cursor = "pointer";

      card.innerHTML = `
        <div class="lt-flightTop">
          <div class="lt-flightNum">${num}</div>
          <div class="lt-badge">${airline}</div>
        </div>
        <div class="lt-flightRoute">${f.origin || fromIata} → ${f.destination || toIata}</div>
        <div class="lt-metrics">
          <div><span>Altitude</span><strong>${feet(f.altitude)}</strong></div>
          <div><span>Speed</span><strong>${kmh(f.speed)}</strong></div>
          <div><span>Heading</span><strong>${head(f.heading)}</strong></div>
        </div>
      `;

      card.addEventListener("click", () => {
        els.flightsList.querySelectorAll(".lt-flightCard").forEach((x) => x.classList.remove("is-selected"));
        card.classList.add("is-selected");
        window.Globe3D?.setSelectedFlight?.(f.id);
      });

      els.flightsList.appendChild(card);
    });
  }

  // -----------------------
  // API
  // -----------------------
  async function fetchFlightsByRoute(from, to) {
    const url = `/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Live API returned non-JSON.");
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

    const fromIata = resolveToIata(els.from.value);
    const toIata = resolveToIata(els.to.value);
    const flightNumber = up(els.flightNumber.value).replace(/\s+/g, "");

    if (!fromIata || !toIata) {
      showError("Select valid airports (type BOS or Boston, then click a suggestion).");
      return;
    }
    if (fromIata === toIata) {
      showError("Origin and destination cannot be the same.");
      return;
    }

    els.pillRoute.textContent = `${fromIata} → ${toIata}`;
    els.pillCount.textContent = "Searching…";
    els.pillUpdated.textContent = `Updated ${niceTime()}`;
    els.globeSub.textContent = `Showing live aircraft for ${fromIata} → ${toIata}. Click a flight to track it.`;
    els.globeStatus.textContent = "Loading";

    if (scrollIntoView) {
      els.trackerSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setLoading(true);

    try {
      let flights = await fetchFlightsByRoute(fromIata, toIata);

      if (flightNumber) {
        flights = flights.filter((f) =>
          String(f.number || "").toUpperCase().replace(/\s+/g, "").includes(flightNumber)
        );
      }

      els.pillCount.textContent = `${flights.length} flight${flights.length === 1 ? "" : "s"}`;
      els.pillUpdated.textContent = `Updated ${niceTime()}`;
      els.globeStatus.textContent = flights.length ? "Live" : "No flights";

      renderFlightsList(fromIata, toIata, flights);
    } catch (err) {
      console.error(err);
      els.pillCount.textContent = "Search failed";
      els.globeStatus.textContent = "Error";
      showError(err.message || "Search failed");
      window.Globe3D?.setFlights?.([]);
      window.Globe3D?.setSelectedFlight?.(null);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // Events
  // -----------------------
  els.btnTrack.addEventListener("click", () => runSearch({ scrollIntoView: true }));

  els.btnModify.addEventListener("click", () => {
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
    els.globeSub.textContent = "Search a route to plot flights. Click a flight to track it.";
    window.Globe3D?.setFlights?.([]);
    window.Globe3D?.setSelectedFlight?.(null);
    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 250);
  });

  [els.from, els.to, els.flightNumber].forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch({ scrollIntoView: true });
      }
    });
  });

  // Init
window.addEventListener("DOMContentLoaded", () => {
  // Attach now (works if DB already present)
  attachAutocomplete(els.from);
  attachAutocomplete(els.to);

  // If DB loads later, retrigger input so dropdown starts working
  window.addEventListener("airportsdb:ready", () => {
    // Kick the input handler once so results appear immediately
    els.from.dispatchEvent(new Event("input"));
    els.to.dispatchEvent(new Event("input"));
  });

  // If DB already ready, also kick
  if (window.__AIRPORTS_READY__) {
    els.from.dispatchEvent(new Event("input"));
    els.to.dispatchEvent(new Event("input"));
  }
});

})();
