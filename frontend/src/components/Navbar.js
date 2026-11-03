import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setDropdownOpen(false); };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || location.pathname !== '/' ? 'bg-dark/95 backdrop-blur-md border-b border-dark-border' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-primary text-2xl font-display tracking-wider">CINEMAX</span>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse-slow" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Home</Link>
            <Link to="/movies" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Movies</Link>
            <Link to="/recommendations" className="text-white/70 hover:text-white transition-colors text-sm font-medium flex items-center gap-1">
              🔍 Discover
            </Link>
            {user && <Link to="/my-bookings" className="text-white/70 hover:text-white transition-colors text-sm font-medium">My Bookings</Link>}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-gold hover:text-gold-light transition-colors text-sm font-medium flex items-center gap-1">
                <span>⚙</span> Admin
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-full px-3 py-2 hover:border-white/30 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white/80">{user.name}</span>
                  <svg className={`w-4 h-4 text-white/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl animate-scale-in overflow-hidden">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-dark-surface transition-colors text-sm">
                      👤 Profile
                    </Link>
                    <Link to="/my-bookings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-dark-surface transition-colors text-sm">
                      🎟 My Bookings
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-dark-surface transition-colors text-sm text-gold">
                        ⚙ Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-dark-border" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 hover:bg-dark-surface transition-colors text-sm text-red-400 w-full text-left">
                      ↩ Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Sign In</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-card border-t border-dark-border animate-slide-up">
          <div className="px-4 py-4 flex flex-col gap-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white py-2 text-sm">Home</Link>
            <Link to="/movies" onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white py-2 text-sm">Movies</Link>
            <Link to="/recommendations" onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white py-2 text-sm">🔍 Discover</Link>
            {user && <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white py-2 text-sm">My Bookings</Link>}
            {user && <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white py-2 text-sm">Profile</Link>}
            {user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-gold py-2 text-sm">Admin Dashboard</Link>}
            <div className="border-t border-dark-border pt-3">
              {user ? (
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-red-400 text-sm w-full text-left py-2">Sign Out</button>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline py-2 px-4 text-sm flex-1 text-center">Sign In</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary py-2 px-4 text-sm flex-1 text-center">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
