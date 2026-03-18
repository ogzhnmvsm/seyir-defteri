/**
 * IBB Şehir Tiyatroları Scraper Runner
 * 
 * Kullanım:
 *   node ibb-run.js              → Sahneler + tüm oyunlar
 *   node ibb-run.js --venues     → Sadece sahneler
 *   node ibb-run.js --plays      → Sadece oyunlar
 *   node ibb-run.js --play agri-dagi-efsanesi  → Tek oyun
 */

const { scrapeAllPlaySlugs, scrapeIbbPlay, scrapeAllVenues, scrapeVenueDetail, sleep } = require('./src/scrapers/ibb-scraper');
const { saveIbbVenue, saveIbbPlay } = require('./src/db/save-to-db');

const args = process.argv.slice(2);
const onlyVenues = args.includes('--venues');
const onlyPlays = args.includes('--plays');
const singlePlayIdx = args.indexOf('--play');
const singlePlay = singlePlayIdx !== -1 ? args[singlePlayIdx + 1] : null;

async function runVenues() {
    console.log('\n🏛  ===== SAHNELER =====');
    const venues = await scrapeAllVenues();

    for (const venue of venues) {
        try {
            // Detay sayfasından galeri + kapasite çek
            if (venue.slug) {
                const detail = await scrapeVenueDetail(venue.slug);
                venue.galleryImages = detail.galleryImages;
                venue.capacity = detail.capacity;
                await sleep(400);
            }
            await saveIbbVenue(venue);
        } catch (err) {
            console.error(`❌ Mekan kaydedilemedi (${venue.name}):`, err.message);
        }
    }
    console.log(`\n✅ ${venues.length} sahne işlendi.`);
}

async function runPlays(slugs) {
    console.log('\n🎭  ===== OYUNLAR =====');
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
            console.error(`❌ Oyun kaydedilemedi (${slug}):`, err.message);
            fail++;
        }
        // Sunucuya nazik ol
        await sleep(600);
    }
    console.log(`\n✅ ${ok} oyun kaydedildi, ${fail} hata.`);
}

async function main() {
    try {
        if (singlePlay) {
            console.log(`\n🔍 Tek oyun modu: ${singlePlay}`);
            await runPlays([singlePlay]);
        } else if (onlyVenues) {
            await runVenues();
        } else if (onlyPlays) {
            const slugs = await scrapeAllPlaySlugs();
            await runPlays(slugs);
        } else {
            // Hepsini çalıştır: önce sahneler (FK için), sonra oyunlar
            await runVenues();
            const slugs = await scrapeAllPlaySlugs();
            await runPlays(slugs);
        }
        console.log('\n🎉 IBB scraper tamamlandı!');
        process.exit(0);
    } catch (err) {
        console.error('\n💥 Beklenmeyen hata:', err);
        process.exit(1);
    }
}

main();
