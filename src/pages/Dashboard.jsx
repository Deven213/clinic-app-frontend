import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, TrendingUp, AlertCircle,
  Loader2, IndianRupee, History, Play,
  CheckCircle2, XCircle, Timer, Activity, CalendarDays, Clock,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';

// Read the API base URL from the env file so we don't hardcode the deployed URL.
// Falls back to the local backend if the env var is missing.
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().split('T')[0];
const today = () => toISO(new Date());
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Compute start/end ISO date strings for a given timeframe key.
// "today" / "week" (last 7d incl. today) / "month" (last 30d incl. today)
function rangeForTimeframe(tf) {
  const end = new Date();
  const start = new Date();
  if (tf === 'week') start.setDate(start.getDate() - 6);
  else if (tf === 'month') start.setDate(start.getDate() - 29);
  return { start: toISO(start), end: toISO(end) };
}

// Greeting picks based on hour-of-day, including a late-night case.
function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Working late';
}

// Format today's date as "Tuesday, 20 May"
function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Waiting:   { color: '#92400e', bg: '#fef9ec', icon: Timer,        label: 'Waiting'   },
  Scheduled: { color: '#2d8653', bg: '#e8f5ee', icon: Calendar,     label: 'Scheduled' },
  Completed: { color: '#1a5c38', bg: '#d4edde', icon: CheckCircle2, label: 'Completed' },
  Cancelled: { color: '#6b7280', bg: '#f3f4f6', icon: XCircle,      label: 'Cancelled' },
};
const getStatus = (s) => STATUS_CFG[s] || STATUS_CFG.Waiting;

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, loading }) {
  return (
    <div className="glass-panel stat-card">
      <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
        {loading ? <Loader2 size={26} className="animate-spin" /> : <Icon size={28} />}
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{loading ? '—' : value}</div>
      </div>
    </div>
  );
}

// ─── Timeframe Chip Group ────────────────────────────────────────────────────
function TimeframeChips({ value, onChange }) {
  const opts = [
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-muted, #f3f4f6)', borderRadius: '10px', padding: '3px' }}>
      {opts.map(o => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '8px',
              background: active ? '#16a34a' : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Status Summary Bar ───────────────────────────────────────────────────────
function StatusSummary({ queue, loading }) {
  if (loading) return null;
  const counts = { Waiting: 0, Scheduled: 0, Completed: 0, Cancelled: 0 };
  queue.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; else counts.Waiting++; });
  if (queue.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingBottom: '4px' }}>
      {Object.entries(STATUS_CFG).map(([key, cfg]) => (
        <span key={key} style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 10px', borderRadius: '6px',
          background: cfg.bg, fontSize: '0.75rem', fontWeight: 600, color: cfg.color,
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
          {cfg.label} <strong>{counts[key] || 0}</strong>
        </span>
      ))}
    </div>
  );
}

