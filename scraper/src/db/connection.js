const { Pool } = require('pg');

// Database bağlantı ayarları
const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
} : {
    user: 'postgres',
    host: 'localhost',
    database: 'tiyatro_takip',
    password: 'postgres',
    port: 5432,
};

const pool = new Pool(poolConfig);

// Bağlantıyı test et
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database bağlantı hatası:', err);
    } else {
        console.log('✅ Database bağlantısı başarılı:', res.rows[0].now);
    }
});

module.exports = pool;