// public/live-tracker-client.js
// Robust client for /api/live/route
// - Never crashes on HTML/non-JSON responses (common on Vercel 404/500 pages)
// - Normalizes IATA inputs
// - Provides clear errors + safe fallbacks

(function () {
  "use strict";

  function normIata(v) {
    return String(v || "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  }

  function isIata(v) {
    return /^[A-Z]{3}$/.test(v);
  }

  async function safeReadText(res) {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }

  async function safeReadJson(res) {
    // Only attempt JSON if content-type says json (or looks like json)
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const text = await safeReadText(res);

    if (ct.includes("application/json")) {
      try {
        return { ok: true, data: JSON.parse(text), raw: text };
      } catch {
        return { ok: false, data: null, raw: text };
      }
    }

    // Sometimes Vercel returns json with wrong header; detect
    const looksJson = text.trim().startsWith("{") || text.trim().startsWith("[");
    if (looksJson) {
      try {
        return { ok: true, data: JSON.parse(text), raw: text };
      } catch {
        return { ok: false, data: null, raw: text };
      }
    }

    return { ok: false, data: null, raw: text };
  }

  async function trackFlightsByRoute(from, to, opts = {}) {
    const origin = normIata(from);
    const dest = normIata(to);

    if (!isIata(origin) || !isIata(dest)) {
      return {
        success: false,
        flights: [],
        count: 0,
        error: "Please enter valid 3-letter IATA codes (e.g., JFK, LHR).",
        meta: { origin, dest },
      };
    }

    if (origin === dest) {
      return {
        success: false,
        flights: [],
        count: 0,
        error: "Origin and destination cannot be the same.",
        meta: { origin, dest },
      };
    }

    const endpoint = opts.endpoint || "/api/live/route";
    const url =
      `${endpoint}?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}` +
      (opts.noCache ? `&t=${Date.now()}` : "");

    let res;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
    } catch (e) {
      return {
        success: false,
        flights: [],
        count: 0,
        error: "Network error. Please check your connection and try again.",
        meta: { origin, dest, detail: String(e?.message || e) },
      };
    }

    const parsed = await safeReadJson(res);

    // If backend returned valid JSON, use it
    if (parsed.ok && parsed.data) {
      const data = parsed.data;

      if (!res.ok) {
        return {
          success: false,
          flights: [],
          count: 0,
          error: data?.error || data?.message || `Live route API error (${res.status})`,
          meta: { origin, dest, status: res.status },
        };
      }

      const flights = Array.isArray(data?.flights) ? data.flights : [];
      return {
        success: true,
        flights,
        count: typeof data?.count === "number" ? data.count : flights.length,
        meta: { origin, dest, status: res.status },
      };
    }

    // Non-JSON response (usually Vercel error HTML). Provide a readable error.
    const snippet = (parsed.raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
    return {
      success: false,
      flights: [],
      count: 0,
      error:
        `Live route API returned non-JSON (${res.status}). ` +
        (snippet ? `Response: ${snippet}` : "Check Vercel function logs."),
      meta: { origin, dest, status: res.status },
    };
  }

  // Optional helper: turn raw flight into UI-friendly values
  function formatFlight(f) {
    const altitudeFt = Number(f?.altitude);
    const speedKt = Number(f?.speed);
    const heading = Number(f?.heading);

    return {
      ...f,
      altitudeFt: Number.isFinite(altitudeFt) ? altitudeFt : null,
      altitudeKft: Number.isFinite(altitudeFt) ? Math.round(altitudeFt / 1000) : null,
      speedKt: Number.isFinite(speedKt) ? speedKt : null,
      heading: Number.isFinite(heading) ? heading : null,
      lat: Number(f?.latitude),
      lng: Number(f?.longitude),
    };
  }

  // Expose to window (so live-tracker.html can call it)
  window.trackFlightsByRoute = trackFlightsByRoute;
  window.formatTrackedFlight = formatFlight;
})();
