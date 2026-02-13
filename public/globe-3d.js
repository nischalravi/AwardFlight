async function trackFlightsByRoute(from, to) {
  const url = `/api/live/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const text = await res.text();

    // If Vercel returns HTML, JSON.parse will fail — detect early
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (!isJson) {
      return {
        success: false,
        flights: [],
        error: `Non-JSON response from ${url} (HTTP ${res.status}). Your API route may be missing on Vercel.`
      };
    }

    const data = JSON.parse(text);
    return {
      success: !!data.success,
      flights: data.flights || [],
      count: data.count || (data.flights ? data.flights.length : 0),
      error: data.error || null
    };
  } catch (err) {
    return { success: false, flights: [], error: err.message || "Request failed" };
  }
}
window.trackFlightsByRoute = trackFlightsByRoute;
