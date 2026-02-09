const express = require('express');
const cors = require('cors');
const { FlightRadar24API } = require('flightradarapi');

const app = express();
const fr24 = new FlightRadar24API();

app.use(cors());
app.use(express.json());

// Get flights for route
app.get('/api/flights', async (req, res) => {
    const { from, to } = req.query;
    
    try {
        const allFlights = await fr24.getFlights();
        
        const routeFlights = allFlights.filter(f => 
            f.originAirportIata === from &&
            f.destinationAirportIata === to
        );
        
        res.json({ flights: routeFlights });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get airport info
app.get('/api/airport/:code', async (req, res) => {
    try {
        const airport = await fr24.getAirport(req.params.code, true);
        res.json({ airport });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get airlines
app.get('/api/airlines', async (req, res) => {
    try {
        const airlines = await fr24.getAirlines();
        res.json({ airlines });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('✈️ FlightRadar24 API server running on port 3000');
});
