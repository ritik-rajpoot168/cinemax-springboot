import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatInr } from '../utils/currency';

// Generate seat map: rows A-J, cols 1-8 (80 seats)
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8];
const VIP_ROWS = ['A', 'B']; // Front VIP rows
const MAX_SEATS = 8;

export default function SeatSelection() {
  const { id, showTimeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTheatre = location.state?.theatre;
  const [movie, setMovie] = useState(null);
  const [showTime, setShowTime] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, seatsRes] = await Promise.all([
          axios.get(`/api/movies/${id}`),
          axios.get(`/api/booking/seats/${id}/${showTimeId}`),
        ]);
        setMovie(movieRes.data);
        const st = movieRes.data.showTimes?.find(s => s._id === showTimeId);
        setShowTime(st);
        setBookedSeats(seatsRes.data.bookedSeats || []);
      } catch {
        toast.error('Failed to load seat data');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, showTimeId]);

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= MAX_SEATS) {
        toast.error(`Max ${MAX_SEATS} seats per booking`);
        return;
      }
      setSelectedSeats(prev => [...prev, seatId]);
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) { toast.error('Please select at least one seat'); return; }
    if (!showTime) { toast.error('Showtime data not loaded. Please go back and try again.'); return; }
    if (!selectedTheatre) { toast.error('Please go back and select a theatre'); return; }
    navigate('/checkout', {
      state: {
        movieId: id,
        showTimeId,
        seats: selectedSeats,
        totalAmount: selectedSeats.length * showTime.price,
        movieTitle: movie.title,
        showTime: showTime.time,
        showDate: showTime.date,
        hall: showTime.hall,
        format: showTime.format,
        pricePerSeat: showTime.price,
        theatreId: selectedTheatre._id,
        theatreName: selectedTheatre.name,
        theatreAddress: selectedTheatre.address,
        city: selectedTheatre.city,
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-32 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white text-sm flex items-center gap-2 mb-4 transition-colors">
            ← Back
          </button>
          <h1 className="font-display text-3xl md:text-4xl text-white">{movie?.title}</h1>
          {showTime && (
            <p className="text-white/50 mt-1">{showTime.hall} • {showTime.time} • <span className="text-primary">{showTime.format}</span></p>
          )}
          {selectedTheatre && (
            <p className="text-white/40 text-sm mt-2">
              {selectedTheatre.name} • {selectedTheatre.city}
            </p>
          )}
        </div>

        {/* Screen */}
        <div className="relative mb-10">
          <div className="w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <div className="w-3/4 mx-auto h-12 rounded-b-3xl bg-gradient-to-b from-white/10 to-transparent flex items-center justify-center">
            <span className="text-white/30 text-xs uppercase tracking-widest">Screen</span>
          </div>
        </div>

        {/* Seat Map */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6 overflow-x-auto">
          <div className="min-w-[360px]">
            {ROWS.map(row => (
              <div key={row} className="flex items-center gap-2 mb-2 justify-center">
                <span className="text-white/30 text-xs w-4 text-center font-mono">{row}</span>
                <div className="flex gap-2">
                  {COLS.map(col => {
                    const seatId = `${row}${col}`;
                    const isBooked = bookedSeats.includes(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    const isVip = VIP_ROWS.includes(row);
                    return (
                      <button
                        key={seatId}
                        onClick={() => toggleSeat(seatId)}
                        title={`${seatId}${isVip ? ' (VIP)' : ''}`}
                        className={`seat ${isVip ? 'seat-vip' : ''} ${isBooked ? 'seat-booked' : isSelected ? 'seat-selected' : 'seat-available'}`}
                      >
                        {isSelected ? '✓' : col}
                      </button>
                    );
                  })}
                </div>
                <span className="text-white/30 text-xs w-4 text-center font-mono">{row}</span>
              </div>
            ))}
            {/* Column numbers */}
            <div className="flex items-center gap-2 justify-center mt-2">
              <span className="w-4" />
              <div className="flex gap-2">
                {COLS.map(c => (
                  <span key={c} className="w-8 text-center text-white/20 text-xs font-mono">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
          {[
            { cls: 'bg-dark-surface border border-white/10', label: 'Available' },
            { cls: 'bg-primary border-primary-dark', label: 'Selected' },
            { cls: 'bg-dark-border opacity-50', label: 'Booked' },
            { cls: 'bg-dark-surface border border-gold/50', label: 'VIP' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-t-lg ${cls}`} />
              <span className="text-white/50">{label}</span>
            </div>
          ))}
        </div>

        {/* VIP Info */}
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6 text-center">
          <p className="text-gold text-sm">⭐ Rows A & B are VIP seats — premium experience</p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-dark-border p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-white/50 text-xs uppercase tracking-wider">Selected</div>
            <div className="text-white font-semibold">
              {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'No seats selected'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/50 text-xs">Total</div>
            <div className="text-primary font-bold text-xl">{formatInr(selectedSeats.length * (showTime?.price || 0))}</div>
          </div>
          <button
            onClick={handleProceed}
            disabled={selectedSeats.length === 0}
            className="btn-primary px-8 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed to Pay →
          </button>
        </div>
      </div>
    </div>
  );
}
