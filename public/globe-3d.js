// public/globe-3d.js
// Stable Globe controller (Chrome-safe plane icon + direction + route + pins + in-globe weather)
//
// Shows:
//  - points for all flights
//  - selected flight: plane ICON (sprite) rotated by heading
//  - arcs: origin->dest (faint) + current->dest (animated dashed)
//  - origin/destination pins (rings)
//  - weather label on-globe near plane (optional)
//
// API exposed:
//   window.Globe3D = {
//     setFlights(flights[]),
//     setSelectedFlight(id),
//     getSelectedFlight(),
//     setSelectedWeather(weatherObjOrNull)  // { label, tempC, windKmh, windDir } etc
//   }

(function () {
  const $ = (id) => document.getElementById(id);

  const normalizeCode = (v) => String(v || "").trim().toUpperCase();
  const isFiniteNum = (n) => Number.isFinite(Number(n));
  const deg2rad = (d) => (Number(d) * Math.PI) / 180;

  function validLatLng(f) {
    return isFiniteNum(f?.latitude) && isFiniteNum(f?.longitude);
  }

  function buildAirportIndex() {
    const db = window.AIRPORTS_DB;
    const idx = new Map();
    if (!Array.isArray(db)) return idx;

    for (const a of db) {
      const code = normalizeCode(a.code || a.iata || a.IATA);
      if (!code || code.length !== 3) continue;

      const lat = Number(a.lat ?? a.latitude);
      const lng = Number(a.lng ?? a.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      idx.set(code, {
        code,
        lat,
        lng,
        city: a.city || "",
        country: a.country || "",
        airport: a.airport || a.name || "",
      });
    }
    return idx;
  }

  function makePlaneSprite(THREE) {
    // Crisp plane icon drawn to canvas (no external assets)
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Transparent background
    ctx.clearRect(0, 0, size, size);

    // Draw a "plane arrow" style icon pointing UP (north) by default
    // We'll rotate sprite based on heading later.
    ctx.save();
    ctx.translate(size / 2, size / 2);

    // glow
    ctx.shadowColor = "rgba(197,255,104,0.65)";
    ctx.shadowBlur = 18;

    // body
    ctx.fillStyle = "#c5ff68";
    ctx.beginPath();
    // nose
    ctx.moveTo(0, -92);
    // right wing
    ctx.lineTo(22, -28);
    ctx.lineTo(78, -12);
    ctx.lineTo(78, 8);
    ctx.lineTo(20, 6);
    // tail right
    ctx.lineTo(14, 80);
    ctx.lineTo(0, 60);
    // tail left
    ctx.lineTo(-14, 80);
    ctx.lineTo(-20, 6);
    // left wing
    ctx.lineTo(-78, 8);
    ctx.lineTo(-78, -12);
    ctx.lineTo(-22, -28);
    ctx.closePath();
    ctx.fill();

    // subtle outline for readability
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(10,15,30,0.55)";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 10;
    return sprite;
  }

  function latLngAltToVec3(THREE, radius, latDeg, lngDeg, altFrac) {
    // Standard sphere mapping (x,z in lon plane, y vertical)
    const lat = deg2rad(latDeg);
    const lng = deg2rad(lngDeg);
    const r = radius * (1 + (altFrac || 0));
    return new THREE.Vector3(
      r * Math.cos(lat) * Math.cos(lng),
      r * Math.sin(lat),
      r * Math.cos(lat) * Math.sin(lng)
    );
  }

  window.addEventListener("DOMContentLoaded", () => {
    const globeEl = $("globe");
    if (!globeEl) return;

    if (!window.Globe || !window.THREE) {
      console.warn("Missing Globe.gl or THREE. Check script tags.");
      return;
    }

    const THREE = window.THREE;

    let flights = [];
    let selectedId = null;
    let selectedWeather = null;

    let airportIndex = buildAirportIndex();
    function refreshAirportIndexIfNeeded() {
      if (!airportIndex || airportIndex.size < 1000) {
        airportIndex = buildAirportIndex();
      }
    }
    function findAirport(code) {
      refreshAirportIndexIfNeeded();
      return airportIndex.get(normalizeCode(code)) || null;
    }

    // --- Globe init ---
    const globe = Globe()(globeEl)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#0a0f1e")

      // points = all flights (and we’ll append pins as points if needed)
      .pointsData([])
      .pointAltitude((d) => (d.kind === "PIN" ? 0.045 : 0.02))
      .pointRadius((d) => (d.kind === "PIN" ? 0.42 : 0.22))
      .pointColor((d) => (d.kind === "PIN" ? "#4a9cff" : "#c5ff68"))

      // rings = origin/dest pulsing pins
      .ringsData([])
      .ringColor((d) => d.color || "rgba(74,156,255,0.9)")
      .ringMaxRadius((d) => d.maxR ?? 2.2)
      .ringPropagationSpeed((d) => d.speed ?? 2.0)
      .ringRepeatPeriod((d) => d.period ?? 1200)

      // arcs = selected flight route(s)
      .arcsData([])
      .arcColor((a) => a.color || ["rgba(197,255,104,.90)", "rgba(197,255,104,.10)"])
      .arcAltitude((a) => a.altitude ?? 0.22)
      .arcStroke((a) => a.stroke ?? 0.85)
      .arcDashLength((a) => a.dashLength ?? 0.35)
      .arcDashGap((a) => a.dashGap ?? 0.22)
      .arcDashAnimateTime((a) => a.dashTime ?? 1400)

      // labels (selected only)
      .labelsData([])
      .labelText((d) => d.text)
      .labelSize((d) => d.size ?? 1.0)
      .labelAltitude((d) => d.alt ?? 0.06)
      .labelColor((d) => d.color ?? "#c5ff68")
      .labelDotRadius(0.1);

    // Controls
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;

    // --- Selected flight plane icon layer (SPRITE) ---
    const basePlaneSprite = makePlaneSprite(THREE);

    globe
      .customLayerData([])
      .customThreeObject(() => basePlaneSprite.clone()); // clone per datum

    globe.customThreeObjectUpdate((obj, d) => {
      try {
        const lat = Number(d.lat);
        const lng = Number(d.lng);
        const heading = Number(d.heading || 0);

        const radius =
          typeof globe.getGlobeRadius === "function" ? globe.getGlobeRadius() : 100;

        // position slightly above earth
        const pos = latLngAltToVec3(THREE, radius, lat, lng, 0.07);
        obj.position.copy(pos);

        // sprite scale (tuned to look good across zoom levels)
        obj.scale.set(16, 16, 1);

        // Rotate sprite so 0° (north) points "up" on sprite.
        // Sprite rotation is screen-facing, but visually communicates heading well.
        obj.material.rotation = -deg2rad(heading);

        // Keep on top
        obj.renderOrder = 10;
      } catch (_) {}
    });

    // --- Resize: width/height only (NO POV reset loops) ---
    let resizeRAF = null;
    function resizeToContainer() {
      if (resizeRAF) cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(() => {
        globe.width(globeEl.clientWidth || 800);
        globe.height(globeEl.clientHeight || 440);
      });
    }
    const ro = new ResizeObserver(resizeToContainer);
    ro.observe(globeEl);
    resizeToContainer();

    // Set initial camera ONCE
    globe.pointOfView({ lat: 18, lng: 0, altitude: 2.15 }, 0);

    // --- Build overlays for selected flight ---
    function buildArcs(sel) {
      const o = findAirport(sel.origin);
      const d = findAirport(sel.destination);
      if (!o || !d) return [];

      const curOk = validLatLng(sel);
      const arcs = [];

      // Full route: origin -> destination (faint)
      arcs.push({
        startLat: o.lat,
        startLng: o.lng,
        endLat: d.lat,
        endLng: d.lng,
        altitude: 0.20,
        stroke: 0.65,
        dashLength: 0,
        dashGap: 0,
        dashTime: 0,
        color: ["rgba(197,255,104,.26)", "rgba(197,255,104,.06)"],
      });

      // Remaining: current -> destination (animated dashed, indicates direction)
      if (curOk) {
        arcs.push({
          startLat: Number(sel.latitude),
          startLng: Number(sel.longitude),
          endLat: d.lat,
          endLng: d.lng,
          altitude: 0.26,
          stroke: 0.95,
          dashLength: 0.35,
          dashGap: 0.22,
          dashTime: 1400,
          color: ["rgba(197,255,104,.95)", "rgba(197,255,104,.12)"],
        });
      }

      return arcs;
    }

    function buildPins(sel) {
      const o = findAirport(sel.origin);
      const d = findAirport(sel.destination);
      const pins = [];
      if (o) pins.push({ lat: o.lat, lng: o.lng, kind: "PIN", label: sel.origin, color: "rgba(74,156,255,.95)" });
      if (d) pins.push({ lat: d.lat, lng: d.lng, kind: "PIN", label: sel.destination, color: "rgba(74,156,255,.95)" });
      return pins;
    }

    function buildRings(sel) {
      const o = findAirport(sel.origin);
      const d = findAirport(sel.destination);
      const rings = [];
      if (o) rings.push({ lat: o.lat, lng: o.lng, color: "rgba(74,156,255,0.85)", maxR: 2.0, speed: 2.2, period: 1200 });
      if (d) rings.push({ lat: d.lat, lng: d.lng, color: "rgba(74,156,255,0.85)", maxR: 2.0, speed: 2.2, period: 1200 });
      return rings;
    }

    function weatherLabelText(w) {
      if (!w) return "";
      const parts = [];
      if (w.label) parts.push(w.label);
      if (w.tempC != null && Number.isFinite(Number(w.tempC))) parts.push(`${Math.round(Number(w.tempC))}°C`);
      if (w.windKmh != null && Number.isFinite(Number(w.windKmh))) parts.push(`${Math.round(Number(w.windKmh))} km/h`);
      if (w.windDir != null && Number.isFinite(Number(w.windDir))) parts.push(`${Math.round(Number(w.windDir))}°`);
      return parts.join(" • ");
    }

    function updateSelected(sel, { moveCamera = true } = {}) {
      // All flight points
      const pts = flights
        .filter(validLatLng)
        .map((f) => ({
          lat: Number(f.latitude),
          lng: Number(f.longitude),
          id: f.id,
          kind: "FLIGHT",
        }));

      if (!sel) {
        globe.pointsData(pts);
        globe.customLayerData([]);
        globe.labelsData([]);
        globe.arcsData([]);
        globe.ringsData([]);
        return;
      }

      // Add origin/dest pins to points + rings
      const pins = buildPins(sel);
      globe.ringsData(buildRings(sel));
      globe.pointsData(pts.concat(pins));

      // Arcs
      globe.arcsData(buildArcs(sel));

      // Plane + labels
      if (validLatLng(sel)) {
        const lat = Number(sel.latitude);
        const lng = Number(sel.longitude);

        globe.customLayerData([{ lat, lng, heading: sel.heading ?? 0 }]);

        const labels = [];

        // Flight number label (NO emoji -> avoids "?" boxes)
        const flightText = String(sel.number || sel.id || "").trim();
        if (flightText) {
          labels.push({ lat, lng, text: flightText, size: 1.05, alt: 0.07, color: "#c5ff68" });
        }

        // Weather label on-globe (optional)
        const wText = weatherLabelText(selectedWeather);
        if (wText) {
          labels.push({ lat, lng, text: wText, size: 0.85, alt: 0.10, color: "#cbd6ea" });
        }

        globe.labelsData(labels);

        // Camera follow only when selection changes / new flights (not every resize)
        if (moveCamera) {
          globe.pointOfView({ lat, lng, altitude: 1.55 }, 850);
        }
      } else {
        globe.customLayerData([]);
        globe.labelsData([]);
      }
    }

    function renderAll(opts) {
      const sel = flights.find((f) => f.id === selectedId) || null;
      updateSelected(sel, opts);
    }

    // --- Public API ---
    function setFlights(next) {
      flights = Array.isArray(next) ? next : [];
      if (!selectedId && flights.length) selectedId = flights[0].id;
      selectedWeather = null; // reset weather when new set arrives
      renderAll({ moveCamera: true });
    }

    function setSelectedFlight(id) {
      selectedId = id || null;
      selectedWeather = null; // weather should be refreshed by client for the new selection
      renderAll({ moveCamera: true });
    }

    function getSelectedFlight() {
      return flights.find((f) => f.id === selectedId) || null;
    }

    // Call this after you fetch weather for the selected aircraft position
    function setSelectedWeather(w) {
      selectedWeather = w || null;
      // Re-render labels only (don’t yank camera again)
      renderAll({ moveCamera: false });
    }

    window.Globe3D = {
      setFlights,
      setSelectedFlight,
      getSelectedFlight,
      setSelectedWeather
    };
  });
})();
