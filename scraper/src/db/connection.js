const { Pool } = require('pg');

// Database bağlantı ayarları
const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 4,
    prepare: false,
} : {
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'tiyatro_takip',
    password: process.env.PG_PASSWORD || 'postgres',
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
};

const pool = new Pool(poolConfig);

// Bağlantıyı test et
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database bağlantı hatası:', err);
    } else {
        const mode = process.env.DATABASE_URL ? '🌐 Supabase (DATABASE_URL)' : '💻 Local PostgreSQL';
        console.log(`✅ Database bağlantısı başarılı [${mode}]:`, res.rows[0].now);
    }
});

module.exports = pool;