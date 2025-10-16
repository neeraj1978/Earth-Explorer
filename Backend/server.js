// server.js (verbose debug version)
require('dotenv').config();
const fs = require('fs');

console.log('== starting server.js ==', new Date().toISOString());

try {
  const express = require('express');
  const cors = require('cors');

  // small helper to show installed versions
  try {
    console.log('Node version:', process.version);
    const pkg = require('./package.json');
    console.log('Project name:', pkg.name, 'version:', pkg.version);
  } catch (e) {
    console.warn('Could not read package.json', e.message);
  }

  const apiLimiter = require('./utils/rateLimiter'); // if this throws, will be caught below

  const geocodeRoutes = require('./routes/geocode');
  const weatherRoutes = require('./routes/weather');
  const timezoneRoutes = require('./routes/timezone');
  const wikiRoutes = require('./routes/wiki');
  const populationRoutes = require('./routes/population');
  const countryRoutes = require("./routes/country");
  const stateRoutes = require("./routes/state");
  
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api', apiLimiter);

  app.get('/', (req, res) => res.json({ ok: true, service: 'earth-backend', timestamp: new Date().toISOString() }));

  app.use('/api/geocode', geocodeRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/timezone', timezoneRoutes);
  app.use('/api/wiki', wikiRoutes);
  app.use('/api/population', populationRoutes);
  app.use("/api/country", countryRoutes);
  app.use("/api/state", stateRoutes);     

  // generic 404
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  const PORT = parseInt(process.env.PORT || '4000', 10);

  const server = app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error event:', err && err.message);
    process.exit(1);
  });

  // global handlers for safety
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err && err.stack || err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
  });

} catch (err) {
  console.error('Top-level error while starting server:', err && err.stack || err);
  // write to file to inspect if console disappears
  try {
    fs.writeFileSync('server-start-error.log', String(err.stack || err));
    console.log('Wrote server-start-error.log');
  } catch (e) {
    console.warn('Could not write error log:', e && e.message);
  }
  process.exit(1);
}
