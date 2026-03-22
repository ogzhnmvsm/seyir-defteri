const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://sehirtiyatrolari.ibb.istanbul';

// Türkçe ay isimlerini sayıya çevirir
const TR_MONTHS = {
    'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04',
    'Mayıs': '05', 'Haziran': '06', 'Temmuz': '07', 'Ağustos': '08',
    'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
};

/**
 * "25 Şubat Çarşamba, 15:00" → ISO datetime string
 * Eğer tarih geçmişte kalmışsa bir sonraki yıla at.
 */
function parseTurkishDateTime(text) {
    try {
        const match = text.trim().match(/^(\d{1,2})\s+(\S+)\s+\S+,\s+(\d{2}:\d{2})$/);
        if (!match) return null;
        const [, day, monthTR, time] = match;
        const month = TR_MONTHS[monthTR];
        if (!month) return null;
        const [hour, minute] = time.split(':');
        const now = new Date();
        let year = now.getFullYear();
        const candidate = new Date(`${year}-${month}-${day.padStart(2, '0')}T${hour}:${minute}:00`);
        if (candidate < now && (now - candidate) > 24 * 60 * 60 * 1000) {
            year += 1;
        }
        return `${year}-${month}-${day.padStart(2, '0')}T${hour}:${minute}:00`;
    } catch {
        return null;
    }
}

/** HTTP GET + cheerio yükle */
async function fetchPage(url) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'tr-TR,tr;q=0.9'
        },
        timeout: 30000
    });
    return cheerio.load(response.data);
}

/**
 * /oyunlar?page=N sayfasından oyun slug listesi döner.
 */
async function scrapePlayList(page = 1) {
    const url = `${BASE_URL}/oyunlar?page=${page}`;
    console.log(`📄 Oyun listesi çekiliyor: ${url}`);
    const $ = await fetchPage(url);

    const slugs = [];
    $('main .w-full.flex.flex-wrap > div').each((_, el) => {
        const href = $(el).find('figure a').attr('href');
        if (href) {
            const slug = href.replace(/^\/?oyun\//, '');
            if (slug) slugs.push(slug);
        }
    });

    const pageLinks = [];
    $('a[href*="/oyunlar?page="]').each((_, el) => {
        const n = parseInt($(el).text().trim());
        if (!isNaN(n)) pageLinks.push(n);
    });
    const totalPages = pageLinks.length > 0 ? Math.max(...pageLinks) : 1;

    return { slugs, totalPages };
}

/**
 * Tüm sayfalardaki oyun slug'larını toplar
 */
async function scrapeAllPlaySlugs() {
    const { slugs: firstSlugs, totalPages } = await scrapePlayList(1);
    console.log(`📚 Toplam ${totalPages} sayfa bulundu`);

    const all = [...firstSlugs];
    for (let p = 2; p <= totalPages; p++) {
        const { slugs } = await scrapePlayList(p);
        all.push(...slugs);
        await sleep(500);
    }
    console.log(`🎭 Toplam ${all.length} oyun slug'ı toplandı`);
    return all;
}

/**
 * /oyun/<slug> sayfasını scrape eder
 */
async function scrapeIbbPlay(slug) {
    const url = `${BASE_URL}/oyun/${slug}`;
    console.log(`🎭 Oyun detayı çekiliyor: ${url}`);
    const $ = await fetchPage(url);

    const title = $('h1').first().text().trim();

    const posterSrc = $('main img.rounded').filter((_, el) => {
        return !$(el).attr('src')?.includes('lib/images');
    }).first().attr('src') || null;

    const descParts = [];
    $('main .flex.flex-col.items-start.gap-6 > div > p').each((_, el) => {
        const t = $(el).text().trim();
        if (t) descParts.push(t);
    });
    const description = descParts.join('\n\n') || null;

    let duration = null;
    $('span').each((_, el) => {
        const html = $(el).html() || '';
        if (html.includes('Süre')) {
            const text = $(el).text().replace('Süre:', '').trim();
            duration = text || null;
        }
    });

    const genre = null;

    const galleryImages = [];
    $('#my-gallery img[itemprop="thumbnail"]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) galleryImages.push(src);
    });

    const showtimes = [];
    $('#gosterimler .w-full.flex.flex-col > div').each((_, el) => {
        const timeText = $(el).find('time').text().trim();
        if (!timeText) return;

        const venueName = $(el).find('address a').attr('title') || $(el).find('address a').text().trim();
        const venueSlug = venueName ? slugify(venueName) : null;
        const dateTime = parseTurkishDateTime(timeText);

        const ticketLink = $(el).find('a.button_filled');
        const ticketTitle = ticketLink.attr('title') || ticketLink.text().trim();
        const ticketHref = ticketLink.attr('href') || null;
        const ticketUrl = ticketHref && ticketHref.startsWith('/') ? `${BASE_URL}${ticketHref}` : ticketHref;

        let status = 'available';
        if (ticketTitle === 'Tükendi' || ticketTitle?.includes('Tükendi')) status = 'sold_out';
        else if (ticketTitle?.includes('Satışta') || ticketTitle?.includes('Yakında')) status = 'coming_soon';

        showtimes.push({
            dateTimeText: timeText,
            dateTime,
            venueName,
            venueSlug,
            city: 'İstanbul',
            ticketUrl,
            status,
            venue: { name: venueName, url: null, address: null },
            price: { min: null, text: null, categories: [] },
            organizer: 'İBB Şehir Tiyatroları'
        });
    });

    return {
        title,
        slug,
        description,
        posterUrl: posterSrc,
        duration,
        genre,
        galleryImages,
        showtimes,
        url,
        source: 'ibb'
    };
}

