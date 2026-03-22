const puppeteer = require('puppeteer');

async function scrapePlay(playSlug) {
    console.log(`\n🎭 ${playSlug} oyunu çekiliyor...\n`);

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    const url = `https://biletinial.com/tr-tr/tiyatro/${playSlug}`;

    console.log(`📡 URL açılıyor: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Sayfa yüklensin
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Oyun bilgilerini çek
    const playData = await page.evaluate(() => {
        // Poster resmi
        const posterImg = document.querySelector('.yds_cinema_movie_thread_body-cover img');
        const posterUrl = posterImg ? posterImg.src : null;

        // Oyun başlığı
        const titleElement = document.querySelector('h1');
        const title = titleElement ? titleElement.innerText.trim() : null;

        // Açıklama
        const descDiv = document.querySelector('.yds_cinema_movie_thread_body-text .yds_cinema_movie_thread_info');
        const description = descDiv ? descDiv.innerText.trim() : null;

        // Süre
        const durationElement = document.querySelector('.yds_cinema_movie_thread_detail li:nth-child(2) span');
        const duration = durationElement ? durationElement.innerText.trim() : null;

        // Tür
        const genreElement = document.querySelector('.yds_cinema_movie_thread_detail li:nth-child(1) span');
        const genre = genreElement ? genreElement.innerText.trim() : null;

        // Şehir ve gösterimler
        const showtimes = [];
        const cityDivs = document.querySelectorAll('.ed-biletler__sehir');

        cityDivs.forEach(cityDiv => {
            const cityName = cityDiv.getAttribute('data-sehir');
            const shows = cityDiv.querySelectorAll('.ed-biletler__sehir__gun');

            shows.forEach(show => {
                const timeElement = show.querySelector('time[itemprop="startDate"]');
                const dateTimeStr = timeElement ? timeElement.getAttribute('content') : null;
                const dateTimeText = timeElement ? timeElement.innerText.trim() : null;

                const venueElement = show.querySelector('a[itemprop="location"] address[itemprop="name"]');
                const venueName = venueElement ? venueElement.innerText.trim().replace('Adres', '').trim() : null;
                const venueLink = show.querySelector('a[itemprop="location"]');
                const venueUrl = venueLink ? venueLink.getAttribute('href') : null;

                const addressElement = show.querySelector('meta[itemprop="streetAddress"]');
                const address = addressElement ? addressElement.getAttribute('content') : null;

                const priceElement = show.querySelector('.price-info[itemprop="price"]');
                const priceMin = priceElement ? priceElement.getAttribute('content') : null;
                const priceText = priceElement ? priceElement.innerText.trim() : null;

                const priceTooltip = show.querySelector('.ticket_price_tooltip');
                let priceCategories = [];
                if (priceTooltip) {
                    try {
                        const priceData = priceTooltip.getAttribute('data-ticketprices');
                        const parsed = JSON.parse(priceData.replace(/&quot;/g, '"'));
                        priceCategories = parsed.prices || [];
                    } catch (e) { }
                }

                const organizerElement = show.querySelector('.ed-biletler__sehir__gun__organizator span');
                const organizer = organizerElement ? organizerElement.innerText.trim() : null;

                showtimes.push({
                    city: cityName,
                    venue: {
                        name: venueName,
                        address: address,
                        url: venueUrl ? 'https://biletinial.com' + venueUrl : null
                    },
                    dateTime: dateTimeStr,
                    dateTimeText: dateTimeText,
                    price: {
                        min: priceMin,
                        text: priceText,
                        categories: priceCategories
                    },
                    organizer: organizer
                });
            });
        });

        return {
            title,
            slug: window.location.pathname.split('/').pop(),
            description,
            posterUrl,
            duration,
            genre,
            showtimes,
            url: window.location.href,
            source: 'biletinial'
        };
    });

    console.log('\n✅ VERİ BAŞARIYLA ÇEKİLDİ!\n');
    console.log(`Oyun: ${playData.title}`);
    console.log(`Poster: ${playData.posterUrl ? '✓' : '✗'}`);
    console.log(`Toplam Gösterim: ${playData.showtimes.length}`);

    await browser.close();
    return playData;
}

module.exports = { scrapePlay };
