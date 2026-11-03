import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PosterArt from './PosterArt';

const StarRating = ({ rating }) => {
  const stars = Math.round(rating / 2);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= stars ? 'star-filled' : 'star-empty'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-white/50 text-xs ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  );
};

export default function MovieCard({ movie, onFavoriteChange }) {
  const { user } = useAuth();
  const favoriteIds = useMemo(
    () => user?.favorites?.map(f => typeof f === 'string' ? f : f._id) || [],
    [user?.favorites],
  );
  const [isFav, setIsFav] = useState(favoriteIds.includes(movie._id));
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setIsFav(favoriteIds.includes(movie._id));
  }, [favoriteIds, movie._id]);

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to add favorites'); return; }
    try {
      const res = await axios.post(`/api/movies/favorite/${movie._id}`);
      setIsFav(res.data.isFavorite);
      toast.success(res.data.isFavorite ? '❤️ Added to favorites' : '💔 Removed from favorites');
      onFavoriteChange?.();
    } catch { toast.error('Failed to update favorites'); }
  };

  const statusColor = { now_showing: 'bg-green-500', coming_soon: 'bg-blue-500', ended: 'bg-gray-500' };
  const statusLabel = { now_showing: 'Now Showing', coming_soon: 'Coming Soon', ended: 'Ended' };

  return (
    <Link to={`/movie/${movie._id}`} className="group block">
      <div className="card hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-dark-surface">
          {!imgError && !movie.posterUrl?.includes('placehold.co') ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <PosterArt movie={movie} />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="btn-primary text-sm py-2 px-4 w-full text-center">
              {movie.status === 'now_showing' ? '🎟 Book Now' : '📅 Coming Soon'}
            </span>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={`badge text-white ${statusColor[movie.status]}`}>
              {statusLabel[movie.status]}
            </span>
            {movie.featured && <span className="badge bg-gold text-black">⭐ Featured</span>}
          </div>

          {/* Age Rating */}
          <div className="absolute top-2 right-2">
            <span className="badge bg-dark/80 border border-white/20 text-white">{movie.ageRating}</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className="absolute bottom-2 right-2 w-8 h-8 bg-dark/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className={`w-4 h-4 ${isFav ? 'text-primary fill-primary' : 'text-white'}`} fill={isFav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">{movie.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/50 text-xs">{movie.genre?.slice(0, 2).join(' • ')}</span>
            <span className="text-white/50 text-xs">{movie.duration}m</span>
          </div>
          <div className="mt-2">
            <StarRating rating={movie.rating} />
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-white/40">
            {movie.imdbRating > 0 && <span>IMDb {Number(movie.imdbRating).toFixed(1)}</span>}
            {movie.criticsRating > 0 && <span>Critics {movie.criticsRating}%</span>}
          </div>
          {movie.category && <div className="text-primary/80 text-[11px] mt-1 truncate">{movie.category}</div>}
        </div>
      </div>
    </Link>
  );
}
