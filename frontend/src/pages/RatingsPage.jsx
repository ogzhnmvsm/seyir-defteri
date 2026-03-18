import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlays, getRatings, upsertRating, deleteRating } from '../api/api';
import './RatingsPage.css';

const STARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker">
      {STARS.map((s) => (
        <button
          key={s}
          className={`star ${(hover || value) >= s ? 'filled' : ''}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          title={`${s}/10`}
        >★</button>
      ))}
      {value > 0 && <span className="star-label">{value}/10</span>}
    </div>
  );
}

export default function RatingsPage() {
  const [plays, setPlays] = useState([]);
  const [ratings, setRatings] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getPlays({ limit: 200 }), getRatings()])
      .then(([pr, rr]) => {
        setPlays(pr.data.rows);
        const rm = {};
        rr.data.rows.forEach((r) => { rm[r.play_id] = r; });
        setRatings(rm);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (play_id) => setExpanded((prev) => prev === play_id ? null : play_id);

  const handleRate = async (play_id, data) => {
    setSaving((s) => ({ ...s, [play_id]: true }));
    try {
      const res = await upsertRating({ play_id, ...data });
      setRatings((prev) => ({ ...prev, [play_id]: res.data }));
    } finally {
      setSaving((s) => ({ ...s, [play_id]: false }));
    }
  };

  const handleDelete = async (play_id) => {
    setSaving((s) => ({ ...s, [play_id]: true }));
    try {
      await deleteRating(play_id);
      setRatings((prev) => { const n = { ...prev }; delete n[play_id]; return n; });
    } finally {
      setSaving((s) => ({ ...s, [play_id]: false }));
    }
  };

  const q = search.toLowerCase();
  const filtered = plays.filter((p) => !q || (p.title || '').toLowerCase().includes(q));
  const rated = filtered.filter((p) => ratings[p.id]);
  const unrated = filtered.filter((p) => !ratings[p.id]);

  const PlayRow = ({ play }) => {
    const r = ratings[play.id];
    const isOpen = expanded === play.id;
    const isSaving = saving[play.id];

    return (
      <div className={`rating-row${r ? ' has-rating' : ''}`}>
        <Link to={`/plays/${play.id}`}>
          <img
            className="rating-poster"
            src={play.poster_url}
            alt={play.title}
            onError={(e) => { e.target.src = 'https://placehold.co/48x68/1e1e30/a99ef9?text=🎭'; }}
          />
        </Link>
        <div className="rating-info">
          <Link to={`/plays/${play.id}`} className="rating-title">{play.title}</Link>
          {play.genre && <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{play.genre}</span>}
          {r && (
            <div className="rating-summary">
              <StarPicker value={r.rating} onChange={(v) => handleRate(play.id, { rating: v, times_attended: r.times_attended, attended_dates: r.attended_dates, note: r.note })} />
              {r.times_attended > 0 && (
                <span className="rating-went">🎟 {r.times_attended} kez gidildi</span>
              )}
            </div>
          )}
          {!r && (
            <StarPicker value={0} onChange={(v) => { handleRate(play.id, { rating: v, times_attended: 0, attended_dates: [], note: null }); setExpanded(play.id); }} />
          )}
        </div>
        <div className="rating-actions">
          {!isSaving && (
            <button className="rating-expand-btn" onClick={() => toggleExpand(play.id)}>
              {isOpen ? '▲ Kapat' : '✎ Düzenle'}
            </button>
          )}
          {isSaving && <span className="saving-label">💾 Kaydediliyor…</span>}
          {r && !isSaving && (
            <button className="btn-unfollow-detail" style={{ fontSize: '0.73rem', padding: '4px 10px' }} onClick={() => handleDelete(play.id)}>
              ✕ Puanı Sil
            </button>
          )}
        </div>

        {isOpen && (
          <div className="rating-editor">
            <RatingEditor
              rating={r}
              isSaving={isSaving}
              onSave={(data) => handleRate(play.id, data)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container page-content">
      <div className="section-title">Puanlarım</div>
      <div className="section-subtitle">Takip ettiğiniz oyunları puanlayın, kaç kere ve ne zaman gittiğinizi kaydedin.</div>

      <input
        className="search-input sticky-search"
        placeholder="🔍 Oyun ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div className="loading-state"><div className="spinner" /><span>Yükleniyor...</span></div>}

      {!loading && rated.length > 0 && (
        <>
          <div className="wl-section-header">
            <span className="wl-section-label">⭐ Puanladıklarım</span>
            <span className="result-count">{rated.length} oyun</span>
          </div>
          <div className="rating-list">{rated.map((p) => <PlayRow key={p.id} play={p} />)}</div>
        </>
      )}

      {!loading && unrated.length > 0 && (
        <>
          <div className="wl-section-header" style={{ marginTop: '36px' }}>
            <span className="wl-section-label">🎭 Puanlanmamış</span>
            <span className="result-count">{unrated.length} oyun</span>
          </div>
          <div className="rating-list">{unrated.map((p) => <PlayRow key={p.id} play={p} />)}</div>
        </>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">🎭 <span>Takip edilen oyun yok. Öneriler'den oyun takibe alın.</span></div>
      )}
    </div>
  );
}

function RatingEditor({ rating, isSaving, onSave }) {
  const [stars, setStars] = useState(rating?.rating || 0);
  const [times, setTimes] = useState(rating?.times_attended ?? 0);
  const [dates, setDates] = useState(rating?.attended_dates ?? []);
  const [newDate, setNewDate] = useState('');
  const [note, setNote] = useState(rating?.note || '');

  const addDate = () => {
    if (!newDate || dates.includes(newDate)) return;
    const next = [...dates, newDate].sort();
    setDates(next);
    setTimes(next.length);
    setNewDate('');
  };

  const removeDate = (d) => {
    const next = dates.filter((x) => x !== d);
    setDates(next);
    if (times === dates.length) setTimes(next.length); // sync count if it was auto
  };

  return (
    <div className="rating-edit-panel">
      <div className="rp-row">
        <label className="rp-label">Puan</label>
        <StarPicker value={stars} onChange={setStars} />
      </div>

      <div className="rp-row">
        <label className="rp-label">Kaç kere gidildi</label>
        <div className="times-row">
          <button className="times-btn" onClick={() => setTimes(Math.max(0, times - 1))}>−</button>
          <span className="times-value">{times}</span>
          <button className="times-btn" onClick={() => setTimes(times + 1)}>+</button>
          <span className="times-hint">kez</span>
        </div>
      </div>

      <div className="rp-row">
        <label className="rp-label">Gittiğim tarihler <small>(opsiyonel)</small></label>
        <div className="date-entry-row">
          <input
            type="date"
            className="filter-select"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={addDate}>
            + Ekle
          </button>
        </div>
        {dates.length > 0 && (
          <div className="date-chips">
            {dates.map((d) => (
              <span key={d} className="date-chip">
                {new Date(d + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                <button className="date-chip-remove" onClick={() => removeDate(d)}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rp-row">
        <label className="rp-label">Not <small>(opsiyonel)</small></label>
        <textarea
          className="rp-textarea"
          placeholder="İzlenim notunuz..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>

      <button
        className="btn btn-primary"
        disabled={!stars || isSaving}
        onClick={() => onSave({ rating: stars, times_attended: times, attended_dates: dates, note: note || null })}
      >
        {isSaving ? '💾 Kaydediliyor...' : '💾 Kaydet'}
      </button>
    </div>
  );
}
