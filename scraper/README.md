# Tiyatro Takip - Web Scraper

Bu klasör, biletinial.com'dan tiyatro oyunu ve mekan verilerini çeken scraper'ları içerir.

## Kurulum

```bash
npm install
```

## Veritabanı Bağlantısı

`src/db/connection.js` dosyasında PostgreSQL şifrenizi güncelleyin.

## Kullanım

### Tek Oyun Çek ve Kaydet

```bash
node run-scraper.js play elma-labrador-cimen
```

### Tek Mekan Çek ve Kaydet

```bash
node run-scraper.js venue fisekhane-etk
```

## Klasör Yapısı

```
scraper/
├── src/
│   ├── scrapers/          # Web scraper'lar
│   │   ├── play-scraper.js
│   │   └── venue-scraper.js
│   ├── db/                # Database işlemleri
│   │   ├── connection.js
│   │   └── save-to-db.js
│   └── utils/             # Yardımcı fonksiyonlar
├── data/                  # Çekilen JSON veriler
├── run-scraper.js         # Ana çalıştırma scripti
├── package.json
└── README.md
```

## Veritabanı Şeması

- `venues` - Tiyatro mekanları
- `plays` - Tiyatro oyunları
- `showtimes` - Gösterim tarihleri ve saatleri
- `price_categories` - Bilet fiyat kategorileri
- `venue_gallery` - Mekan galeri resimleri
