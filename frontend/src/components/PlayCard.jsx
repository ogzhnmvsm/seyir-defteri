import { Link } from 'react-router-dom';
import './PlayCard.css';

export default function PlayCard({ play }) {
  return (
    <Link to={`/plays/${play.id}`} className="play-card">
      <div className="play-card__img-wrap">
        <img
          src={play.poster_url || play.image_url}
          alt={play.title}
          className="play-card__img"
          onError={(e) => { e.target.src = 'https://placehold.co/400x560/1e1e30/a99ef9?text=🎭'; }}
        />
        {play.genre && <span className="play-card__genre badge badge-accent">{play.genre}</span>}
      </div>
      <div className="play-card__body">
        <div className="play-card__title">{play.title}</div>
        {play.duration && <div className="play-card__meta">⏱ {play.duration}</div>}
      </div>
    </Link>
  );
}
