const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API routes
app.use('/api/amadeus', require('./api/amadeus/search'));
app.use('/api/live', require('./api/live/route'));
app.use('/api', require('./api/health'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Award Flights running on http://localhost:${PORT}`);
});
