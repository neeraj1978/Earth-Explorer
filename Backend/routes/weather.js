// routes/weather.js
const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();
const OWM_KEY = process.env.OPENWEATHER_KEY;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_WEATHER || '120', 10);

router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat & lng required' });

    const key = `weather:${lat},${lng}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    if (!OWM_KEY) return res.status(500).json({ error: 'OPENWEATHER_KEY not configured' });

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OWM_KEY}&units=metric`;
    const { data } = await axios.get(url);

    cache.set(key, data, CACHE_TTL);
    res.json(data);
  } catch (err) {
    console.error('WEATHER ERR:', err.message);
    res.status(500).json({ error: 'Weather fetch failed' });
  }
});

module.exports = router;
