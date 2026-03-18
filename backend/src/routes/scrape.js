const express = require('express');
const router = express.Router();
const { runDiscover, runScrapePlay, runScrapeVenue } = require('../controllers/scrapeController');

// POST /api/scrape/discover { startUrl?, pageLimit? }
router.post('/discover', runDiscover);

// POST /api/scrape/play/:slug
router.post('/play/:slug', runScrapePlay);

// POST /api/scrape/venue/:slug
router.post('/venue/:slug', runScrapeVenue);

module.exports = router;