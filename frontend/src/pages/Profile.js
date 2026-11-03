import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';

const GENRES = ['Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller'];

export default function Profile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(authUser);
  const [name, setName] = useState(authUser?.name || '');
  const [selectedGenres, setSelectedGenres] = useState(authUser?.preferences?.genres || []);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const favorites = profile?.favorites || [];
  const favoriteGenres = useMemo(() => {
    const counts = favorites.reduce((acc, movie) => {
      movie.genre?.forEach(g => { acc[g] = (acc[g] || 0) + 1; });
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [favorites]);

  useEffect(() => {
    let active = true;
    axios.get('/api/auth/profile')
      .then(res => {
        if (!active) return;
        setProfile(res.data);
        setName(res.data.name || '');
        setSelectedGenres(res.data.preferences?.genres || []);
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => (
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    ));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/auth/profile', {
        name: name.trim() || profile.name,
        preferences: {
          ...(profile.preferences || {}),
          genres: selectedGenres,
        },
      });
      setProfile(prev => ({ ...prev, ...res.data, favorites }));
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-6 md:px-16 pb-16 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.3em] uppercase">Your Profile</p>
              <h1 className="font-display text-4xl md:text-6xl text-white mt-2">{profile?.name}</h1>
              <p className="text-white/50 mt-1">{profile?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-[280px]">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
              <p className="text-white/40 text-xs">Favorites</p>
              <p className="text-white font-display text-3xl mt-1">{favorites.length}</p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
              <p className="text-white/40 text-xs">Bookings</p>
              <p className="text-white font-display text-3xl mt-1">View</p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-white/40 text-xs">Role</p>
              <p className="text-white font-display text-3xl mt-1 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[360px,1fr] gap-8">
          <section className="space-y-6">
            <form onSubmit={saveProfile} className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-white font-semibold text-xl mb-5">Account</h2>
              <label className="block text-white/50 text-sm mb-2">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
              />
              <div className="mt-6">
                <p className="text-white/50 text-sm mb-3">Favorite genres</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <button
                      type="button"
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${selectedGenres.includes(genre) ? 'bg-primary border-primary text-white' : 'bg-dark-surface border-dark-border text-white/60 hover:text-white'}`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={saving} className="btn-primary w-full mt-6 py-3 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-white font-semibold text-xl mb-4">Taste Snapshot</h2>
              {favoriteGenres.length ? (
                <div className="space-y-3">
                  {favoriteGenres.map(([genre, count]) => (
                    <div key={genre} className="flex items-center justify-between">
                      <span className="text-white/70">{genre}</span>
                      <span className="text-primary font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">Add movies to favorites to build your taste profile.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-white font-semibold text-2xl">Favorite Movies</h2>
                <p className="text-white/40 text-sm mt-1">Movies you saved from the heart button on each poster.</p>
              </div>
              <Link to="/movies" className="btn-outline px-4 py-2 text-sm whitespace-nowrap">Browse Movies</Link>
            </div>

            {favorites.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {favorites.map(movie => (
                  <MovieCard key={movie._id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-xl min-h-[320px] flex flex-col items-center justify-center text-center p-8">
                <div className="text-5xl mb-4">♡</div>
                <h3 className="font-display text-3xl text-white mb-2">No favorites yet</h3>
                <p className="text-white/40 max-w-md mb-6">Open any movie and press the heart on its poster card. Your saved films will appear here.</p>
                <Link to="/movies" className="btn-primary px-8 py-3">Find Movies</Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
