// public/globe-3d.js
(function () {
  let globe = null;
  let globeEl = null;
  let flights = [];
  let selectedId = null;

  function validFlight(f) {
    return f && Number.isFinite(+f.latitude) && Number.isFinite(+f.longitude);
  }

  function ensureSize() {
    if (!globe || !globeEl) return;
    const w = globeEl.clientWidth;
    const h = globeEl.clientHeight;
    if (w > 0 && h > 0) {
      globe.width(w);
      globe.height(h);
      try {
        globe.renderer().setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      } catch (_) {}
    }
  }

  function render() {
    if (!globe) return;

    const pts = flights
      .filter(validFlight)
      .map((f) => ({
        id: f.id,
        number: f.number,
        airline: f.airline,
        lat: +f.latitude,
        lng: +f.longitude,
      }));

    globe.pointsData(pts);

    const sel = flights.find((f) => f && f.id === selectedId && validFlight(f));
    if (sel) {
      globe.labelsData([
        { lat: +sel.latitude, lng: +sel.longitude, text: `✈ ${sel.number || sel.id || ""}`.trim() },
      ]);
      globe.labelText((d) => d.text);
      globe.pointOfView({ lat: +sel.latitude, lng: +sel.longitude, altitude: 1.6 }, 900);
    } else {
      globe.labelsData([]);
    }
  }

  function initNow() {
    globeEl = document.getElementById("globe");
    if (!globeEl) return false;
    if (typeof window.Globe !== "function") return false;

    globe = window.Globe()(globeEl)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#0a0f1e")
      .pointAltitude(0.02)
      .pointRadius(0.35)
      .pointColor(() => "#c5ff68")
      .labelAltitude(0.05)
      .labelSize(1.2)
      .labelDotRadius(0.25)
      .labelColor(() => "#c5ff68")
      .pointsData([])
      .labelsData([]);

    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;

    ensureSize();
    requestAnimationFrame(ensureSize);

    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);
    render();

    window.addEventListener("resize", () => {
      ensureSize();
    });

    return true;
  }

  // Public API (used by live-tracker-client.js)
  function setFlights(next) {
    flights = Array.isArray(next) ? next : [];
    if (flights.length && !selectedId) selectedId = flights[0].id;
    ensureSize();
    render();
  }

  function setSelectedFlight(id) {
    selectedId = id || null;
    render();
  }

  function clear() {
    flights = [];
    selectedId = null;
    if (globe) {
      globe.pointsData([]);
      globe.labelsData([]);
    }
  }

  window.Globe3D = { setFlights, setSelectedFlight, clear };

  // Self-initialize without touching autocomplete code
  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (initNow()) {
        clearInterval(timer);
      }
      if (tries > 200) {
        clearInterval(timer);
        console.warn("Globe failed to initialize: #globe or window.Globe missing.");
      }
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
