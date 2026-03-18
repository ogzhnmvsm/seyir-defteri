-- suggestions tablosu: keşfedilen oyun ve mekan önerilerini tutar
CREATE TABLE IF NOT EXISTS suggestions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'play' veya 'venue'
    title TEXT NOT NULL,
    slug TEXT,
    image_url TEXT,
    city TEXT,
    biletinial_url TEXT,
    metadata JSONB,
    accepted BOOLEAN DEFAULT FALSE,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggestions_type_slug ON suggestions(type, slug);
