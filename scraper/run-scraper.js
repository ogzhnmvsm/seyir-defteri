const { scrapePlay } = require('./src/scrapers/play-scraper');
const { scrapeVenue } = require('./src/scrapers/venue-scraper');
const { discoverPlays } = require('./src/scrapers/discover-plays');
const { savePlay, saveVenue, saveSuggestion } = require('./src/db/save-to-db');
const fs = require('fs');

async function scrapeAndSavePlay(playSlug) {
    console.log('\n🎭 Oyun çekiliyor ve kaydediliyor...\n');

    const playData = await scrapePlay(playSlug);

    // JSON'a kaydet
    fs.writeFileSync(
        `./data/play-${playSlug}.json`,
        JSON.stringify(playData, null, 2)
    );

    // Database'e kaydet
    await savePlay(playData);

    console.log('\n✅ İşlem tamamlandı!\n');
}

async function scrapeAndSaveVenue(venueSlug) {
    console.log('\n🏛️ Mekan çekiliyor ve kaydediliyor...\n');

    const venueData = await scrapeVenue(venueSlug);

    // JSON'a kaydet
    fs.writeFileSync(
        `./data/venue-${venueSlug}.json`,
        JSON.stringify(venueData, null, 2)
    );

    // Database'e kaydet
    await saveVenue(venueData);

    console.log('\n✅ İşlem tamamlandı!\n');
}

// Komut satırından kullanım
const args = process.argv.slice(2);
const type = args[0]; // 'play' veya 'venue'
const slug = args[1]; // oyun veya mekan slug'ı

if (type === 'play' && slug) {
    scrapeAndSavePlay(slug);
} else if (type === 'venue' && slug) {
    scrapeAndSaveVenue(slug);
} else if (type === 'discover-plays') {
    const urlArg = slug || null; // ikinci arg istersen url ver
    (async () => {
        console.log('\n🔎 Keşif başlıyor ve öneriler DB ye kaydedilecek...\n');
        const url = urlArg || 'https://biletinial.com/tr-tr/tiyatro/istanbul?minprice=0&maxprice=22000&order=1';
        const discovered = await discoverPlays(url);

        // JSON'a kaydet
        fs.writeFileSync(`./data/discovered-plays.json`, JSON.stringify(discovered, null, 2));

        // DB'ye kaydet
        for (const item of discovered) {
            await saveSuggestion({
                type: 'play',
                title: item.title,
                slug: item.slug,
                image: item.image,
                city: null,
                url: item.url,
                metadata: { rating: item.rating, reviewCount: item.reviewCount, address: item.address, datesText: item.datesText }
            });
        }

        console.log('\n✅ Keşif ve kayıt işlemi tamamlandı!\n');
    })();
} else {
    console.log('Kullanım:');
    console.log('  node run-scraper.js play elma-labrador-cimen');
    console.log('  node run-scraper.js venue fisekhane-etk');
    console.log('  node run-scraper.js discover-plays [optional-start-url]');
}