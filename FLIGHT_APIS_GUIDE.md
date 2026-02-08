# ✈️ REAL-TIME FLIGHT DATA APIs - Complete Guide

## 🌟 BEST OPTIONS FOR YOUR WEBSITE

---

## 1. **FlightAPI** ⭐ RECOMMENDED FOR AWARD FLIGHTS

**URL:** https://www.flightapi.io/

### Features:
- ✅ Real-time flight **prices** (perfect for your site!)
- ✅ Flight schedules and status
- ✅ 700+ airlines covered
- ✅ One-way, round-trip, multi-city support
- ✅ **Award flight data** available
- ✅ Currency selection
- ✅ Fast response times

### Pricing:
- **Free Trial:** 7 days or 50 requests
- **Starter:** $49/month - 10,000 requests
- **Professional:** $99/month - 50,000 requests
- **Enterprise:** Custom pricing

### Example API Call:
```javascript
const API_KEY = 'your_api_key_here';
const url = `https://www.flightapi.io/compschedule/${API_KEY}?from=JFK&to=MXP&date=2026-02-20`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        console.log(data);
        // Returns: prices, airlines, times, duration, stops
    });
```

### Response Example:
```json
{
    "flights": [
        {
            "airline": "Air France",
            "price": 1250,
            "departureTime": "18:30",
            "arrivalTime": "08:15",
            "duration": "8h 45m",
            "stops": 0,
            "aircraft": "Boeing 777-300ER"
        }
    ]
}
```

---

## 2. **AviationStack** ⭐ GREAT FOR TRACKING

**URL:** https://aviationstack.com/

### Features:
- ✅ Real-time flight tracking
- ✅ 13,000+ airlines
- ✅ 250+ countries
- ✅ Historical flight data
- ✅ Flight schedules
- ✅ Airport data
- ✅ Aircraft information

### Pricing:
- **Free:** 100 requests/month
- **Basic:** $49.99/month - 10,000 requests
- **Professional:** $149.99/month - 100,000 requests
- **Enterprise:** Custom

### Example API Call:
```javascript
const API_KEY = 'your_api_key';
const url = `http://api.aviationstack.com/v1/flights?access_key=${API_KEY}&dep_iata=JFK&arr_iata=MXP`;

fetch(url)
    .then(res => res.json())
    .then(data => console.log(data));
```

---

## 3. **AirLabs** ⭐ BEST FOR LIVE TRACKING

**URL:** https://airlabs.co/

### Features:
- ✅ **Live flight positions** (ADS-B data)
- ✅ Real-time flight tracker
- ✅ Flight schedules
- ✅ Airport timetables
- ✅ Airline routes
- ✅ Historical data

### Pricing:
- **Free:** 1,000 requests/month
- **Basic:** $9/month - 10,000 requests
- **Standard:** $49/month - 100,000 requests

### Example API Call:
```javascript
const API_KEY = 'your_api_key';
const url = `https://airlabs.co/api/v9/schedules?dep_iata=JFK&arr_iata=MXP&api_key=${API_KEY}`;

fetch(url)
    .then(res => res.json())
    .then(data => console.log(data));
```

---

## 4. **FlightAware (AeroAPI)** 🏆 MOST COMPREHENSIVE

**URL:** https://www.flightaware.com/commercial/aeroapi

### Features:
- ✅ **Predictive technology** (Foresight AI)
- ✅ Real-time tracking
- ✅ Historical data back to 2011
- ✅ Flight alerts/notifications
- ✅ 60+ API endpoints
- ✅ Most accurate data

### Pricing:
- **Usage-based** - Pay per request
- **Personal:** $0.001 - $0.005 per query
- **Business:** Custom pricing
- **Enterprise:** Volume discounts

### Example API Call:
```javascript
const API_KEY = 'your_api_key';
const url = `https://aeroapi.flightaware.com/aeroapi/flights/JFK/MXP`;

