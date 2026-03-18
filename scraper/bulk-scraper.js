const { scrapePlay } = require('./src/scrapers/play-scraper');
const { scrapeVenue } = require('./src/scrapers/venue-scraper');
const { savePlay, saveVenue } = require('./src/db/save-to-db');
const fs = require('fs');
const path = require('path');

// Targets dosyasını oku
const targets = JSON.parse(
    fs.readFileSync('./config/targets.json', 'utf-8')
);

// Gecikme fonksiyonu (rate limiting için)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Toplu oyun çekme
async function scrapeAllPlays() {
    console.log('\n🎭 TOPLU OYUN ÇEKME BAŞLIYOR...\n');
    console.log(`Toplam ${targets.plays.length} oyun çekilecek\n`);

    const results = {
        success: [],
        failed: []
    };

    for (let i = 0; i < targets.plays.length; i++) {
        const slug = targets.plays[i];
        console.log(`\n[${i + 1}/${targets.plays.length}] ${slug} işleniyor...`);

        try {
            // Oyun verisini çek
            const playData = await scrapePlay(slug);

            // JSON'a kaydet
            const jsonPath = path.join(__dirname, 'data', `play-${slug}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(playData, null, 2));

            // Database'e kaydet
            await savePlay(playData);

            console.log(`✅ ${playData.title} başarıyla kaydedildi!`);
            results.success.push(slug);

        } catch (err) {
            console.error(`❌ ${slug} hata: ${err.message}`);
            results.failed.push({ slug, error: err.message });
        }

        // Rate limiting - her istekten sonra 3 saniye bekle
        if (i < targets.plays.length - 1) {
            console.log('⏳ 3 saniye bekleniyor...');
            await delay(3000);
        }
    }

    return results;
}

// Toplu mekan çekme
async function scrapeAllVenues() {
    console.log('\n🏛️ TOPLU MEKAN ÇEKME BAŞLIYOR...\n');
    console.log(`Toplam ${targets.venues.length} mekan çekilecek\n`);

    const results = {
        success: [],
        failed: []
    };

    for (let i = 0; i < targets.venues.length; i++) {
        const slug = targets.venues[i];
        console.log(`\n[${i + 1}/${targets.venues.length}] ${slug} işleniyor...`);

        try {
            // Mekan verisini çek
            const venueData = await scrapeVenue(slug);

            // JSON'a kaydet
            const jsonPath = path.join(__dirname, 'data', `venue-${slug}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(venueData, null, 2));

            // Database'e kaydet
            await saveVenue(venueData);

            console.log(`✅ ${venueData.name} başarıyla kaydedildi!`);
            results.success.push(slug);

        } catch (err) {
            console.error(`❌ ${slug} hata: ${err.message}`);
            results.failed.push({ slug, error: err.message });
        }

        // Rate limiting - her istekten sonra 3 saniye bekle
        if (i < targets.venues.length - 1) {
            console.log('⏳ 3 saniye bekleniyor...');
            await delay(3000);
        }
    }

    return results;
}

// Her ikisini de çek
async function scrapeAll() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 TOPLU SCRAPING BAŞLIYOR');
    console.log('='.repeat(60));

    const startTime = Date.now();

    // Önce oyunları çek
    const playResults = await scrapeAllPlays();

    // Sonra mekanları çek
    const venueResults = await scrapeAllVenues();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    // Özet rapor
    console.log('\n' + '='.repeat(60));
    console.log('📊 ÖZET RAPOR');
    console.log('='.repeat(60));
    console.log(`\n⏱️  Toplam Süre: ${duration} dakika`);
    console.log(`\n🎭 Oyunlar:`);
    console.log(`   ✅ Başarılı: ${playResults.success.length}`);
    console.log(`   ❌ Başarısız: ${playResults.failed.length}`);

    if (playResults.failed.length > 0) {
        console.log(`\n   Başarısız oyunlar:`);
        playResults.failed.forEach(f => {
            console.log(`   - ${f.slug}: ${f.error}`);
        });
    }

    console.log(`\n🏛️  Mekanlar:`);
    console.log(`   ✅ Başarılı: ${venueResults.success.length}`);
    console.log(`   ❌ Başarısız: ${venueResults.failed.length}`);

    if (venueResults.failed.length > 0) {
        console.log(`\n   Başarısız mekanlar:`);
        venueResults.failed.forEach(f => {
            console.log(`   - ${f.slug}: ${f.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TOPLU SCRAPING TAMAMLANDI!');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
}

// Komut satırından kullanım
const args = process.argv.slice(2);
const command = args[0];

if (command === 'plays') {
    scrapeAllPlays().then(() => process.exit(0));
} else if (command === 'venues') {
    scrapeAllVenues().then(() => process.exit(0));
} else if (command === 'all' || !command) {
    scrapeAll();
} else {
    console.log('Kullanım:');
    console.log('  node bulk-scraper.js           # Hem oyun hem mekan');
    console.log('  node bulk-scraper.js plays     # Sadece oyunlar');
    console.log('  node bulk-scraper.js venues    # Sadece mekanlar');
    console.log('  node bulk-scraper.js all       # Hem oyun hem mekan');
}