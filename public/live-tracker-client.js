// public/live-tracker-client.js
// - Airport autocomplete from window.AIRPORTS_DB (robust even if DB loads later)
// - Route search -> list flights -> click selects -> globe follows
// - Weather for selected aircraft position (Open-Meteo)
// - Weather pills rendered via Globe3D.setWeather when available

(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    from: $("from"),
    to: $("to"),
    fromSuggest: $("fromSuggest"),
    toSuggest: $("toSuggest"),
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
    weatherRow: $("weatherRow"), // fallback renderer only
  };

  // -------------------------
  // Utilities
  // -------------------------
  const norm = (s) => String(s || "").trim();
  const normUpper = (s) => norm(s).toUpperCase();
  const normText = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  // -------------------------
  // Airport DB helpers (robust)
  // -------------------------
  function getDB() {
    return Array.isArray(window.AIRPORTS_DB) ? window.AIRPORTS_DB : [];
  }

  function airportToDisplay(a) {
    const code = normUpper(a.code || a.iata || a.IATA);
    const city = a.city || "";
    const country = a.country || "";
    const airport = a.airport || a.name || "";
    return {
      code,
      title: `${city}${country ? ", " + country : ""}`.trim() || code,
      sub: airport ? `${airport} (${code})` : code,
    };
  }

  function scoreAirport(a, q) {
    const code = normUpper(a.code || a.iata || a.IATA);
    if (!code || code.length !== 3) return -1;

    const city = normText(a.city);
    const airport = normText(a.airport || a.name);
    const country = normText(a.country);

    const qq = normText(q);
    if (!qq) return -1;

    let score = 0;
    if (code.toLowerCase().startsWith(qq)) score += 200;
    if (city.startsWith(qq)) score += 150;
    if (airport.startsWith(qq)) score += 120;
    if (country.startsWith(qq)) score += 40;

    const hay = `${code.toLowerCase()} ${city} ${airport} ${country}`;
    if (hay.includes(qq)) score += 25;

    // bias short prefixes towards city
    if (qq.length <= 2 && city.startsWith(qq)) score += 50;

    return score;
  }

  function findBestIata(query) {
    const db = getDB();
    const q = norm(query);
    if (!q) return null;

    const direct = normUpper(q);
    if (/^[A-Z]{3}$/.test(direct)) return direct;

    let best = null;
    let bestScore = -1;
    for (const a of db) {
      const s = scoreAirport(a, q);
      if (s > bestScore) {
        bestScore = s;
        best = a;
      }
    }
    if (!best || bestScore < 60) return null;
    return normUpper(best.code || best.iata || best.IATA);
  }

  // -------------------------
  // Custom autocomplete UI
  // -------------------------
  function hideSuggest(boxEl) {
    if (!boxEl) return;
    boxEl.style.display = "none";
    boxEl.innerHTML = "";
  }

  function renderSuggest(boxEl, inputEl, matches) {
    if (!matches.length) {
      hideSuggest(boxEl);
      return;
    }

    boxEl.innerHTML = matches
      .map((m) => {
        const d = airportToDisplay(m);
        return `
          <div class="lt-suggestItem" data-code="${d.code}">
            <div class="lt-suggestCode">${d.code}</div>
            <div>
              <div class="lt-suggestMain">${escapeHtml(d.title)}</div>
              <div class="lt-suggestSub">${escapeHtml(d.sub)}</div>
            </div>
          </div>
        `;
      })
      .join("");

    boxEl.style.display = "block";

    boxEl.querySelectorAll(".lt-suggestItem").forEach((row) => {
      row.addEventListener("mousedown", (e) => {
        // mousedown so it works before blur fires
        e.preventDefault();
        const code = row.getAttribute("data-code");
        if (code) {
          inputEl.value = code;
          inputEl.dataset.iata = code;
        }
        hideSuggest(boxEl);
      });
    });
  }

  function computeMatches(q) {
    const db = getDB();
    if (!db.length) return [];

    const scored = db
      .map((a) => ({ a, s: scoreAirport(a, q) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, 8)
      .map((x) => x.a);

    return scored;
  }

  function attachAutocomplete(inputEl, boxEl) {
    if (!inputEl || !boxEl) return;

    // input handler always uses live DB (so it works even if DB loads later)
    inputEl.addEventListener("input", () => {
      const q = norm(inputEl.value);
      inputEl.dataset.iata = "";

      if (!q || q.length < 2) {
        hideSuggest(boxEl);
        return;
      }

      const matches = computeMatches(q);
      renderSuggest(boxEl, inputEl, matches);
    });

    inputEl.addEventListener("focus", () => {
      const q = norm(inputEl.value);
      if (q.length >= 2) {
        const matches = computeMatches(q);
        renderSuggest(boxEl, inputEl, matches);
      }
    });

    inputEl.addEventListener("blur", () => {
      // delay so suggestion mousedown can run first
      setTimeout(() => hideSuggest(boxEl), 140);

      // If they typed and didn't click, resolve best match
      const resolved = findBestIata(inputEl.value);
      if (resolved) {
        inputEl.value = resolved;
        inputEl.dataset.iata = resolved;
      }
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideSuggest(boxEl);
      }
    });
  }

  // Close dropdowns when clicking elsewhere
  document.addEventListener("mousedown", (e) => {
    const t = e.target;
    const insideFrom = els.fromSuggest?.contains(t) || els.from?.contains(t);
    const insideTo = els.toSuggest?.contains(t) || els.to?.contains(t);
    if (!insideFrom) hideSuggest(els.fromSuggest);
    if (!insideTo) hideSuggest(els.toSuggest);
  });

  // -------------------------
  // Weather (Open-Meteo)
  // -------------------------
  const WEATHER_CODE = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Drizzle",
    53: "Drizzle",
    55: "Drizzle",
    61: "Rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
  };

  async function fetchWeather(lat, lng) {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Weather fetch failed");

    const data = await res.json();
    const cur = data && data.current ? data.current : null;
    if (!cur) return null;

    return {
      tempC: cur.temperature_2m,
      windKmh: cur.wind_speed_10m,
      windDir: cur.wind_direction_10m,
      code: cur.weather_code,
      label: WEATHER_CODE[cur.weather_code] || "Weather",
    };
  }

  // Prefer Globe3D.setWeather (globe-3d.js), fallback to #weatherRow if needed.
  function renderWeather(w) {
    if (!w) {
      if (window.Globe3D?.setWeather) window.Globe3D.setWeather([]);
      if (els.weatherRow) {
        els.weatherRow.style.display = "none";
        els.weatherRow.innerHTML = "";
      }
      return;
    }

    const pills = [
      { icon: "🌦️", label: "", temp: w.label, wind: "" },
      { icon: "🌡️", label: "", temp: `${Math.round(w.tempC)}°C`, wind: "" },
      { icon: "💨", label: "", temp: `${Math.round(w.windKmh)} km/h`, wind: "" },
      { icon: "🧭", label: "", temp: `${Math.round(w.windDir)}°`, wind: "" },
    ];

    if (window.Globe3D?.setWeather) {
      // we’ll pass each pill as {icon,label,temp,wind} which globe-3d turns into text
      window.Globe3D.setWeather(pills);
      return;
    }

    // fallback
    if (!els.weatherRow) return;
    els.weatherRow.style.display = "flex";
    els.weatherRow.innerHTML = `
      <div class="lt-weatherPill">🌦️ ${escapeHtml(w.label)}</div>
      <div class="lt-weatherPill">🌡️ ${Math.round(w.tempC)}°C</div>
      <div class="lt-weatherPill">💨 ${Math.round(w.windKmh)} km/h</div>
      <div class="lt-weatherPill">🧭 ${Math.round(w.windDir)}°</div>
    `;
  }

  let weatherAbort = null;
  async function updateWeatherForSelected() {
    try {
      const sel = window.Globe3D?.getSelectedFlight?.();
      if (!sel || sel.latitude == null || sel.longitude == null) {
        renderWeather(null);
        return;
      }

      // abort previous
      if (weatherAbort) weatherAbort.aborted = true;
      const token = { aborted: false };
      weatherAbort = token;

      const w = await fetchWeather(sel.latitude, sel.longitude);
      if (token.aborted) return;

      renderWeather(w);
    } catch (_) {
      renderWeather(null);
    }
  }

  // -------------------------
  // Render flight list
  // -------------------------
  function feetFromAltitude(alt) {
    const n = Number(alt);
    if (!Number.isFinite(n)) return "—";
    return n >= 1000 ? `${Math.round(n / 1000)}k ft` : `${Math.round(n)} ft`;
  }
  function kmhFromKnots(knots) {
    const n = Number(knots);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n * 1.852)} km/h`;
  }

  function renderFlightsList(from, to, flights) {
    els.flightsList.innerHTML = "";

    if (!flights.length) {
      els.flightsList.innerHTML = `
        <div class="lt-flightCard">
          <div style="color:#8a99b3; font-weight:800;">No live flights found</div>
          <div style="color:#8a99b3; margin-top:6px; font-size:0.9rem;">
            No aircraft currently flying <strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong>.
          </div>
        </div>
      `;
      renderWeather(null);
      window.Globe3D?.setFlights?.([]);
      window.Globe3D?.setSelectedFlight?.(null);
      return;
    }

    // push into globe
    window.Globe3D?.setFlights?.(flights);
    window.Globe3D?.setSelectedFlight?.(flights[0].id);
    updateWeatherForSelected();

    flights.forEach((f, idx) => {
      const num = f.number || f.id || "—";
      const airline = f.airline || "—";
      const alt = feetFromAltitude(f.altitude);
      const spd = kmhFromKnots(f.speed);
      const hdg = Number.isFinite(Number(f.heading)) ? `${Math.round(f.heading)}°` : "—";

      const card = document.createElement("div");
      card.className = "lt-flightCard" + (idx === 0 ? " is-selected" : "");
      card.dataset.flightId = f.id;

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

      card.addEventListener("click", () => {
        els.flightsList
          .querySelectorAll(".lt-flightCard")
          .forEach((x) => x.classList.remove("is-selected"));
        card.classList.add("is-selected");

        window.Globe3D?.setSelectedFlight?.(f.id);
        updateWeatherForSelected();
      });

      els.flightsList.appendChild(card);
    });
  }

  // -------------------------
  // API
  // -------------------------
  async function fetchFlightsByRoute(from, to) {
    const url = `/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      throw new Error(data?.error || `Live route error (HTTP ${res.status})`);
    }
    return Array.isArray(data.flights) ? data.flights : [];
  }

  // -------------------------
  // Search Flow
  // -------------------------
  async function runSearch({ scrollIntoView = true } = {}) {
    clearError();

    const fromRaw = norm(els.from.value);
    const toRaw = norm(els.to.value);

    const from = findBestIata(fromRaw) || normUpper(fromRaw);
    const to = findBestIata(toRaw) || normUpper(toRaw);

    const flightNumber = normUpper(els.flightNumber.value).replace(/\s+/g, "");

    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
      showError("Please select valid airports (type a city or IATA code and pick a suggestion).");
      return;
    }
    if (from === to) {
      showError("Origin and destination cannot be the same.");
      return;
    }

    els.from.value = from;
    els.to.value = to;

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
          String(f.number || "").toUpperCase().replace(/\s+/g, "").includes(flightNumber)
        );
      }

      els.pillCount.textContent = `${flights.length} flight${flights.length === 1 ? "" : "s"}`;
      els.pillUpdated.textContent = `Updated ${niceTime()}`;
      els.globeStatus.textContent = flights.length ? "Live" : "No flights";

      renderFlightsList(from, to, flights);
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

      renderWeather(null);
      window.Globe3D?.setFlights?.([]);
      window.Globe3D?.setSelectedFlight?.(null);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // Buttons / Events
  // -------------------------
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
    renderWeather(null);

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
    attachAutocomplete(els.from, els.fromSuggest);
    attachAutocomplete(els.to, els.toSuggest);
  });
})();
