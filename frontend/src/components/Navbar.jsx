import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand">
          🎭 <span>Tiyatro Takip</span>
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Gösterimler
          </NavLink>
          <NavLink to="/watchlist" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Takip Listem
          </NavLink>
          <NavLink to="/ratings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Puanlarım
          </NavLink>
          <NavLink to="/suggestions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Öneriler
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

