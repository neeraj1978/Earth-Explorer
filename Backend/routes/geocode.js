// routes/geocode.js (OpenCage version)
const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();
const OPENCAGE_KEY = process.env.OPENCAGE_KEY;
const CACHE_TTL = 60 * 30; // 30 minutes

router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat & lng required' });

    const key = `geocode:${lat},${lng}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    if (!OPENCAGE_KEY) return res.status(500).json({ error: 'OPENCAGE_KEY not set in .env' });

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_KEY}&language=en&pretty=1`;
    const { data } = await axios.get(url);

    // Simplify output for frontend
    const result = {
      formatted: data.results?.[0]?.formatted,
      components: data.results?.[0]?.components,
      geometry: data.results?.[0]?.geometry,
    };

    cache.set(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    console.error('OpenCage geocode error:', err.message);
    res.status(500).json({ error: 'OpenCage geocoding failed' });
  }
});

module.exports = router;
