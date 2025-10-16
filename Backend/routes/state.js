// routes/state.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/info", async (req, res) => {
  const { country, state } = req.query;
  if (!country || !state) {
    return res.status(400).json({ error: "Country and state are required." });
  }

  try {
    // Try to get Wikipedia summary for state
    const wikiResp = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(state)}`
    );
    const wiki_extract = wikiResp.data?.extract || "No Wikipedia summary found.";

    // Optional: fetch state-level population from GeoNames or local dataset (mocked here)
    const popResp = await axios
      .get(`https://countriesnow.space/api/v0.1/countries/state/cities`, {
        params: { country, state },
      })
      .catch(() => ({ data: { population: null } }));

    res.json({
      country,
      state,
      population: popResp.data?.population || null,
      wiki_extract,
    });
  } catch (err) {
    console.error("State info error:", err.message);
    res.status(500).json({ error: "Failed to fetch state info." });
  }
});

module.exports = router;
