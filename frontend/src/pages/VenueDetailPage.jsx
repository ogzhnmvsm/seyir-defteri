import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVenue, deleteVenue, getShowtimes } from '../api/api';
import './VenueDetailPage.css';

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('tr-TR', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

const todayISO = () => new Date().toISOString().split('T')[0];

export default function VenueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [stLoading, setStLoading] = useState(true);

  const handleUnfollow = async () => {
    if (!confirm(`"${venue.name}" takipten çıkarılsın mı?`)) return;
    await deleteVenue(id);
    navigate('/watchlist');
  };

  useEffect(() => {
    setLoading(true);
    getVenue(id)
      .then((res) => { setVenue(res.data); setError(null); })
      .catch(() => setError('Mekan yüklenemedi.'))
      .finally(() => setLoading(false));

    setStLoading(true);
    getShowtimes({ venue_id: id, from: todayISO(), limit: 50 })
      .then((res) => setShowtimes(res.data.rows))
      .catch(() => {})
      .finally(() => setStLoading(false));
  }, [id]);

  if (loading) return <div className="container page-content"><div className="loading-state"><div className="spinner" /><span>Yükleniyor...</span></div></div>;
  if (error) return <div className="container page-content"><div className="error-state">⚠️ {error}</div></div>;
  if (!venue) return null;

  return (
    <div className="container page-content">
      <Link to="/watchlist" className="back-link">← Takip Listem</Link>

      <div className="venue-hero">
        {venue.cover_image && (
          <img
            className="venue-hero-img"
            src={venue.cover_image}
            alt={venue.name}
            onError={(e) => { e.target.src = 'https://placehold.co/1200x400/1e1e30/a99ef9?text=🏛️'; }}
          />
        )}
        <div className="venue-hero-body">
          <div className="detail-title">{venue.name}</div>
          <div className="venue-contact">
            {venue.address && <div>📍 {venue.address}</div>}
            {venue.phone && (
              <div>
                📞 <a href={`tel:${venue.phone}`} className="phone-link">{venue.phone}</a>
              </div>
            )}
            <div className="detail-actions" style={{ marginTop: '12px' }}>
              {venue.biletinial_url && (
                <a href={venue.biletinial_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                  Biletinial'da Gör →
                </a>
              )}
              <button className="btn-unfollow-detail" onClick={handleUnfollow}>
                ✕ Takibi Bırak
              </button>
            </div>
          </div>
          {venue.description && <p className="detail-desc" style={{ marginTop: '16px' }}>{venue.description}</p>}
        </div>
      </div>

      {/* Upcoming Showtimes */}
      <div className="section-title" style={{ marginTop: '36px' }}>Yaklaşan Gösterimler</div>
      {stLoading && <div className="loading-state"><div className="spinner" /><span>Yükleniyor...</span></div>}
      {!stLoading && showtimes.length === 0 && (
        <div className="empty-state">📅 <span>Bu mekanda planlanmış yaklaşan gösterim bulunmuyor.</span></div>
      )}
      {!stLoading && showtimes.length > 0 && (
        <div className="showtime-list" style={{ marginTop: '14px' }}>
          {showtimes.map((s) => (
            <div key={s.id} className="showtime-row">
              <Link to={`/plays/${s.play_id}`}>
                <img
                  className="showtime-poster"
                  src={s.play_poster}
                  alt={s.play_title}
                  onError={(e) => { e.target.src = 'https://placehold.co/48x68/1e1e30/a99ef9?text=🎭'; }}
                />
              </Link>
              <div className="showtime-info">
                <Link to={`/plays/${s.play_id}`} className="showtime-play-title">{s.play_title}</Link>
                {s.city && <span className="showtime-city">📍 {s.city}</span>}
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

      {venue.gallery?.length > 0 && (
        <>
          <div className="section-title" style={{ margin: '36px 0 16px' }}>Galeri</div>
          <div className="gallery-grid">
            {venue.gallery.map((g) => (
              <a key={g.id} href={g.image_url} target="_blank" rel="noreferrer">
                <img
                  className="gallery-img"
                  src={g.image_url}
                  alt=""
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
