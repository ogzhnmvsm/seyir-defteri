-- Tiyatro Takip (Seyir Defteri) Database Schema

CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    description TEXT,
    cover_image TEXT,
    biletinial_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venue_gallery (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plays (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    poster_url TEXT,
    duration VARCHAR(50),
    genre VARCHAR(100),
    biletinial_url TEXT,
    source VARCHAR(50),
    ibb_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS showtimes (
    id SERIAL PRIMARY KEY,
    play_id INTEGER REFERENCES plays(id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    city VARCHAR(100),
    show_datetime TIMESTAMP,
    show_date_text VARCHAR(255),
    price_min NUMERIC(10,2),
    price_text VARCHAR(255),
    organizer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_categories (
    id SERIAL PRIMARY KEY,
    showtime_id INTEGER REFERENCES showtimes(id) ON DELETE CASCADE,
    category_name VARCHAR(100),
    price NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS suggestions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    image_url TEXT,
    city VARCHAR(100),
    biletinial_url TEXT,
    metadata JSONB DEFAULT '{}',
    accepted BOOLEAN DEFAULT false,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    play_id INTEGER REFERENCES plays(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
