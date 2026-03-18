const { Pool } = require('pg');

// Database bağlantı ayarları
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'tiyatro_takip',
    password: 'postgres',  // Senin belirlediğin şifre
    port: 5432,
});

// Bağlantıyı test et
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database bağlantı hatası:', err);
    } else {
        console.log('✅ Database bağlantısı başarılı:', res.rows[0].now);
    }
});

module.exports = pool;