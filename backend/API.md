# Tiyatro Takip – API Documentation

Base URL: `http://localhost:4000`

---

## Health

### `GET /health`
Returns server status.

**Response**
```json
{ "status": "ok", "time": "2026-02-22T20:00:00.000Z" }
```

---

## Suggestions `/api/suggestions`

Suggestions are plays or venues discovered by the scraper that are awaiting review. When accepted, the full detail is scraped and saved to `plays` or `venues`.

### `GET /api/suggestions`
List suggestions with optional filters.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `accepted` | `true` \| `false` | Filter by accepted status |
| `type` | `play` \| `venue` | Filter by type |
| `q` | string | Search by title (case-insensitive) |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response**
```json
{
  "count": 2,
  "rows": [
    {
      "id": 1,
      "type": "play",
      "title": "Örnek Oyun",
      "slug": "ornek-oyun",
      "image_url": "https://...",
      "city": "İstanbul",
      "biletinial_url": "https://biletinial.com/tr-tr/tiyatro/ornek-oyun",
      "metadata": { "rating": "4.8", "reviewCount": "120", "datesText": "Mart - 15 - 22" },
      "accepted": false,
      "discovered_at": "2026-02-20T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/suggestions/:id`
Get a single suggestion by ID.

**Response** – single suggestion object (see above) or `404`.

---

### `POST /api/suggestions/:id/accept`
Accept a suggestion. This triggers a full scrape of the play or venue and saves it to the `plays` or `venues` table.

**Response**
```json
{ "ok": true, "createdId": 42 }
```
- `createdId` – the ID of the newly created `plays` or `venues` record.
- If already accepted: `{ "ok": true, "message": "already accepted" }`

---

### `POST /api/suggestions/:id/reject`
Permanently deletes the suggestion.

**Response**
```json
{ "ok": true }
```

---

## Plays `/api/plays`

Fully scraped play records.

### `GET /api/plays`
List accepted plays.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by title (case-insensitive) |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response**
```json
{
  "count": 1,
  "rows": [
    {
      "id": 5,
      "title": "Örnek Oyun",
      "slug": "ornek-oyun",
      "description": "Oyun açıklaması...",
      "poster_url": "https://...",
      "duration": "90 dk",
      "genre": "Dram",
      "biletinial_url": "https://biletinial.com/tr-tr/tiyatro/ornek-oyun",
      "created_at": "2026-02-20T10:00:00.000Z",
      "updated_at": "2026-02-21T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/plays/:id`
Get a single play with its showtimes and price categories.

**Response**
```json
{
  "id": 5,
  "title": "Örnek Oyun",
  "slug": "ornek-oyun",
  "description": "...",
  "poster_url": "https://...",
  "duration": "90 dk",
  "genre": "Dram",
  "biletinial_url": "https://...",
  "showtimes": [
    {
      "id": 101,
      "venue_id": 3,
      "venue_name": "Zorlu PSM",
      "venue_slug": "zorlu-psm",
      "city": "İstanbul",
      "show_datetime": "2026-03-15T20:00:00.000Z",
      "show_date_text": "15 Mart Pazar 20:00",
      "price_min": 250.00,
      "price_text": "250 TL'den başlayan fiyatlarla",
      "organizer": "Zorlu PSM",
      "price_categories": [
        { "category_name": "Tam", "price": 350.00 },
        { "category_name": "Öğrenci", "price": 250.00 }
      ]
    }
  ]
}
```

---

## Venues `/api/venues`

Fully scraped venue records.

### `GET /api/venues`
List venues.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by name |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response**
```json
{
  "count": 1,
  "rows": [
    {
      "id": 3,
      "name": "Zorlu PSM",
      "slug": "zorlu-psm",
      "address": "Levazım Mh. ...",
      "phone": "+90 212 000 0000",
      "description": "Mekan açıklaması...",
      "cover_image": "https://...",
      "biletinial_url": "https://biletinial.com/tr-tr/mekan/zorlu-psm",
      "created_at": "2026-02-20T10:00:00.000Z",
      "updated_at": "2026-02-21T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/venues/:id`
Get a single venue with its gallery images.

**Response**
```json
{
  "id": 3,
  "name": "Zorlu PSM",
  "slug": "zorlu-psm",
  "address": "...",
  "phone": "...",
  "description": "...",
  "cover_image": "https://...",
  "biletinial_url": "https://...",
  "gallery": [
    { "id": 1, "image_url": "https://..." },
    { "id": 2, "image_url": "https://..." }
  ]
}
```

---

## Showtimes `/api/showtimes`

### `GET /api/showtimes`
List showtimes with optional filters.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `play_id` | number | Filter by play |
| `venue_id` | number | Filter by venue |
| `city` | string | Filter by city |
| `from` | ISO date | Show dates on or after this date |
| `to` | ISO date | Show dates on or before this date |
| `limit` | number | Max results (default: 100) |
| `offset` | number | Pagination offset (default: 0) |

**Response**
```json
{
  "count": 2,
  "rows": [
    {
      "id": 101,
      "play_id": 5,
      "play_title": "Örnek Oyun",
      "play_poster": "https://...",
      "venue_id": 3,
      "venue_name": "Zorlu PSM",
      "city": "İstanbul",
      "show_datetime": "2026-03-15T20:00:00.000Z",
      "show_date_text": "15 Mart Pazar 20:00",
      "price_min": 250.00,
      "price_text": "250 TL'den başlayan fiyatlarla",
      "organizer": "Zorlu PSM"
    }
  ]
}
```

---

## Scrape Triggers `/api/scrape`

These endpoints trigger live Puppeteer scrapes. They are slow (5–15 seconds) and should be called from an admin panel or CLI, not on every page load.

### `POST /api/scrape/discover`
Discover new plays from biletinial.com listing pages and save them as suggestions.

**Request Body**
```json
{
  "startUrl": "https://biletinial.com/tr-tr/tiyatro/istanbul?minprice=0&maxprice=22000&order=1",
  "pageLimit": 5
}
```
Both fields are optional. Default `startUrl` is the Istanbul listing. Default `pageLimit` is 50.

**Response**
```json
{ "ok": true, "discovered": 48 }
```

---

### `POST /api/scrape/play/:slug`
Scrape a play detail page and upsert into the `plays` + `showtimes` tables.

**URL Parameter:** `slug` – biletinial.com play slug (e.g. `ornek-oyun`)

**Response**
```json
{ "ok": true, "play": "Örnek Oyun" }
```

---

### `POST /api/scrape/venue/:slug`
Scrape a venue detail page and upsert into the `venues` + `venue_gallery` tables.

**URL Parameter:** `slug` – biletinial.com venue slug (e.g. `zorlu-psm`)

**Response**
```json
{ "ok": true, "venue": "Zorlu PSM" }
```

---

## Database Schema Reference

```
suggestions      – keşfedilen oyun/mekan önerileri
plays            – kabul edilmiş, detayı çekilmiş oyunlar
venues           – kabul edilmiş, detayı çekilmiş mekanlar
showtimes        – oyun gösterimleri (play_id + venue_id)
price_categories – gösterim fiyat kategorileri (showtime_id)
venue_gallery    – mekan galeri resimleri (venue_id)
```

## Error Responses

All endpoints return errors in this shape:
```json
{ "error": "error_code_or_message" }
```

HTTP status codes: `400` Bad Request · `404` Not Found · `500` Server Error
