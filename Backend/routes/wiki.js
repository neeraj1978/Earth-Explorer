// routes/wiki.js
const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();
const CACHE_TTL = parseInt(process.env.CACHE_TTL_WIKI || '21600', 10); // default 6 hours

router.get('/summary', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'title required' });

    const key = `wiki:${title.toLowerCase()}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'earth-explorer-app/1.0 (contact@example.com)' } });

    cache.set(key, data, CACHE_TTL);
    res.json(data);
  } catch (err) {
    console.error('WIKI ERR:', err.message);
    res.status(500).json({ error: 'Wikipedia fetch failed' });
  }
});

module.exports = router;
