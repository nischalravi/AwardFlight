/* public/search-client.js
   Search Results page controller
   Calls /api/amadeus/search, renders results with TravelNexus theme
*/
(function () {
  const $ = id => document.getElementById(id);
  const els = {
    summaryPills: $("summaryPills"), results: $("results"),
    errorBox: $("errorBox"), resultsHint: $("resultsHint"),
    btnNewSearch: $("btnNewSearch"), btnModify: $("btnModify"),
    sortBy: $("sortBy"), maxStops: $("maxStops"),
    maxPrice: $("maxPrice"), togglePoints: $("togglePoints"),
    btnResetFilters: $("btnResetFilters"),
  };

  const qs = new URLSearchParams(location.search);
  const state = {
    from: (qs.get("from") || "").trim().toUpperCase(),
    to: (qs.get("to") || "").trim().toUpperCase(),
    date: (qs.get("date") || "").trim(),
    adults: (qs.get("adults") || "1").trim(),
    cabin: (qs.get("cabin") || "ECONOMY").trim(),
    rawFlights: [],
  };

  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const isIata = x => /^[A-Z]{3}$/.test(x||"");
  const isDate = x => /^\d{4}-\d{2}-\d{2}$/.test(x||"");

  function setPills() {
    if (!els.summaryPills) return;
    els.summaryPills.innerHTML = `${esc(state.from)} → ${esc(state.to)} · ${esc(state.date)} · ${esc(state.cabin)} · ${state.adults} pax`;
  }

  function skeleton(n) {
    if (!els.results) return;
    els.results.innerHTML = Array.from({length:n||4}, ()=>`
      <div class="skeleton"><div class="shimmer"></div>
        <div class="sk-line big"></div><div class="sk-line mid"></div><div class="sk-line small"></div>
      </div>`).join("");
  }

  function parseDur(d) {
    const s = String(d||"");
    const h = (s.match(/(\d+)\s*h/i)||[])[1]||0;
    const m = (s.match(/(\d+)\s*m/i)||[])[1]||0;
    return (+h)*60+(+m);
  }

  function norm(f) {
    return { ...f, _price: +f.price||0, _stops: +f.stops>=0?+f.stops:99, _dur: parseDur(f.duration) };
  }

  function filter(list) {
    const ms = els.maxStops?.value; const mp = (els.maxPrice?.value||"").trim();
    let out = list.slice();
    if (ms !== "" && ms != null) out = out.filter(f => f._stops <= +ms);
    if (mp && +mp > 0) out = out.filter(f => f._price <= +mp);
    const sort = els.sortBy?.value||"price_asc";
    out.sort((a,b) => {
      if (sort==="price_asc") return a._price-b._price;
      if (sort==="price_desc") return b._price-a._price;
      if (sort==="stops_asc") return (a._stops-b._stops)||(a._price-b._price);
      if (sort==="duration_asc") return (a._dur-b._dur)||(a._price-b._price);
      return a._price-b._price;
    });
    return out;
  }

  function pointsEst(f) {
    if ((els.togglePoints?.value||"off")!=="on") return "";
    const pts = Math.max(5000, Math.round(f._price/0.014));
    return `<div style="margin-top:8px;"><span class="badge badge-gold">${pts.toLocaleString()} pts (est.)</span></div>`;
  }

  function render() {
    if (!els.results) return;
    const norms = state.rawFlights.map(norm);
    const filtered = filter(norms);
    if (!state.rawFlights.length) {
      els.resultsHint.textContent = "No flights found.";
      els.results.innerHTML = `<div class="card" style="text-align:center;padding:40px;"><p style="color:var(--text-dim);">Try a different date or route.</p></div>`;
      return;
    }
    els.resultsHint.textContent = `${filtered.length} of ${state.rawFlights.length} flights`;
    if (!filtered.length) {
      els.results.innerHTML = `<div class="card" style="text-align:center;padding:40px;"><p style="color:var(--text-dim);">Filters removed all results. Try resetting.</p></div>`;
      return;
    }
    els.results.innerHTML = filtered.map(f => {
      const airline = f.airline||f.airlineCode||"Airline";
      const code = f.code||"";
      const stops = +f.stops===0?"Non-stop":`${f.stops} stop${f.stops>1?'s':''}`;
      const stopInfo = f.stopInfo||stops;
      return `<div class="flight-card">
        <div class="flight-card-main">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="airline-badge" style="background:var(--accent-dim);color:var(--accent);">${esc(airline.substring(0,2))}</div>
            <div>
              <div style="font-weight:700;">${esc(airline)}</div>
              <div style="font-size:12px;color:var(--text-dim);font-family:var(--font-mono);">${esc(code)}</div>
            </div>
          </div>
          <div class="flight-times">
            <div>
              <div class="flight-time">${esc(f.departTime||"--:--")}</div>
              <div class="flight-airport">${esc(f.departAirport||state.from)}</div>
            </div>
            <div class="flight-line">
              <div class="flight-duration">${esc(f.duration||"")}</div>
              <div class="flight-track"></div>
              <div class="flight-stops" style="color:${+f.stops===0?'var(--accent)':'var(--gold)'};">${esc(stopInfo)}</div>
            </div>
            <div>
              <div class="flight-time">${esc(f.arriveTime||"--:--")}</div>
              <div class="flight-airport">${esc(f.arriveAirport||state.to)}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div class="flight-price" style="color:var(--accent);">$${(+f._price).toLocaleString()}</div>
            ${pointsEst(f)}
          </div>
        </div>
        <div style="padding:12px 24px 16px;border-top:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;">
          <a href="live-tracker.html?from=${state.from}&to=${state.to}" class="btn btn-ghost btn-sm">🛰️ Track Live</a>
          <button class="btn btn-primary btn-sm" disabled title="Booking coming in V2">Book (coming soon)</button>
        </div>
      </div>`;
    }).join("");
  }

  async function fetchFlights() {
    const url = new URL("/api/amadeus/search", location.origin);
    url.searchParams.set("from", state.from);
    url.searchParams.set("to", state.to);
    url.searchParams.set("date", state.date);
    url.searchParams.set("adults", state.adults);
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data?.message||data?.error||"Search failed");
    return Array.isArray(data?.flights) ? data.flights : [];
  }

  function bind() {
    els.btnNewSearch?.addEventListener("click", ()=>location.href="index.html");
    els.btnModify?.addEventListener("click", ()=>location.href="index.html");
    const rr = ()=>render();
    els.sortBy?.addEventListener("change", rr);
    els.maxStops?.addEventListener("change", rr);
    els.maxPrice?.addEventListener("input", ()=>{ clearTimeout(rr._t); rr._t=setTimeout(rr,120); });
    els.togglePoints?.addEventListener("change", rr);
    els.btnResetFilters?.addEventListener("click", ()=>{
      if(els.sortBy) els.sortBy.value="price_asc";
      if(els.maxStops) els.maxStops.value="";
      if(els.maxPrice) els.maxPrice.value="";
      if(els.togglePoints) els.togglePoints.value="off";
      render();
    });
  }

  async function init() {
    setPills(); bind();
    if (!isIata(state.from)||!isIata(state.to)||state.from===state.to||!isDate(state.date)) {
      els.resultsHint.textContent = "";
      if(els.errorBox){els.errorBox.textContent="Please search from the Home page.";els.errorBox.classList.add("visible");}
      els.results.innerHTML = `<div style="margin-top:1rem;"><a href="index.html" class="btn btn-primary">Go to Home</a></div>`;
      return;
    }
    skeleton(4);
    try {
      state.rawFlights = await fetchFlights();
      render();
    } catch(err) {
      els.resultsHint.textContent = "Search failed.";
      if(els.errorBox){els.errorBox.textContent=err?.message||"Error";els.errorBox.classList.add("visible");}
      els.results.innerHTML = "";
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
