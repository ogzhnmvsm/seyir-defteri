import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlays, deletePlay, getVenues, deleteVenue } from '../api/api';
import './WatchlistPage.css';

function PlayGrid({ items, onUnfollow }) {
  return (
    <div className="wl-grid">
      {items.map((play) => (
        <div key={play.id} className="wl-card">
          <Link to={`/plays/${play.id}`}>
            <img
              className="wl-card-img"
              src={play.poster_url}
              alt={play.title}
              onError={(e) => { e.target.src = 'https://placehold.co/200x280/1e1e30/a99ef9?text=🎭'; }}
            />
          </Link>
          <div className="wl-card-body">
            <Link to={`/plays/${play.id}`} className="wl-card-title">{play.title}</Link>
            {play.genre && <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{play.genre}</span>}
            {play.city && <div className="wl-card-sub">📍 {play.city}</div>}
            <button className="btn-unfollow" onClick={() => onUnfollow(play.id, play.title)}>
              ✕ Takibi Bırak
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function VenueGrid({ items, onUnfollow }) {
  return (
    <div className="wl-venue-grid">
      {items.map((v) => (
        <div key={v.id} className="wl-venue-card">
          {v.cover_image && (
            <img
              className="wl-venue-img"
              src={v.cover_image}
              alt={v.name}
              onError={(e) => { e.target.src = 'https://placehold.co/400x140/1e1e30/a99ef9?text=🏛️'; }}
            />
          )}
          <div className="wl-venue-body">
            <Link to={`/venues/${v.id}`} className="wl-card-title">{v.name}</Link>
            {v.address && <div className="wl-card-sub">📍 {v.address}</div>}
            {v.city && <div className="wl-card-sub">🏙️ {v.city}</div>}
            <button className="btn-unfollow" onClick={() => onUnfollow(v.id, v.name)}>
              ✕ Takibi Bırak
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WatchlistPage() {
  const [plays, setPlays] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getPlays({ limit: 200 }), getVenues({ limit: 200 })])
      .then(([pr, vr]) => { setPlays(pr.data.rows); setVenues(vr.data.rows); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleUnfollowPlay = async (id, title) => {
    if (!confirm(`"${title}" takipten çıkarılsın mı?`)) return;
    await deletePlay(id);
    setPlays((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUnfollowVenue = async (id, name) => {
    if (!confirm(`"${name}" takipten çıkarılsın mı?`)) return;
    await deleteVenue(id);
    setVenues((prev) => prev.filter((v) => v.id !== id));
  };

  const q = search.toLowerCase();
  const filteredPlays = plays.filter((p) => !q || (p.title || '').toLowerCase().includes(q));
  const filteredVenues = venues.filter((v) => !q || (v.name || '').toLowerCase().includes(q));

  return (
    <div className="container page-content">
      <div className="section-title">Takip Listem</div>
      <div className="section-subtitle">Takip ettiğiniz oyunlar ve mekanlar.</div>

      <input
        className="search-input"
        style={{ marginBottom: '32px' }}
        placeholder="🔍 Oyun veya mekan ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div className="loading-state"><div className="spinner" /><span>Yükleniyor...</span></div>}

      {!loading && (
        <>
          {/* Plays section */}
          <div className="wl-section-header">
            <span className="wl-section-label">🎭 Oyunlar</span>
            <span className="result-count">{filteredPlays.length} oyun</span>
          </div>
          {filteredPlays.length === 0
            ? <div className="empty-state" style={{ marginBottom: '32px' }}>🎭 <span>Takip edilen oyun yok.</span></div>
            : <PlayGrid items={filteredPlays} onUnfollow={handleUnfollowPlay} />}

          {/* Venues section */}
          <div className="wl-section-header" style={{ marginTop: '40px' }}>
            <span className="wl-section-label">🏛️ Mekanlar</span>
            <span className="result-count">{filteredVenues.length} mekan</span>
          </div>
          {filteredVenues.length === 0
            ? <div className="empty-state">🏛️ <span>Takip edilen mekan yok.</span></div>
            : <VenueGrid items={filteredVenues} onUnfollow={handleUnfollowVenue} />}
        </>
      )}
    </div>
  );
}
