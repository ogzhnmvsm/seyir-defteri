const pool = require('../db/connection');
const { scrapePlay } = require('../../../scraper/src/scrapers/play-scraper');
const { scrapeVenue } = require('../../../scraper/src/scrapers/venue-scraper');
const { savePlay, saveVenue } = require('../../../scraper/src/db/save-to-db');

async function listSuggestions(req, res) {
    const accepted = req.query.accepted;
    const qParam = req.query.q; // search by title
    const type = req.query.type; // play or venue
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        let q = 'SELECT * FROM suggestions';
        const params = [];
        const conditions = [];

        if (accepted === 'true' || accepted === 'false') {
            params.push(accepted === 'true');
            conditions.push(`accepted = $${params.length}`);
        }

        if (type) {
            params.push(type);
            conditions.push(`type = $${params.length}`);
        }

        if (qParam) {
            params.push('%' + qParam + '%');
            conditions.push(`title ILIKE $${params.length}`);
        }

        if (conditions.length > 0) {
            q += ' WHERE ' + conditions.join(' AND ');
        }

        q += ' ORDER BY discovered_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const client = await pool.connect();
        const result = await client.query(q, params);
        client.release();

        res.json({ count: result.rows.length, rows: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function getSuggestion(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM suggestions WHERE id = $1', [id]);
        client.release();

        if (result.rows.length === 0) return res.status(404).json({ error: 'not_found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function acceptSuggestion(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();
        const getRes = await client.query('SELECT * FROM suggestions WHERE id = $1', [id]);
        if (getRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'not_found' });
        }

        const suggestion = getRes.rows[0];
        if (suggestion.accepted) {
            client.release();
            return res.json({ ok: true, message: 'already accepted' });
        }

        // Derive slug if missing
        let slug = suggestion.slug;
        if (!slug && suggestion.biletinial_url) {
            try { slug = suggestion.biletinial_url.split('/').pop(); } catch (e) { slug = null; }
        }

        // Determine source
        let source = 'biletinial';
        if (suggestion.metadata && suggestion.metadata.source) {
            source = suggestion.metadata.source;
        }

        // Scrape + save depending on type and source
        let createdId = null;

        if (source === 'ibb') {
            const { saveIbbPlay, saveIbbVenue } = require('../../../scraper/src/db/save-to-db');
            if (suggestion.type === 'play' && slug) {
                const { scrapeIbbPlay } = require('../../../scraper/src/scrapers/ibb-scraper');
                const playData = await scrapeIbbPlay(slug);
                createdId = await saveIbbPlay(playData, true);
            } else if (suggestion.type === 'venue' && slug) {
                const { scrapeVenueDetail } = require('../../../scraper/src/scrapers/ibb-scraper');
                const detail = await scrapeVenueDetail(slug);
                const venueData = {
                    name: suggestion.title,
                    slug: suggestion.slug,
                    coverImage: suggestion.image_url,
                    address: suggestion.metadata.address,
                    phone: suggestion.metadata.phone,
                    description: suggestion.metadata.description,
                    capacity: detail?.capacity,
                    galleryImages: detail?.galleryImages || []
                };
                createdId = await saveIbbVenue(venueData, true);
            }
        } else {
            if (suggestion.type === 'play' && slug) {
                const playData = await scrapePlay(slug);
                createdId = await savePlay(playData);
            } else if (suggestion.type === 'venue' && slug) {
                const venueData = await scrapeVenue(slug);
                createdId = await saveVenue(venueData);
            }
        }

        // Mark accepted and add created id into metadata if available
        if (createdId) {
            const metaPatch = JSON.stringify(suggestion.metadata || {});
            const newMeta = (JSON.parse(metaPatch) || {});
            if (suggestion.type === 'play') newMeta.created_play_id = createdId;
            if (suggestion.type === 'venue') newMeta.created_venue_id = createdId;
            await client.query('UPDATE suggestions SET accepted = TRUE, metadata = $2 WHERE id = $1', [id, newMeta]);
        } else {
            await client.query('UPDATE suggestions SET accepted = TRUE WHERE id = $1', [id]);
        }

        client.release();
        res.json({ ok: true, createdId: createdId });
    } catch (err) {
        console.error('Accept suggestion error:', err);
        res.status(500).json({ error: 'DB or scrape error' });
    }
}

async function rejectSuggestion(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();
        await client.query('DELETE FROM suggestions WHERE id = $1', [id]);
        client.release();
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

module.exports = { listSuggestions, getSuggestion, acceptSuggestion, rejectSuggestion };