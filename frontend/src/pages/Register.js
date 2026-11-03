import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleGenre = (g) =>
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to CineMax 🎬');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="fixed inset-0 bg-gradient-to-br from-dark via-dark to-primary/5 -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-primary font-display text-4xl tracking-wider">CINEMAX</span>
          </Link>
          <p className="text-white/40 mt-2 text-sm">Create your account</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-primary text-white' : 'bg-dark-surface text-white/30 border border-dark-border'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div className={`flex-1 h-0.5 rounded transition-all ${step > s ? 'bg-primary' : 'bg-dark-border'}`} />}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5 animate-slide-up">
              <h2 className="text-white text-lg font-semibold mb-4">Your Details</h2>
              <div>
                <label className="text-white/50 text-sm mb-2 block">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="input" required />
              </div>
              <div>
                <label className="text-white/50 text-sm mb-2 block">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input" required />
              </div>
              <div>
                <label className="text-white/50 text-sm mb-2 block">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="input pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-dark-border rounded-full overflow-hidden">
                      <div className={`h-full ${strengthColor} rounded-full transition-all`} style={{ width: `${(strength / 3) * 100}%` }} />
                    </div>
                    <span className="text-xs text-white/40">{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-white/50 text-sm mb-2 block">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className={`input ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-500' : ''}`}
                  required
                />
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full py-3">Continue →</button>
            </form>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-white text-lg font-semibold mb-2">Pick your favorite genres</h2>
              <p className="text-white/40 text-sm mb-6">We'll use this to recommend movies just for you.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`badge transition-all text-sm py-2 px-3 ${genres.includes(g) ? 'bg-primary text-white' : 'bg-dark-surface border border-dark-border text-white/60 hover:border-white/30'}`}
                  >
                    {genres.includes(g) ? '✓ ' : ''}{g}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 py-3">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : 'Create Account 🎬'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-light transition-colors font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