// ─── Status Pill (under greeting) ─────────────────────────────────────────────
function StatusPill({ apptsToday, followUpsOverdue, loading }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      marginTop: '6px', padding: '6px 12px', borderRadius: '20px',
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      fontSize: '0.82rem', color: '#15803d', fontWeight: 500,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <CalendarDays size={13} /> {todayLabel()}
      </span>
      <span style={{ color: '#86efac' }}>·</span>
      <span>
        {loading ? '…' : (
          <><strong>{apptsToday}</strong> appointment{apptsToday === 1 ? '' : 's'} today</>
        )}
      </span>
      <span style={{ color: '#86efac' }}>·</span>
      <span style={{ color: followUpsOverdue > 0 ? '#b91c1c' : '#15803d' }}>
        {loading ? '…' : (
          <><strong>{followUpsOverdue}</strong> follow-up{followUpsOverdue === 1 ? '' : 's'} due</>
        )}
      </span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { userName, role, authFetch } = useAuth();

  // ── Timeframe ──
  // 'today' (default) | 'week' | 'month' — drives stats + chart range.
  // The queue + status pill always reflect today regardless of this.
  const [timeframe, setTimeframe] = useState('today');
  const { start: statsStart, end: statsEnd } = rangeForTimeframe(timeframe);

  // ── Data ──
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [queue, setQueue] = useState([]);
  const [followUpsOverdue, setFollowUpsOverdue] = useState(0);

  // ── Loading ──
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingPill,  setLoadingPill]  = useState(true);
  const [error, setError] = useState('');

  // ── Fetch: stats for the selected timeframe ──
  const fetchStats = useCallback(async (s, e) => {
    setLoadingStats(true);
    setError('');
    try {
      const r = await authFetch(`${API}/api/dashboard/stats?start=${s}&end=${e}`);
      if (!r.ok) throw new Error();
      setStats(await r.json());
    } catch {
      setStats(null);
    } finally { setLoadingStats(false); }
  }, [authFetch]);

  // ── Fetch: chart series for the selected timeframe ──
  const fetchChart = useCallback(async (s, e) => {
    setLoadingChart(true);
    try {
      const r = await authFetch(`${API}/api/dashboard/chart?start=${s}&end=${e}`);
      if (!r.ok) throw new Error();
      setChart(await r.json());
    } catch { setChart([]); }
    finally { setLoadingChart(false); }
  }, [authFetch]);

  // ── Fetch: queue is always TODAY ──
  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const today = toISO(new Date());
      const params = new URLSearchParams({ startDate: today, endDate: today, limit: 500 });
      const r = await authFetch(`${API}/api/appointments?${params}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setQueue(Array.isArray(data) ? data : (data.appointments || []));
    } catch { setQueue([]); }
    finally { setLoadingQueue(false); }
  }, [authFetch]);

  // ── Fetch: overdue follow-up count for the status pill ──
  const fetchOverdueFollowUps = useCallback(async () => {
    setLoadingPill(true);
    try {
      const r = await authFetch(`${API}/api/followup?filter=overdue`);
      if (!r.ok) throw new Error();
      const arr = await r.json();
      setFollowUpsOverdue(Array.isArray(arr) ? arr.length : 0);
    } catch { setFollowUpsOverdue(0); }
    finally { setLoadingPill(false); }
  }, [authFetch]);

  // Refetch stats + chart whenever the timeframe changes.
  useEffect(() => {
    fetchStats(statsStart, statsEnd);
    fetchChart(statsStart, statsEnd);
  }, [statsStart, statsEnd, fetchStats, fetchChart]);

  // Initial queue + pill fetch.
  useEffect(() => {
    fetchQueue();
    fetchOverdueFollowUps();
  }, [fetchQueue, fetchOverdueFollowUps]);

  // ── Auto-refresh: queue + pill every 30s (queue is the most volatile thing) ──
  useEffect(() => {
    const id = setInterval(() => {
      // Skip while tab is hidden — saves network/battery.
      if (document.visibilityState !== 'visible') return;
      fetchQueue();
      fetchOverdueFollowUps();
    }, 30_000);
    return () => clearInterval(id);
  }, [fetchQueue, fetchOverdueFollowUps]);

  // Today's appointment count for the status pill.
  // When timeframe === 'today' this equals stats.appointmentsCount, otherwise
  // we use queue.length (which is always today's data).
  const apptsToday = timeframe === 'today'
    ? (stats?.appointmentsCount ?? queue.length)
    : queue.length;

  // The "current" patient is the first non-Completed/Cancelled row in the queue
  // (sorted by token). This is what gets the colored left border.
  const currentIdx = queue.findIndex(a => a.status !== 'Completed' && a.status !== 'Cancelled');

  // ── Actions ────────────────────────────────────────────────────────────────
  const startConsultation = (appt) => {
    // Prescription.jsx already reads location.state.appointment.
    navigate('/prescription', { state: { appointment: appt } });
  };

  const viewHistory = (appt) => {
    if (appt.patientId) navigate(`/patients/${appt.patientId}/history`);
    else navigate('/patients');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '4px 0' }}>

      {/* ── Page Header: greeting + status pill on left, timeframe chips on right ── */}
      <div className="page-header" style={{ marginBottom: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title">Clinic Overview</h1>
          <p className="page-subtitle" style={{ marginBottom: '4px' }}>
            {timeGreeting()}, {userName || (role === 'Doctor' ? 'Doctor' : 'Staff')}!
          </p>
          <StatusPill
            apptsToday={apptsToday}
            followUpsOverdue={followUpsOverdue}
            loading={loadingPill || (loadingStats && timeframe === 'today')}
          />
        </div>
        <TimeframeChips value={timeframe} onChange={setTimeframe} />
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '0.84rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#d97706" /> {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          icon={Users} iconBg="rgba(22,163,74,0.12)" iconColor="#16a34a"
          label={timeframe === 'today' ? 'New Patients Today' : timeframe === 'week' ? 'New Patients (7d)' : 'New Patients (30d)'}
          value={stats?.patientsCount ?? 0} loading={loadingStats}
        />
        <StatCard
          icon={Calendar} iconBg="rgba(5,150,105,0.12)" iconColor="#059669"
          label={timeframe === 'today' ? 'Appointments Today' : timeframe === 'week' ? 'Appointments (7d)' : 'Appointments (30d)'}
          value={stats?.appointmentsCount ?? 0} loading={loadingStats}
        />
        <StatCard
          icon={IndianRupee} iconBg="rgba(71,85,105,0.12)" iconColor="#475569"
          label={timeframe === 'today' ? 'Revenue Today' : timeframe === 'week' ? 'Revenue (7d)' : 'Revenue (30d)'}
          value={fmt(stats?.totalRevenue)} loading={loadingStats}
        />
      </div>

      {/* ── Main 2-col grid: Queue (left, 2fr) + Chart (right, 1fr) ── */}
      {/* Reuses .resp-chart-queue which already stacks on tablet/mobile */}
      <div className="resp-chart-queue">

        {/* ── Patient Queue (primary, larger column) ── */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Patient Queue</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · auto-refreshing every 30s
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, border: '1px solid var(--border-color)' }}>
              {loadingQueue ? '…' : `${queue.length} patient${queue.length === 1 ? '' : 's'}`}
            </span>
          </div>

          <StatusSummary queue={queue} loading={loadingQueue} />

          {/* Queue list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
            {loadingQueue ? (
              <MedicalLoader text="Loading queue…" />
            ) : queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: '0.9rem' }}>
                <Calendar size={40} color="#e5e7eb" style={{ marginBottom: '10px' }} />
                <div style={{ fontWeight: 600, color: '#6b7280' }}>No appointments today</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Add a walk-in or schedule from the Appointments page.</div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '14px', fontSize: '0.82rem' }}
                  onClick={() => navigate('/appointments')}
                >Go to Appointments</button>
              </div>
            ) : (
              queue.map((p, i) => {
                const sc = getStatus(p.status);
                const isCurrent = i === currentIdx;
                const ageGender = [p.age, p.gender?.[0]].filter(Boolean).join('');
                return (
                  <div
                    key={p._id || p.id || i}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      borderLeft: isCurrent ? '4px solid #16a34a' : '1px solid var(--border-color)',
                      background: isCurrent ? '#f0fdf4' : 'var(--bg-card, #fff)',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: '14px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Token */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: isCurrent ? '#16a34a' : '#f0fdf4',
                      border: isCurrent ? 'none' : '1.5px solid #bbf7d0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCurrent ? '#fff' : '#15803d',
                      fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                    }}>{p.tokenNumber ?? (i + 1)}</div>

                    {/* Info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {p.patientName}
                        </span>
                        {ageGender && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            · {ageGender}
                          </span>
                        )}
                        {isCurrent && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                            NEXT UP
                          </span>
                        )}
                        {p.isEmergency && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', color: '#991b1b', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                            EMERGENCY
                          </span>
                        )}
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                          background: sc.bg, color: sc.color,
                        }}>{sc.label}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {p.time && (
                          <>
                            <Clock size={12} /> {p.time}
                            {p.reason && <span style={{ color: '#d1d5db' }}>·</span>}
                          </>
                        )}
                        {p.reason || (p.time ? '' : 'No reason noted')}
                      </div>
                    </div>

                    {/* Action buttons — stacked vertically on the right */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch', minWidth: '150px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        onClick={() => startConsultation(p)}
                        disabled={p.status === 'Completed' || p.status === 'Cancelled'}
                      >
                        <Play size={13} /> Start Consultation
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        onClick={() => viewHistory(p)}
                      >
                        <History size={13} /> View History
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.82rem', marginTop: '4px' }} onClick={() => navigate('/appointments')}>
            View All Appointments
          </button>
        </div>

        {/* ── Chart (secondary, smaller column) ── */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Visits & Revenue</h2>
            <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', padding: '3px 9px', borderRadius: '6px', fontWeight: 600 }}>
              {timeframe === 'today' ? 'Today' : timeframe === 'week' ? 'Last 7 days' : 'Last 30 days'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <span style={{ width: '12px', height: '2px', background: '#16a34a', display: 'inline-block', borderRadius: '2px' }} /> Patients
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <span style={{ width: '12px', height: '2px', background: '#059669', display: 'inline-block', borderRadius: '2px' }} /> Revenue
            </span>
          </div>
          {loadingChart ? (
            <MedicalLoader text="Loading chart…" />
          ) : chart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#9ca3af', minHeight: '260px' }}>
              <TrendingUp size={36} color="#e5e7eb" />
              <span style={{ fontSize: '0.82rem' }}>No data in this range</span>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="p" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="r" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '10px', fontSize: '0.82rem' }}
                    formatter={(val, name) => [name === 'patients' ? val + ' patients' : `₹${val.toLocaleString('en-IN')}`, name === 'patients' ? 'Patients' : 'Revenue']}
                  />
                  <Area yAxisId="p" type="monotone" dataKey="patients" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#gP)" name="patients" />
                  <Area yAxisId="r" type="monotone" dataKey="revenue"  stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#gR)"  name="revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
