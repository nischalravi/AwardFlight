/* public/globe-3d.js
   Globe renderer using Globe.gl
   Exposes: window.AwardGlobe = { init(el), setFlights(flights), clear(), resize() }
*/
(function () {
  let globe = null;
  let containerEl = null;

  function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function init(el) {
    containerEl = el;
    if (!containerEl) return null;

    if (globe) return globe;

    if (!window.Globe) {
      console.warn("Globe.gl not loaded. Make sure globe.gl is included before globe-3d.js");
      return null;
    }

    globe = Globe()(containerEl)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#0a0f1e")

      // Points (aircraft markers)
      .pointsData([])
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude("alt")
      .pointRadius("r")
      .pointColor("color")

      // Labels (flight numbers)
      .labelsData([])
      .labelLat("lat")
      .labelLng("lng")
      .labelText("text")
      .labelColor(() => "#c5ff68")
      .labelSize(() => 1.1)
      .labelDotRadius(() => 0.2)
      .labelAltitude(() => 0.02);

    // Controls
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.35;
    controls.zoomSpeed = 0.6;

    // Initial view
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 0);

    // Set initial size
    resize();

    return globe;
  }

  function resize() {
    if (!globe || !containerEl) return;
    const w = containerEl.clientWidth || 800;
    const h = containerEl.clientHeight || 440;
    globe.width(w);
    globe.height(h);
  }

  function clear() {
    if (!globe) return;
    globe.pointsData([]);
    globe.labelsData([]);
  }

  function setFlights(flights) {
    if (!globe) return;

    const pts = [];
    const labels = [];

    for (const f of flights || []) {
      const lat = safeNum(f.latitude);
      const lng = safeNum(f.longitude);
      if (lat == null || lng == null) continue;

      // Make them very visible:
      pts.push({
        lat,
        lng,
        // Small altitude so it sits just above globe surface:
        alt: 0.03,
        r: 0.55,          // BIGGER radius so you can see it
        color: "#c5ff68",
        id: f.id || "",
        text: (f.number || f.id || "").toString()
      });

      // Label near the dot (optional, but helpful)
      labels.push({
        lat,
        lng,
        text: (f.number || "").toString() || "✈︎"
      });
    }

    globe.pointsData(pts);
    globe.labelsData(labels);

    // Auto-center if we have points
    if (pts.length) {
      const avgLat = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
      const avgLng = pts.reduce((a, p) => a + p.lng, 0) / pts.length;
      globe.pointOfView({ lat: avgLat, lng: avgLng, altitude: 1.55 }, 900);
    }
  }

  // Expose API
  window.AwardGlobe = { init, setFlights, clear, resize };

  // auto-resize on window resize
  window.addEventListener("resize", () => window.AwardGlobe.resize());
})();
