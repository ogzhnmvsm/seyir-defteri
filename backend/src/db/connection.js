const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'tiyatro_takip',
    password: process.env.PG_PASSWORD || 'postgres',
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database bağlantı hatası (backend):', err);
    } else {
        console.log('✅ Backend DB bağlantısı başarılı:', res.rows[0].now);
    }
});

module.exports = pool;