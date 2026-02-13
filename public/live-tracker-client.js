// public/live-tracker-client.js

function isIata(code) {
  return typeof code === "string" && /^[A-Za-z]{3}$/.test(code.trim());
}

function normIata(code) {
  return String(code || "").trim().toUpperCase();
}

/**
 * Fetch JSON safely (won't crash if server returns HTML like a Vercel 404 page).
 */
async function fetchJsonSafe(url, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // This happens when the endpoint returns HTML (e.g., 404 page on Vercel)
      throw new Error(
        `Non-JSON response (${res.status}). Likely missing API route. First chars: ${text.slice(
          0,
          80
        )}`
      );
    }

    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Track live flights by route.
 * Returns:
 *   { success: boolean, flights: array, error?: string }
 */
async function trackFlightsByRoute(from, to) {
  const fromIata = normIata(from);
  const toIata = normIata(to);

  // Validate client-side so we don't spam the API
  if (!isIata(fromIata) || !isIata(toIata)) {
    return { success: false, flights: [], error: "Please enter valid 3-letter IATA codes (e.g., JFK, LHR)." };
  }
  if (fromIata === toIata) {
    return { success: false, flights: [], error: "Origin and destination cannot be the same." };
  }

  const url = `/api/live/route?from=${encodeURIComponent(fromIata)}&to=${encodeURIComponent(toIata)}`;

  try {
    const data = await fetchJsonSafe(url);

    // Ensure predictable output
    const flights = Array.isArray(data?.flights) ? data.flights : [];
    return { success: true, flights };
  } catch (err) {
    console.error("Live tracker error:", err?.message || err);
    return {
      success: false,
      flights: [],
      error: err?.message || "Live route lookup failed",
    };
  }
}

// Expose globally if your HTML calls it directly
window.trackFlightsByRoute = trackFlightsByRoute;
