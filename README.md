# Award Flights ✈️

Search 100+ airlines, compare award flights, and track live flights on a 3D globe. Book business class for economy points.

## Features

- **Smart Flight Search** — Compare flights across airlines with points pricing via Amadeus API
- **3D Live Flight Tracker** — Track any flight on an interactive globe using FlightRadar24 + Globe.gl
- **Points Calculator** — Find the best transfer partner and redemption value
- **Hot Deals** — Premium routes at economy prices

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS with TravelNexus design system (dark theme, DM Sans/Syne/JetBrains Mono)
- **Backend**: Node.js + Express
- **APIs**: Amadeus Flight Search, FlightRadar24, Open-Meteo Weather
- **3D Globe**: Globe.gl + Three.js
- **Deployment**: Vercel

## Quick Start

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/award-flights.git
cd award-flights
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Amadeus API credentials

# Run locally
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect the GitHub repo to Vercel for automatic deployments.

## Environment Variables

| Variable | Description |
|---|---|
| `AMADEUS_API_KEY` | Amadeus API key |
| `AMADEUS_API_SECRET` | Amadeus API secret |
| `AMADEUS_BASE_URL` | `https://test.api.amadeus.com` (test) or `https://api.amadeus.com` (prod) |

## Project Structure

```
award-flights/
├── api/
│   ├── amadeus/search.js    # Amadeus flight search endpoint
│   ├── live/route.js         # FlightRadar24 live tracking endpoint
│   └── health.js             # Health check
├── public/
│   ├── index.html            # Home page with search
│   ├── search.html           # Search results
│   ├── live-tracker.html     # 3D globe flight tracker
│   ├── calculator.html       # Points calculator
│   ├── deals.html            # Hot deals
│   ├── dashboard.html        # User dashboard (coming soon)
│   ├── styles.css            # TravelNexus design system
│   ├── script.js             # Shared logic + autocomplete
│   ├── search-client.js      # Search results controller
│   ├── globe-3d.js           # Globe.gl controller
│   ├── live-tracker-client.js # Live tracker controller
│   ├── airport-loader.js     # Airport DB loader
│   └── airports-database.js  # Pre-built airport database
├── server.js                 # Express server
├── vercel.json               # Vercel deployment config
├── package.json
└── .env.example
```

## License

MIT
