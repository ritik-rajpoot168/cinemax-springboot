import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import PosterArt from '../components/PosterArt';

// ── Genre pill ──────────────────────────────────────────────────────────────
const GenrePill = ({ genre, selected, onClick }) => (
  <button
    onClick={() => onClick(genre)}
    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 select-none
      ${selected
        ? 'bg-primary border-primary text-white scale-105 shadow-lg shadow-primary/30'
        : 'bg-dark-surface border-dark-border text-white/60 hover:border-white/40 hover:text-white'
      }`}
  >
    {genre}
  </button>
);

// ── Star rating display ─────────────────────────────────────────────────────
const RatingBadge = ({ rating }) => {
  const val = Number(rating);
  const color =
    val >= 8 ? 'text-green-400' :
    val >= 6 ? 'text-gold' :
    'text-white/40';
  return (
    <span className={`font-display text-lg tracking-wider ${color}`}>
      ★ {val.toFixed(1)}
    </span>
  );
};

// ── Letterboxd-style film card ──────────────────────────────────────────────
const FilmCard = ({ movie, rank }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <Link to={`/movie/${movie._id}`} className="group relative block">
      {/* Rank number */}
      <div className="absolute -top-3 -left-2 z-10 w-7 h-7 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
        <span className="font-display text-xs text-white/40">{rank}</span>
      </div>

      <div className="rounded-xl overflow-hidden border border-dark-border group-hover:border-primary/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/10">
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-dark-surface overflow-hidden">
          {!imgErr && !movie.posterUrl?.includes('placehold.co') ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgErr(true)}
            />
          ) : (
            <PosterArt movie={movie} />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

          {/* Genre tags on hover */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-wrap gap-1">
            {movie.genre?.slice(0, 2).map(g => (
              <span key={g} className="text-[10px] bg-black/70 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-full border border-white/10">
                {g}
              </span>
            ))}
          </div>

          {/* Book Now overlay */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
              {movie.status === 'now_showing' ? '🎟 Book Now' : '📅 Coming Soon'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-dark-card">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <RatingBadge rating={movie.rating} />
            <span className="text-white/30 text-xs">{movie.duration}m</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ── Skeleton ────────────────────────────────────────────────────────────────
const FilmSkeleton = () => (
  <div className="rounded-xl overflow-hidden border border-dark-border">
    <div className="aspect-[2/3] shimmer-bg" />
    <div className="p-3 bg-dark-card space-y-2">
      <div className="h-3 shimmer-bg rounded w-3/4" />
      <div className="h-3 shimmer-bg rounded w-1/3" />
    </div>
  </div>
);

// ── Main page ───────────────────────────────────────────────────────────────
export default function Recommendations() {
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load genres on mount
  useEffect(() => {
    axios.get('/api/recommendations/genres')
      .then(r => setAllGenres(r.data))
      .catch(() => {});
  }, []);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const discover = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (selectedGenres.length) params.genres = selectedGenres.join(',');
      const res = await axios.get('/api/recommendations', { params });
      setMovies(res.data.movies || []);
      setSource(res.data.source);
    } catch {
      toast.error('Could not fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [selectedGenres]);

  // Auto-discover on genre change after first search
  useEffect(() => {
    if (searched) discover();
  }, [selectedGenres, discover]);

  const clearAll = () => {
    setSelectedGenres([]);
    setSearched(false);
    setMovies([]);
  };

  return (
    <div className="min-h-screen animate-fade-in">

      {/* ── Header banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark via-dark-card to-dark-surface border-b border-dark-border">
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        <div className="relative px-6 md:px-16 py-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎬</span>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary/80">Cinemax Discovery</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-white tracking-wide mb-3">
            FIND YOUR NEXT FILM
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-xl">
            Pick the genres you love — we'll surface the best matches playing now.
            Inspired by Letterboxd's discovery experience.
          </p>
        </div>
      </div>

      <div className="px-6 md:px-16 py-10">

        {/* ── Genre selector ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">
              Select genres
              {selectedGenres.length > 0 &&
                <span className="ml-2 text-primary font-display text-xl">({selectedGenres.length})</span>
              }
            </h2>
            {selectedGenres.length > 0 && (
              <button onClick={clearAll} className="text-white/40 hover:text-white text-sm transition-colors">
                ✕ Clear all
              </button>
            )}
          </div>

          {allGenres.length === 0 ? (
            <div className="flex gap-3 flex-wrap">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="h-9 w-20 shimmer-bg rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {allGenres.map(g => (
                <GenrePill
                  key={g}
                  genre={g}
                  selected={selectedGenres.includes(g)}
                  onClick={toggleGenre}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Discover button ── */}
        {!searched && (
          <div className="text-center py-4 mb-8">
            <button
              onClick={discover}
              className="btn-primary text-lg px-12 py-4 rounded-xl font-display tracking-wider hover:shadow-2xl hover:shadow-primary/30 transition-all"
            >
              🔍 DISCOVER FILMS
            </button>
            <p className="text-white/30 text-sm mt-3">
              Or select genres above to filter results
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {searched && (
          <div>
            {/* Source label */}
            {!loading && movies.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-white/40 text-sm">
                    {source === 'genre_based'
                      ? `Showing ${movies.length} films matching: `
                      : `Top-rated films — `}
                  </span>
                  {source === 'genre_based' && selectedGenres.map(g => (
                    <span key={g} className="text-primary text-sm font-semibold mr-1">{g}</span>
                  ))}
                </div>
                <button
                  onClick={discover}
                  className="text-white/40 hover:text-primary text-sm transition-colors"
                >
                  ↺ Refresh
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {loading
                ? Array(10).fill(0).map((_, i) => <FilmSkeleton key={i} />)
                : movies.map((m, i) => <FilmCard key={m._id} movie={m} rank={i + 1} />)
              }
            </div>

            {/* Empty state */}
            {!loading && movies.length === 0 && (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="font-display text-3xl text-white mb-2">NO MATCHES FOUND</h3>
                <p className="text-white/40 mb-6">Try selecting different genres or clear filters</p>
                <button onClick={clearAll} className="btn-outline px-8 py-3">
                  Start over
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Intro state (not yet searched) ── */}
        {!searched && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Genre-Matched', desc: 'We pick films that match your selected genres and rank them by audience rating.' },
              { icon: '⭐', title: 'Top-Rated First', desc: 'Results are sorted by rating so you always see the best films at the top.' },
              { icon: '🎟', title: 'Book Instantly', desc: 'Click any film to view showtimes and book your seats in seconds.' },
            ].map(card => (
              <div key={card.title} className="bg-dark-card border border-dark-border rounded-xl p-6 flex gap-4">
                <span className="text-3xl">{card.icon}</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">{card.title}</h3>
                  <p className="text-white/40 text-sm">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
