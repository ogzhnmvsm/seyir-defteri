const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeVenue(venueSlug) {
    console.log(`\n🏛️ ${venueSlug} mekanı çekiliyor...\n`);

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null
    });

    const page = await browser.newPage();
    const url = `https://biletinial.com/tr-tr/mekan/${venueSlug}`;

    console.log(`📡 URL açılıyor: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Pop-up'ı kapat (varsa)
    await new Promise(resolve => setTimeout(resolve, 3000));
    try {
        await page.click('.blt_mdl_overlay');
        console.log('✓ Pop-up kapatıldı');
    } catch (e) {
        console.log('✓ Pop-up yok, devam ediliyor');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mekan bilgilerini çek
    const venueData = await page.evaluate(() => {
        // Mekan adı (Hakkında sekmesindeki h2)
        const aboutTab = document.querySelector('#about');
        const nameElement = aboutTab ? aboutTab.querySelector('h2') : null;
        const name = nameElement ? nameElement.innerText.trim() : null;

        // Açıklama (Hakkında sekmesindeki p)
        const descElement = aboutTab ? aboutTab.querySelector('p') : null;
        const description = descElement ? descElement.innerText.trim() : null;

        // İletişim bilgileri
        const contactTab = document.querySelector('#contact');

        // Telefon
        const phoneElement = contactTab ? contactTab.querySelector('a[href^="tel:"]') : null;
        const phone = phoneElement ? phoneElement.innerText.trim() : null;

        // Adres
        const addressElements = contactTab ? contactTab.querySelectorAll('li') : [];
        let address = null;
        addressElements.forEach(li => {
            const h3 = li.querySelector('h3');
            if (h3 && h3.innerText.trim() === 'Adres') {
                const p = li.querySelector('p');
                address = p ? p.innerText.trim() : null;
            }
        });

        // Galeri resimleri
        const galleryImages = [];
        const galleryFigures = document.querySelectorAll('#foto figure a');
        galleryFigures.forEach(a => {
            const href = a.getAttribute('href');
            if (href) {
                galleryImages.push(href);
            }
        });

        // Kapak resmi (ilk galeri resmi)
        const coverImage = galleryImages.length > 0 ? galleryImages[0] : null;

        // Bu mekanda oynayan oyunlar
        const plays = [];
        const playItems = document.querySelectorAll('#cinema li');

        playItems.forEach(li => {
            const titleElement = li.querySelector('h3 a');
            const imgElement = li.querySelector('figure img');
            const dateElement = li.querySelector('date');
            const genreElements = li.querySelectorAll('div a');

            const genres = [];
            genreElements.forEach(g => {
                const genreText = g.innerText.trim().replace('•', '').trim();
                if (genreText) genres.push(genreText);
            });

            if (titleElement) {
                plays.push({
                    title: titleElement.innerText.trim(),
                    image: imgElement ? imgElement.src : null,
                    dates: dateElement ? dateElement.innerText.trim() : null,
                    genres: genres
                });
            }
        });

        return {
            name,
            slug: window.location.pathname.split('/').pop(),
            address,
            phone,
            coverImage,
            galleryImages,
            description,
            plays,
            url: window.location.href
        };
    });

    console.log('\n✅ VERİ BAŞARIYLA ÇEKİLDİ!\n');
    console.log('📊 ÇEKİLEN VERİ ÖZETİ:');
    console.log('='.repeat(50));
    console.log(`Mekan: ${venueData.name}`);
    console.log(`Adres: ${venueData.address || '✗'}`);
    console.log(`Telefon: ${venueData.phone || '✗'}`);
    console.log(`Kapak Resmi: ${venueData.coverImage ? '✓' : '✗'}`);
    console.log(`Galeri: ${venueData.galleryImages.length} resim`);
    console.log(`Oynayan Oyun Sayısı: ${venueData.plays.length}`);
    console.log('='.repeat(50));

    await browser.close();
    return venueData;
}

module.exports = { scrapeVenue };