fetch(url, {
    headers: {
        'x-apikey': API_KEY
    }
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 5. **Aviation Edge** 💼 GOOD ALL-ROUNDER

**URL:** https://aviation-edge.com/

### Features:
- ✅ Real-time flight tracker
- ✅ Flight schedules
- ✅ Airport database (8,000+)
- ✅ Airline routes
- ✅ Aircraft data
- ✅ Historical flights

### Pricing:
- **Free:** 1,000 requests/month
- **Starter:** $29/month - 10,000 requests
- **Professional:** $99/month - 100,000 requests

---

## 6. **Amadeus Travel APIs** 🎯 ENTERPRISE GRADE

**URL:** https://developers.amadeus.com/

### Features:
- ✅ Flight search & booking
- ✅ Real-time prices
- ✅ Flight status
- ✅ Airport & city search
- ✅ Seat maps
- ✅ Hotel & car rental too

### Pricing:
- **Self-Service (Free):** Test with limited requests
- **Enterprise:** Contact sales

---

## 7. **FlightRadar24 API** 📡 PREMIUM TRACKING

**URL:** https://fr24api.flightradar24.com/

### Features:
- ✅ Live flight positions
- ✅ Real-time tracking
- ✅ Historical playback
- ✅ Comprehensive coverage

### Pricing:
- **Custom pricing** - Contact sales

---

## 📊 COMPARISON TABLE

| API | Free Tier | Price/Month | Best For | Delay |
|-----|-----------|-------------|----------|-------|
| **FlightAPI** | 50 requests | $49 | Prices & Schedules | 10 min |
| **AviationStack** | 100 req | $49.99 | General tracking | Real-time |
| **AirLabs** | 1,000 req | $9 | Live positions | Real-time |
| **FlightAware** | No free | $0.001/req | Predictions | Real-time |
| **Aviation Edge** | 1,000 req | $29 | All-in-one | Real-time |
| **Amadeus** | Test only | Enterprise | Booking | Real-time |

---

## 🎯 RECOMMENDATION FOR YOUR SITE

### **Option A: FlightAPI (Best for Award Flights)**
**Why:** Specifically designed for flight price comparison
**Cost:** $49/month
**Best fit because:**
- Gets prices from 700+ airlines
- Supports award flights
- Easy integration
- Good free trial

### **Option B: AirLabs (Best Value)**
**Why:** Most requests in free tier
**Cost:** FREE for 1,000/month, then $9/month
**Best fit because:**
- 1,000 free requests monthly
- Good for starting out
- Real-time schedules
- Very affordable

### **Option C: Hybrid Approach (RECOMMENDED)**
Use multiple APIs:
1. **Airport data:** OpenFlights (FREE) ✅ Already implemented
2. **Flight schedules:** AirLabs ($9/month)
3. **Live tracking:** AviationStack free tier (100/month)

---

## 💻 INTEGRATION EXAMPLE FOR YOUR SITE

Here's how to integrate into your website:

```javascript
// ============================================
// REAL-TIME FLIGHT DATA INTEGRATION
// ============================================

const FLIGHT_API_KEY = 'your_api_key_here';

async function searchRealFlights(from, to, date, passengers, cabinClass) {
    try {
        // FlightAPI example
        const url = `https://www.flightapi.io/compschedule/${FLIGHT_API_KEY}?from=${from}&to=${to}&date=${date}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Transform API data to your format
        const flights = data.flights.map(flight => ({
            airline: flight.airline,
            code: flight.flightNumber,
            aircraft: flight.aircraftType,
            price: flight.price,
            departTime: flight.departureTime,
            arriveTime: flight.arrivalTime,
            duration: flight.duration,
            stops: flight.stops,
            // Add award miles lookup here
            awardMiles: getAwardMiles(flight.airline, cabinClass)
        }));
        
        return flights;
        
    } catch (error) {
        console.error('Error fetching flights:', error);
        // Fallback to static data
        return flightDatabase;
    }
}

