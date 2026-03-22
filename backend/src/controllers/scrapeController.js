const { discoverPlays } = require('../../../scraper/src/scrapers/biletinial/discover');
const { scrapePlay } = require('../../../scraper/src/scrapers/biletinial/play-scraper');
const { scrapeVenue } = require('../../../scraper/src/scrapers/biletinial/venue-scraper');
const { saveSuggestion, saveBiletinialPlay, saveBiletinialVenue } = require('../../../scraper/src/db/save-to-db');

async function runDiscover(req, res) {
    const startUrl = req.body.startUrl || 'https://biletinial.com/tr-tr/tiyatro/istanbul?minprice=0&maxprice=22000&order=1';
    const pageLimit = req.body.pageLimit;

    if (pageLimit) process.env.PAGE_LIMIT = pageLimit;

    try {
        const discovered = await discoverPlays(startUrl);

        // DB'ye kaydet (aynı logic run-scraper.js'tekinin aynısı)
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

        res.json({ ok: true, discovered: discovered.length });
    } catch (err) {
        console.error('Discover error', err);
        res.status(500).json({ error: 'discover_failed' });
    }
}

async function runScrapePlay(req, res) {
    const slug = req.params.slug;
    try {
        const playData = await scrapePlay(slug);
        await saveBiletinialPlay(playData);
        res.json({ ok: true, play: playData.title });
    } catch (err) {
        console.error('Scrape play error', err);
        res.status(500).json({ error: 'scrape_play_failed' });
    }
}

async function runScrapeVenue(req, res) {
    const slug = req.params.slug;
    try {
        const venueData = await scrapeVenue(slug);
        await saveBiletinialVenue(venueData);
        res.json({ ok: true, venue: venueData.name });
    } catch (err) {
        console.error('Scrape venue error', err);
        res.status(500).json({ error: 'scrape_venue_failed' });
    }
}

module.exports = { runDiscover, runScrapePlay, runScrapeVenue };