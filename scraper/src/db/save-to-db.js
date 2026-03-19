const pool = require('./connection');

// Oyun kaydet
async function savePlay(playData) {
    const client = await pool.connect();
    try {
        // Önce oyun var mı kontrol et
        const checkPlay = await client.query(
            'SELECT id FROM plays WHERE slug = $1',
            [playData.slug]
        );

        let playId;

        if (checkPlay.rows.length > 0) {
            // Oyun zaten var, güncelle
            playId = checkPlay.rows[0].id;
            await client.query(
                `UPDATE plays 
                SET title = $1, description = $2, poster_url = $3, 
                    duration = $4, genre = $5, biletinial_url = $6, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7`,
                [playData.title, playData.description, playData.posterUrl,
                playData.duration, playData.genre, playData.url, playId]
            );
            console.log(`✓ Oyun güncellendi: ${playData.title}`);
        } else {
            // Yeni oyun ekle
            const result = await client.query(
                `INSERT INTO plays (title, slug, description, poster_url, duration, genre, biletinial_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id`,
                [playData.title, playData.slug, playData.description,
                playData.posterUrl, playData.duration, playData.genre, playData.url]
            );
            playId = result.rows[0].id;
            console.log(`✓ Yeni oyun eklendi: ${playData.title}`);
        }

        // Eski gösterimleri sil (yeni verilerle güncellenecek)
        await client.query('DELETE FROM showtimes WHERE play_id = $1', [playId]);

        // Gösterimleri kaydet
        for (const showtime of playData.showtimes) {
            // Mekanı bul veya oluştur
            let venueId = await findOrCreateVenue(client, showtime.venue);

            // Gösterimi kaydet
            const showtimeResult = await client.query(
                `INSERT INTO showtimes 
                (play_id, venue_id, city, show_datetime, show_date_text, price_min, price_text, organizer)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id`,
                [playId, venueId, showtime.city, showtime.dateTime,
                    showtime.dateTimeText,
                    showtime.price.min ? parseFloat(String(showtime.price.min).replace(/[^0-9,.]/g, '').replace(',', '.')) || null : null,
                    showtime.price.text, showtime.organizer]
            );

            const showtimeId = showtimeResult.rows[0].id;

            // Fiyat kategorilerini kaydet
            for (const category of showtime.price.categories) {
                await client.query(
                    `INSERT INTO price_categories (showtime_id, category_name, price)
                    VALUES ($1, $2, $3)`,
                    [showtimeId, category.name, parseFloat(String(category.price).replace(/[^0-9,.]/g, '').replace(',', '.')) || null]
                );
            }
        }

        console.log(`✅ ${playData.title} tüm verileriyle kaydedildi!`);
        return playId;

    } catch (err) {
        console.error('❌ Hata:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Mekan bul veya oluştur (yardımcı fonksiyon)
async function findOrCreateVenue(client, venueData) {
    if (!venueData.url) return null;

    const slug = venueData.url.split('/').pop();

    const checkVenue = await client.query(
        'SELECT id FROM venues WHERE slug = $1',
        [slug]
    );

    if (checkVenue.rows.length > 0) {
        return checkVenue.rows[0].id;
    }

    const result = await client.query(
        `INSERT INTO venues (name, slug, address, biletinial_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [venueData.name, slug, venueData.address, venueData.url]
    );

    return result.rows[0].id;
}

// Mekan kaydet (detaylı)
async function saveVenue(venueData) {
    const client = await pool.connect();
    try {
        const checkVenue = await client.query(
            'SELECT id FROM venues WHERE slug = $1',
            [venueData.slug]
        );

        let venueId;

        if (checkVenue.rows.length > 0) {
            // Mekan var, güncelle
            venueId = checkVenue.rows[0].id;
            await client.query(
                `UPDATE venues 
                SET name = $1, address = $2, phone = $3, description = $4, 
                    cover_image = $5, biletinial_url = $6, updated_at = CURRENT_TIMESTAMP
                WHERE id = $7`,
                [venueData.name, venueData.address, venueData.phone,
                venueData.description, venueData.coverImage, venueData.url, venueId]
            );
            console.log(`✓ Mekan güncellendi: ${venueData.name}`);
        } else {
            // Yeni mekan
            const result = await client.query(
                `INSERT INTO venues (name, slug, address, phone, description, cover_image, biletinial_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id`,
                [venueData.name, venueData.slug, venueData.address, venueData.phone,
                venueData.description, venueData.coverImage, venueData.url]
            );
            venueId = result.rows[0].id;
            console.log(`✓ Yeni mekan eklendi: ${venueData.name}`);
        }

        // Eski galeri resimlerini sil
        await client.query('DELETE FROM venue_gallery WHERE venue_id = $1', [venueId]);

        // Galeri resimlerini kaydet
        for (const imageUrl of venueData.galleryImages) {
            await client.query(
                `INSERT INTO venue_gallery (venue_id, image_url) VALUES ($1, $2)`,
                [venueId, imageUrl]
            );
        }

        console.log(`✅ ${venueData.name} galerisiyle birlikte kaydedildi!`);
        return venueId;

    } catch (err) {
        console.error('❌ Hata:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Öneri / keşif kayıt fonksiyonu
async function saveSuggestion(suggestionData) {
    const client = await pool.connect();
    try {
        const type = suggestionData.type || 'play';
        const slug = suggestionData.slug || (suggestionData.biletinial_url ? suggestionData.biletinial_url.split('/').pop() : null);

        const check = await client.query(
            'SELECT id FROM suggestions WHERE type = $1 AND slug = $2',
            [type, slug]
        );

        if (check.rows.length > 0) {
            const id = check.rows[0].id;
            await client.query(
                `UPDATE suggestions SET title = $1, image_url = $2, city = $3, biletinial_url = $4, metadata = $5, discovered_at = CURRENT_TIMESTAMP WHERE id = $6`,
                [suggestionData.title, suggestionData.image, suggestionData.city, suggestionData.url, suggestionData.metadata || {}, id]
            );
            console.log(`✓ Öneri güncellendi: ${suggestionData.title}`);
            return id;
        } else {
            const result = await client.query(
                `INSERT INTO suggestions (type, title, slug, image_url, city, biletinial_url, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [type, suggestionData.title, slug, suggestionData.image, suggestionData.city, suggestionData.url, suggestionData.metadata || {}]
            );
            console.log(`✓ Yeni öneri eklendi: ${suggestionData.title}`);
            return result.rows[0].id;
        }

    } catch (err) {
        console.error('❌ Hata (saveSuggestion):', err);
        throw err;
    } finally {
        client.release();
    }
}

// IBB Mekan kaydet (Sistemde varsa günceller, yoksa öneri olarak ekler, forceCreate=true ise zorla tabloya ekler)
async function saveIbbVenue(venueData, forceCreate = false) {
    const client = await pool.connect();
    try {
        const check = await client.query(
            'SELECT id FROM venues WHERE slug = $1 OR name ILIKE $2',
            [venueData.slug, venueData.name]
        );

        if (check.rows.length > 0) {
            const venueId = check.rows[0].id;
            await client.query(
                `UPDATE venues
                SET phone = COALESCE(phone, $1), description = COALESCE(description, $2),
                    cover_image = COALESCE(cover_image, $3), updated_at = CURRENT_TIMESTAMP
                WHERE id = $4`,
                [venueData.phone, venueData.description, venueData.coverImage, venueId]
            );
            console.log(`✓ IBB Mekan güncellendi (Kayıt Bulundu): ${venueData.name}`);
            return venueId;
        } else if (forceCreate) {
            const result = await client.query(
                `INSERT INTO venues (name, slug, address, phone, description, cover_image)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id`,
                [venueData.name, venueData.slug, venueData.address, venueData.phone,
                venueData.description, venueData.coverImage]
            );
            const venueId = result.rows[0].id;
            console.log(`✓ IBB Yeni mekan eklendi: ${venueData.name}`);
            if (venueData.galleryImages && venueData.galleryImages.length > 0) {
                await client.query('DELETE FROM venue_gallery WHERE venue_id = $1', [venueId]);
                for (const imageUrl of venueData.galleryImages) {
                    await client.query(`INSERT INTO venue_gallery (venue_id, image_url) VALUES ($1, $2)`, [venueId, imageUrl]);
                }
            }
            return venueId;
        } else {
            const suggestionData = {
                type: 'venue',
                title: venueData.name,
                slug: venueData.slug,
                image: venueData.coverImage,
                city: 'İstanbul',
                url: null,
                metadata: { source: 'ibb', address: venueData.address, phone: venueData.phone, description: venueData.description }
            };
            console.log(`✓ IBB Mekan bulunamadı. Öneri listesine (suggestions) eklendi: ${venueData.name}`);
            return await saveSuggestion(suggestionData);
        }
    } catch (err) {
        console.error('❌ Hata (saveIbbVenue):', err);
        throw err;
    } finally {
        client.release();
    }
}

// IBB Oyun kaydet (Sistemde varsa günceller, yoksa öneri olarak ekler, forceCreate=true ise zorla tabloya ekler)
async function saveIbbPlay(playData, forceCreate = false) {
    const client = await pool.connect();
    try {
        const checkPlay = await client.query(
            'SELECT id FROM plays WHERE slug = $1 OR title ILIKE $2',
            [playData.slug, playData.title]
        );

        if (checkPlay.rows.length > 0) {
            const playId = checkPlay.rows[0].id;
            await client.query(
                `UPDATE plays
                SET ibb_url = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2`,
                [playData.url, playId]
            );
            console.log(`✓ IBB Oyun güncellendi (Kayıt Bulundu): ${playData.title}`);

            await client.query(`DELETE FROM showtimes WHERE play_id = $1 AND organizer ILIKE '%Şehir Tiyatroları%'`, [playId]);

            for (const showtime of playData.showtimes) {
                let venueId = null;
                if (showtime.venueSlug) {
                    const vr = await client.query('SELECT id FROM venues WHERE slug = $1', [showtime.venueSlug]);
                    if (vr.rows.length > 0) {
                        venueId = vr.rows[0].id;
                    } else if (showtime.venueName) {
                        const vr2 = await client.query('SELECT id FROM venues WHERE name ILIKE $1', [showtime.venueName]);
                        if (vr2.rows.length > 0) venueId = vr2.rows[0].id;
                    }
                }

                await client.query(
                    `INSERT INTO showtimes
                    (play_id, venue_id, city, show_datetime, show_date_text, price_min, price_text, organizer)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [playId, venueId, showtime.city, showtime.dateTime,
                        showtime.dateTimeText, null, null, showtime.organizer]
                );
            }
            console.log(`✅ IBB ${playData.title} gösterimleri güncellendi (${playData.showtimes.length} gösterim)`);
            return playId;

        } else if (forceCreate) {
            const result = await client.query(
                `INSERT INTO plays (title, slug, description, poster_url, duration, genre, source, ibb_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id`,
                [playData.title, playData.slug, playData.description,
                playData.posterUrl, playData.duration, playData.genre, 'ibb', playData.url]
            );
            const playId = result.rows[0].id;
            console.log(`✓ IBB Yeni oyun eklendi: ${playData.title}`);

            for (const showtime of playData.showtimes) {
                let venueId = null;
                if (showtime.venueSlug) {
                    const vr = await client.query('SELECT id FROM venues WHERE slug = $1', [showtime.venueSlug]);
                    if (vr.rows.length > 0) venueId = vr.rows[0].id;
                    else if (showtime.venueName) {
                        const vr2 = await client.query('SELECT id FROM venues WHERE name ILIKE $1', [showtime.venueName]);
                        if (vr2.rows.length > 0) venueId = vr2.rows[0].id;
                    }
                }
                await client.query(
                    `INSERT INTO showtimes (play_id, venue_id, city, show_datetime, show_date_text, price_min, price_text, organizer)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [playId, venueId, showtime.city, showtime.dateTime, showtime.dateTimeText, null, null, showtime.organizer]
                );
            }
            return playId;
        } else {
            const suggestionData = {
                type: 'play',
                title: playData.title,
                slug: playData.slug,
                image: playData.posterUrl,
                city: 'İstanbul',
                url: playData.url,
                metadata: { source: 'ibb', duration: playData.duration, genre: playData.genre }
            };
            console.log(`✓ IBB Oyun bulunamadı. Öneri listesine (suggestions) eklendi: ${playData.title}`);
            return await saveSuggestion(suggestionData);
        }
    } catch (err) {
        console.error('❌ Hata (saveIbbPlay):', err);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { savePlay, saveVenue, saveSuggestion, saveIbbVenue, saveIbbPlay };