// In your search form submission:
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading
    showToast('Searching real-time flights...', 'success');
    
    // Fetch real data
    const flights = await searchRealFlights(from, to, departure, passengers, cabinClass);
    
    // Render results
    renderFlights(flights);
});
```

---

## 🔑 HOW TO GET API KEYS

### FlightAPI:
1. Go to https://www.flightapi.io/
2. Click "Start Free Trial"
3. Sign up with email
4. Get API key instantly
5. 7 days free or 50 requests

### AirLabs:
1. Go to https://airlabs.co/
2. Click "Get API Key"
3. Sign up
4. Get key - 1,000 free requests/month

### AviationStack:
1. Go to https://aviationstack.com/
2. Click "Get Free API Key"
3. Sign up
4. 100 free requests/month

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Choose Your API
**Recommended:** Start with **AirLabs** (1,000 free requests)

### Step 2: Get API Key
Sign up and get your key (takes 2 minutes)

### Step 3: Add to Your Code
```javascript
// Add to search-functionality.js
const AIRLABS_API_KEY = 'your_key_here';

async function fetchRealFlights(from, to, date) {
    const url = `https://airlabs.co/api/v9/schedules?dep_iata=${from}&arr_iata=${to}&api_key=${AIRLABS_API_KEY}`;
    const response = await fetch(url);
    return await response.json();
}
```

### Step 4: Update Your renderFlights()
Use real API data instead of static flightDatabase

### Step 5: Add Loading States
Show spinner while fetching data

---

## 💡 PRO TIPS

### Caching Strategy:
```javascript
// Cache responses for 1 hour
const cacheKey = `flights_${from}_${to}_${date}`;
const cached = localStorage.getItem(cacheKey);
const timestamp = localStorage.getItem(cacheKey + '_time');

if (cached && (Date.now() - timestamp) < 3600000) {
    return JSON.parse(cached);
}

// Otherwise fetch fresh data
const data = await fetchRealFlights(from, to, date);
localStorage.setItem(cacheKey, JSON.stringify(data));
localStorage.setItem(cacheKey + '_time', Date.now());
```

### Rate Limiting:
```javascript
// Avoid hitting API limits
const lastRequest = localStorage.getItem('lastAPIRequest');
const now = Date.now();

if (lastRequest && (now - lastRequest) < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000));
}

localStorage.setItem('lastAPIRequest', now);
```

### Error Handling:
```javascript
try {
    const flights = await fetchRealFlights(from, to, date);
} catch (error) {
    console.error('API Error:', error);
    // Fallback to cached or static data
    showToast('Using cached flight data', 'warning');
    return flightDatabase;
}
```

---

## 🎯 MY RECOMMENDATION

### **For Your Award Flights Website:**

**Best Setup:**
1. **Airports:** OpenFlights API (FREE) ✅ Already done
2. **Flight Schedules:** AirLabs (1,000 free/month)
3. **Award Miles:** Static database (update quarterly)
4. **Credit Cards:** Static database (rarely changes)

### **Cost:** $0 - $9/month
### **Requests:** 1,000 - 10,000/month
### **Coverage:** Global

---

## 📝 NEXT STEPS

### Immediate (Free):
1. ✅ Keep using OpenFlights for airports
2. ✅ Use static flight data for demo
3. ✅ Test with current setup

### When Ready (Paid):
1. Sign up for AirLabs ($9/month)
2. Get API key
3. Integrate into search-functionality.js
4. Add caching layer
5. Deploy with real data

---

## 📞 QUICK START CODE

Want me to create a complete integration file with one of these APIs? Just let me know which one you prefer:

- **FlightAPI** - Best for prices ($49/month)
- **AirLabs** - Best value (1,000 free/month)
- **AviationStack** - Good balance (100 free/month)

I can create the complete integration code for you! 🚀

---

**Summary:** Use **AirLabs** to start (free 1,000/month), upgrade to **FlightAPI** when you need more detailed pricing and award data.
