# Tiyatro Takip — Web Scraper

Biletinial.com ve IBB Şehir Tiyatroları web sitelerinden tiyatro oyunu, mekan ve öneri verilerini çeken scraper.

## Kurulum

```bash
npm install
```

Bağlantı ayarları için `.env` veya ortam değişkenleri:

```
DATABASE_URL=postgres://...          # Production (Render vb.)
# veya
PG_USER=postgres
PG_PASSWORD=postgres
PG_DATABASE=tiyatro_takip
PG_HOST=localhost
PG_PORT=5432
```

---

## Kullanım

### Genel yapı

```
node scrape.js <kaynak> <eylem> [slug]
```

| Kaynak | Eylem | Açıklama |
|---|---|---|
| `biletinial` | `discover` | Kategori sayfasını tara → suggestions tablosu |
| `biletinial` | `play <slug>` | Tek oyunu çek → DB'de var: güncelle / Yok: suggestions |
| `biletinial` | `venue <slug>` | Tek mekanı çek → DB'de var: güncelle / Yok: suggestions |
| `ibb` | `discover` | Tüm IBB oyunlarını tara → DB'de var: güncelle / Yok: suggestions |
| `ibb` | `play <slug>` | Tek IBB oyununu çek → DB'de var: güncelle / Yok: suggestions |
| `ibb` | `venue <slug>` | Tek IBB sahnesini çek → DB'de var: güncelle / Yok: suggestions |
| `ibb` | `venues` | Tüm IBB sahnelerini çek → DB'de var: güncelle / Yok: suggestions |

---

### Biletinial — Keşif ve Öneri Akışı

Biletinial kategori sayfasını tara, bulunan oyunları `suggestions` tablosuna kaydet:

```bash
node scrape.js biletinial discover
# npm kısayolu: npm run biletinial:discover
```

Suggestions'tan takibe aldığın bir oyunu çek ve kaydet:

```bash
node scrape.js biletinial play elma-labrador-cimen
# npm kısayolu: npm run biletinial:play -- elma-labrador-cimen
```

Mekan çek:

```bash
node scrape.js biletinial venue fisekhane-etk
# npm kısayolu: npm run biletinial:venue -- fisekhane-etk
```

---

### IBB — Şehir Tiyatroları

Tüm IBB oyunlarını tara (eşleşen → güncelle, eşleşmeyen → suggestions):

```bash
node scrape.js ibb discover
# npm kısayolu: npm run ibb:discover
```

Tek oyun veya sahne çek:

```bash
node scrape.js ibb play agri-dagi-efsanesi
node scrape.js ibb venue kadikoy-sahnesi
# npm kısayolları:
# npm run ibb:play -- agri-dagi-efsanesi
# npm run ibb:venue -- kadikoy-sahnesi
```

Tüm IBB sahnelerini çek:

```bash
node scrape.js ibb venues
# npm kısayolu: npm run ibb:venues
```

---

## Öneri Akışı

```
Biletinial Discover  ──────────►  suggestions tablosu
IBB Discover         ──┬─────────►  plays (eşleşme varsa güncelle)
                       └─────────►  suggestions (eşleşme yoksa)

Kullanıcı öneri listesinden takibe aldığı oyunu seçer
   ↓
node scrape.js biletinial play <slug>   veya
node scrape.js ibb play <slug>
   ↓
DB'de eşleşme varsa → plays tablosu güncellenir
DB'de eşleşme yoksa → suggestions tablosuna eklenir
```

---

## Klasör Yapısı

```
scraper/
├── src/
│   ├── scrapers/
│   │   ├── biletinial/
│   │   │   ├── play-scraper.js    # Oyun detay scraper (Puppeteer)
│   │   │   ├── venue-scraper.js   # Mekan detay scraper (Puppeteer)
│   │   │   └── discover.js        # Kategori sayfası keşif scraper (Puppeteer)
│   │   └── ibb/
│   │       └── ibb-scraper.js     # IBB oyun + sahne scraper (Axios + Cheerio)
│   ├── db/
│   │   ├── connection.js          # PostgreSQL bağlantı havuzu
│   │   └── save-to-db.js          # DB kayıt fonksiyonları
│   └── utils/
├── data/                          # Çekilen JSON veriler (otomatik oluşur)
├── scrape.js                      # 🚀 Ana giriş noktası
├── package.json
└── README.md
```

---

## Veritabanı Tabloları

| Tablo | Açıklama |
|---|---|
| `plays` | Takibe alınan tiyatro oyunları |
| `venues` | Tiyatro mekanları |
| `showtimes` | Gösterim tarihleri ve saatleri |
| `price_categories` | Bilet fiyat kategorileri |
| `venue_gallery` | Mekan galeri resimleri |
| `suggestions` | Keşfedilen / önerilen oyun ve mekanlar |

Şema için: `npm run migrate`
