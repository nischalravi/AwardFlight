// public/globe-3d.js
// Renders:
// - ALL flights as points
// - SELECTED flight as a big "✈" sprite (always visible)
// API:
//   window.Globe3D.setFlights(flights)
//   window.Globe3D.setSelectedFlight(flightId)

(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(() => {
    const globeEl = document.getElementById("globe");
    if (!globeEl) return;

    // Wait until globe.gl has loaded and created window.Globe()
    const waitForGlobe = () => {
      if (!window.Globe || !window.THREE) return setTimeout(waitForGlobe, 50);
      init();
    };
    waitForGlobe();

    function init() {
      let flights = [];
      let selectedId = null;

      // ---- plane sprite factory (canvas texture) ----
      function makePlaneSprite(headingDeg) {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, size, size);

        // Draw a clear, big plane icon
        ctx.font = "180px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // glow
        ctx.shadowColor = "rgba(197,255,104,0.85)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#c5ff68";
        ctx.fillText("✈", size / 2, size / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          depthTest: true,
        });

        const sprite = new THREE.Sprite(material);

        // Size in 3D world (tweak if you want bigger/smaller)
        sprite.scale.set(12, 12, 1);

        // Rotate to heading (Globe is in 3D; sprite rotation is screen-facing, but rotateZ still helps)
        const heading = Number(headingDeg);
        if (Number.isFinite(heading)) {
          sprite.material.rotation = (-heading * Math.PI) / 180; // negate so it “points” correctly
        }

        return sprite;
      }

      function validLatLng(f) {
        return Number.isFinite(f?.latitude) && Number.isFinite(f?.longitude);
      }

      const globe = Globe()(globeEl)
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundColor("#0a0f1e")
        // --- points (all flights) ---
        .pointAltitude(0.02)
        .pointRadius(0.30)
        .pointColor(() => "#c5ff68")
        .pointsData([])
        .pointLabel((d) => d.number || d.id || "")
        // --- selected plane as object sprite ---
        .objectsData([])
        .objectLat((d) => d.latitude)
        .objectLng((d) => d.longitude)
        .objectAltitude(() => 0.06) // lift plane slightly above surface
        .objectThreeObject((d) => makePlaneSprite(d.heading));

      // Controls / initial camera
      globe.controls().enableDamping = true;
      globe.controls().dampingFactor = 0.08;
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

      // Keep the canvas sized to its container
      function resize() {
        try {
          globe.width(globeEl.clientWidth);
          globe.height(globeEl.clientHeight);
        } catch (_) {}
      }
      window.addEventListener("resize", resize);
      setTimeout(resize, 0);

      function render() {
        // All flight points
        const pts = flights
          .filter(validLatLng)
          .map((f) => ({
            latitude: f.latitude,
            longitude: f.longitude,
            id: f.id,
            number: f.number,
          }));
        globe.pointsData(pts);

        // Selected plane sprite
        const sel = flights.find((f) => f?.id === selectedId && validLatLng(f));
        if (sel) {
          globe.objectsData([sel]);

          // Camera nudge to selected flight
          globe.pointOfView(
            { lat: sel.latitude, lng: sel.longitude, altitude: 1.6 },
            900
          );
        } else {
          globe.objectsData([]);
        }
      }

      function setFlights(next) {
        flights = Array.isArray(next) ? next : [];
        if (flights.length && !selectedId) selectedId = flights[0]?.id || null;
        render();
      }

      function setSelectedFlight(id) {
        selectedId = id || null;
        render();
      }

      window.Globe3D = { setFlights, setSelectedFlight };
    }
  });
})();
