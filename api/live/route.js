const express = require('express');
const router = express.Router();

let FlightRadar24API;
try {
  FlightRadar24API = require('flightradarapi').FlightRadar24API;
} catch (_) {
  FlightRadar24API = null;
}

router.get('/route', async (req, res) => {
  try {
    const from = (req.query.from || '').trim().toUpperCase();
    const to = (req.query.to || '').trim().toUpperCase();

    if (!from || !to || from.length !== 3 || to.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid from/to IATA codes' });
    }

    if (!FlightRadar24API) {
      return res.status(503).json({ success: false, error: 'FlightRadar24 API not available. Install flightradarapi package.', flights: [] });
    }

    const fr24 = new FlightRadar24API();
    const allFlights = await fr24.getFlights();

    const routeFlights = allFlights
      .filter(f => f.originAirportIata === from && f.destinationAirportIata === to)
      .map(f => ({
        id: f.id || f.flightId || `${f.callsign}-${Date.now()}`,
        number: f.number || f.callsign || '',
        airline: f.airlineIcao || '',
        aircraft: f.aircraftCode || '',
        origin: f.originAirportIata || from,
        destination: f.destinationAirportIata || to,
        latitude: f.latitude,
        longitude: f.longitude,
        altitude: f.altitude || 0,
        speed: f.groundSpeed || 0,
        heading: f.heading || 0,
        onGround: f.onGround === 1,
        callsign: f.callsign || '',
      }));

    res.json({ success: true, flights: routeFlights, count: routeFlights.length, from, to });
  } catch (err) {
    console.error('Live route error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error', flights: [] });
  }
});

module.exports = router;
