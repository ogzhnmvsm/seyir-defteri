const pool = require('../db/connection');

// Auto-migrate: create table if not exists
async function ensureTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_ratings (
                id SERIAL PRIMARY KEY,
                play_id INTEGER NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
                times_attended INTEGER NOT NULL DEFAULT 0,
                attended_dates TEXT[] NOT NULL DEFAULT '{}',
                note TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (play_id)
            )
        `);
        // Migrate existing tables: swap showtime_id for new columns
        await pool.query(`ALTER TABLE user_ratings DROP COLUMN IF EXISTS showtime_id`).catch(() => { });
        await pool.query(`ALTER TABLE user_ratings ADD COLUMN IF NOT EXISTS times_attended INTEGER NOT NULL DEFAULT 0`).catch(() => { });
        await pool.query(`ALTER TABLE user_ratings ADD COLUMN IF NOT EXISTS attended_dates TEXT[] NOT NULL DEFAULT '{}'`).catch(() => { });
        await pool.query(`ALTER TABLE user_ratings DROP CONSTRAINT IF EXISTS user_ratings_rating_check`).catch(() => { });
        await pool.query(`ALTER TABLE user_ratings ADD CONSTRAINT user_ratings_rating_check CHECK (rating >= 1 AND rating <= 10)`).catch(() => { });
    } catch (e) {
        console.error('Ratings table migration error:', e);
    }
}
ensureTable().catch((e) => console.error('Ratings table migration failed:', e));

async function listRatings(req, res) {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT r.*, p.title AS play_title, p.poster_url, p.genre
            FROM user_ratings r
            JOIN plays p ON p.id = r.play_id
            ORDER BY r.updated_at DESC
        `);
        client.release();
        res.json({ rows: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function upsertRating(req, res) {
    const { play_id, rating, times_attended, attended_dates, note } = req.body;
    if (!play_id || !rating) return res.status(400).json({ error: 'play_id and rating required' });
    if (rating < 1 || rating > 10) return res.status(400).json({ error: 'rating must be 1-10' });

    try {
        const client = await pool.connect();
        const result = await client.query(`
            INSERT INTO user_ratings (play_id, rating, times_attended, attended_dates, note, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (play_id) DO UPDATE
              SET rating = EXCLUDED.rating,
                  times_attended = EXCLUDED.times_attended,
                  attended_dates = EXCLUDED.attended_dates,
                  note = EXCLUDED.note,
                  updated_at = NOW()
            RETURNING *
        `, [play_id, rating, times_attended ?? 0, attended_dates ?? [], note || null]);
        client.release();
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

async function deleteRating(req, res) {
    const { play_id } = req.params;
    try {
        const client = await pool.connect();
        await client.query('DELETE FROM user_ratings WHERE play_id = $1', [play_id]);
        client.release();
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
}

module.exports = { listRatings, upsertRating, deleteRating };
