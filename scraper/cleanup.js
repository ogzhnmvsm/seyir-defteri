/**
 * DB Cleanup Scriptleri — Seyir Defteri
 * 
 * Kullanım:
 *   node cleanup.js check          → Sorunlu kayıtları listele (sadece okur, değiştirmez)
 *   node cleanup.js fix-sources    → Biletinial plays'de source=null olanları 'biletinial' yap
 *   node cleanup.js refresh-ibb    → IBB suggestions'ı sil ve yeniden keşfet (datesText dolsun)
 */

'use strict';

const { Pool } = require('pg');

const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 4, prepare: false }
        : { user: 'postgres', host: 'localhost', database: 'tiyatro_takip', password: 'postgres', port: 5432 }
);

async function check() {
    console.log('\n🔍 DB Durum Kontrolü\n' + '='.repeat(50));

    // Suggestions: kaynak dağılımı
    const suggSources = await pool.query(`
        SELECT metadata->>'source' as source, type, COUNT(*) as count
        FROM suggestions
        GROUP BY source, type
        ORDER BY source, type
    `);
    console.log('\n📋 Suggestions — Kaynak dağılımı:');
    suggSources.rows.forEach(r => {
        console.log(`  [${r.source || 'NULL'}] ${r.type}: ${r.count} kayıt`);
    });

    // Suggestions: datesText doluluk oranı
    const datesStats = await pool.query(`
        SELECT 
            COUNT(*) FILTER (WHERE metadata->>'datesText' IS NOT NULL AND metadata->>'datesText' != '') as with_dates,
            COUNT(*) FILTER (WHERE metadata->>'datesText' IS NULL OR metadata->>'datesText' = '') as without_dates,
            COUNT(*) as total
        FROM suggestions WHERE type = 'play'
    `);
    const ds = datesStats.rows[0];
    console.log(`\n📅 Oyun önerilerinde datesText: ${ds.with_dates}/${ds.total} dolu (${ds.without_dates} boş)`);

    // Plays: source dağılımı
    const playSources = await pool.query(`
        SELECT source, COUNT(*) as count FROM plays GROUP BY source ORDER BY source
    `);
    console.log('\n🎭 Plays — Source dağılımı:');
    playSources.rows.forEach(r => {
        console.log(`  [${r.source || 'NULL'}]: ${r.count} kayıt`);
    });

    // Plays: biletinial_url var ama source null olanlar
    const missingSource = await pool.query(`
        SELECT id, title, slug FROM plays WHERE source IS NULL AND biletinial_url IS NOT NULL
    `);
    if (missingSource.rows.length > 0) {
        console.log(`\n⚠️  Biletinial URL'si olan ama source=NULL olan ${missingSource.rows.length} oyun:`);
        missingSource.rows.forEach(r => console.log(`  - [${r.id}] ${r.title} (${r.slug})`));
    }

    await pool.end();
    console.log('\n✅ Kontrol tamamlandı.\n');
}

async function fixSources() {
    console.log('\n🔧 Source alanını düzeltiyor...\n');

    // biletinial_url varsa source = 'biletinial'
    const res = await pool.query(`
        UPDATE plays SET source = 'biletinial'
        WHERE source IS NULL AND biletinial_url IS NOT NULL
        RETURNING id, title
    `);
    console.log(`✅ ${res.rows.length} oyun güncellendi:`);
    res.rows.forEach(r => console.log(`  - [${r.id}] ${r.title}`));

    await pool.end();
    console.log('\n✅ Fix tamamlandı.\n');
}

async function refreshIbbSuggestions() {
    console.log('\n🗑️  IBB suggestions siliniyor...\n');

    const del = await pool.query(`
        DELETE FROM suggestions
        WHERE metadata->>'source' = 'ibb' AND accepted IS NOT TRUE
    `);
    console.log(`✅ ${del.rowCount} IBB önerisi silindi.`);
    console.log('\n📌 Şimdi şunu çalıştır:');
    console.log('   node scrape.js ibb discover');
    console.log('\nBu sayede yeni kayıtlar datesText ve showtimeCount bilgisiyle kaydedilecek.\n');

    await pool.end();
}

const cmd = process.argv[2];

if (cmd === 'check') {
    check().catch(console.error);
} else if (cmd === 'fix-sources') {
    fixSources().catch(console.error);
} else if (cmd === 'refresh-ibb') {
    refreshIbbSuggestions().catch(console.error);
} else {
    console.log(`
Kullanım:
  node cleanup.js check           → Sorunlu kayıtları listele (sadece okur)
  node cleanup.js fix-sources     → plays.source=NULL olanları 'biletinial' yap
  node cleanup.js refresh-ibb     → IBB suggestions sil (sonra ibb discover çalıştır)
`);
}
