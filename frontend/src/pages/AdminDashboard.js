import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatInr } from '../utils/currency';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <span className="text-white/40 text-sm font-medium uppercase tracking-wider">{label}</span>
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg`}>{icon}</div>
    </div>
    <div className="text-white font-bold text-3xl font-display tracking-wide">{value}</div>
    {sub && <div className="text-white/30 text-xs mt-1">{sub}</div>}
  </div>
);

const statusColor = { confirmed: 'text-green-400', cancelled: 'text-red-400', pending: 'text-yellow-400' };
const paymentColor = { paid: 'text-green-400', failed: 'text-red-400', pending: 'text-yellow-400', refunded: 'text-blue-400' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/api/admin/bookings');
      setBookings(res.data);
    } catch {
      toast.error('Failed to load bookings');
    }
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'bookings') fetchBookings();
  }, [tab]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const maxRev = stats?.monthlyData?.length > 0 ? Math.max(...stats.monthlyData.map(m => m.revenue)) : 1;

  return (
    <div className="min-h-screen pt-20 pb-12 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl text-white tracking-wide">ADMIN DASHBOARD</h1>
            <p className="text-white/40 mt-1">CineMax Analytics & Management</p>
          </div>
          <div className="badge bg-gold/20 border border-gold/50 text-gold px-3 py-2">⭐ Admin</div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Movies" value={stats.stats.totalMovies} icon="🎬" color="bg-blue-500/20" />
            <StatCard label="Total Users" value={stats.stats.totalUsers} icon="👥" color="bg-purple-500/20" />
            <StatCard label="Bookings" value={stats.stats.totalBookings} icon="🎟" color="bg-green-500/20" sub={`${stats.stats.totalSeats} seats sold`} />
            <StatCard
              label="Revenue"
              value={formatInr(stats.stats.totalRevenue)}
              icon="💰"
              color="bg-primary/20"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-dark-border gap-6 mb-8">
          {['overview', 'bookings', 'users'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-semibold uppercase tracking-wider transition-colors capitalize ${tab === t ? 'text-white border-b-2 border-primary -mb-px' : 'text-white/40 hover:text-white/70'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && stats && (
          <div className="grid lg:grid-cols-2 gap-8 animate-slide-up">

            {/* Revenue Chart */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-6">📈 Monthly Revenue</h3>
              {stats.monthlyData.length === 0 ? (
                <div className="text-white/30 text-center py-8">No data yet</div>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {stats.monthlyData.map(m => (
                    <div key={`${m._id.year}-${m._id.month}`} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-primary text-xs">{formatInr(m.revenue)}</span>
                      <div
                        className="w-full bg-primary/40 hover:bg-primary rounded-t transition-all"
                        style={{ height: `${(m.revenue / maxRev) * 100}%`, minHeight: '4px' }}
                        title={formatInr(m.revenue)}
                      />
                      <span className="text-white/30 text-xs">{MONTHS[m._id.month - 1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Movies */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-6">🏆 Top Movies</h3>
              <div className="space-y-3">
                {stats.topMovies.length === 0 ? (
                  <div className="text-white/30 text-center py-8">No bookings yet</div>
                ) : (
                  stats.topMovies.map((m, i) => (
                    <div key={m._id} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-gold text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-dark-surface text-white/50'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{m.title}</div>
                        <div className="text-white/30 text-xs">{m.count} bookings</div>
                      </div>
                      <div className="text-primary font-semibold text-sm">{formatInr(m.revenue)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-white font-semibold mb-6">🕒 Recent Bookings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-dark-border">
                      <th className="text-left pb-3 pr-4">Code</th>
                      <th className="text-left pb-3 pr-4">Movie</th>
                      <th className="text-left pb-3 pr-4">User</th>
                      <th className="text-left pb-3 pr-4">Seats</th>
                      <th className="text-left pb-3 pr-4">Amount</th>
                      <th className="text-left pb-3 pr-4">Status</th>
                      <th className="text-left pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {stats.recentBookings.map(b => (
                      <tr key={b._id} className="hover:bg-dark-surface/50 transition-colors">
                        <td className="py-3 pr-4 font-mono text-white/50 text-xs">{b.bookingCode}</td>
                        <td className="py-3 pr-4 text-white font-medium truncate max-w-[150px]">{b.movie?.title || b.movieTitle}</td>
                        <td className="py-3 pr-4 text-white/60">{b.user?.name || 'N/A'}</td>
                        <td className="py-3 pr-4 text-white/60">{b.seats?.join(', ')}</td>
                        <td className="py-3 pr-4 text-primary font-semibold">{formatInr(b.totalAmount)}</td>
                        <td className="py-3 pr-4"><span className={`capitalize text-xs ${statusColor[b.bookingStatus]}`}>{b.bookingStatus}</span></td>
                        <td className="py-3 text-white/40 text-xs">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div className="animate-slide-up">
            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-surface">
                    <tr className="text-white/40 text-xs uppercase tracking-wider">
                      <th className="text-left p-4">Code</th>
                      <th className="text-left p-4">Movie</th>
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Seats</th>
                      <th className="text-left p-4">Amount</th>
                      <th className="text-left p-4">Payment</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {bookings.map(b => (
                      <tr key={b._id} className="hover:bg-dark-surface/30 transition-colors">
                        <td className="p-4 font-mono text-white/40 text-xs">{b.bookingCode}</td>
                        <td className="p-4 text-white font-medium">{b.movieTitle}</td>
                        <td className="p-4 text-white/60">{b.user?.name}<br /><span className="text-white/30 text-xs">{b.user?.email}</span></td>
                        <td className="p-4 text-white/60">{b.seats?.join(', ')}</td>
                        <td className="p-4 text-primary font-semibold">{formatInr(b.totalAmount)}</td>
                        <td className="p-4"><span className={`capitalize text-xs ${paymentColor[b.paymentStatus]}`}>{b.paymentStatus}</span></td>
                        <td className="p-4"><span className={`capitalize text-xs ${statusColor[b.bookingStatus]}`}>{b.bookingStatus}</span></td>
                        <td className="p-4 text-white/40 text-xs">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="animate-slide-up">
            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-surface">
                    <tr className="text-white/40 text-xs uppercase tracking-wider">
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Role</th>
                      <th className="text-left p-4">Favorites</th>
                      <th className="text-left p-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-dark-surface/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-sm">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-white/60">{u.email}</td>
                        <td className="p-4">
                          <span className={`badge ${u.role === 'admin' ? 'bg-gold/20 border border-gold/50 text-gold' : 'bg-dark-surface border border-dark-border text-white/50'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-white/50">{u.favorites?.length || 0}</td>
                        <td className="p-4 text-white/40 text-xs">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
