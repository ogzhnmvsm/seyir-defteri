const fs = require('fs');
const path = require('path');
const pool = require('../src/db/connection');

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, '../sql/create-suggestions-table.sql'), 'utf8');
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('✅ Migration çalıştırıldı: suggestions tablosu yaratıldı (veya zaten mevcut).');
    } catch (err) {
        console.error('❌ Migration hatası:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();
