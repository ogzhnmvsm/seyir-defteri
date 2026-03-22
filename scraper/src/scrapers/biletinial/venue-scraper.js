const puppeteer = require('puppeteer');

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

    await new Promise(resolve => setTimeout(resolve, 3000));
    try {
        await page.click('.blt_mdl_overlay');
        console.log('✓ Pop-up kapatıldı');
    } catch (e) {
        console.log('✓ Pop-up yok, devam ediliyor');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const venueData = await page.evaluate(() => {
        const aboutTab = document.querySelector('#about');
        const nameElement = aboutTab ? aboutTab.querySelector('h2') : null;
        const name = nameElement ? nameElement.innerText.trim() : null;

        const descElement = aboutTab ? aboutTab.querySelector('p') : null;
        const description = descElement ? descElement.innerText.trim() : null;

        const contactTab = document.querySelector('#contact');

        const phoneElement = contactTab ? contactTab.querySelector('a[href^="tel:"]') : null;
        const phone = phoneElement ? phoneElement.innerText.trim() : null;

        const addressElements = contactTab ? contactTab.querySelectorAll('li') : [];
        let address = null;
        addressElements.forEach(li => {
            const h3 = li.querySelector('h3');
            if (h3 && h3.innerText.trim() === 'Adres') {
                const p = li.querySelector('p');
                address = p ? p.innerText.trim() : null;
            }
        });

        const galleryImages = [];
        const galleryFigures = document.querySelectorAll('#foto figure a');
        galleryFigures.forEach(a => {
            const href = a.getAttribute('href');
            if (href) galleryImages.push(href);
        });

        const coverImage = galleryImages.length > 0 ? galleryImages[0] : null;

        return {
            name,
            slug: window.location.pathname.split('/').pop(),
            address,
            phone,
            coverImage,
            galleryImages,
            description,
            url: window.location.href,
            source: 'biletinial'
        };
    });

    console.log('\n✅ VERİ BAŞARIYLA ÇEKİLDİ!\n');
    console.log(`Mekan: ${venueData.name}`);
    console.log(`Adres: ${venueData.address || '✗'}`);
    console.log(`Galeri: ${venueData.galleryImages.length} resim`);

    await browser.close();
    return venueData;
}

module.exports = { scrapeVenue };
