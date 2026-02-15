/* public/globe-3d.js - BIGGER points + selected ✈ label */

(function () {
  let globe = null;
  let globeEl = null;

  let flights = [];
  let selectedId = null;

  function toNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  function valid(f) {
    const lat = toNum(f.latitude);
    const lng = toNum(f.longitude);
    return lat != null && lng != null;
  }

  function init(el) {
    if (globe) return;
    globeEl = el;

    if (!window.Globe) {
      console.warn("Globe.gl not loaded");
      return;
    }

    globe = Globe()(globeEl)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#0a0f1e")

      // ✅ Make points easy to see
      .pointAltitude(0.06)
      .pointRadius(0.7)
      .pointColor(() => "#c5ff68")
      .pointsData([])

      // ✅ Selected flight label
      .labelAltitude(0.10)
      .labelSize(1.4)
      .labelDotRadius(0.35)
      .labelColor(() => "#c5ff68")
      .labelsData([]);

    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;

    requestAnimationFrame(() => {
      try {
        globe.width(globeEl.clientWidth);
        globe.height(globeEl.clientHeight);
      } catch (_) {}
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);
    });

    window.addEventListener("resize", () => {
      if (!globe || !globeEl) return;
      try {
        globe.width(globeEl.clientWidth);
        globe.height(globeEl.clientHeight);
      } catch (_) {}
    });
  }

  function render() {
    if (!globe) return;

    const pts = flights
      .filter(valid)
      .map((f) => ({
        lat: toNum(f.latitude),
        lng: toNum(f.longitude),
        id: f.id,
        number: f.number || f.id,
      }));

    globe.pointsData(pts);

    const sel = flights.find((f) => f.id === selectedId && valid(f));
    if (sel) {
      const lat = toNum(sel.latitude);
      const lng = toNum(sel.longitude);

      globe.labelsData([
        { lat, lng, text: `✈ ${sel.number || sel.id}` }
      ]);
      globe.labelText((d) => d.text);

      globe.pointOfView({ lat, lng, altitude: 1.55 }, 900);
    } else {
      globe.labelsData([]);
    }
  }

  function setFlights(next) {
    flights = Array.isArray(next) ? next : [];
    if (flights.length && !selectedId) selectedId = flights[0].id;
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

  window.Globe3D = { init, setFlights, setSelectedFlight, clear };
})();
