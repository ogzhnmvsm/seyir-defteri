const express = require('express');
const router = express.Router();
const { listSuggestions, getSuggestion, acceptSuggestion, rejectSuggestion } = require('../controllers/suggestionsController');

// GET /api/suggestions?accepted=&limit=&offset=&q=&type=
router.get('/', listSuggestions);

// GET /api/suggestions/:id
router.get('/:id', getSuggestion);

// POST /api/suggestions/:id/accept
router.post('/:id/accept', acceptSuggestion);

// POST /api/suggestions/:id/reject
router.post('/:id/reject', rejectSuggestion);

module.exports = router;