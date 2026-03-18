import { useEffect, useState } from 'react';
import { getSuggestions, acceptSuggestion } from '../api/api';
import { usePagination, Pagination } from '../components/Pagination';
import './SuggestionsPage.css';

const RATING_OPTIONS = [
  { label: 'Tüm Puanlar', value: 0 },
  { label: '4.0 +', value: 4.0 },
  { label: '4.3 +', value: 4.3 },
  { label: '4.5 +', value: 4.5 },
  { label: '4.7 +', value: 4.7 },
];

const PAGE_SIZE = 24;

export default function SuggestionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'title' | 'rating'

  const load = () => {
    setLoading(true);
    getSuggestions({ accepted: false, limit: 500 })
      .then((res) => { setItems(res.data.rows); setError(null); })
      .catch(() => setError('Öneriler yüklenemedi.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleFollow = async (id) => {
    setBusy((b) => ({ ...b, [id]: 'saving' }));
    try {
      await acceptSuggestion(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('Takip etme sırasında bir hata oluştu.');
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
    }
  };

  const cities = [...new Set(items.map((i) => i.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));

  const filtered = items
    .filter((item) => {
      if (cityFilter && item.city !== cityFilter) return false;
      if (minRating > 0) {
        const r = parseFloat(item.metadata?.rating);
        if (isNaN(r) || r < minRating) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!(item.title || '').toLowerCase().includes(q) &&
            !(item.metadata?.address || '').toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '', 'tr');
      if (sortBy === 'rating') return (parseFloat(b.metadata?.rating) || 0) - (parseFloat(a.metadata?.rating) || 0);
      return new Date(b.discovered_at) - new Date(a.discovered_at);
    });

  const { page, setPage, totalPages, slice } = usePagination(filtered, PAGE_SIZE);

  return (
    <div className="container page-content">
      <div className="section-title">Öneriler</div>
      <div className="section-subtitle">Scraper tarafından keşfedilen gösterimler. Beğendiklerinizi takibe alın.</div>

      {/* Sticky filter bar */}
      <div className="filter-bar sugg-filter-bar sticky-filter-bar">
        <input
          className="search-input sugg-search"
          placeholder="🔍 Oyun ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="filter-select" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}>
          <option value="">📍 Tüm Şehirler</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={minRating} onChange={(e) => { setMinRating(parseFloat(e.target.value)); setPage(1); }}>
          {RATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>⭐ {o.label}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">↕ Tarihe göre</option>
          <option value="title">↕ Ada göre</option>
          <option value="rating">↕ Puana göre</option>
        </select>
        <span className="result-count">{filtered.length} öneri</span>
      </div>

      {loading && (
        <div className="sugg-loading-overlay">
          <div className="spinner" />
          <span>Scraped öneriler yükleniyor…</span>
        </div>
      )}
      {error && <div className="error-state">⚠️ {error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">✅ <span>İncelenecek öneri kalmadı.</span></div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="sugg-card-grid">
            {slice.map((item) => (
              <div key={item.id} className={`sugg-card${busy[item.id] ? ' sugg-card-busy' : ''}`}>
                {busy[item.id] && (
                  <div className="sugg-card-overlay">
                    <div className="spinner" />
                    <span>Oyun scraping ediliyor…</span>
                  </div>
                )}
                <div className="sugg-card-img-wrap">
                  <img
                    className="sugg-card-img"
                    src={item.image_url}
                    alt={item.title}
                    onError={(e) => { e.target.src = 'https://placehold.co/200x280/1e1e30/a99ef9?text=🎭'; }}
                  />
                  {item.metadata?.rating && (
                    <span className="sugg-rating-badge">⭐ {item.metadata.rating}</span>
                  )}
                </div>
                <div className="sugg-card-body">
                  <div className="sugg-card-title" title={item.title}>{item.title}</div>
                  {item.metadata?.address && (
                    <div className="sugg-card-meta">🏛️ {item.metadata.address}</div>
                  )}
                  {item.city && <div className="sugg-card-meta">📍 {item.city}</div>}
                  {item.metadata?.datesText && (
                    <div className="sugg-card-dates">📆 {item.metadata.datesText}</div>
                  )}
                  <button
                    className="btn-follow sugg-follow-btn"
                    disabled={!!busy[item.id]}
                    onClick={() => handleFollow(item.id)}
                  >
                    {busy[item.id] ? '⏳ İşleniyor...' : '+ Takip Et'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}
