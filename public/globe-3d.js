// public/globe-3d.js
// Renders a real 3D globe and plots live flights from /api/live/route
// Depends on these scripts being loaded BEFORE this file:
// 1) https://unpkg.com/three/build/three.min.js
// 2) https://unpkg.com/globe.gl
//
// Also depends on window.trackFlightsByRoute(from,to) (from live-tracker-client.js)

(function () {
  const STATE = {
    globe: null,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animTimer: null,
    flights: [],
    selectedId: null
  };

  // --- Utilities ---
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const isNum = (v) => Number.isFinite(Number(v));
  const kmhFromKnots = (kn) => (isNum(kn) ? Math.round(Number(kn) * 1.852) : null);

  function normalizeFlightNumber(v) {
    return String(v || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function makePoints(flights) {
    return (flights || [])
      .filter((f) => isNum(f.latitude) && isNum(f.longitude))
      .map((f) => {
        const alt = Number(f.altitude) || 0; // ft
        // Keep points visible above surface even if altitude missing
        const altitude = clamp(alt / 45000, 0.06, 0.7);

        const number = f.number || f.id || "FLIGHT";
        return {
          id: String(f.id ?? number),
          number,
          airline: f.airline || "",
          lat: Number(f.latitude),
          lng: Number(f.longitude),
          altitude,
          _raw: f
        };
      });
  }

  function makeArcs(flights) {
    // Optional: draw direction arcs (short) based on heading
    return (flights || [])
      .filter((f) => isNum(f.latitude) && isNum(f.longitude) && isNum(f.heading))
      .map((f) => {
        const lat = Number(f.latitude);
        const lng = Number(f.longitude);
        const heading = Number(f.heading);

        // Create a tiny arc forward in direction of heading (approx)
        // This isn't a real route; it’s just a "direction indicator".
        const step = 2; // degrees-ish small step (visual only)
        const rad = (heading * Math.PI) / 180;
        const dLat = (step * Math.cos(rad)) / 10;
        const dLng = (step * Math.sin(rad)) / 10;

        return {
          id: String(f.id ?? f.number),
          startLat: lat,
          startLng: lng,
          endLat: lat + dLat,
          endLng: lng + dLng,
          _raw: f
        };
      });
  }

  function setStatusBadge(text) {
    const el = document.getElementById("globeStatus");
    if (el) el.textContent = text;
  }

  function setHint(text) {
    const el = document.getElementById("globeHint");
    if (el) el.textContent = text;
  }

  function safeCall(fn) {
    try {
      return fn();
    } catch (_) {
      return null;
    }
  }

  // --- Globe init ---
  function initGlobe() {
    const el = document.getElementById("globe");
    if (!el) return;

    // Prevent double init
    if (STATE.globe) return;

    if (!window.Globe) {
      setStatusBadge("Missing globe.gl");
      setHint("globe.gl did not load. Check script tags.");
      return;
    }

    // Build globe
    const globe = Globe()(el)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#4a9cff")
      .atmosphereAltitude(0.12)

      // Points (flights)
      .pointsData([])
      .pointLat((d) => d.lat)
      .pointLng((d) => d.lng)
      .pointAltitude((d) => d.altitude)
      .pointRadius(() => 0.18)
      .pointResolution(8)
      .pointColor((d) => (d.id === STATE.selectedId ? "#c5ff68" : "#4a9cff"))
      .pointsMerge(true)

      // Hover label
      .pointLabel((d) => {
        const f = d?._raw || {};
        const num = f.number || f.id || "Flight";
        const alt = isNum(f.altitude) ? `${Math.round(Number(f.altitude) / 1000)}k ft` : "—";
        const spd = isNum(f.speed) ? `${kmhFromKnots(f.speed)} km/h` : "—";
        const head = isNum(f.heading) ? `${Math.round(Number(f.heading))}°` : "—";
        return `
          <div style="font-family: Outfit, system-ui; padding: 8px 10px;">
            <div style="font-weight:800; color:#c5ff68; margin-bottom:4px;">${num}</div>
            <div style="color:#8a99b3; font-size:12px;">Alt: <b style="color:#fff">${alt}</b> • Spd: <b style="color:#fff">${spd}</b> • Hdg: <b style="color:#fff">${head}</b></div>
          </div>
        `;
      })

      // Arcs (direction indicators)
      .arcsData([])
      .arcStartLat((d) => d.startLat)
      .arcStartLng((d) => d.startLng)
      .arcEndLat((d) => d.endLat)
      .arcEndLng((d) => d.endLng)
      .arcColor(() => ["rgba(197,255,104,0.85)", "rgba(74,156,255,0.15)"])
      .arcStroke(() => 0.9)
      .arcDashLength(() => 0.4)
      .arcDashGap(() => 2.2)
      .arcDashAnimateTime(() => 1200);

    // Save references for sizing / centering fixes
    const renderer = globe.renderer();
    const scene = globe.scene();
    const camera = globe.camera();
    const controls = globe.controls();

    STATE.globe = globe;
    STATE.scene = scene;
    STATE.camera = camera;
    STATE.renderer = renderer;
    STATE.controls = controls;

    // Nice controls defaults
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.5;
      controls.minDistance = 140;
      controls.maxDistance = 520;
      controls.enablePan = false;
    }

    // Center the globe reliably
    safeCall(() => globe.pointOfView({ lat: 20, lng: 0, altitude: 1.9 }, 0));
    setTimeout(() => safeCall(() => globe.pointOfView(globe.pointOfView(), 0)), 50);
    setTimeout(() => safeCall(() => globe.pointOfView(globe.pointOfView(), 0)), 250);

    // Handle resize
    const onResize = () => safeCall(() => globe.width(el.clientWidth).height(el.clientHeight));
    window.addEventListener("resize", onResize, { passive: true });
    setTimeout(onResize, 0);

    // Click selects flight (optional)
    globe.onPointClick((p) => {
      STATE.selectedId = p?.id || null;
      // Re-apply data to force recolor
      const pts = makePoints(STATE.flights);
      globe.pointsData(pts);

      // Inform UI if you have a handler
      if (typeof window.onGlobeSelectFlight === "function") {
        window.onGlobeSelectFlight(p?._raw || null);
      }
    });

    setStatusBadge("Idle");
    setHint("Search a route to plot flights. Drag to rotate.");
  }

  // --- Public API used by live-tracker-client.js ---
  async function globeSetFlights({ from, to, flightNumber }) {
    initGlobe();
    if (!STATE.globe) return;

    const fno = normalizeFlightNumber(flightNumber);

    setStatusBadge("Loading…");
    setHint(`Fetching flights for ${from} → ${to}…`);

    if (typeof window.trackFlightsByRoute !== "function") {
      setStatusBadge("Error");
      setHint("trackFlightsByRoute() is missing. Check live-tracker-client.js include order.");
      return;
    }

    const result = await window.trackFlightsByRoute(from, to);

    if (!result?.success) {
      setStatusBadge("Error");
      setHint(result?.error || "Live route request failed");
      STATE.globe.pointsData([]);
      STATE.globe.arcsData([]);
      STATE.flights = [];
      return;
    }

    let flights = Array.isArray(result.flights) ? result.flights : [];

    // Optional flight number filter (matches BA178, BAW178, etc loosely)
    if (fno) {
      flights = flights.filter((f) => {
        const n = normalizeFlightNumber(f.number);
        if (!n) return false;
        // Loose match: contains typed token or ends with typed token
        return n.includes(fno) || n.endsWith(fno);
      });
    }

    STATE.flights = flights;

    const pts = makePoints(flights);
    const arcs = makeArcs(flights);

    STATE.globe.pointsData(pts);
    STATE.globe.arcsData(arcs);

    // Auto-center camera on the first flight (or just reset view)
    if (pts.length) {
      const first = pts[0];
      safeCall(() => STATE.globe.pointOfView({ lat: first.lat, lng: first.lng, altitude: 1.8 }, 900));
      setStatusBadge("Live");
      setHint(`Showing ${pts.length} flight${pts.length === 1 ? "" : "s"} for ${from} → ${to}`);
    } else {
      safeCall(() => STATE.globe.pointOfView({ lat: 20, lng: 0, altitude: 1.9 }, 700));
      setStatusBadge("No flights");
      setHint(`No live flights to plot for ${from} → ${to}${fno ? ` (filter: ${fno})` : ""}.`);
    }

    // If your UI needs the list
    if (typeof window.onGlobeFlightsUpdated === "function") {
      window.onGlobeFlightsUpdated(flights);
    }
  }

  // Optional helper for clearing globe
  function globeClear() {
    initGlobe();
    if (!STATE.globe) return;
    STATE.flights = [];
    STATE.selectedId = null;
    STATE.globe.pointsData([]);
    STATE.globe.arcsData([]);
    setStatusBadge("Idle");
    setHint("Search a route to plot flights. Drag to rotate.");
    safeCall(() => STATE.globe.pointOfView({ lat: 20, lng: 0, altitude: 1.9 }, 600));
  }

  // Expose
  window.globeSetFlights = globeSetFlights;
  window.globeClear = globeClear;

  // Auto-init on load (safe)
  window.addEventListener("DOMContentLoaded", () => {
    initGlobe();

    // If the page already has default IATA values and wants immediate render, you can uncomment:
    // const from = document.getElementById("originIata")?.value?.trim()?.toUpperCase();
    // const to = document.getElementById("destIata")?.value?.trim()?.toUpperCase();
    // if (from && to) globeSetFlights({ from, to, flightNumber: "" });
  });
})();
