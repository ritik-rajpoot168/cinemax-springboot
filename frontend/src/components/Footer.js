import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-primary font-display text-2xl tracking-wider">CINEMAX</span>
              <span className="w-2 h-2 bg-primary rounded-full" />
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Your ultimate destination for movies. Book tickets, explore new releases, and enjoy the best cinema experience.
            </p>
            <div className="flex gap-3 mt-4">
              {['Twitter', 'Instagram', 'Facebook'].map(s => (
                <span key={s} className="w-9 h-9 bg-dark-surface border border-dark-border rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 cursor-pointer transition-all text-xs">
                  {s[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2">
              {[
                { label: 'All Movies', to: '/movies' },
                { label: 'Now Showing', to: '/movies?status=now_showing' },
                { label: 'Coming Soon', to: '/movies?status=coming_soon' },
                { label: 'My Bookings', to: '/my-bookings' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-white/40 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2">
              {[
                { label: 'Sign In', to: '/login' },
                { label: 'Register', to: '/register' },
                { label: 'Profile', to: '/profile' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-white/40 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">© 2026 CineMax. All rights reserved.</p>
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <span>🔒 Payments secured by</span>
            <span className="text-white/40 font-semibold">Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
