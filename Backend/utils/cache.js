// utils/cache.js
const NodeCache = require('node-cache');

const stdTtl = 60 * 5; // default 5 minutes
const cache = new NodeCache({ stdTTL: stdTtl });

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl || stdTtl),
  del: (key) => cache.del(key),
};
