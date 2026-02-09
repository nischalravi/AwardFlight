const express = require('express');
const cors = require('cors');
const path = require('path');
const { FlightRadar24API } = require('flightradarapi');

const app = express();
const PORT = process.env.PORT || 3000;
const fr24 = new FlightRadar24API();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'FlightRadar24 API active' });
});

app.get('/api/live/route', async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'Missing parameters' });
    
    try {
        const allFlights = await fr24.getFlights();
        const filtered = allFlights.filter(f => 
            f.originAirportIata === from.toUpperCase() &&
            f.destinationAirportIata === to.toUpperCase()
        );
        
        const formatted = filtered.map(f => ({
            id: f.id, number: f.number, airline: f.airlineIcao,
            latitude: f.latitude, longitude: f.longitude,
            altitude: f.altitude, speed: f.groundSpeed, heading: f.heading,
            origin: f.originAirportIata, destination: f.destinationAirportIata
        }));
        
        res.json({ success: true, count: formatted.length, flights: formatted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log('✈️  Award Flights running on http://localhost:' + PORT);
    console.log('📡 FlightRadar24 API Active');
});

module.exports = app;
