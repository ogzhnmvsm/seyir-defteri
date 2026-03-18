-- Kullanıcı oyun puanlama tablosu
CREATE TABLE IF NOT EXISTS user_ratings (
    id SERIAL PRIMARY KEY,
    play_id INTEGER NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    showtime_id INTEGER REFERENCES showtimes(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (play_id)  -- Oyun başına bir puan
);
