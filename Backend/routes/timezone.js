// routes/timezone.js
const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();
const TIMEZONEDB_KEY = process.env.TIMEZONEDB_KEY;
const CACHE_TTL = 60 * 10; // 10 min

router.get('/local', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat & lng required' });

    const key = `time:${lat},${lng}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    if (!TIMEZONEDB_KEY) {
      return res.status(400).json({
        error:
          'TIMEZONEDB_KEY not configured. Either set TIMEZONEDB_KEY or call /api/geocode/reverse first to obtain place/timezone info.',
      });
    }

    const url = `http://api.timezonedb.com/v2.1/get-time-zone?key=${TIMEZONEDB_KEY}&format=json&by=position&lat=${lat}&lng=${lng}`;
    const { data } = await axios.get(url);
    cache.set(key, data, CACHE_TTL);
    res.json(data);
  } catch (err) {
    console.error('TIMEZONE ERR:', err.message);
    res.status(500).json({ error: 'Timezone fetch failed' });
  }
});

module.exports = router;
