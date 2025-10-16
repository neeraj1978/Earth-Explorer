// routes/country.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/info", async (req, res) => {
  const { country } = req.query;
  if (!country) return res.status(400).json({ error: "Country is required" });

  try {
    // Fetch country info
    const restResp = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`);
    const countryData = restResp.data?.[0];

    const name = countryData?.name?.common || country;
    const capital = countryData?.capital?.[0] || "N/A";
    const population = countryData?.population || null;
    const area_km2 = countryData?.area || null;
    const flag_url = countryData?.flags?.svg || countryData?.flags?.png || null;
    const region = countryData?.region || "N/A";
    const subregion = countryData?.subregion || "N/A";
    const currencies = countryData?.currencies ? Object.keys(countryData.currencies).join(", ") : "N/A";

    // Fetch wiki summary
    const wikiResp = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
    const wiki_extract = wikiResp.data?.extract || "No Wikipedia summary found.";

    res.json({
      name,
      capital,
      population,
      area_km2,
      flag_url,
      region,
      subregion,
      currencies,
      wiki_extract,
    });
  } catch (err) {
    console.error("Country info error:", err.message);
    res.status(500).json({ error: "Failed to fetch country info." });
  }
});

module.exports = router;
