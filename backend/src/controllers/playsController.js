const pool = require('../db/connection');
const { scrapePlay } = require('../../../scraper/src/scrapers/play-scraper');
const { savePlay } = require('../../../scraper/src/db/save-to-db');

// plays tablosuna source + ibb_url kolonu ekle (yoksa)
async function migratePlaysSchema() {
    try {
        await pool.query(`ALTER TABLE plays ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'biletinial'`);
        await pool.query(`ALTER TABLE plays ADD COLUMN IF NOT EXISTS ibb_url TEXT`);
    } catch (e) {
        console.error('plays migration error:', e.message);
    }
}
migratePlaysSchema();

async function listPlays(req, res) {
    const q = req.query.q;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        let query = 'SELECT * FROM plays';
        const params = [];
        const conditions = [];

        if (q) {
            params.push('%' + q + '%');
            conditions.push(`title ILIKE $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const client = await pool.connect();
        const result = await client.query(query, params);
        client.release();

        res.json({ count: result.rows.length, rows: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function getPlay(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();

        const playResult = await client.query('SELECT * FROM plays WHERE id = $1', [id]);
        if (playResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'not_found' });
        }

        const play = playResult.rows[0];

        const showtimesResult = await client.query(
            `SELECT s.*, v.name AS venue_name, v.slug AS venue_slug
             FROM showtimes s
             LEFT JOIN venues v ON s.venue_id = v.id
             WHERE s.play_id = $1
             ORDER BY s.show_datetime ASC`,
            [id]
        );

        const showtimes = [];
        for (const row of showtimesResult.rows) {
            const priceResult = await client.query(
                'SELECT category_name, price FROM price_categories WHERE showtime_id = $1',
                [row.id]
            );
            showtimes.push({ ...row, price_categories: priceResult.rows });
        }

        client.release();
        res.json({ ...play, showtimes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function deletePlay(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();

        const check = await client.query('SELECT id, slug FROM plays WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'not_found' });
        }

        await client.query(
            `DELETE FROM price_categories WHERE showtime_id IN (SELECT id FROM showtimes WHERE play_id = $1)`,
            [id]
        );
        await client.query('DELETE FROM showtimes WHERE play_id = $1', [id]);
        await client.query('DELETE FROM plays WHERE id = $1', [id]);
        await client.query(
            `UPDATE suggestions SET accepted = FALSE WHERE slug = $1 AND type = 'play'`,
            [check.rows[0].slug]
        );

        client.release();
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function rescrapePlay(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();
        const check = await client.query('SELECT slug FROM plays WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'not_found' });
        }
        client.release();

        const slug = check.rows[0].slug;
        const playData = await scrapePlay(slug);
        await savePlay(playData);

        res.json({ ok: true, showtimes: playData.showtimes.length });
    } catch (err) {
        console.error('Rescrape error:', err);
        res.status(500).json({ error: 'rescrape_failed' });
    }
}

module.exports = { listPlays, getPlay, deletePlay, rescrapePlay };
