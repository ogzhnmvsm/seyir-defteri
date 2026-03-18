const express = require('express');
const router = express.Router();
const { listShowtimes } = require('../controllers/showtimesController');

// GET /api/showtimes?play_id=&venue_id=&city=&from=&to=&limit=&offset=
router.get('/', listShowtimes);

module.exports = router;
