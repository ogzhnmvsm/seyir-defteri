const pool = require('../db/connection');

async function listVenues(req, res) {
    const q = req.query.q;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        let baseQuery = `
            SELECT v.*,
                COALESCE(v.cover_image, (
                    SELECT vg.image_url FROM venue_gallery vg
                    WHERE vg.venue_id = v.id ORDER BY vg.id ASC LIMIT 1
                )) AS cover_image
            FROM venues v
        `;
        const params = [];
        const conditions = [];

        if (q) {
            params.push('%' + q + '%');
            conditions.push(`v.name ILIKE $${params.length}`);
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }

        baseQuery += ` ORDER BY v.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const client = await pool.connect();
        const result = await client.query(baseQuery, params);
        client.release();

        res.json({ count: result.rows.length, rows: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function getVenue(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();

        const venueResult = await client.query(`
            SELECT v.*,
                COALESCE(v.cover_image, (
                    SELECT vg.image_url FROM venue_gallery vg
                    WHERE vg.venue_id = v.id ORDER BY vg.id ASC LIMIT 1
                )) AS cover_image
            FROM venues v WHERE v.id = $1
        `, [id]);
        if (venueResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'not_found' });
        }

        const venue = venueResult.rows[0];

        const galleryResult = await client.query(
            'SELECT id, image_url FROM venue_gallery WHERE venue_id = $1 ORDER BY id ASC',
            [id]
        );

        client.release();
        res.json({ ...venue, gallery: galleryResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function deleteVenue(req, res) {
    const id = req.params.id;
    try {
        const client = await pool.connect();

        const check = await client.query('SELECT id, slug FROM venues WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'not_found' });
        }

        await client.query('DELETE FROM venue_gallery WHERE venue_id = $1', [id]);
        await client.query(
            `DELETE FROM price_categories WHERE showtime_id IN (SELECT id FROM showtimes WHERE venue_id = $1)`,
            [id]
        );
        await client.query('DELETE FROM showtimes WHERE venue_id = $1', [id]);
        await client.query('DELETE FROM venues WHERE id = $1', [id]);
        await client.query(
            `UPDATE suggestions SET accepted = FALSE WHERE slug = $1 AND type = 'venue'`,
            [check.rows[0].slug]
        );

        client.release();
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

module.exports = { listVenues, getVenue, deleteVenue };
