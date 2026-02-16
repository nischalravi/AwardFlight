// public/globe-3d.js - Globe controller for live tracker
// Uses Globe.gl + THREE.js. Renders flight points, arcs, plane sprites, weather labels.
// API: window.Globe3D = { setFlights, setSelectedFlight, getSelectedFlight, setSelectedWeather }

(function () {
  const $ = (id) => document.getElementById(id);
  const deg2rad = (d) => (Number(d) * Math.PI) / 180;
  const isFiniteNum = (n) => Number.isFinite(Number(n));
  const normalizeCode = (v) => String(v || "").trim().toUpperCase();

  function validLatLng(f) { return isFiniteNum(f?.latitude) && isFiniteNum(f?.longitude); }

  function buildAirportIndex() {
    const db = window.AIRPORTS_DB;
    const idx = new Map();
    if (!Array.isArray(db)) return idx;
    for (const a of db) {
      const code = normalizeCode(a.code || a.iata);
      if (!code || code.length !== 3) continue;
      const lat = Number(a.lat ?? a.latitude);
      const lng = Number(a.lng ?? a.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      idx.set(code, { code, lat, lng, city: a.city || "", country: a.country || "", airport: a.airport || "" });
    }
    return idx;
  }

  function makePlaneSprite(THREE) {
    const size = 256, canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.save(); ctx.translate(size/2, size/2);
    ctx.shadowColor = "rgba(0,212,170,0.65)"; ctx.shadowBlur = 18;
    ctx.fillStyle = "#00D4AA";
    ctx.beginPath();
    ctx.moveTo(0,-92); ctx.lineTo(22,-28); ctx.lineTo(78,-12); ctx.lineTo(78,8);
    ctx.lineTo(20,6); ctx.lineTo(14,80); ctx.lineTo(0,60); ctx.lineTo(-14,80);
    ctx.lineTo(-20,6); ctx.lineTo(-78,8); ctx.lineTo(-78,-12); ctx.lineTo(-22,-28);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(10,14,23,0.55)"; ctx.lineWidth = 6; ctx.stroke();
    ctx.restore();
    const texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat); sprite.renderOrder = 10;
    return sprite;
  }

  window.addEventListener("DOMContentLoaded", () => {
    const globeEl = $("globe");
    if (!globeEl || !window.Globe || !window.THREE) return;
    const THREE = window.THREE;

    let flights = [], selectedId = null, selectedWeather = null;
    let airportIndex = buildAirportIndex();

    function findAirport(code) {
      if (airportIndex.size < 100) airportIndex = buildAirportIndex();
      return airportIndex.get(normalizeCode(code)) || null;
    }

    const globe = Globe()(globeEl)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#0A0E17")
      .pointsData([]).pointAltitude(d => d.kind === "PIN" ? 0.045 : 0.02)
      .pointRadius(d => d.kind === "PIN" ? 0.42 : 0.22)
      .pointColor(d => d.kind === "PIN" ? "#3B82F6" : "#00D4AA")
      .ringsData([]).ringColor(d => d.color || "rgba(59,130,246,0.9)")
      .ringMaxRadius(d => d.maxR ?? 2.2).ringPropagationSpeed(d => d.speed ?? 2)
      .ringRepeatPeriod(d => d.period ?? 1200)
      .arcsData([]).arcColor(a => a.color || ["rgba(0,212,170,.9)","rgba(0,212,170,.1)"])
      .arcAltitude(a => a.altitude ?? 0.22).arcStroke(a => a.stroke ?? 0.85)
      .arcDashLength(a => a.dashLength ?? 0.35).arcDashGap(a => a.dashGap ?? 0.22)
      .arcDashAnimateTime(a => a.dashTime ?? 1400)
      .labelsData([]).labelText(d => d.text).labelSize(d => d.size ?? 1)
      .labelAltitude(d => d.alt ?? 0.06).labelColor(d => d.color ?? "#00D4AA").labelDotRadius(0.1);

    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;

    const basePlane = makePlaneSprite(THREE);
    globe.customLayerData([]).customThreeObject(() => basePlane.clone());
    globe.customThreeObjectUpdate((obj, d) => {
      try {
        const r = typeof globe.getGlobeRadius === "function" ? globe.getGlobeRadius() : 100;
        const lat = deg2rad(d.lat), lng = deg2rad(d.lng), rr = r * 1.07;
        obj.position.set(rr*Math.cos(lat)*Math.cos(lng), rr*Math.sin(lat), rr*Math.cos(lat)*Math.sin(lng));
        obj.scale.set(16, 16, 1);
        obj.material.rotation = -deg2rad(d.heading || 0);
        obj.renderOrder = 10;
      } catch(_){}
    });

    let resizeRAF = null;
    function resize() {
      if (resizeRAF) cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(() => {
        globe.width(globeEl.clientWidth || 800);
        globe.height(globeEl.clientHeight || 440);
      });
    }
    new ResizeObserver(resize).observe(globeEl);
    resize();
    globe.pointOfView({ lat: 18, lng: 0, altitude: 2.15 }, 0);

    function buildArcs(sel) {
      const o = findAirport(sel.origin), d = findAirport(sel.destination);
      if (!o || !d) return [];
      const arcs = [{ startLat:o.lat,startLng:o.lng,endLat:d.lat,endLng:d.lng,altitude:.2,stroke:.65,dashLength:0,dashGap:0,dashTime:0,color:["rgba(0,212,170,.26)","rgba(0,212,170,.06)"] }];
      if (validLatLng(sel)) arcs.push({ startLat:+sel.latitude,startLng:+sel.longitude,endLat:d.lat,endLng:d.lng,altitude:.26,stroke:.95,dashLength:.35,dashGap:.22,dashTime:1400,color:["rgba(0,212,170,.95)","rgba(0,212,170,.12)"] });
      return arcs;
    }

    function buildPins(sel) {
      const pins = [];
      const o = findAirport(sel.origin), d = findAirport(sel.destination);
      if (o) pins.push({ lat:o.lat,lng:o.lng,kind:"PIN" });
      if (d) pins.push({ lat:d.lat,lng:d.lng,kind:"PIN" });
      return pins;
    }

    function buildRings(sel) {
      const rings = [];
      const o = findAirport(sel.origin), d = findAirport(sel.destination);
      if (o) rings.push({ lat:o.lat,lng:o.lng,color:"rgba(59,130,246,0.85)",maxR:2,speed:2.2,period:1200 });
      if (d) rings.push({ lat:d.lat,lng:d.lng,color:"rgba(59,130,246,0.85)",maxR:2,speed:2.2,period:1200 });
      return rings;
    }

    function weatherText(w) {
      if (!w) return "";
      const p = [];
      if (w.label) p.push(w.label);
      if (w.tempC!=null) p.push(`${Math.round(w.tempC)}°C`);
      if (w.windKmh!=null) p.push(`${Math.round(w.windKmh)} km/h`);
      return p.join(" · ");
    }

    function updateSelected(sel, opts) {
      const pts = flights.filter(validLatLng).map(f => ({ lat:+f.latitude,lng:+f.longitude,id:f.id,kind:"FLIGHT" }));
      if (!sel) { globe.pointsData(pts); globe.customLayerData([]); globe.labelsData([]); globe.arcsData([]); globe.ringsData([]); return; }
      globe.ringsData(buildRings(sel));
      globe.pointsData(pts.concat(buildPins(sel)));
      globe.arcsData(buildArcs(sel));
      if (validLatLng(sel)) {
        const lat=+sel.latitude, lng=+sel.longitude;
        globe.customLayerData([{ lat, lng, heading: sel.heading??0 }]);
        const labels = [];
        const ft = String(sel.number||sel.id||"").trim();
        if (ft) labels.push({ lat,lng,text:ft,size:1.05,alt:.07,color:"#00D4AA" });
        const wt = weatherText(selectedWeather);
        if (wt) labels.push({ lat,lng,text:wt,size:.85,alt:.1,color:"#E8ECF4" });
        globe.labelsData(labels);
        if (opts?.moveCamera) globe.pointOfView({ lat, lng, altitude: 1.55 }, 850);
      } else { globe.customLayerData([]); globe.labelsData([]); }
    }

    function renderAll(opts) { updateSelected(flights.find(f=>f.id===selectedId)||null, opts); }

    window.Globe3D = {
      setFlights(next) { flights = Array.isArray(next)?next:[]; if (!selectedId&&flights.length) selectedId=flights[0].id; selectedWeather=null; renderAll({moveCamera:true}); },
      setSelectedFlight(id) { selectedId=id||null; selectedWeather=null; renderAll({moveCamera:true}); },
      getSelectedFlight() { return flights.find(f=>f.id===selectedId)||null; },
      setSelectedWeather(w) { selectedWeather=w||null; renderAll({moveCamera:false}); },
    };
  });
})();
