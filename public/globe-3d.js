/* public/globe-3d.js
   - Initializes Globe.gl on #globe
   - Plots flight markers (lat/lng) and optionally centers view
   - Exposes: window.AwardGlobe.init(), setFlights(), clear()
*/

(function () {
  let globe = null;
  let containerEl = null;
  let resizeObserver = null;

  const DEFAULT_VIEW = { lat: 20, lng: 0, altitude: 2.1 };

  function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function ensureGlobeLoaded() {
    if (!window.Globe) {
      throw new Error("Globe.gl is not loaded. Check the CDN script tag order.");
    }
  }

  function sizeToContainer() {
    if (!globe || !containerEl) return;
    const w = Math.max(10, containerEl.clientWidth || 10);
    const h = Math.max(10, containerEl.clientHeight || 10);
    try {
      globe.width(w);
      globe.height(h);
    } catch (_) {}
  }

  function init(containerId = "globe") {
    ensureGlobeLoaded();

    containerEl = document.getElementById(containerId);
    if (!containerEl) throw new Error(`Missing #${containerId} element`);

    // If the container has no height, Globe.gl will render a 0px canvas.
    const h = containerEl.clientHeight;
    if (!h || h < 50) {
      console.warn(`#${containerId} has low/zero height (${h}px). Ensure CSS sets a fixed height.`);
    }

    // Create globe once
    globe = Globe()(containerEl)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#0a0f1e")
      .atmosphereColor("#c5ff68")
      .atmosphereAltitude(0.12)
      .pointsData([])
      .pointColor(() => "#c5ff68")
      .pointRadius(0.35)
      .pointAltitude(0.02)
      .pointLabel((d) => {
        const num = d.number || d.id || "Flight";
        const alt = d.altitude != null ? `${Math.round(d.altitude)} ft` : "—";
        const spd = d.speed != null ? `${Math.round(d.speed)} kt` : "—";
        return `${num}<br/>Alt: ${alt}<br/>Speed: ${spd}`;
      });

    // Controls feel nicer
    try {
      const c = globe.controls();
      c.enableDamping = true;
      c.dampingFactor = 0.08;
      c.rotateSpeed = 0.35;
      c.zoomSpeed = 0.7;
    } catch (_) {}

    // Initial view
    globe.pointOfView(DEFAULT_VIEW, 0);

    // Size handling (better than just window resize)
    sizeToContainer();

    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => sizeToContainer());
    resizeObserver.observe(containerEl);

    window.addEventListener("resize", sizeToContainer);

    return globe;
  }

  function clear() {
    if (!globe) return;
    globe.pointsData([]);
    globe.pointOfView(DEFAULT_VIEW, 600);
  }

  function setFlights(flights = []) {
    if (!globe) init("globe");

    const pts = (flights || [])
      .map((f) => {
        const lat = toNum(f.latitude);
        const lng = toNum(f.longitude);
        if (lat == null || lng == null) return null;
        return {
          lat,
          lng,
          id: f.id,
          number: f.number,
          altitude: toNum(f.altitude),
          speed: toNum(f.speed),
          heading: toNum(f.heading),
        };
      })
      .filter(Boolean);

    globe.pointsData(pts);

    // Center globe roughly over average point
    if (pts.length) {
      const avgLat = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
      const avgLng = pts.reduce((a, p) => a + p.lng, 0) / pts.length;
      globe.pointOfView({ lat: avgLat, lng: avgLng, altitude: 1.7 }, 800);
    } else {
      globe.pointOfView(DEFAULT_VIEW, 600);
    }

    // Force size refresh (in case init happened before layout)
    sizeToContainer();
  }

  window.AwardGlobe = { init, setFlights, clear };
})();
