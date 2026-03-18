const express = require('express');
const router = express.Router();
const { listPlays, getPlay, deletePlay, rescrapePlay } = require('../controllers/playsController');

router.get('/', listPlays);
router.get('/:id', getPlay);
router.delete('/:id', deletePlay);
router.post('/:id/rescrape', rescrapePlay);

module.exports = router;
