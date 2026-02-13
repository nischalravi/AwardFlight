async function trackFlightsByRoute(from, to) {
    try {
        const response = await fetch('/api/live/route?from=' + from + '&to=' + to);
        const data = await response.json();
        return data.flights || [];
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}
