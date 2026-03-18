import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVenues } from '../api/api';
import VenueCard from '../components/VenueCard';

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getVenues({ q: query, limit: 100 })
      .then((res) => { setVenues(res.data.rows); setError(null); })
      .catch(() => setError('Mekanlar yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <div className="container page-content">
      <div className="section-title">Mekanlar</div>
      <div className="section-subtitle">Takip edilen tiyatro mekanları.</div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="search-input"
          placeholder="Mekan ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Ara</button>
        {query && (
          <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); setQuery(''); }}>
            Temizle
          </button>
        )}
      </form>

      {loading && <div className="loading-state"><div className="spinner" /><span>Yükleniyor...</span></div>}
      {error && <div className="error-state">⚠️ {error}</div>}
      {!loading && !error && venues.length === 0 && (
        <div className="empty-state">🏛️ <span>Henüz mekan kaydı yok.</span></div>
      )}
      {!loading && !error && venues.length > 0 && (
        <div className="card-grid">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
}
