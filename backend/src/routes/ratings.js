const express = require('express');
const router = express.Router();
const { listRatings, upsertRating, deleteRating } = require('../controllers/ratingsController');

router.get('/', listRatings);
router.post('/', upsertRating);
router.delete('/:play_id', deleteRating);

module.exports = router;
