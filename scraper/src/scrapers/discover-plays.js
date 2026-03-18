const puppeteer = require('puppeteer');

async function discoverPlays(startUrl = 'https://biletinial.com/tr-tr/tiyatro/istanbul?minprice=0&maxprice=22000&order=1') {
    console.log(`\n🔎 Keşif başlıyor: ${startUrl}\n`);

    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = await browser.newPage();

    const discovered = [];
    let pageIndex = 1;
    const maxPages = process.env.PAGE_LIMIT ? parseInt(process.env.PAGE_LIMIT) : 50; // env ile sınırlandırma

    while (pageIndex <= maxPages) { // güvenlik olarak 50 sayfa limiti veya env ile belirtilen değer
        const url = startUrl + (pageIndex > 1 ? `&page=${pageIndex}` : '');
        console.log(`📡 Sayfa açılıyor: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 2000));

        const items = await page.evaluate(() => {
            const container = document.querySelector('#kategori__etkinlikler');
            if (!container) return [];

            const list = [];
            const lis = container.querySelectorAll('ul > li');

            lis.forEach(li => {
                try {
                    const titleEl = li.querySelector('h3 a');
                    const hrefEl = li.querySelector('figure a') || titleEl;
                    const imgEl = li.querySelector('figure img');

                    const ratingEl = li.querySelector('.etkinlikler_container_puan_list strong');
                    const reviewEl = li.querySelector('.etkinlikler_container_puan_list span');
                    const addressEl = li.querySelector('address');
                    const datesEl = Array.from(li.querySelectorAll('span')).find(s => s.innerText && /\d/.test(s.innerText));

                    const href = hrefEl ? hrefEl.getAttribute('href') : null;
                    const slug = href ? href.split('/').pop() : null;

                    list.push({
                        title: titleEl ? titleEl.innerText.trim() : null,
                        slug: slug,
                        image: imgEl ? imgEl.src : null,
                        rating: ratingEl ? ratingEl.innerText.trim() : null,
                        reviewCount: reviewEl ? (reviewEl.innerText.replace(/\D/g, '') || null) : null,
                        address: addressEl ? addressEl.innerText.trim() : null,
                        datesText: datesEl ? datesEl.innerText.trim() : null,
                        url: href ? 'https://biletinial.com' + href : null
                    });
                } catch (e) { }
            });

            return list;
        });

        if (!items || items.length === 0) {
            console.log('⚠️ Bu sayfada öğe bulunamadı, döngü sonlandırılıyor.');
            break;
        }

        // Yeni öğeleri ekle (benzersiz slug ile)
        let newCount = 0;
        for (const it of items) {
            if (!it.slug) continue;
            if (!discovered.find(x => x.slug === it.slug)) {
                discovered.push(it);
                newCount++;
            }
        }

        console.log(`➕ Bu sayfada bulunanlar: ${items.length}, yeni: ${newCount} (toplam: ${discovered.length})`);

        if (newCount === 0) {
            // zaten tüm öğeler keşfedilmişse sona er
            break;
        }

        pageIndex++;
    }

    await browser.close();
    console.log(`\n✅ Keşif tamamlandı. Toplam bulunan oyun: ${discovered.length}\n`);
    return discovered;
}

module.exports = { discoverPlays };
