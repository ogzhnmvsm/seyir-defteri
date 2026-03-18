import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPlay, deletePlay, rescrapePlay } from '../api/api';
import './PlayDetailPage.css';

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PlayDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [play, setPlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rescraping, setRescraping] = useState(false);

  const loadPlay = () => {
    setLoading(true);
    getPlay(id)
      .then((res) => { setPlay(res.data); setError(null); })
      .catch(() => setError('Oyun yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadPlay, [id]);

  const handleUnfollow = async () => {
    if (!confirm(`"${play.title}" takipten çıkarılsın mı? Gösterim bilgileri de silinecek.`)) return;
    await deletePlay(id);
    navigate('/watchlist');
  };

  const handleRescrape = async () => {
    setRescraping(true);
    try {
      const res = await rescrapePlay(id);
      alert(`✅ Güncellendi — ${res.data.showtimes} gösterim bulundu.`);
      loadPlay();
    } catch {
      alert('Güncelleme başarısız. Scraper hatası oluştu.');
    } finally {
      setRescraping(false);
    }
  };

  if (loading) return <div className="container page-content"><div className="loading-state"><div className="spinner" /><span>Yükleniyor...</span></div></div>;
  if (error) return <div className="container page-content"><div className="error-state">⚠️ {error}</div></div>;
  if (!play) return null;

  return (
    <div className="container page-content">
      <Link to="/" className="back-link">← Geri Dön</Link>

      <div className="detail-hero">
        <img
          className="detail-poster"
          src={play.poster_url}
          alt={play.title}
          onError={(e) => { e.target.src = 'https://placehold.co/400x560/1e1e30/a99ef9?text=🎭'; }}
        />
        <div className="detail-info">
          <div className="detail-title">{play.title}</div>
          <div className="detail-meta">
            {play.source === 'ibb' && (
              <span className="badge badge-ibb">🏛 İBB Şehir Tiyatroları</span>
            )}
            {play.genre && <span className="badge badge-accent">{play.genre}</span>}
            {play.duration && <span className="badge badge-pending">⏱ {play.duration}</span>}
          </div>
          {play.description && <p className="detail-desc">{play.description}</p>}
          <div className="detail-actions">
            {play.biletinial_url && (
              <a href={play.biletinial_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                Bilet Al →
              </a>
            )}
            {play.source === 'ibb' && play.ibb_url && (
              <a href={play.ibb_url} target="_blank" rel="noreferrer" className="btn btn-ibb">
                🏛 İBB Sitesinde Gör →
              </a>
            )}
            <button className="btn btn-rescrape" onClick={handleRescrape} disabled={rescraping}>
              {rescraping ? '⏳ Taranıyor...' : '🔄 Gösterimleri Güncelle'}
            </button>
            <button className="btn btn-unfollow-detail" onClick={handleUnfollow}>
              ✕ Takibi Bırak
            </button>
          </div>
        </div>
      </div>

      <div className="section-title">Gösterimler</div>
      {play.showtimes?.length === 0 && (
        <div className="empty-state" style={{ flexDirection: 'column', textAlign: 'center', gap: '8px' }}>
          <span>📅 Gösterim bilgisi bulunamadı.</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            "Gösterimleri Güncelle" butonuna tıklayarak veriyi yeniden çekmeyi deneyin.
          </span>
        </div>
      )}
      {play.showtimes?.length > 0 && (
        <div className="showtime-table-wrap">
          <table className="showtime-table">
            <thead>
              <tr><th>Tarih</th><th>Mekan</th><th>Şehir</th><th>Fiyat</th><th>Kategoriler</th></tr>
            </thead>
            <tbody>
              {play.showtimes.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.show_datetime)}</td>
                  <td>
                    {s.venue_id
                      ? <Link to={`/venues/${s.venue_id}`} className="venue-link">{s.venue_name || '—'}</Link>
                      : (s.venue_name || '—')}
                  </td>
                  <td>{s.city || '—'}</td>
                  <td className="price-cell">{s.price_text || (s.price_min ? `${s.price_min} ₺` : '—')}</td>
                  <td>
                    {s.price_categories?.length > 0 ? (
                      <div className="price-cats">
                        {s.price_categories.map((c, i) => (
                          <span key={i} className="price-cat">{c.category_name}: <strong>{c.price} ₺</strong></span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
