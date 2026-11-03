import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';

const GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'French', 'Korean'];
const SORT_OPTIONS = [
  { value: '', label: 'Latest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Release Date ↓' },
  { value: 'oldest', label: 'Release Date ↑' },
];
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'now_showing', label: 'Now Showing' },
  { value: 'coming_soon', label: 'Coming Soon' },
];

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sort, setSort] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    setStatus(urlStatus);
    setPage(1);
  }, [searchParams]);

  const updateStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus) nextParams.set('status', nextStatus);
    else nextParams.delete('status');
    setSearchParams(nextParams);
  };

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      if (selectedGenres.length) params.append('genre', selectedGenres.join(','));
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (status) params.append('status', status);
      if (sort) params.append('sort', sort);

      const res = await axios.get(`/api/movies?${params}`);
      setMovies(res.data.movies);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedGenres, selectedLanguage, status, sort]);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchMovies(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleGenre = (genre) => {
    setPage(1);
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const clearFilters = () => {
    setSearch(''); setSelectedGenres([]); setSelectedLanguage(''); setSort(''); setPage(1); updateStatus('');
  };

  const hasFilters = search || selectedGenres.length || selectedLanguage || status || sort;

  const Filters = () => (
    <div className="space-y-6">
      {hasFilters && (
        <button onClick={clearFilters} className="text-primary text-sm hover:underline flex items-center gap-1 w-full">
          ✕ Clear all filters
        </button>
      )}

      {/* Status */}
      <div>
        <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3 font-semibold">Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateStatus(opt.value)}
              className={`badge transition-all ${status === opt.value ? 'bg-primary text-white' : 'bg-dark-surface border border-dark-border text-white/60 hover:border-white/40'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3 font-semibold">Genre</h3>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`badge transition-all ${selectedGenres.includes(g) ? 'bg-primary text-white' : 'bg-dark-surface border border-dark-border text-white/60 hover:border-white/40'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3 font-semibold">Language</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l}
              onClick={() => { setSelectedLanguage(selectedLanguage === l ? '' : l); setPage(1); }}
              className={`badge transition-all ${selectedLanguage === l ? 'bg-primary text-white' : 'bg-dark-surface border border-dark-border text-white/60 hover:border-white/40'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3 font-semibold">Sort By</h3>
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
          className="input text-sm"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header + Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl text-white tracking-wide">
              {status === 'now_showing' ? 'NOW SHOWING' : status === 'coming_soon' ? 'COMING SOON' : 'ALL MOVIES'}
            </h1>
            <p className="text-white/40 text-sm mt-1">{total} movies found</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search movies..."
                className="input pl-10"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">✕</button>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden btn-outline px-4 py-3 text-sm ${hasFilters ? 'border-primary text-primary' : ''}`}
            >
              ⚙ Filter {hasFilters && `(${[selectedGenres.length, selectedLanguage ? 1 : 0, status ? 1 : 0].reduce((a, b) => a + b, 0)})`}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-dark-card rounded-xl border border-dark-border p-6 sticky top-24">
              <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
                <span>⚙</span> Filters
              </h2>
              <Filters />
            </div>
          </aside>

          {/* Mobile Filters */}
          {sidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/80" onClick={() => setSidebarOpen(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-dark-card border-l border-dark-border p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white font-semibold">Filters</h2>
                  <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white">✕</button>
                </div>
                <Filters />
              </div>
            </div>
          )}

          {/* Movie Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="card">
                    <div className="aspect-[2/3] shimmer-bg" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 shimmer-bg rounded w-3/4" />
                      <div className="h-3 shimmer-bg rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : movies.length === 0 ? (
              <div className="text-center py-24">
                <span className="text-6xl block mb-4">🎬</span>
                <h3 className="text-white text-xl font-semibold mb-2">No movies found</h3>
                <p className="text-white/40">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-primary mt-6 text-sm">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {movies.map(m => <MovieCard key={m._id} movie={m} onFavoriteChange={fetchMovies} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="btn-outline px-4 py-2 text-sm disabled:opacity-30"
                    >← Prev</button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-primary text-white' : 'bg-dark-surface text-white/60 hover:bg-dark-border'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="btn-outline px-4 py-2 text-sm disabled:opacity-30"
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
