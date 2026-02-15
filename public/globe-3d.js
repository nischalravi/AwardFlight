/* public/globe-3d.js
   window.Globe3D:
     - setFlights(flights)
     - setSelectedFlight(id)
   Renders:
     - All flights as small dots
     - Selected flight as a rotated plane icon + a short forward path segment
*/

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

    // All flights as points
    .pointAltitude(0.02)
    .pointRadius(0.26)
    .pointColor(() => "#c5ff68")
    .pointsData([])

    // Selected-flight direction arc (short)
    .arcColor(() => ["rgba(255,196,0,0.95)", "rgba(255,196,0,0.0)"])
    .arcStroke(0.7)
    .arcDashLength(0.55)
    .arcDashGap(0.32)
    .arcDashAnimateTime(1600)
    .arcsData([])

    // Selected flight plane icon
    .htmlElementsData([])
    .htmlElement((d) => d.el);

  globe.controls().enableDamping = true;
  globe.controls().dampingFactor = 0.08;

  // Start centered and reasonable zoom
  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

  function validLatLng(f) {
    return Number.isFinite(f?.latitude) && Number.isFinite(f?.longitude);
  }

  function toRad(deg) {
    return (Number(deg) * Math.PI) / 180;
  }

  // Great-circle forward projection
  function projectForward(lat, lng, bearingDeg, distanceKm) {
    const R = 6371;
    const brng = toRad(bearingDeg || 0);
    const φ1 = toRad(lat);
    const λ1 = toRad(lng);
    const δ = distanceKm / R;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(brng));
    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
      );

    return { lat: (φ2 * 180) / Math.PI, lng: ((λ2 * 180) / Math.PI + 540) % 360 - 180 };
  }

  function makePlaneEl(headingDeg) {
    const el = document.createElement("div");
    el.style.width = "44px";
    el.style.height = "44px";
    el.style.pointerEvents = "none";
    el.style.position = "absolute";
    el.style.filter = "drop-shadow(0 10px 18px rgba(0,0,0,0.45))";

    el.innerHTML = `
      <svg viewBox="0 0 64 64" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
        <path fill="#c5ff68" d="M32 2c2 0 4 2 4 4v18l16 10c2 1 2 4 0 5l-16 9v10l8 4c1 1 2 3 1 4s-3 2-4 1l-9-4-9 4c-1 1-3 0-4-1s0-3 1-4l8-4V48L12 39c-2-1-2-4 0-5l16-10V6c0-2 2-4 4-4z"/>
      </svg>
    `;

    // SVG points "up" by default; rotate by heading.
    el.style.transform = `translate(-50%, -50%) rotate(${Number(headingDeg) || 0}deg)`;
    return el;
  }

  function resize() {
    try {
      globe.width(globeEl.clientWidth);
      globe.height(globeEl.clientHeight);
    } catch (_) {}
  }
  window.addEventListener("resize", resize);
  setTimeout(resize, 0);
  setTimeout(resize, 150);
  
  function render() {
    const pts = flights
      .filter(validLatLng)
      .map((f) => ({ lat: f.latitude, lng: f.longitude, id: f.id }));
    globe.pointsData(pts);

    const sel = flights.find((f) => f?.id === selectedId && validLatLng(f));

    if (!sel) {
      globe.arcsData([]);
      globe.htmlElementsData([]);
      return;
    }

    // distance for direction line: based on speed if available
    const spd = Number(sel.speed);
    const distKm = Number.isFinite(spd) ? Math.min(900, Math.max(140, spd * 1.1)) : 260;

    const forward = projectForward(sel.latitude, sel.longitude, sel.heading || 0, distKm);

    globe.arcsData([
      { startLat: sel.latitude, startLng: sel.longitude, endLat: forward.lat, endLng: forward.lng },
    ]);

    globe.htmlElementsData([
      { lat: sel.latitude, lng: sel.longitude, el: makePlaneEl(sel.heading || 0) },
    ]);

    // Keep it centered on selected flight
    globe.pointOfView({ lat: sel.latitude, lng: sel.longitude, altitude: 1.55 }, 800);
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

  window.Globe3D = { setFlights, setSelectedFlight };
})();
