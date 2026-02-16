/* public/live-tracker-client.js
   Route search → list flights → click selects → globe follows
   Weather via Open-Meteo
*/
(function () {
  const $ = id => document.getElementById(id);
  const els = {
    from:$("from"), to:$("to"), fromSuggest:$("fromSuggest"), toSuggest:$("toSuggest"),
    flightNumber:$("flightNumber"), btnTrack:$("btnTrack"), btnModify:$("btnModify"), btnNew:$("btnNew"),
    formError:$("formError"), flightsList:$("flightsList"), globeStatus:$("globeStatus"),
    globeSub:$("globeSub"), pillRoute:$("pillRoute"), pillCount:$("pillCount"),
    pillUpdated:$("pillUpdated"), trackerSection:$("trackerSection"), formCard:$("formCard"),
    weatherRow:$("weatherRow"),
  };

  const norm = s => String(s||"").trim();
  const normUp = s => norm(s).toUpperCase();
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const niceTime = () => new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

  function showError(m) { if(els.formError){els.formError.style.display="block";els.formError.textContent=m;els.formError.classList.add("visible");} }
  function clearError() { if(els.formError){els.formError.style.display="none";els.formError.textContent="";els.formError.classList.remove("visible");} }
  function setLoading(l) {
    if(els.btnTrack){els.btnTrack.disabled=l;els.btnTrack.textContent=l?"🔄 Searching...":"🔍 Track Live Flights";}
    if(els.globeStatus) els.globeStatus.textContent=l?"Loading":"Idle";
  }

  function getDB() { return Array.isArray(window.AIRPORTS_DB)?window.AIRPORTS_DB:[]; }

  function scoreAirport(a, q) {
    const code = normUp(a.code), city = (a.city||"").toLowerCase(), ql = q.toLowerCase();
    if (code === q.toUpperCase()) return 300;
    if (code.startsWith(q.toUpperCase())) return 200;
    if (city.startsWith(ql)) return 150;
    if (city.includes(ql)) return 60;
    return 0;
  }

  function findBestIata(q) {
    const v = norm(q);
    if (!v) return null;
    const up = normUp(v);
    if (/^[A-Z]{3}$/.test(up)) return up;
    const db = getDB();
    let best=null, bs=-1;
    for (const a of db) { const s=scoreAirport(a,v); if(s>bs){bs=s;best=a;} }
    return best&&bs>=60 ? normUp(best.code) : null;
  }

  // Autocomplete
  function hideSuggest(box) { if(box){box.style.display="none";box.innerHTML="";box.classList.remove("open");} }
  function showSuggest(box, input, matches) {
    if (!matches.length) { hideSuggest(box); return; }
    box.innerHTML = matches.map(a => {
      const code = normUp(a.code), city = a.city||"", country = a.country||"";
      return `<div class="airport-dd-item" data-code="${code}">
        <span style="font-family:var(--font-mono);font-weight:700;color:var(--accent);">${code}</span>
        <span style="font-size:12px;">${esc(city)}${country?', '+esc(country):''}</span>
      </div>`;
    }).join("");
    box.style.display = "block"; box.classList.add("open");
    box.querySelectorAll(".airport-dd-item").forEach(r => {
      r.addEventListener("mousedown", e => { e.preventDefault(); input.value=r.getAttribute("data-code"); hideSuggest(box); });
    });
  }

  function attachAC(input, box) {
    if (!input||!box) return;
    input.addEventListener("input", () => {
      const q = norm(input.value);
      if (q.length<2) { hideSuggest(box); return; }
      const db = getDB();
      const m = db.map(a=>({a,s:scoreAirport(a,q)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.a);
      showSuggest(box, input, m);
    });
    input.addEventListener("focus", () => { const q=norm(input.value); if(q.length>=2) input.dispatchEvent(new Event("input")); });
    input.addEventListener("blur", () => {
      setTimeout(()=>hideSuggest(box), 160);
      const r = findBestIata(input.value);
      if (r) input.value = r;
    });
    input.addEventListener("keydown", e => { if(e.key==="Escape") hideSuggest(box); });
  }

  // Weather
  const WC = {0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",61:"Rain",71:"Snow",80:"Showers",95:"Thunderstorm"};
  async function fetchWeather(lat,lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code`;
    const r = await fetch(url); if(!r.ok) throw new Error("Weather failed");
    const d = await r.json(); const c = d?.current; if(!c) return null;
    return { tempC:c.temperature_2m, windKmh:c.wind_speed_10m, windDir:c.wind_direction_10m, code:c.weather_code, label:WC[c.weather_code]||"Weather" };
  }

  function renderWeather(w) {
    if (window.Globe3D?.setSelectedWeather) window.Globe3D.setSelectedWeather(w);
    if (!els.weatherRow) return;
    if (!w) { els.weatherRow.style.display="none"; return; }
    els.weatherRow.style.display = "flex";
    els.weatherRow.innerHTML = `
      <span class="badge badge-blue">🌦️ ${esc(w.label)}</span>
      <span class="badge badge-blue">🌡️ ${Math.round(w.tempC)}°C</span>
      <span class="badge badge-blue">💨 ${Math.round(w.windKmh)} km/h</span>`;
  }

  async function updateWeather() {
    try {
      const sel = window.Globe3D?.getSelectedFlight?.();
      if (!sel?.latitude) { renderWeather(null); return; }
      renderWeather(await fetchWeather(sel.latitude, sel.longitude));
    } catch(_) { renderWeather(null); }
  }

  // Render flight list
  function renderFlights(from, to, flights) {
    if (!els.flightsList) return;
    els.flightsList.innerHTML = "";
    if (!flights.length) {
      els.flightsList.innerHTML = `<div class="flight-list-card"><div style="color:var(--text-dim);font-weight:700;">No live flights found for ${esc(from)} → ${esc(to)}</div></div>`;
      renderWeather(null);
      window.Globe3D?.setFlights?.([]);
      return;
    }
    window.Globe3D?.setFlights?.(flights);
    window.Globe3D?.setSelectedFlight?.(flights[0].id);
    updateWeather();

    flights.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "flight-list-card" + (i===0?" selected":"");
      card.dataset.flightId = f.id;
      const alt = Number.isFinite(+f.altitude) ? (+f.altitude>=1000?Math.round(+f.altitude/1000)+"k ft":Math.round(+f.altitude)+" ft") : "—";
      const spd = Number.isFinite(+f.speed) ? Math.round(+f.speed*1.852)+" km/h" : "—";
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="flight-list-num">${esc(f.number||f.id||"—")}</div>
          <span class="badge badge-accent">${esc(f.airline||"")}</span>
        </div>
        <div class="flight-list-route">${esc(f.origin||from)} → ${esc(f.destination||to)}</div>
        <div class="flight-list-stats">
          <span>Alt: ${esc(alt)}</span>
          <span>Spd: ${esc(spd)}</span>
          <span>Hdg: ${Number.isFinite(+f.heading)?Math.round(f.heading)+"°":"—"}</span>
        </div>`;
      card.addEventListener("click", () => {
        els.flightsList.querySelectorAll(".flight-list-card").forEach(c=>c.classList.remove("selected"));
        card.classList.add("selected");
        window.Globe3D?.setSelectedFlight?.(f.id);
        updateWeather();
      });
      els.flightsList.appendChild(card);
    });
  }

  // API
  async function fetchRoute(from, to) {
    const r = await fetch(`/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    const d = await r.json().catch(()=>null);
    if (!r.ok||!d||d.success===false) throw new Error(d?.error||`HTTP ${r.status}`);
    return Array.isArray(d.flights)?d.flights:[];
  }

  // Search
  async function runSearch() {
    clearError();
    const from = findBestIata(els.from?.value)||normUp(els.from?.value);
    const to = findBestIata(els.to?.value)||normUp(els.to?.value);
    const fn = normUp(els.flightNumber?.value||"").replace(/\s/g,"");

    if (!/^[A-Z]{3}$/.test(from)||!/^[A-Z]{3}$/.test(to)) { showError("Please enter valid airports."); return; }
    if (from===to) { showError("Origin and destination must differ."); return; }

    if(els.from) els.from.value=from;
    if(els.to) els.to.value=to;
    if(els.pillRoute) els.pillRoute.textContent=`${from} → ${to}`;
    if(els.pillCount) els.pillCount.textContent="Searching…";
    if(els.pillUpdated) els.pillUpdated.textContent=`Updated ${niceTime()}`;
    if(els.globeSub) els.globeSub.textContent=`Showing live flights for ${from} → ${to}`;

    setLoading(true);
    try {
      let flights = await fetchRoute(from, to);
      if (fn) flights = flights.filter(f=>String(f.number||"").toUpperCase().replace(/\s/g,"").includes(fn));
      if(els.pillCount) els.pillCount.textContent=`${flights.length} flight${flights.length===1?"":"s"}`;
      if(els.globeStatus) els.globeStatus.textContent=flights.length?"Live":"No flights";
      renderFlights(from, to, flights);
    } catch(err) {
      if(els.pillCount) els.pillCount.textContent="Failed";
      if(els.globeStatus) els.globeStatus.textContent="Error";
      showError(err.message||"Search failed");
      renderWeather(null);
    } finally { setLoading(false); }
  }

  // Events
  els.btnTrack?.addEventListener("click", runSearch);
  els.btnModify?.addEventListener("click", ()=>{ els.formCard?.scrollIntoView({behavior:"smooth"}); setTimeout(()=>els.from?.focus(),250); });
  els.btnNew?.addEventListener("click", ()=>{
    if(els.from) els.from.value=""; if(els.to) els.to.value=""; if(els.flightNumber) els.flightNumber.value="";
    clearError(); if(els.flightsList) els.flightsList.innerHTML="";
    if(els.pillRoute) els.pillRoute.textContent="—";
    if(els.pillCount) els.pillCount.textContent="0 flights";
    if(els.globeStatus) els.globeStatus.textContent="Idle";
    renderWeather(null);
    window.Globe3D?.setFlights?.([]); window.Globe3D?.setSelectedFlight?.(null);
    els.formCard?.scrollIntoView({behavior:"smooth"});
  });

  [els.from, els.to, els.flightNumber].forEach(inp => {
    inp?.addEventListener("keydown", e => { if(e.key==="Enter"){e.preventDefault();runSearch();} });
  });

  window.addEventListener("DOMContentLoaded", () => {
    attachAC(els.from, els.fromSuggest);
    attachAC(els.to, els.toSuggest);
  });
})();