/**
 * /sahneler?page=N listesini parse eder
 */
async function scrapeVenueList(page = 1) {
    const url = `${BASE_URL}/sahneler?page=${page}`;
    console.log(`🏛 Sahne listesi çekiliyor: ${url}`);
    const $ = await fetchPage(url);

    const venues = [];

    $('main > .w-full.flex').each((_, el) => {
        const imageDiv = $(el).find('[style*="background-image"]');
        const styleAttr = imageDiv.attr('style') || '';
        const imgMatch = styleAttr.match(/url\(([^)]+)\)/);
        const coverImage = imgMatch ? imgMatch[1].replace(/['"]/g, '') : null;

        const infoDiv = $(el).find('.flex.flex-col.gap-5.max-w-2xl');
        if (!infoDiv.length) return;

        const name = infoDiv.find('h2').text().trim();
        if (!name) return;

        const address = infoDiv.find('address').text().trim().replace(/\s+/g, ' ');
        const phone = infoDiv.find('a[href^="tel:"]').text().trim();

        const detailHref = infoDiv.find('a[href^="/sahne/"]').attr('href') || '';
        const slug = detailHref.replace('/sahne/', '');
        const ibbUrl = slug ? `${BASE_URL}/sahne/${slug}` : null;

        venues.push({
            name,
            slug,
            address,
            phone,
            coverImage,
            description: null,
            url: ibbUrl,
            galleryImages: [],
            source: 'ibb'
        });
    });

    const pageLinks = [];
    $('a[href*="/sahneler?page="]').each((_, el) => {
        const n = parseInt($(el).text().trim());
        if (!isNaN(n)) pageLinks.push(n);
    });
    const totalPages = pageLinks.length > 0 ? Math.max(...pageLinks) : 1;

    return { venues, totalPages };
}

/**
 * Tüm sayfalardaki sahneleri toplar
 */
async function scrapeAllVenues() {
    const { venues: firstVenues, totalPages } = await scrapeVenueList(1);
    console.log(`🏛 Toplam ${totalPages} sahne sayfası`);

    const all = [...firstVenues];
    for (let p = 2; p <= totalPages; p++) {
        const { venues } = await scrapeVenueList(p);
        all.push(...venues);
        await sleep(500);
    }
    console.log(`✅ Toplam ${all.length} sahne toplandı`);
    return all;
}

/**
 * Tek sahne detay sayfasını çeker
 */
async function scrapeVenueDetail(slug) {
    try {
        const url = `${BASE_URL}/sahne/${slug}`;
        const $ = await fetchPage(url);

        let capacity = null;
        $('strong').each((_, el) => {
            if ($(el).text().includes('Koltuk Kapasitesi')) {
                capacity = $(el).parent().find('span').text().trim() || null;
            }
        });

        const galleryImages = [];
        $('.mekan_swiper img').each((_, el) => {
            const src = $(el).attr('src');
            if (src && !src.includes('lib/images')) galleryImages.push(src);
        });

        return { capacity, galleryImages };
    } catch (err) {
        console.warn(`⚠️ Sahne detayı alınamadı (${slug}): ${err.message}`);
        return { capacity: null, galleryImages: [] };
    }
}

/** Basit slug üretici */
function slugify(str) {
    return str
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

module.exports = {
    scrapeAllPlaySlugs,
    scrapeIbbPlay,
    scrapeAllVenues,
    scrapeVenueDetail,
    sleep
};
