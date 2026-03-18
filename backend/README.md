# Backend for Tiyatro Takip

This backend exposes endpoints for scraper operations and suggestions management.

Available APIs:

- GET /api/suggestions?accepted=&limit=&offset= — list suggestions
- POST /api/suggestions/:id/accept — mark suggestion accepted
- POST /api/suggestions/:id/reject — delete suggestion
- POST /api/scrape/discover { startUrl?, pageLimit? } — trigger discover and save suggestions
- POST /api/scrape/play/:slug — scrape play detail and save
- POST /api/scrape/venue/:slug — scrape venue detail and save

Usage:

1. Copy `.env.example` to `.env` and set PG credentials.
2. npm install
3. npm run dev

Notes:

- Endpoints are unprotected; add authentication for production.
- Discover and scrape use existing scraper modules in `../scraper/src` (Puppeteer). Ensure the server environment can run Puppeteer.
