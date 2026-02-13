const express = require('express');
const cors = require('cors');
const path = require('path');
const { FlightRadar24API } = require('flightradarapi');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize APIs
const fr24 = new FlightRadar24API();

// Amadeus API Credentials
const AMADEUS_KEY = 'RwoAlqEE4oqRDAVx7iKn3KLusXbYKuha';
const AMADEUS_SECRET = '03Gvmr1kOpCJrFon';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

let amadeusToken = null;
let tokenExpiry = 0;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ============================================
// AMADEUS API - AUTHENTICATION
// ============================================

async function getAmadeusToken() {
    if (amadeusToken && Date.now() < tokenExpiry) {
        return amadeusToken;
    }
    
    try {
        const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${AMADEUS_KEY}&client_secret=${AMADEUS_SECRET}`
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            amadeusToken = data.access_token;
            tokenExpiry = Date.now() + ((data.expires_in - 60) * 1000);
            console.log('✅ Amadeus token obtained');
            return amadeusToken;
        } else {
            throw new Error('Failed to get Amadeus token');
        }
    } catch (error) {
        console.error('❌ Amadeus auth error:', error);
        throw error;
    }
}

// ============================================
// AMADEUS API - FLIGHT SEARCH
// ============================================

app.get('/api/amadeus/search', async (req, res) => {
    const { from, to, date, adults = 1 } = req.query;
    
    if (!from || !to || !date) {
        return res.status(400).json({ 
            error: 'Missing required parameters',
            required: ['from', 'to', 'date']
        });
    }
    
    try {
        console.log(`🔍 Amadeus Search: ${from} → ${to} on ${date}`);
        
        const token = await getAmadeusToken();
        
        const url = `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?` +
                    `originLocationCode=${from}&` +
                    `destinationLocationCode=${to}&` +
                    `departureDate=${date}&` +
                    `adults=${adults}&` +
                    `max=50&` +
                    `currencyCode=USD`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors?.[0]?.detail || 'Amadeus API error');
        }
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            return res.json({ success: true, count: 0, flights: [] });
        }
        
        const flights = data.data.map((offer, index) => {
            const outbound = offer.itineraries[0];
            const first = outbound.segments[0];
            const last = outbound.segments[outbound.segments.length - 1];
            const airlineCode = offer.validatingAirlineCodes[0];
            
            return {
                id: index + 1,
                airline: getAirlineName(airlineCode),
                airlineCode: airlineCode,
                code: `${airlineCode} ${Math.floor(Math.random() * 900) + 100}`,
                aircraft: first.aircraft?.code || 'Unknown',
                logo: '✈',
                logoColor: getAirlineColor(airlineCode),
                price: Math.round(parseFloat(offer.price.total)),
                currency: offer.price.currency,
                departTime: formatTime(first.departure.at),
                arriveTime: formatTime(last.arrival.at),
                departAirport: `${first.departure.iataCode}`,
                arriveAirport: `${last.arrival.iataCode}`,
                duration: formatDuration(outbound.duration),
                stops: outbound.segments.length - 1,
                stopInfo: outbound.segments.length === 1 ? 'Non-stop' : `${outbound.segments.length - 1} stop${outbound.segments.length > 2 ? 's' : ''}`,
                legroom: 'Standard (31")',
                entertainment: true,
                meal: 'Meal included',
                departTimeCategory: getTimeCategory(first.departure.at),
                awardMiles: estimateAwardMiles(airlineCode),
                transferPartners: getTransferPartners(airlineCode)
            };
        });
        
        console.log(`✅ Returning ${flights.length} formatted flights`);
        
        res.json({ success: true, count: flights.length, flights });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function getAirlineName(code) {
    const names = {
        'AF': 'Air France', 'BA': 'British Airways', 'LH': 'Lufthansa',
        'EK': 'Emirates', 'DL': 'Delta', 'AA': 'American Airlines',
        'UA': 'United', 'KL': 'KLM', 'IB': 'Iberia', 'AZ': 'ITA Airways',
        '6E': 'IndiGo', 'AI': 'Air India', 'SG': 'SpiceJet'
    };
    return names[code] || code;
}

function getAirlineColor(code) {
    const colors = {
        'AF': 'linear-gradient(135deg, #e74c3c, #c0392b)',
        'BA': 'linear-gradient(135deg, #3498db, #2980b9)',
        'LH': 'linear-gradient(135deg, #f39c12, #e67e22)',
        'EK': 'linear-gradient(135deg, #c0392b, #e74c3c)'
    };
    return colors[code] || 'linear-gradient(135deg, #8e44ad, #9b59b6)';
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDuration(iso) {
    const m = iso.match(/PT(\d+)H(\d+)M/);
    return m ? `${m[1]}h ${m[2]}m` : iso.replace('PT', '').toLowerCase();
}

function getTimeCategory(iso) {
    const h = new Date(iso).getHours();
    return h >= 6 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : 'evening';
}

function estimateAwardMiles(code) {
    const miles = {
        'AF': { program: 'Flying Blue', economyClass: 25000, businessClass: 55000, firstClass: 90000 },
        'BA': { program: 'Avios', economyClass: 26000, businessClass: 68000, firstClass: 102000 },
        'LH': { program: 'Miles & More', economyClass: 30000, businessClass: 70000, firstClass: 110000 },
        'EK': { program: 'Skywards', economyClass: 40000, businessClass: 85000, firstClass: 180000 }
    };
    return miles[code] || { program: 'Partner', economyClass: 30000, businessClass: 60000, firstClass: 100000 };
}

function getTransferPartners(code) {
    const partners = {
        'AF': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }, { name: 'Chase UR', ratio: '1:1', class: 'chase' }, { name: 'Citi TYP', ratio: '1:1', class: 'citi' }],
        'BA': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }, { name: 'Chase UR', ratio: '1:1', class: 'chase' }],
        'LH': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }, { name: 'Chase UR', ratio: '1:1', class: 'chase' }],
        'EK': [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }]
    };
    return partners[code] || [{ name: 'Amex MR', ratio: '1:1', class: 'amex' }];
}

// ============================================
// FLIGHTRADAR24 API - LIVE TRACKING
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        apis: {
            flightRadar24: 'active',
            amadeus: 'active'
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/live/route', async (req, res) => {
    const { from, to } = req.query;
    
    if (!from || !to) {
        return res.status(400).json({ error: 'Missing from/to parameters' });
    }
    
    try {
        const allFlights = await fr24.getFlights();
        const filtered = allFlights.filter(f => 
            f.originAirportIata === from.toUpperCase() &&
            f.destinationAirportIata === to.toUpperCase()
        );
        
        const formatted = filtered.map(f => ({
            id: f.id,
            number: f.number,
            airline: f.airlineIcao,
            latitude: f.latitude,
            longitude: f.longitude,
            altitude: f.altitude,
            speed: f.groundSpeed,
            heading: f.heading,
            origin: f.originAirportIata,
            destination: f.destinationAirportIata
        }));
        
        res.json({ success: true, count: formatted.length, flights: formatted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  ✈️  Award Flights API Server        ║');
    console.log(`║  🌐 http://localhost:${PORT}           ║`);
    console.log('║  📡 FlightRadar24: Live Tracking     ║');
    console.log('║  🎯 Amadeus: Real Flight Search      ║');
    console.log('╚═══════════════════════════════════════╝\n');
    console.log('API Endpoints:');
    console.log('  GET /api/health');
    console.log('  GET /api/live/route?from=JFK&to=LHR');
    console.log('  GET /api/amadeus/search?from=JFK&to=BLR&date=2026-02-20\n');
});

module.exports = app;
