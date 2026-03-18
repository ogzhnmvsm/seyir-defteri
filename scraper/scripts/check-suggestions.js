const pool = require('../src/db/connection');

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT COUNT(*) as cnt FROM suggestions');
        console.log('Suggestions count:', res.rows[0].cnt);

        const sample = await client.query('SELECT id, type, title, slug, biletinial_url FROM suggestions ORDER BY discovered_at DESC LIMIT 10');
        console.log('--- Son 10 öneri ---');
        sample.rows.forEach(r => console.log(`${r.id}	${r.type}	${r.title}	${r.slug}	${r.biletinial_url}`));
    } catch (err) {
        console.error('Hata:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();