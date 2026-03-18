const pool = require('../db/connection');

async function listShowtimes(req, res) {
    const { play_id, venue_id, city, from, to } = req.query;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    try {
        let query = `
            SELECT s.*,
                   p.title AS play_title,
                   p.poster_url AS play_poster,
                   p.slug AS play_slug,
                   v.name AS venue_name,
                   v.slug AS venue_slug
            FROM showtimes s
            LEFT JOIN plays p ON s.play_id = p.id
            LEFT JOIN venues v ON s.venue_id = v.id
        `;

        const params = [];
        const conditions = [];

        if (play_id) {
            params.push(play_id);
            conditions.push(`s.play_id = $${params.length}`);
        }
        if (venue_id) {
            params.push(venue_id);
            conditions.push(`s.venue_id = $${params.length}`);
        }
        if (city) {
            params.push(city);
            conditions.push(`s.city ILIKE $${params.length}`);
        }
        if (from) {
            params.push(from);
            conditions.push(`s.show_datetime >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            conditions.push(`s.show_datetime <= $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY s.show_datetime ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

module.exports = { listShowtimes };
