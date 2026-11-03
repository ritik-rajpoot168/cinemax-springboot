import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { formatInr } from '../utils/currency';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const formatDuration = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;

const StarInput = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5,6,7,8,9,10].map(n => (
      <button key={n} onClick={() => onChange(n)} className={`text-xl transition-transform hover:scale-125 ${n <= value ? 'star-filled' : 'star-empty'}`}>★</button>
    ))}
  </div>
);

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('showtimes');
  const [theatres, setTheatres] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    axios.get(`/api/movies/${id}`)
      .then(r => { setMovie(r.data); setLoading(false); })
      .catch(() => { setLoading(false); navigate('/movies'); });
  }, [id]);

  useEffect(() => {
    axios.get('/api/theatres?limit=60')
      .then(r => {
        setTheatres(r.data || []);
        if (r.data?.length) {
          setSelectedCity(r.data[0].city);
          setSelectedTheatreId(r.data[0]._id);
        }
      })
      .catch(() => toast.error('Could not load theatres'));
  }, []);

  const handleReview = async () => {
    if (!review.rating) return toast.error('Please select a rating');
    if (!review.comment.trim()) return toast.error('Please write a comment');
    setSubmitting(true);
    try {
      await axios.post(`/api/movies/review/${id}`, review);
      toast.success('Review submitted!');
      const res = await axios.get(`/api/movies/${id}`);
      setMovie(res.data);
      setReview({ rating: 0, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await axios.post(`/api/movies/favorite/${id}`);
      toast.success(res.data.isFavorite ? '❤️ Added to favorites' : '💔 Removed from favorites');
    } catch { toast.error('Failed'); }
  };

  const groupedShowTimes = movie?.showTimes?.reduce((acc, st) => {
    const date = new Date(st.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(st);
    return acc;
  }, {}) || {};

  const dateKeys = Object.keys(groupedShowTimes);
  const cities = [...new Set(theatres.map(t => t.city))].sort();
  const visibleTheatres = theatres.filter(t => !selectedCity || t.city === selectedCity);
  const selectedTheatre = theatres.find(t => t._id === selectedTheatreId);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await axios.get('/api/theatres', {
            params: { lat: coords.latitude, lng: coords.longitude, limit: 60 },
          });
          const sorted = res.data || [];
          setTheatres(sorted);
          if (sorted[0]) {
            setSelectedCity(sorted[0].city);
            setSelectedTheatreId(sorted[0]._id);
            toast.success(`Nearest theatre: ${sorted[0].name}`);
          }
        } catch {
          toast.error('Could not sort theatres by your location');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Location permission was not granted');
      }
    );
  };

  const openSeats = (showtimeId) => {
    if (!selectedTheatre) {
      toast.error('Please select a theatre first');
      return;
    }

    navigate(`/movie/${id}/seats/${showtimeId}`, {
      state: { theatre: selectedTheatre },
    });
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!movie) return null;

  const formatTag = { '2D': 'bg-blue-600', '3D': 'bg-purple-600', 'IMAX': 'bg-amber-600', '4DX': 'bg-green-600' };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Banner */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={e => e.target.src = movie.posterUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <div className="w-40 md:w-56 rounded-xl overflow-hidden shadow-2xl border border-dark-border">
              <img src={movie.posterUrl} alt={movie.title} className="w-full" onError={e => e.target.src = ''} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-16">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {movie.genre?.map(g => <span key={g} className="badge bg-dark-surface border border-dark-border text-white/60">{g}</span>)}
              {movie.category && <span className="badge bg-primary/20 border border-primary/40 text-primary">{movie.category}</span>}
              <span className="badge bg-dark-surface border border-dark-border text-white/60">{movie.ageRating}</span>
              <span className="badge bg-dark-surface border border-dark-border text-white/60">{movie.language?.join(', ')}</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl text-white tracking-wide mb-4">{movie.title}</h1>

            <div className="flex items-center gap-6 mb-4 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <span className="star-filled">★</span>
                <span className="text-white font-semibold">{Number(movie.rating).toFixed(1)}</span>
                /10
                <span className="text-white/40">({movie.totalRatings} ratings)</span>
              </span>
              {movie.imdbRating > 0 && <span>IMDb <span className="text-white font-semibold">{Number(movie.imdbRating).toFixed(1)}</span></span>}
              {movie.criticsRating > 0 && <span>Critics <span className="text-white font-semibold">{movie.criticsRating}%</span></span>}
              <span>⏱ {formatDuration(movie.duration)}</span>
              <span>📅 {formatDate(movie.releaseDate)}</span>
            </div>

            {movie.director && <p className="text-white/50 text-sm mb-2">🎬 Directed by <span className="text-white">{movie.director}</span></p>}
            {movie.cast?.length > 0 && <p className="text-white/50 text-sm mb-4">🎭 {movie.cast.join(', ')}</p>}

            <p className="text-white/70 leading-relaxed mb-6 max-w-2xl">{movie.description}</p>

            <div className="flex items-center gap-4">
              {movie.status === 'now_showing' && (
                <button
                  onClick={() => { setActiveTab('showtimes'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="btn-primary px-8 py-3"
                >
                  🎟 Book Tickets
                </button>
              )}
              {movie.status === 'coming_soon' && (
                <button className="btn-outline px-8 py-3 cursor-not-allowed opacity-60">📅 Coming Soon</button>
              )}
              <button onClick={handleFavorite} className="btn-outline px-6 py-3 flex items-center gap-2">
                ❤️ Favorite
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div id="tabs" className="mt-12">
          <div className="flex border-b border-dark-border gap-8">
            {['showtimes', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold uppercase tracking-wider transition-colors capitalize ${activeTab === tab ? 'text-white border-b-2 border-primary -mb-px' : 'text-white/40 hover:text-white/70'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Showtimes Tab */}
          {activeTab === 'showtimes' && (
            <div className="mt-6 animate-slide-up">
              {movie.status !== 'now_showing' ? (
                <div className="text-center py-12 text-white/40">
                  <span className="text-4xl block mb-3">📅</span>
                  No showtimes available yet.
                </div>
              ) : dateKeys.length === 0 ? (
                <div className="text-center py-12 text-white/40">No showtimes scheduled.</div>
              ) : (
                <>
                  {/* Theatre selector */}
                  <div className="bg-dark-card border border-dark-border rounded-xl p-5 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-white font-semibold">Choose location and theatre</h3>
                        <p className="text-white/40 text-sm">Shows are filtered by selected city and theatre.</p>
                      </div>
                      <button
                        onClick={detectLocation}
                        disabled={locating}
                        className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
                      >
                        {locating ? 'Detecting...' : 'Use My Location'}
                      </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                      {cities.map(city => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedCity(city);
                            const first = theatres.find(t => t.city === city);
                            setSelectedTheatreId(first?._id || '');
                          }}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-colors ${selectedCity === city ? 'bg-primary text-white' : 'bg-dark-surface border border-dark-border text-white/60 hover:border-white/30'}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {visibleTheatres.map(theatre => (
                        <button
                          key={theatre._id}
                          onClick={() => setSelectedTheatreId(theatre._id)}
                          className={`text-left border rounded-xl p-4 transition-all ${selectedTheatreId === theatre._id ? 'border-primary bg-primary/10' : 'border-dark-border bg-dark-surface hover:border-white/30'}`}
                        >
                          <div className="text-white font-semibold text-sm">{theatre.name}</div>
                          <div className="text-white/40 text-xs mt-1 line-clamp-2">{theatre.address}</div>
                          <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
                            <span>★ {Number(theatre.rating).toFixed(1)}</span>
                            <span>{theatre.screens} screens</span>
                            {theatre.distance && <span>{theatre.distance} km</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date selector */}
                  <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
                    {dateKeys.map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedDate === date ? 'bg-primary text-white' : 'bg-dark-surface border border-dark-border text-white/60 hover:border-white/30'}`}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>

                  {/* Showtime cards */}
                  {(selectedDate ? [selectedDate] : dateKeys.slice(0, 1)).map(date => (
                    <div key={date}>
                      <h3 className="text-white/50 text-sm mb-4 uppercase tracking-wider">{formatDate(date)}</h3>
                      <div className="flex flex-wrap gap-4">
                        {groupedShowTimes[date].map(st => (
                          <button
                            key={st._id}
                            onClick={() => openSeats(st._id)}
                            className="group bg-dark-surface border border-dark-border hover:border-primary rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-primary/10 min-w-[160px] text-left"
                          >
                            <div className="text-white font-bold text-lg mb-1">{st.time}</div>
                            <div className="text-white/50 text-sm">{st.hall}</div>
                            <div className="flex items-center justify-between mt-3">
                              <span className={`badge text-white text-xs ${formatTag[st.format] || 'bg-gray-600'}`}>{st.format}</span>
                              <span className="text-primary font-semibold">{formatInr(st.price)}</span>
                            </div>
                            <div className="text-white/30 text-xs mt-2">
                              {st.totalSeats - (st.bookedSeats?.length || 0)} seats left
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="mt-6 animate-slide-up space-y-6 max-w-3xl">
              {/* Add Review */}
              {user && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Write a Review</h3>
                  <div className="mb-4">
                    <p className="text-white/50 text-sm mb-2">Your Rating</p>
                    <StarInput value={review.rating} onChange={r => setReview(prev => ({ ...prev, rating: r }))} />
                  </div>
                  <textarea
                    value={review.comment}
                    onChange={e => setReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your thoughts about this movie..."
                    rows={4}
                    className="input resize-none mb-4"
                  />
                  <button onClick={handleReview} disabled={submitting} className="btn-primary disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}

              {/* Reviews list */}
              {movie.reviews?.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <span className="text-4xl block mb-3">💬</span>
                  No reviews yet. Be the first!
                </div>
              ) : (
                movie.reviews?.map((r, i) => (
                  <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center font-bold text-sm">
                          {r.userName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{r.userName || 'Anonymous'}</div>
                          <div className="text-white/30 text-xs">{formatDate(r.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gold font-bold">
                        <span className="star-filled">★</span> {r.rating}/10
                      </div>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
