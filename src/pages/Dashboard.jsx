import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, TrendingUp, AlertCircle,
  Search, X, Filter, Loader2, RefreshCw,
  ChevronDown, CalendarDays, IndianRupee,
  CheckCircle2, XCircle, Timer, Activity,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';

const API = 'https://medical-project-h6yc.vercel.app';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().split('T')[0];
const today = () => toISO(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toISO(d); };
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;


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

// ─── Status Summary Bar ───────────────────────────────────────────────────────
function StatusSummary({ queue, loading }) {
  if (loading) return null;
  const counts = { Waiting: 0, Scheduled: 0, Completed: 0, Cancelled: 0 };
  queue.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; else counts.Waiting++; });
  const total = queue.length;
  if (total === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingBottom: '4px' }}>
      {Object.entries(STATUS_CFG).map(([key, cfg]) => {
        const count = counts[key] || 0;
        return (
          <span key={key} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '6px',
            background: cfg.bg, fontSize: '0.75rem', fontWeight: 600, color: cfg.color,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
            {cfg.label} <strong>{count}</strong>
          </span>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { userName, role, authFetch } = useAuth();

  // ── Date range (shared: stats, chart and queue all use this) ──
  const [startDate, setStartDate] = useState(today());
  const [endDate,   setEndDate]   = useState(today());

  // ── Filters ──
  const [diseaseList,     setDiseaseList]     = useState([]);
  const [selectedDisease, setSelectedDisease] = useState('');
  const [patientSearch,   setPatientSearch]   = useState('');
  const [diseaseOpen,     setDiseaseOpen]     = useState(false);
  const diseaseRef = useRef(null);

  // ── Status filter for queue ──
  const [statusFilter, setStatusFilter] = useState('');
  const [statusOpen,   setStatusOpen]   = useState(false);
  const statusRef = useRef(null);

  // ── Data ──
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [queue, setQueue] = useState([]);

  // ── Loading ──
  const [loadingStats,   setLoadingStats]   = useState(true);
  const [loadingChart,   setLoadingChart]   = useState(true);
  const [loadingQueue,   setLoadingQueue]   = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState('');

  // Outside click for dropdowns
  useEffect(() => {
    const fn = (e) => {
      if (diseaseRef.current && !diseaseRef.current.contains(e.target)) setDiseaseOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── Fetch disease list once ────────────────────────────────────────────────
  useEffect(() => {
    setLoadingFilters(true);
    authFetch(`${API}/api/dashboard/diseases`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDiseaseList(data); })
      .catch(() => {})
      .finally(() => setLoadingFilters(false));
  }, [authFetch]);

  // ── Stats & Chart: re-fetch when date range OR authFetch changes ───────────
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

  const fetchChart = useCallback(async (s, e) => {
    setLoadingChart(true);
    try {
      const r = await authFetch(`${API}/api/dashboard/chart?start=${s}&end=${e}`);
      if (!r.ok) throw new Error();
      setChart(await r.json());
    } catch { setChart([]); }
    finally { setLoadingChart(false); }
  }, [authFetch]);

  useEffect(() => {
    fetchStats(startDate, endDate);
    fetchChart(startDate, endDate);
  }, [startDate, endDate, fetchStats, fetchChart]);

  // ── Queue: use /api/appointments which already supports startDate/endDate ────
  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const params = new URLSearchParams({ startDate, endDate, limit: 500 });
      const r = await authFetch(`${API}/api/appointments?${params}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setQueue(Array.isArray(data) ? data : (data.appointments || []));
    } catch { setQueue([]); }
    finally { setLoadingQueue(false); }
  }, [startDate, endDate, authFetch]);

  useEffect(() => {
    const t = setTimeout(fetchQueue, 300);
    return () => clearTimeout(t);
  }, [fetchQueue]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDateChange = (field, val) => {
    if (field === 'start') setStartDate(val);
    else setEndDate(val);
  };

  const resetFilters = () => { setSelectedDisease(''); setPatientSearch(''); setStatusFilter(''); };
  const hasFilter = selectedDisease || patientSearch.trim() || statusFilter;

  // All filtering is client-side on top of the full range result
  const filteredQueue = queue.filter(a => {
    if (statusFilter && (a.status || 'Waiting') !== statusFilter) return false;
    if (patientSearch.trim() && !a.patientName?.toLowerCase().includes(patientSearch.trim().toLowerCase())) return false;
    if (selectedDisease && !(a.reason?.toLowerCase().includes(selectedDisease.toLowerCase()))) return false;
    return true;
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening';
  };

  return (
    <div className="animate-fade-in" style={{ padding: '4px 0' }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Clinic Overview</h1>
          <p className="page-subtitle">{greeting()}, {userName || (role === 'Doctor' ? 'Doctor' : 'Staff')}!</p>
        </div>
        <button
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          onClick={() => { fetchStats(startDate, endDate); fetchChart(startDate, endDate); fetchQueue(); }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '0.84rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#d97706" /> {error}
        </div>
      )}

      {/* ── Filter Panel — single unified row ── */}
      <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* Date range */}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <CalendarDays size={14} /> Date Range
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-input)', border: '1.5px solid var(--border-color)',
            borderRadius: '10px', padding: '5px 12px',
          }}>
            <CalendarDays size={13} color="#9ca3af" />
            <input type="date" value={startDate} max={endDate}
              onChange={e => handleDateChange('start', e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.82rem', color: 'var(--text-main)', background: 'transparent', cursor: 'pointer' }} />
            <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 700 }}>→</span>
            <input type="date" value={endDate} min={startDate}
              onChange={e => handleDateChange('end', e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.82rem', color: 'var(--text-main)', background: 'transparent', cursor: 'pointer' }} />
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', flexShrink: 0 }} />

          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <Filter size={13} /> Filters
          </div>

          {/* Status dropdown */}
          <div ref={statusRef} style={{ position: 'relative' }}>
            <button onClick={() => setStatusOpen(!statusOpen)} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px',
              border: `1.5px solid ${statusFilter ? STATUS_CFG[statusFilter]?.color : 'var(--border-color)'}`,
              borderRadius: '10px', background: statusFilter ? STATUS_CFG[statusFilter]?.bg : 'transparent',
              color: statusFilter ? STATUS_CFG[statusFilter]?.color : 'var(--text-muted)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', minWidth: '140px', justifyContent: 'space-between',
            }}>
              <span>{statusFilter || 'All Statuses'}</span>
              <ChevronDown size={12} />
            </button>
            {statusOpen && (
              <div className="glass-panel" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, minWidth: '160px', padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <div onClick={() => { setStatusFilter(''); setStatusOpen(false); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, background: !statusFilter ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = !statusFilter ? '#f0fdf4' : 'transparent'}
                >All Statuses</div>
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                  <div key={key} onClick={() => { setStatusFilter(key); setStatusOpen(false); }}
                    style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: statusFilter === key ? 700 : 400, color: cfg.color, background: statusFilter === key ? cfg.bg : 'transparent' }}
                    onMouseEnter={e => { if (statusFilter !== key) e.currentTarget.style.background = 'var(--bg-muted)'; }}
                    onMouseLeave={e => { if (statusFilter !== key) e.currentTarget.style.background = 'transparent'; }}
                  >{cfg.label}</div>
                ))}
              </div>
            )}
          </div>

          {/* Disease dropdown */}
          <div ref={diseaseRef} style={{ position: 'relative' }}>
            <button onClick={() => setDiseaseOpen(!diseaseOpen)} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px',
              border: `1.5px solid ${selectedDisease ? '#16a34a' : 'var(--border-color)'}`,
              borderRadius: '10px', background: selectedDisease ? '#f0fdf4' : 'transparent',
              color: selectedDisease ? '#16a34a' : 'var(--text-muted)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', minWidth: '150px', justifyContent: 'space-between',
            }}>
              <span>{selectedDisease || 'All Diseases'}</span>
              {loadingFilters ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
            </button>
            {diseaseOpen && (
              <div className="glass-panel" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, minWidth: '240px', maxHeight: '220px', overflowY: 'auto', padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <div onClick={() => { setSelectedDisease(''); setDiseaseOpen(false); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, background: !selectedDisease ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = !selectedDisease ? '#f0fdf4' : 'transparent'}
                >All Diseases</div>
                {diseaseList.length === 0 && !loadingFilters
                  ? <div style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#9ca3af' }}>No diagnoses recorded yet</div>
                  : diseaseList.map(d => (
                    <div key={d} onClick={() => { setSelectedDisease(d); setDiseaseOpen(false); }}
                      style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: selectedDisease === d ? 600 : 400, color: selectedDisease === d ? '#16a34a' : 'var(--text-main)', background: selectedDisease === d ? '#f0fdf4' : 'transparent' }}
                      onMouseEnter={e => { if (selectedDisease !== d) e.currentTarget.style.background = 'var(--bg-muted)'; }}
                      onMouseLeave={e => { if (selectedDisease !== d) e.currentTarget.style.background = 'transparent'; }}
                    >{d}</div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Patient search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} color="#9ca3af" style={{ position: 'absolute', left: '10px' }} />
            <input type="text" placeholder="Search patient..." value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
              style={{ padding: '7px 30px 7px 28px', border: `1.5px solid ${patientSearch ? '#16a34a' : 'var(--border-color)'}`, borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-main)', outline: 'none', background: patientSearch ? '#f0fdf4' : 'transparent', width: '170px' }} />
            {patientSearch && (
              <button onClick={() => setPatientSearch('')} style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Clear all filters */}
          {hasFilter && (
            <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon={Users}       iconBg="rgba(22,163,74,0.12)"  iconColor="#16a34a" label="New Patients"     value={stats?.patientsCount ?? 0}    loading={loadingStats} />
        <StatCard icon={Calendar}    iconBg="rgba(5,150,105,0.12)"  iconColor="#059669" label="Appointments"     value={stats?.appointmentsCount ?? 0} loading={loadingStats} />
        <StatCard icon={IndianRupee} iconBg="rgba(71,85,105,0.12)"  iconColor="#475569" label="Revenue Collected" value={fmt(stats?.totalRevenue)}       loading={loadingStats} />
      </div>

      {/* ── Chart + Queue ── */}
      <div className="resp-chart-queue">

        {/* Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Patient Visits & Revenue</h2>
            <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
              {startDate === endDate ? startDate : `${startDate} → ${endDate}`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <span style={{ width: '12px', height: '2px', background: '#16a34a', display: 'inline-block', borderRadius: '2px' }} /> Patients
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <span style={{ width: '12px', height: '2px', background: '#059669', display: 'inline-block', borderRadius: '2px' }} /> Revenue
            </span>
          </div>
          {loadingChart ? (
            <MedicalLoader text="Loading chart data…" />
          ) : chart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#9ca3af', minHeight: '260px' }}>
              <TrendingUp size={40} color="#e5e7eb" />
              <span style={{ fontSize: '0.85rem' }}>No data for selected date range</span>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: '260px' }}>
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
                  <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="p" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
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

        {/* Queue */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Patient Queue</h2>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                {startDate === endDate
                  ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, border: '1px solid var(--border-color)' }}>
              {loadingQueue ? '…' : `${Math.min(filteredQueue.length, 5)} / ${queue.length} shown`}
            </span>
          </div>

          {/* Status summary badges */}
          <StatusSummary queue={queue} loading={loadingQueue} />

          {/* Queue list — shows first 5, scrollable */}
          <div style={{ overflowY: 'auto', maxHeight: '340px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingQueue ? (
              <MedicalLoader text="Loading queue…" />
            ) : filteredQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#9ca3af', fontSize: '0.85rem' }}>
                <Calendar size={32} color="#e5e7eb" style={{ marginBottom: '8px' }} />
                <div>No appointments found</div>
                {hasFilter && <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Try clearing the filters</div>}
              </div>
            ) : (
              filteredQueue.slice(0, 5).map((p, i) => {
                const sc = getStatus(p.status);
                return (
                  <div key={p._id || p.id || i} style={{
                    padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card, #fff)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    {/* Token */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                      background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#15803d', fontWeight: 700, fontSize: '0.75rem',
                    }}>{p.tokenNumber ?? (i + 1)}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.patientName}
                        </span>
                        {p.isEmergency && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', color: '#991b1b', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {[p.time, p.reason].filter(Boolean).join(' · ')}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                      background: sc.bg, color: sc.color, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{sc.label}</span>

                    {/* Consult button */}
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.72rem', padding: '5px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
                      onClick={() => navigate('/appointments')}
                    >Consult</button>
                  </div>
                );
              })
            )}
          </div>

          <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.82rem', marginTop: '4px' }} onClick={() => navigate('/appointments')}>
            View All Appointments
          </button>
        </div>
      </div>
    </div>
  );
}
