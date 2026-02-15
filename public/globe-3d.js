// public/globe-3d.js
// Globe controller with:
// - setFlights(flights)
// - setSelectedFlight(flightId)
// - renders ALL flights as points
// - renders SELECTED flight as a plane label

(function () {
  const globeEl = document.getElementById("globe");
  if (!globeEl) return;

  if (!window.Globe) {
    console.warn("Globe.gl not loaded");
    return;
  }

  let flights = [];
  let selectedId = null;

  const globe = Globe()(globeEl)
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
    .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
    .backgroundColor("#0a0f1e")
    .pointAltitude(0.02)
    .pointRadius(0.35)              // bigger so you can see them
    .pointColor(() => "#c5ff68")
    .pointsData([])
    .labelAltitude(0.04)
    .labelSize(1.2)
    .labelDotRadius(0.2)
    .labelColor(() => "#c5ff68")
    .labelsData([]);

  globe.controls().enableDamping = true;
  globe.controls().dampingFactor = 0.08;
  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

  function validLatLng(f) {
    return typeof f.latitude === "number" && typeof f.longitude === "number";
  }

  function render() {
    const pts = flights.filter(validLatLng).map((f) => ({
      lat: f.latitude,
      lng: f.longitude,
      id: f.id,
      number: f.number
    }));

    globe.pointsData(pts);

    // Selected flight label as "✈"
    const sel = flights.find((f) => f.id === selectedId && validLatLng(f));
    if (sel) {
      globe.labelsData([{
        lat: sel.latitude,
        lng: sel.longitude,
        text: `✈ ${sel.number || sel.id || ""}`.trim()
      }]);

      globe.labelText((d) => d.text);

      // pull camera near selected flight
      globe.pointOfView({ lat: sel.latitude, lng: sel.longitude, altitude: 1.6 }, 900);
    } else {
      globe.labelsData([]);
    }
  }

  function setFlights(next) {
    flights = Array.isArray(next) ? next : [];
    // if selection missing, pick first
    if (flights.length && !selectedId) selectedId = flights[0].id;
    render();
  }

  function setSelectedFlight(id) {
    selectedId = id || null;
    render();
  }

  // Resize fix
  window.addEventListener("resize", () => {
    try {
      globe.width([globeEl.clientWidth]);
      globe.height([globeEl.clientHeight]);
    } catch (_) {}
  });

  window.Globe3D = { setFlights, setSelectedFlight };
})();
