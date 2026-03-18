const express = require('express');
const router = express.Router();
const { listVenues, getVenue, deleteVenue } = require('../controllers/venuesController');

router.get('/', listVenues);
router.get('/:id', getVenue);
router.delete('/:id', deleteVenue);

module.exports = router;
