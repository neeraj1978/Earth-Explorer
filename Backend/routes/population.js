// routes/population.js
const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();
const CACHE_TTL = 60 * 60 * 6; // 6 hours cache by default

/**
 * Helper: search Wikidata for a label and return top entity id (Q...)
 * Uses Wikidata API wbsearchentities
 */
async function findEntityIdByLabel(label) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    label
  )}&language=en&format=json&limit=1`;
  const resp = await axios.get(url, { headers: { 'User-Agent': 'earth-explorer-app/1.0 (contact@example.com)' } });
  const results = resp.data && resp.data.search ? resp.data.search : [];
  if (results.length === 0) return null;
  return {
    id: results[0].id, // e.g., Q1353
    label: results[0].label,
    description: results[0].description,
  };
}

/**
 * Helper: query Wikidata SPARQL endpoint for latest population (P1082) for a given entity id
 */
async function fetchPopulationByEntityId(qid) {
  // SPARQL: get ps:P1082 and possible pq:P585 (point in time), order by date desc, limit 1
  const sparql = `
    SELECT ?population ?pointInTime WHERE {
      wd:${qid} p:P1082 ?popStatement .
      ?popStatement ps:P1082 ?population .
      OPTIONAL { ?popStatement pq:P585 ?pointInTime. }
    }
    ORDER BY DESC(?pointInTime)
    LIMIT 1
  `;
  const url = 'https://query.wikidata.org/sparql';
  const resp = await axios.get(url, {
    params: { query: sparql, format: 'json' },
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'earth-explorer-app/1.0 (contact@example.com)' },
    timeout: 10000,
  });

  const bindings = resp.data && resp.data.results ? resp.data.results.bindings : [];
  if (!bindings || bindings.length === 0) return null;

  const b = bindings[0];
  const population = b.population && b.population.value ? b.population.value : null;
  const pointInTime = b.pointInTime && b.pointInTime.value ? b.pointInTime.value : null;
  return { population, pointInTime };
}

router.get('/', async (req, res) => {
  try {
    const { city, title } = req.query;
    const name = (city || title || '').trim();
    if (!name) return res.status(400).json({ error: 'Please provide ?city=CityName or ?title=PlaceName' });

    const key = `population:${name.toLowerCase()}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    // 1. Find entity ID by label
    const entity = await findEntityIdByLabel(name);
    if (!entity) {
      const payload = { city: name, population: null, message: 'No Wikidata entity found for that name' };
      cache.set(key, payload, CACHE_TTL);
      return res.json(payload);
    }

    // 2. Query population by entity id
    const popData = await fetchPopulationByEntityId(entity.id);
    if (!popData) {
      const payload = { city: name, wikidataId: entity.id, wikidataLabel: entity.label, population: null, message: 'No population data found in Wikidata' };
      cache.set(key, payload, CACHE_TTL);
      return res.json(payload);
    }

    const payload = {
      city: name,
      wikidataId: entity.id,
      wikidataLabel: entity.label,
      wikidataDescription: entity.description,
      population: popData.population ? Number(popData.population) : null,
      populationPointInTime: popData.pointInTime || null,
    };

    cache.set(key, payload, CACHE_TTL);
    res.json(payload);
  } catch (err) {
    console.error('POPULATION ERR:', err && (err.stack || err.message || err));
    res.status(500).json({ error: 'Population lookup failed', details: String(err && err.message) });
  }
});

module.exports = router;
