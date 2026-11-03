import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatInr } from '../utils/currency';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: 'rgba(255,255,255,0.3)' },
    },
    invalid: { color: '#E50914' },
  },
};

const OrderSummaryRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center">
    <span className="text-white/50 text-sm">{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-primary font-bold text-base' : 'text-white'}`}>{value}</span>
  </div>
);

export default function Checkout() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;

  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    if (!bookingData) navigate('/movies');
  }, [bookingData, navigate]);

  if (!bookingData) return null;

  const { movieId, showTimeId, seats, totalAmount, movieTitle, showTime, showDate, hall, format, pricePerSeat, theatreId, theatreName, theatreAddress, city } = bookingData;
  const tax = totalAmount * 0.1;
  const convFee = 25 * seats.length;
  const grandTotal = totalAmount + tax + convFee;

  const handlePayment = async () => {
    setCardError('');
    setProcessing(true);

    try {
      // Step 1: Create Payment Intent
      const intentRes = await axios.post('/api/payment/create-payment-intent', {
        amount: grandTotal,
        bookingData: { movieId, showTimeId, seats },
      });

      const { clientSecret, paymentIntentId, mock } = intentRes.data;

      // Step 2: In demo mode the backend issues a one-use mock intent. Live mode uses Stripe.
      if (!mock) {
        const card = elements?.getElement(CardElement);
        if (!stripe || !card) throw new Error('Card payment is not ready. Check your Stripe publishable key.');
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card },
        });
        if (error) {
          setCardError(error.message);
          return;
        }
        if (paymentIntent.status !== 'succeeded') return;
      }

      // Step 3: Confirm booking on backend
      const confirmRes = await axios.post('/api/payment/confirm', {
        paymentIntentId,
        bookingData: { movieId, showTimeId, seats, totalAmount: grandTotal, theatreId, theatreName, theatreAddress, city },
      });

      toast.success(mock ? '🎟 Demo booking confirmed!' : '🎉 Booking confirmed!');
      navigate(`/booking/${confirmRes.data.booking._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen pt-20 pb-12 animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white text-sm flex items-center gap-2 mb-8 transition-colors">
          ← Back to Seat Selection
        </button>

        <h1 className="font-display text-4xl text-white tracking-wide mb-8">CHECKOUT</h1>

        <div className="grid md:grid-cols-5 gap-8">

          {/* Payment Form */}
          <div className="md:col-span-3 space-y-6">
            {/* Card Details */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <h2 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
                💳 Payment Details
              </h2>

              <div className="space-y-4">
                {stripe ? (
                  <div>
                    <label className="text-white/50 text-sm mb-2 block">Card Information</label>
                    <div className="bg-dark-surface border border-dark-border rounded-lg px-4 py-4 focus-within:border-primary transition-colors">
                      <CardElement options={CARD_ELEMENT_OPTIONS} />
                    </div>
                    {cardError && <p className="text-primary text-sm mt-2">{cardError}</p>}
                  </div>
                ) : (
                  <p className="text-amber-300 text-sm">Demo payment mode is active. Configure Stripe keys to accept card payments.</p>
                )}
              </div>

              {/* Test Card Info */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-xs font-medium mb-1">🧪 Test Mode</p>
                <p className="text-blue-300 text-xs">Use card: 4242 4242 4242 4242, any future date, any CVC</p>
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">📋 Booking Summary</h2>
              <div className="space-y-3">
                <OrderSummaryRow label="Movie" value={movieTitle} />
                <OrderSummaryRow label="Theatre" value={theatreName || 'Selected theatre'} />
                <OrderSummaryRow label="Location" value={city || theatreAddress || 'Selected city'} />
                <OrderSummaryRow label="Date" value={formatDate(showDate)} />
                <OrderSummaryRow label="Show Time" value={showTime} />
                <OrderSummaryRow label="Hall" value={hall} />
                <OrderSummaryRow label="Format" value={format} />
                <OrderSummaryRow label="Seats" value={seats.join(', ')} />
                <OrderSummaryRow label="Seats Count" value={`${seats.length} × ${formatInr(pricePerSeat)}`} />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sticky top-24">
              <h2 className="text-white font-semibold text-lg mb-6">💰 Price Breakdown</h2>

              <div className="space-y-3 mb-6">
                <OrderSummaryRow label={`${seats.length} × Ticket`} value={formatInr(totalAmount)} />
                <OrderSummaryRow label="Tax (10%)" value={formatInr(tax)} />
                <OrderSummaryRow label="Convenience Fee" value={formatInr(convFee)} />
                <div className="border-t border-dark-border pt-3 mt-3">
                  <OrderSummaryRow label="Total" value={formatInr(grandTotal)} highlight />
                </div>
              </div>

              {/* Ticket preview */}
              <div className="ticket rounded-xl p-4 mb-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-lg">🎬</div>
                  <div>
                    <div className="text-white font-semibold text-sm truncate">{movieTitle}</div>
                    <div className="text-white/40 text-xs">{seats.length} seat{seats.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {seats.map(s => (
                    <span key={s} className="badge bg-primary/20 border border-primary/40 text-primary text-xs">{s}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing || !stripe}
                className="btn-primary w-full py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `💳 Pay ${formatInr(grandTotal)}`
                )}
              </button>

              <p className="text-white/30 text-xs text-center mt-4 flex items-center justify-center gap-1">
                🔒 Secured by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
