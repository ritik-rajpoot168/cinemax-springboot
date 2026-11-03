import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';

const Skeleton = () => (
  <div className="card">
    <div className="aspect-[2/3] shimmer-bg" />
    <div className="p-4 space-y-2">
      <div className="h-4 shimmer-bg rounded w-3/4" />
      <div className="h-3 shimmer-bg rounded w-1/2" />
    </div>
  </div>
);

const HeroSlide = ({ movie, active }) => (
  <div className={`absolute inset-0 transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
    <div
      className="w-full h-full bg-cover bg-center"
      style={{ backgroundImage: `url(${movie.bannerUrl || movie.posterUrl})` }}
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
  </div>
);

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      axios.get('/api/movies/recommendations')
        .then(res => setRecommendations(res.data))
        .catch(() => {});
    } else {
      setRecommendations([]);
    }
  }, [user]);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % featured.length), 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const fetchData = async () => {
    try {
      const [featRes, nowRes, soonRes] = await Promise.all([
        axios.get('/api/movies/featured'),
        axios.get('/api/movies?status=now_showing&limit=8'),
        axios.get('/api/movies?status=coming_soon&limit=6'),
      ]);
      setFeatured(featRes.data);
      setNowShowing(nowRes.data.movies);
      setComingSoon(soonRes.data.movies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hero = featured[heroIndex];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[500px] overflow-hidden">
        {featured.map((movie, i) => (
          <HeroSlide key={movie._id} movie={movie} active={i === heroIndex} />
        ))}

        {hero && (
          <div className="absolute inset-0 flex items-end pb-24 px-6 md:px-16">
            <div className="max-w-2xl animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <span className="badge bg-primary text-white">⭐ Featured</span>
                <span className="badge bg-dark-surface border border-white/20 text-white">{hero.ageRating}</span>
                {hero.genre?.slice(0, 2).map(g => (
                  <span key={g} className="badge bg-dark-surface/60 text-white/70">{g}</span>
                ))}
              </div>
              <h1 className="font-display text-5xl md:text-7xl tracking-wide text-white mb-4 leading-none">{hero.title}</h1>
              <p className="text-white/70 text-sm md:text-base line-clamp-3 mb-6 max-w-lg">{hero.description}</p>
              <div className="flex items-center gap-4">
                <Link to={`/movie/${hero._id}`} className="btn-primary text-base px-8 py-3">
                  🎬 Book Tickets
                </Link>
                <Link to={`/movie/${hero._id}`} className="btn-outline text-base px-6 py-3">
                  ℹ More Info
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Hero Dots */}
        {featured.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === heroIndex ? 'bg-primary w-8' : 'bg-white/30 w-4'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Now Showing */}
      <section className="px-6 md:px-16 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">NOW SHOWING</h2>
            <div className="h-1 w-16 bg-primary mt-2 rounded-full" />
          </div>
          <Link to="/movies?status=now_showing" className="text-primary hover:text-primary-light text-sm font-medium transition-colors flex items-center gap-1">
            View All <span>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
          {loading ? Array(8).fill(0).map((_, i) => <Skeleton key={i} />) :
            nowShowing.map(m => <MovieCard key={m._id} movie={m} onFavoriteChange={fetchData} />)}
        </div>
      </section>

      {/* Recommendations (if logged in) */}
      {user && recommendations.length > 0 && (
        <section className="px-6 md:px-16 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">RECOMMENDED FOR YOU</h2>
              <div className="h-1 w-16 bg-gold mt-2 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {recommendations.slice(0, 5).map(m => <MovieCard key={m._id} movie={m} onFavoriteChange={fetchData} />)}
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <section className="px-6 md:px-16 py-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">COMING SOON</h2>
              <div className="h-1 w-16 bg-blue-500 mt-2 rounded-full" />
            </div>
            <Link to="/movies?status=coming_soon" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-1">
              View All <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {comingSoon.map(m => <MovieCard key={m._id} movie={m} />)}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      {!user && (
        <section className="px-6 md:px-16 py-16">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">JOIN CINEMAX</h2>
            <p className="text-white/60 mb-8 text-lg">Get personalized recommendations, save favorites, and book tickets in seconds.</p>
            <div className="flex gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-10 py-3">Create Account</Link>
              <Link to="/login" className="btn-outline text-lg px-10 py-3">Sign In</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
