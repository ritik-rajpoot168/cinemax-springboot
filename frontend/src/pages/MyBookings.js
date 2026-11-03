import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatInr } from '../utils/currency';

const statusColor = {
  confirmed: 'bg-green-500/20 border-green-500/50 text-green-400',
  pending: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  cancelled: 'bg-red-500/20 border-red-500/50 text-red-400',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/booking/my-bookings')
      .then(r => { setBookings(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.put(`/api/booking/cancel/${id}`);
      toast.success('Booking cancelled');
      setBookings(prev => prev.map(b => b._id === id ? { ...b, bookingStatus: 'cancelled' } : b));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen pt-20 pb-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <div className="mb-8">
          <h1 className="font-display text-4xl text-white tracking-wide">MY BOOKINGS</h1>
          <p className="text-white/40 mt-1">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 shimmer-bg rounded-xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-6xl block mb-4">🎟</span>
            <h3 className="text-white text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-white/40 mb-6">Start exploring movies and book your first ticket!</p>
            <Link to="/movies" className="btn-primary">Browse Movies</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking._id} className="card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center group">
                {/* Poster */}
                <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-dark-surface">
                  {booking.movie?.posterUrl ? (
                    <img src={booking.movie.posterUrl} alt={booking.movieTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-white font-semibold truncate">{booking.movieTitle}</h3>
                    <span className={`badge border flex-shrink-0 ${statusColor[booking.bookingStatus]}`}>
                      {booking.bookingStatus}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-white/50 mb-3">
                    <span>📅 {formatDate(booking.showDate)}</span>
                    <span>⏰ {booking.showTime}</span>
                    {booking.theatreName && <span>📍 {booking.theatreName}</span>}
                    {booking.city && <span>{booking.city}</span>}
                    <span>🏛 {booking.hall}</span>
                    <span>🎬 {booking.format}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1">
                      {booking.seats.map(s => (
                        <span key={s} className="badge bg-dark-surface border border-dark-border text-white/60 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <div className="text-primary font-bold text-lg">{formatInr(booking.totalAmount)}</div>
                  <div className="text-white/30 text-xs font-mono">{booking.bookingCode}</div>
                  <div className="flex gap-2">
                    <Link to={`/booking/${booking._id}`} className="btn-outline px-3 py-1 text-xs">View</Link>
                    {booking.bookingStatus === 'confirmed' && (
                      <button onClick={() => handleCancel(booking._id)} className="text-red-400 border border-red-400/30 hover:bg-red-400/10 px-3 py-1 rounded-lg text-xs transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
