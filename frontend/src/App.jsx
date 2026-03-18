import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import WatchlistPage from './pages/WatchlistPage';
import SuggestionsPage from './pages/SuggestionsPage';
import VenuesPage from './pages/VenuesPage';
import PlayDetailPage from './pages/PlayDetailPage';
import VenueDetailPage from './pages/VenueDetailPage';
import RatingsPage from './pages/RatingsPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/suggestions" element={<SuggestionsPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/plays/:id" element={<PlayDetailPage />} />
        <Route path="/venues/:id" element={<VenueDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
