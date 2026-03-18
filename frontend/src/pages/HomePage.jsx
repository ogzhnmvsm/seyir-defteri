import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getShowtimes } from '../api/api';
import { usePagination, Pagination } from '../components/Pagination';
import './HomePage.css';

const PAGE_SIZE_LIST = 20;
const PAGE_SIZE_CARD = 30;

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('tr-TR', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

const today = () => new Date().toISOString().split('T')[0];

function CityDropdown({ cities, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (city) =>
    onChange(selected.includes(city) ? selected.filter((c) => c !== city) : [...selected, city]);

  const label = selected.length === 0 ? '📍 Tüm Şehirler' : `📍 ${selected.length} şehir`;

  return (
    <div className="city-dropdown" ref={ref}>
      <button className="city-dropdown-toggle" onClick={() => setOpen((v) => !v)}>
        {label} ▾
      </button>
      {open && (
        <div className="city-dropdown-menu">
          {cities.length === 0 && <div className="city-dd-empty">Yükleniyor…</div>}
          {cities.map((c) => (
            <label key={c} className="city-dd-item">
              <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} />
              {c}
            </label>
          ))}
          {selected.length > 0 && (
            <button className="city-dd-clear" onClick={() => onChange([])}>✕ Temizle</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('card');

  const [search, setSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: 500, from: dateFrom || today() };
    if (dateTo) params.to = dateTo;
    getShowtimes(params)
      .then((res) => { setShowtimes(res.data.rows); setError(null); })
      .catch(() => setError('Gösterimler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const cities = [...new Set(showtimes.map((s) => s.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));

  const filtered = showtimes
    .filter((s) => {
      if (selectedCities.length > 0 && !selectedCities.includes(s.city)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (s.play_title || '').toLowerCase().includes(q) || (s.venue_name || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'play') return (a.play_title || '').localeCompare(b.play_title || '', 'tr');
      if (sortBy === 'venue') return (a.venue_name || '').localeCompare(b.venue_name || '', 'tr');
      return new Date(a.show_datetime) - new Date(b.show_datetime);
    });

  const pageSize = view === 'card' ? PAGE_SIZE_CARD : PAGE_SIZE_LIST;
  const { page, setPage, totalPages, slice } = usePagination(filtered, pageSize);

  const handleFilterChange = (fn) => (...args) => { fn(...args); setPage(1); };

  return (
    <div className="container page-content">
      <div className="home-header">
        <div className="section-title">Yaklaşan Gösterimler</div>
        <div className="section-subtitle">Takip ettiğiniz oyunların ve mekanların gelecek gösterimleri.</div>
      </div>

      {/* Sticky filter bar */}
      <div className="filter-bar sticky-filter-bar home-filter-bar">
        <input
          className="search-input"
          placeholder="🔍 Oyun veya mekan ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <CityDropdown cities={cities} selected={selectedCities} onChange={handleFilterChange(setSelectedCities)} />
        <div className="date-range">
          <input type="date" className="filter-select" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="Tarihten" />
          <span className="date-sep">→</span>
          <input type="date" className="filter-select" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} title="Tarihe" />
        </div>
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">↕ Tarihe göre</option>
          <option value="play">↕ Oyuna göre</option>
          <option value="venue">↕ Mekana göre</option>
        </select>
        <div className="view-toggle">
          <button className={`view-btn${view === 'list' ? ' active' : ''}`} onClick={() => { setView('list'); setPage(1); }} title="Liste">☰</button>
          <button className={`view-btn${view === 'card' ? ' active' : ''}`} onClick={() => { setView('card'); setPage(1); }} title="Kart">⊞</button>
        </div>
        <span className="result-count">{filtered.length} gösterim</span>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><span>Yükleniyor...</span></div>}
      {error && <div className="error-state">⚠️ {error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">🎭 <span>Gösterim bulunamadı.</span> <span style={{ fontSize: '0.8rem' }}>Öneriler'den oyun takibe alın.</span></div>
      )}

      {/* LIST VIEW */}
      {!loading && !error && slice.length > 0 && view === 'list' && (
        <div className="showtime-list">
          {slice.map((s) => (
            <div key={s.id} className="showtime-row">
              <Link to={`/plays/${s.play_id}`} className="showtime-poster-link">
                <img className="showtime-poster" src={s.play_poster} alt={s.play_title}
                  onError={(e) => { e.target.src = 'https://placehold.co/56x80/1e1e30/a99ef9?text=🎭'; }} />
              </Link>
              <div className="showtime-info">
                <Link to={`/plays/${s.play_id}`} className="showtime-play-title">{s.play_title}</Link>
                <div className="showtime-meta">
                  {s.venue_id
                    ? <Link to={`/venues/${s.venue_id}`} className="showtime-venue">🏛️ {s.venue_name}</Link>
                    : <span className="showtime-venue">🏛️ {s.venue_name || '—'}</span>}
                  {s.city && <span className="showtime-city">📍 {s.city}</span>}
                </div>
              </div>
              <div className="showtime-right">
                <div className="showtime-date">{formatDate(s.show_datetime)}</div>
                {s.price_min != null && (
                  <div className="showtime-price">{parseFloat(s.price_min).toLocaleString('tr-TR')} ₺'den başlar</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CARD VIEW */}
      {!loading && !error && slice.length > 0 && view === 'card' && (
        <div className="showtime-card-grid">
          {slice.map((s) => (
            <div key={s.id} className="showtime-card">
              <Link to={`/plays/${s.play_id}`}>
                <img className="showtime-card-img" src={s.play_poster} alt={s.play_title}
                  onError={(e) => { e.target.src = 'https://placehold.co/200x280/1e1e30/a99ef9?text=🎭'; }} />
              </Link>
              <div className="showtime-card-body">
                <Link to={`/plays/${s.play_id}`} className="showtime-play-title">{s.play_title}</Link>
                <div className="showtime-date" style={{ fontSize: '0.78rem', marginTop: '2px' }}>{formatDate(s.show_datetime)}</div>
                {s.venue_id
                  ? <Link to={`/venues/${s.venue_id}`} className="showtime-venue">🏛️ {s.venue_name}</Link>
                  : <span className="showtime-venue">🏛️ {s.venue_name || '—'}</span>}
                {s.city && <span className="showtime-city">📍 {s.city}</span>}
                {s.price_min != null && (
                  <div className="showtime-price">{parseFloat(s.price_min).toLocaleString('tr-TR')} ₺'den başlar</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}
