/* public/live-tracker-client.js
   - City/airport name OR IATA input with autocomplete
   - Resolves to IATA behind the scenes
   - Calls /api/live/route?from=XXX&to=YYY
   - Renders flights list; click a flight to focus on globe
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
  function isIata(s) {
    return /^[A-Za-z]{3}$/.test(String(s || "").trim());
  }
  function normIata(s) {
    return String(s || "").trim().toUpperCase();
  }

  // ----------------------------
  // Autocomplete UI (custom dropdown)
  // ----------------------------
  function ensureDropdown(inputEl) {
    let dd = inputEl.parentElement.querySelector(".lt-ac");
    if (dd) return dd;

    dd = document.createElement("div");
    dd.className = "lt-ac";
    dd.style.position = "relative";

    const menu = document.createElement("div");
    menu.className = "lt-ac-menu";
    menu.style.position = "absolute";
    menu.style.left = "0";
    menu.style.right = "0";
    menu.style.top = "calc(100% + 8px)";
    menu.style.zIndex = "50";
    menu.style.display = "none";
    menu.style.maxHeight = "320px";
    menu.style.overflow = "auto";
    menu.style.background = "#0a0f1e";
    menu.style.border = "1px solid #2a3644";
    menu.style.borderRadius = "14px";
    menu.style.boxShadow = "0 16px 50px rgba(0,0,0,0.45)";

    // wrap input + menu
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    inputEl.parentElement.insertBefore(wrap, inputEl);
    wrap.appendChild(inputEl);
    wrap.appendChild(menu);

    // store menu reference
    inputEl._acMenu = menu;
    return menu;
  }

  function formatAirport(a) {
    const city = a.city || "";
    const country = a.country || "";
    const airport = a.airport || "";
    const code = a.code || "";
    return {
      code,
      title: `${city}${country ? ", " + country : ""}`,
      sub: `${airport}${airport && code ? " (" + code + ")" : code ? "(" + code + ")" : ""}`
    };
  }

  function bindAirportAutocomplete(inputEl) {
    ensureDropdown(inputEl);

    inputEl.addEventListener("input", () => {
      const q = inputEl.value.trim();
      inputEl.dataset.iata = ""; // clear selection if user edits

      const menu = inputEl._acMenu;
      if (!menu) return;

      const results = (window.searchAirports ? window.searchAirports(q, 8) : []);
      if (!q || q.length < 2 || !results.length) {
        menu.style.display = "none";
        menu.innerHTML = "";
        return;
      }

      menu.innerHTML = results
        .map((a) => {
          const f = formatAirport(a);
          return `
            <button type="button"
              class="lt-ac-item"
              data-code="${f.code}"
              data-label="${(f.title + " — " + f.sub).replace(/"/g, "&quot;")}"
              style="
                width:100%;
                text-align:left;
                padding:12px 12px;
                border:0;
                background:transparent;
                color:#fff;
                cursor:pointer;
                display:flex;
                gap:12px;
                align-items:flex-start;
              ">
              <div style="min-width:46px; color:#c5ff68; font-weight:900;">${f.code}</div>
              <div>
                <div style="font-weight:800; line-height:1.2;">${f.title}</div>
                <div style="color:#8a99b3; font-weight:700; margin-top:3px;">${f.sub}</div>
              </div>
            </button>
          `;
        })
        .join("");

      menu.style.display = "block";

      menu.querySelectorAll(".lt-ac-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const code = btn.getAttribute("data-code");
          inputEl.value = code;          // keep it simple: fill IATA
          inputEl.dataset.iata = code;   // store resolved IATA
          menu.style.display = "none";
          menu.innerHTML = "";
        });
      });
    });

    // close dropdown on outside click
    document.addEventListener("click", (e) => {
      const menu = inputEl._acMenu;
      if (!menu) return;
      if (e.target === inputEl || menu.contains(e.target)) return;
      menu.style.display = "none";
    });
  }

  function resolveToIata(inputEl) {
    const raw = inputEl.value.trim();
    if (!raw) return null;

    // If user typed IATA directly
    if (isIata(raw)) return normIata(raw);

    // If user picked from dropdown earlier
    if (inputEl.dataset.iata && isIata(inputEl.dataset.iata)) return normIata(inputEl.dataset.iata);

    // Try best-effort exact match by city/airport in AIRPORTS_DB
    const db = window.AIRPORTS_DB || [];
    const q = raw.toLowerCase().trim();
    const found = db.find((a) =>
      String(a.city || "").toLowerCase() === q ||
      String(a.airport || "").toLowerCase() === q
    );
    return found ? normIata(found.code) : null;
  }

  // ----------------------------
  // Globe helpers
  // ----------------------------
  function initGlobe() {
    if (window.Globe3D && els.globeEl) {
      window.Globe3D.init(els.globeEl);
      window.Globe3D.clear();
    }
  }
  function plotFlights(flights) {
    if (window.Globe3D) window.Globe3D.setFlights(flights || []);
  }
  function selectFlight(id) {
    if (window.Globe3D) window.Globe3D.setSelectedFlight(id);
  }

  // ----------------------------
  // Render flights list
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
  function hdg(h) {
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
      return;
    }

    // Default: first flight selected
    selectFlight(flights[0].id);

    flights.forEach((f, idx) => {
      const num = f.number || f.id || "—";
      const airline = f.airline || "N/A";
      const card = document.createElement("div");
      card.className = "lt-flightCard" + (idx === 0 ? " is-selected" : "");
      card.style.cursor = "pointer";

      card.innerHTML = `
        <div class="lt-flightTop">
          <div class="lt-flightNum">${num}</div>
          <div class="lt-badge">${airline}</div>
        </div>
        <div class="lt-flightRoute">${(f.origin || from)} → ${(f.destination || to)}</div>
        <div class="lt-metrics">
          <div><span>Altitude</span><strong>${feet(f.altitude)}</strong></div>
          <div><span>Speed</span><strong>${kmh(f.speed)}</strong></div>
          <div><span>Heading</span><strong>${hdg(f.heading)}</strong></div>
        </div>
      `;

      card.addEventListener("click", () => {
        els.flightsList.querySelectorAll(".lt-flightCard").forEach((x) => x.classList.remove("is-selected"));
        card.classList.add("is-selected");
        selectFlight(f.id);
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
  // Search flow
  // ----------------------------
  async function runSearch({ scrollIntoView = true } = {}) {
    clearError();

    const from = resolveToIata(els.from);
    const to = resolveToIata(els.to);
    const flightNumber = normIata(els.flightNumber.value).replace(/\s+/g, "");

    if (!from || !to) {
      showError("Please select valid airports from the dropdown (or type a 3-letter IATA code).");
      return;
    }
    if (from === to) {
      showError("Origin and destination cannot be the same.");
      return;
    }

    els.pillRoute.textContent = `${from} → ${to}`;
    els.pillCount.textContent = "Searching…";
    els.pillUpdated.textContent = `Updated ${niceTime()}`;
    els.globeSub.textContent = `Showing live aircraft for ${from} → ${to}. Click a flight to track it.`;
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

      plotFlights(flights);
      renderFlightsList(from, to, flights);
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
      if (window.Globe3D) window.Globe3D.clear();
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
    els.from.value = "";
    els.to.value = "";
    els.from.dataset.iata = "";
    els.to.dataset.iata = "";
    els.flightNumber.value = "";
    clearError();
    els.flightsList.innerHTML = "";
    els.pillRoute.textContent = "—";
    els.pillCount.textContent = "0 flights";
    els.pillUpdated.textContent = "Not searched";
    els.globeStatus.textContent = "Idle";
    els.globeSub.textContent = "Search a route to plot flights. Drag to rotate.";
    if (window.Globe3D) window.Globe3D.clear();
    els.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.from.focus(), 250);
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

  // Init
  window.addEventListener("DOMContentLoaded", () => {
    initGlobe();
    bindAirportAutocomplete(els.from);
    bindAirportAutocomplete(els.to);
  });
})();
