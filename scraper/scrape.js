/**
 * 🎭 Tiyatro Takip — Birleşik Scraper Runner
 *
 * Kullanım:
 *   node scrape.js <kaynak> <eylem> [slug]
 *
 * Kaynaklar: biletinial | ibb
 *
 * Eylemler:
 *   discover             → Kategori/liste sayfasını tara, önerileri suggestions tablosuna kaydet
 *   play   <slug>        → Tek oyunu çek → DB'de var mı? Evet: güncelle / Hayır: suggestions
 *   venue  <slug>        → Tek mekanı çek → DB'de var mı? Evet: güncelle / Hayır: suggestions
 *   venues               → Tüm mekanları çek (sadece ibb)
 *
 * Örnekler:
 *   node scrape.js biletinial discover
 *   node scrape.js biletinial play elma-labrador-cimen
 *   node scrape.js biletinial venue fisekhane-etk
 *   node scrape.js ibb discover
 *   node scrape.js ibb play agri-dagi-efsanesi
 *   node scrape.js ibb venue kadikoy-sahnesi
 *   node scrape.js ibb venues
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Biletinial scrapers
const { scrapePlay: biletinialScrapePlay }   = require('./src/scrapers/biletinial/play-scraper');
const { scrapeVenue: biletinialScrapeVenue } = require('./src/scrapers/biletinial/venue-scraper');
const { discoverPlays }                       = require('./src/scrapers/biletinial/discover');

// IBB scrapers
const {
    scrapeAllPlaySlugs,
    scrapeIbbPlay,
    scrapeAllVenues,
    scrapeVenueDetail,
    sleep
} = require('./src/scrapers/ibb/ibb-scraper');

// DB fonksiyonları
const {
    saveSuggestion,
    saveBiletinialPlay,
    saveBiletinialVenue,
    saveIbbPlay,
    saveIbbVenue
} = require('./src/db/save-to-db');

// data/ dizinine JSON kaydet
function saveJson(filename, data) {
    const filePath = path.join(__dirname, 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// =============================================================================
// BİLETİNİAL
// =============================================================================

async function biletinialDiscover(startUrl) {
    console.log('\n🔎 Biletinial keşfi başlıyor — öneriler suggestions tablosuna kaydedilecek...\n');
    const url = startUrl || 'https://biletinial.com/tr-tr/tiyatro/istanbul?minprice=0&maxprice=22000&order=1';
    const discovered = await discoverPlays(url);
    saveJson('biletinial-discovered.json', discovered);

    let added = 0, updated = 0;
    for (const item of discovered) {
        const before = await saveSuggestion({
            type: 'play',
            title: item.title,
            slug: item.slug,
            image: item.image,
            city: null,
            url: item.url,
            metadata: { source: 'biletinial', rating: item.rating, reviewCount: item.reviewCount, address: item.address, datesText: item.datesText }
        });
        if (before) added++;
    }

    console.log(`\n✅ Biletinial keşif tamamlandı. ${discovered.length} oyun işlendi.\n`);
}

async function biletinialPlay(slug) {
    console.log(`\n🎭 Biletinial oyun çekiliyor: ${slug}\n`);
    const playData = await biletinialScrapePlay(slug);
    saveJson(`biletinial-play-${slug}.json`, playData);
    await saveBiletinialPlay(playData);
    console.log('\n✅ İşlem tamamlandı!\n');
}

async function biletinialVenue(slug) {
    console.log(`\n🏛️ Biletinial mekan çekiliyor: ${slug}\n`);
    const venueData = await biletinialScrapeVenue(slug);
    saveJson(`biletinial-venue-${slug}.json`, venueData);
    await saveBiletinialVenue(venueData);
    console.log('\n✅ İşlem tamamlandı!\n');
}

// =============================================================================
// IBB
// =============================================================================

async function ibbDiscover() {
    console.log('\n🔎 IBB keşfi başlıyor — tüm oyunlar taranacak...\n');
    const slugs = await scrapeAllPlaySlugs();
    let ok = 0, fail = 0;

    for (const slug of slugs) {
        try {
            const playData = await scrapeIbbPlay(slug);
            if (!playData.title) {
                console.warn(`⚠️ Başlık bulunamadı, atlanıyor: ${slug}`);
                fail++;
                continue;
            }
            await saveIbbPlay(playData);
            ok++;
        } catch (err) {
            console.error(`❌ Oyun işlenemedi (${slug}): ${err.message}`);
            fail++;
        }
        await sleep(600);
    }
    console.log(`\n✅ IBB keşif tamamlandı. ${ok} oyun işlendi, ${fail} hata.\n`);
}

async function ibbPlay(slug) {
    console.log(`\n🎭 IBB oyun çekiliyor: ${slug}\n`);
    const playData = await scrapeIbbPlay(slug);
    if (!playData.title) throw new Error(`Başlık bulunamadı: ${slug}`);
    saveJson(`ibb-play-${slug}.json`, playData);
    await saveIbbPlay(playData);
    console.log('\n✅ İşlem tamamlandı!\n');
}

async function ibbVenue(slug) {
    console.log(`\n🏛 IBB sahne çekiliyor: ${slug}\n`);
    const detail = await scrapeVenueDetail(slug);
    const venueData = {
        name: slug,   // detay sayfasında isim yoksa slug'ı kullan
        slug,
        address: null,
        phone: null,
        coverImage: detail.galleryImages[0] || null,
        description: null,
        galleryImages: detail.galleryImages,
        capacity: detail.capacity,
        url: `https://sehirtiyatrolari.ibb.istanbul/sahne/${slug}`,
        source: 'ibb'
    };
    saveJson(`ibb-venue-${slug}.json`, venueData);
    await saveIbbVenue(venueData, false);
    console.log('\n✅ İşlem tamamlandı!\n');
}

async function ibbVenues() {
    console.log('\n🏛  IBB tüm sahneler çekiliyor...\n');
    const venues = await scrapeAllVenues();

    for (const venue of venues) {
        try {
            if (venue.slug) {
                const detail = await scrapeVenueDetail(venue.slug);
                venue.galleryImages = detail.galleryImages;
                venue.capacity = detail.capacity;
                await sleep(400);
            }
            await saveIbbVenue(venue);
        } catch (err) {
            console.error(`❌ Mekan kaydedilemedi (${venue.name}): ${err.message}`);
        }
    }
    console.log(`\n✅ ${venues.length} IBB sahnesi işlendi.\n`);
}

// =============================================================================
// CLI AYRIŞTIRICISI
// =============================================================================

function printUsage() {
    console.log(`
🎭 Tiyatro Takip — Scraper Kullanımı
=====================================

  node scrape.js <kaynak> <eylem> [slug]

Kaynaklar: biletinial | ibb

Eylemler:
  discover             Kategori/liste sayfasını tara → suggestions tablosu
  play   <slug>        Tek oyunu çek → DB'de var: güncelle / Yok: suggestions
  venue  <slug>        Tek mekanı çek → DB'de var: güncelle / Yok: suggestions
  venues               Tüm mekanları çek (sadece ibb)

Örnekler:
  node scrape.js biletinial discover
  node scrape.js biletinial play elma-labrador-cimen
  node scrape.js biletinial venue fisekhane-etk
  node scrape.js ibb discover
  node scrape.js ibb play agri-dagi-efsanesi
  node scrape.js ibb venue kadikoy-sahnesi
  node scrape.js ibb venues

npm kısayolları:
  npm run biletinial:discover
  npm run biletinial:play -- elma-labrador-cimen
  npm run biletinial:venue -- fisekhane-etk
  npm run ibb:discover
  npm run ibb:play -- agri-dagi-efsanesi
  npm run ibb:venue -- kadikoy-sahnesi
  npm run ibb:venues
`);
}

async function main() {
    const [source, action, slug] = process.argv.slice(2);

    if (!source || !action) {
        printUsage();
        process.exit(0);
    }

    try {
        if (source === 'biletinial') {
            if (action === 'discover')           await biletinialDiscover(slug);
            else if (action === 'play' && slug)  await biletinialPlay(slug);
            else if (action === 'venue' && slug) await biletinialVenue(slug);
            else { console.error(`❌ Geçersiz eylem veya eksik slug: ${action}`); printUsage(); process.exit(1); }

        } else if (source === 'ibb') {
            if (action === 'discover')           await ibbDiscover();
            else if (action === 'play' && slug)  await ibbPlay(slug);
            else if (action === 'venue' && slug) await ibbVenue(slug);
            else if (action === 'venues')        await ibbVenues();
            else { console.error(`❌ Geçersiz eylem veya eksik slug: ${action}`); printUsage(); process.exit(1); }

        } else {
            console.error(`❌ Bilinmeyen kaynak: ${source}`);
            printUsage();
            process.exit(1);
        }

        process.exit(0);
    } catch (err) {
        console.error('\n💥 Beklenmeyen hata:', err);
        process.exit(1);
    }
}

main();
