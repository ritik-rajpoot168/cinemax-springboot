import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { formatInr } from '../utils/currency';

export default function BookingConfirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/booking/${id}`)
      .then(r => { setBooking(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen pt-20 flex items-center justify-center text-white">Booking not found</div>
  );

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4 animate-fade-in">
      <div className="max-w-lg w-full">

        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="font-display text-4xl text-white mb-2">BOOKING CONFIRMED!</h1>
          <p className="text-white/50">Your tickets are ready. Enjoy the show! 🍿</p>
        </div>

        {/* Ticket */}
        <div className="ticket rounded-2xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-primary/20 border-b border-dashed border-white/20 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-3xl">🎬</div>
              <div>
                <h2 className="text-white font-bold text-xl">{booking.movieTitle}</h2>
                <p className="text-white/50 text-sm">{booking.format}</p>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Theatre</div>
                <div className="text-white font-medium text-sm">{booking.theatreName || 'Selected theatre'}</div>
                {booking.city && <div className="text-white/40 text-xs mt-1">{booking.city}</div>}
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Date</div>
                <div className="text-white font-medium text-sm">{formatDate(booking.showDate)}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Time</div>
                <div className="text-white font-medium text-sm">{booking.showTime}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Hall</div>
                <div className="text-white font-medium text-sm">{booking.hall}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Seats</div>
                <div className="flex flex-wrap gap-1">
                  {booking.seats.map(s => (
                    <span key={s} className="badge bg-primary/20 border border-primary/50 text-primary text-xs">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative border-t border-dashed border-white/20 my-4">
              <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-dark rounded-full" />
              <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-dark rounded-full" />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Booking Code</div>
                <div className="text-white font-mono font-bold tracking-widest">{booking.bookingCode}</div>
              </div>
              <div className="text-right">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Paid</div>
                <div className="text-primary font-bold text-xl">{formatInr(booking.totalAmount)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Confirmed & Paid</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Link to="/my-bookings" className="btn-outline flex-1 text-center py-3">My Bookings</Link>
          <Link to="/movies" className="btn-primary flex-1 text-center py-3">Book More</Link>
        </div>

        <p className="text-white/30 text-xs text-center mt-4">
          Show this confirmation at the cinema entrance. Save your booking code: <strong className="text-white/50">{booking.bookingCode}</strong>
        </p>
      </div>
    </div>
  );
}
