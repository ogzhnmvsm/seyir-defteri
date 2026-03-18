import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: BASE_URL });

// Plays
export const getPlays = (params) => api.get('/api/plays', { params });
export const getPlay = (id) => api.get(`/api/plays/${id}`);
export const deletePlay = (id) => api.delete(`/api/plays/${id}`);
export const rescrapePlay = (id) => api.post(`/api/plays/${id}/rescrape`);

// Venues
export const getVenues = (params) => api.get('/api/venues', { params });
export const getVenue = (id) => api.get(`/api/venues/${id}`);
export const deleteVenue = (id) => api.delete(`/api/venues/${id}`);

// Showtimes
export const getShowtimes = (params) => api.get('/api/showtimes', { params });

// Suggestions
export const getSuggestions = (params) => api.get('/api/suggestions', { params });
export const acceptSuggestion = (id) => api.post(`/api/suggestions/${id}/accept`);

// Ratings
export const getRatings = () => api.get('/api/ratings');
export const upsertRating = (data) => api.post('/api/ratings', data);
export const deleteRating = (play_id) => api.delete(`/api/ratings/${play_id}`);

