require('dotenv').config();
const express = require('express');
const cors = require('cors');

const suggestionsRoutes = require('./routes/suggestions');
const scrapeRoutes = require('./routes/scrape');
const playsRoutes = require('./routes/plays');
const venuesRoutes = require('./routes/venues');
const showtimesRoutes = require('./routes/showtimes');
const ratingsRoutes = require('./routes/ratings');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/plays', playsRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/showtimes', showtimesRoutes);
app.use('/api/ratings', ratingsRoutes);

app.listen(port, () => {
    console.log(`✅ Backend listening on http://localhost:${port}`);
});