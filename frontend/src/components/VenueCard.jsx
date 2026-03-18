import { Link } from 'react-router-dom';
import './VenueCard.css';

export default function VenueCard({ venue }) {
  return (
    <Link to={`/venues/${venue.id}`} className="venue-card">
      <div className="venue-card__img-wrap">
        <img
          src={venue.cover_image}
          alt={venue.name}
          className="venue-card__img"
          onError={(e) => { e.target.src = 'https://placehold.co/600x300/1e1e30/a99ef9?text=🏛️'; }}
        />
      </div>
      <div className="venue-card__body">
        <div className="venue-card__name">{venue.name}</div>
        {venue.address && (
          <div className="venue-card__address">📍 {venue.address}</div>
        )}
      </div>
    </Link>
  );
}
