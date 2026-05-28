import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ChevronLeft, ChevronRight, Users, Pill, IndianRupee,
  ClipboardList, Clock, CheckCircle2, XCircle, Timer, CalendarClock,
  Loader2, FileText, Wallet, Activity, RotateCcw, Stethoscope, Phone,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/*
 * MediCore — "Day report" dashboard (main-content area only).
 *
 * Goal: let the doctor pick ANY date and review that whole day at a glance —
 * patients seen, prescriptions/medicines, revenue/billing, and follow-ups.
 * Built only from existing endpoints. Where an endpoint can't filter by date
 * server-side, we fetch once and filter client-side (see TODOs).
 *
 * Endpoints used:
 *   GET /api/appointments?startDate=&endDate=   (server-side date filter ✓)
 *   GET /api/dashboard/stats?start=&end=        (per-day revenue/counts ✓)
 *   GET /api/dashboard/chart?start=&end=        (14-day strip)
 *   GET /api/prescriptions?limit=500            (filtered client-side by createdAt)
 *   GET /api/billing?limit=500                  (filtered client-side by createdAt)
 *   GET /api/followup                           (filtered client-side by dueDate)
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// TODO: /api/prescriptions and /api/billing have no server-side date filter,
// so we pull up to 500 of the most recent records and filter on the client.
// For a high-volume clinic, add ?start=&end= to those routes and switch the
// fetches below to per-day requests.
const FETCH_LIMIT = 500;

// ─── date helpers (local-time, YYYY-MM-DD) ──────────────────────────────────
const ymd = (d) => {
  // Local-time YYYY-MM-DD (en-CA gives ISO-like order)
  return d.toLocaleDateString('en-CA');
};
const todayYMD = () => ymd(new Date());
const parseYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const sameLocalDay = (isoOrDate, dayStr) => {
  if (!isoOrDate) return false;
  return ymd(new Date(isoOrDate)) === dayStr;
};
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const prettyDate = (dayStr) =>
  parseYMD(dayStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const shiftDay = (dayStr, delta) => { const d = parseYMD(dayStr); d.setDate(d.getDate() + delta); return ymd(d); };

const STATUS_CFG = {
  Waiting:   { color: '#92400e', bg: '#fef9ec', icon: Timer,        label: 'Waiting'   },
  Scheduled: { color: '#2d8653', bg: '#e8f5ee', icon: Calendar,     label: 'Scheduled' },
  Completed: { color: '#1a5c38', bg: '#d4edde', icon: CheckCircle2, label: 'Completed' },
  Cancelled: { color: '#6b7280', bg: '#f3f4f6', icon: XCircle,      label: 'Cancelled' },
};
const statusOf = (s) => STATUS_CFG[s] || STATUS_CFG.Waiting;

// ─── KPI tile ───────────────────────────────────────────────────────────────
function Kpi({ icon: Icon, iconBg, iconColor, label, value, sub, loading }) {
  return (
    <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg, color: iconColor,
      }}>
        {loading ? <Loader2 size={19} className="animate-spin" /> : <Icon size={20} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
          {loading ? '—' : value}
        </div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Section panel wrapper ──────────────────────────────────────────────────
function Section({ icon: Icon, title, count, children, action }) {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={17} color="var(--primary)" />
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h2>
        {count != null && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 9px', borderRadius: '20px', fontWeight: 600 }}>
            {count}
          </span>
        )}
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

const emptyHint = (text) => (
  <div style={{ textAlign: 'center', padding: '26px 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>{text}</div>
);

// ─── 14-day clickable strip (busyness navigator) ────────────────────────────
function DayStrip({ insights, selected, onPick }) {
  if (!insights.length) return null;
  const max = Math.max(1, ...insights.map((d) => d.patients || 0));
  return (
    <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '20px' }}>
      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
        Last 14 days · click a day to jump (bar height = new patients)
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '64px' }}>
        {insights.map((d) => {
          const isSel = d.date === selected;
          const h = Math.round(((d.patients || 0) / max) * 46) + 6;
          return (
            <button
              key={d.date}
              onClick={() => onPick(d.date)}
              title={`${d.label} · ${d.patients} patients · ${fmtMoney(d.revenue)}`}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{
                width: '100%', height: `${h}px`, borderRadius: '4px',
                background: isSel ? 'var(--primary)' : 'var(--primary-mid)',
                transition: 'background 0.15s',
              }} />
              <span style={{ fontSize: '0.6rem', color: isSel ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isSel ? 700 : 400, whiteSpace: 'nowrap' }}>
                {d.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const { userName, role, authFetch } = useAuth();

  const [selected, setSelected] = useState(todayYMD()); // selected day (YYYY-MM-DD)

  // Per-day (server-filtered)
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingDay, setLoadingDay] = useState(true);

  // Full lists (fetched once, filtered client-side per day)
  const [allRx, setAllRx] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [allFollowUps, setAllFollowUps] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);

  const isToday = selected === todayYMD();
  const displayName = userName || (role === 'Doctor' ? 'Doctor' : 'Staff');

  // ── Fetch per-day data (appointments + stats) whenever the date changes ──
  const fetchDay = useCallback(async (day) => {
    setLoadingDay(true);
    try {
      const [aRes, sRes] = await Promise.all([
        authFetch(`${API}/api/appointments?startDate=${day}&endDate=${day}&limit=${FETCH_LIMIT}`),
        authFetch(`${API}/api/dashboard/stats?start=${day}&end=${day}`),
      ]);
      const a = aRes.ok ? await aRes.json() : { appointments: [] };
      setAppointments(Array.isArray(a) ? a : (a.appointments || []));
      setStats(sRes.ok ? await sRes.json() : null);
    } catch {
      setAppointments([]); setStats(null);
    } finally { setLoadingDay(false); }
  }, [authFetch]);

  useEffect(() => { fetchDay(selected); }, [selected, fetchDay]);

  // ── Fetch full lists once on mount ──
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingAll(true);
      try {
        const end = new Date();
        const start = new Date(); start.setDate(start.getDate() - 13);
        const [rxRes, blRes, fuRes, chRes] = await Promise.all([
          authFetch(`${API}/api/prescriptions?limit=${FETCH_LIMIT}`),
          authFetch(`${API}/api/billing?limit=${FETCH_LIMIT}`),
          authFetch(`${API}/api/followup`),
          authFetch(`${API}/api/dashboard/chart?start=${ymd(start)}&end=${ymd(end)}`),
        ]);
        if (!alive) return;
        const rx = rxRes.ok ? await rxRes.json() : [];
        setAllRx(Array.isArray(rx) ? rx : []);
        const bl = blRes.ok ? await blRes.json() : { bills: [] };
        setAllBills(Array.isArray(bl) ? bl : (bl.bills || []));
        const fu = fuRes.ok ? await fuRes.json() : [];
        setAllFollowUps(Array.isArray(fu) ? fu : []);
        const ch = chRes.ok ? await chRes.json() : [];
        setInsights(Array.isArray(ch) ? ch : []);
      } catch {
        if (alive) { setAllRx([]); setAllBills([]); setAllFollowUps([]); setInsights([]); }
      } finally { if (alive) setLoadingAll(false); }
    })();
    return () => { alive = false; };
  }, [authFetch]);

  // ── Derive the selected day's slices ──
  const dayRx = useMemo(
    () => allRx.filter((p) => sameLocalDay(p.createdAt, selected)),
    [allRx, selected]
  );
  const dayBills = useMemo(
    () => allBills.filter((b) => sameLocalDay(b.createdAt, selected)),
    [allBills, selected]
  );
  const dayFollowUps = useMemo(
    () => allFollowUps.filter((f) => sameLocalDay(f.dueDate, selected)),
    [allFollowUps, selected]
  );

  // diagnosis lookup by patientId from that day's prescriptions (to enrich the
  // appointments table — appointments don't carry a diagnosis).
  const diagnosisByPatient = useMemo(() => {
    const m = {};
    dayRx.forEach((p) => {
      const pid = (p.patientId && (p.patientId._id || p.patientId)) || null;
      if (pid && p.diagnosis) m[String(pid)] = p.diagnosis;
    });
    return m;
  }, [dayRx]);

  // Billing breakdown for the day
  const billing = useMemo(() => {
    let collected = 0, pending = 0, paidCount = 0, unpaidCount = 0;
    const byMethod = {};
    dayBills.forEach((b) => {
      if (b.paidStatus) { collected += b.totalAmount; paidCount++; byMethod[b.paymentMethod || 'Other'] = (byMethod[b.paymentMethod || 'Other'] || 0) + b.totalAmount; }
      else { pending += b.totalAmount; unpaidCount++; }
    });
    return { collected, pending, paidCount, unpaidCount, byMethod };
  }, [dayBills]);

  // Top medicines prescribed that day
  const topMeds = useMemo(() => {
    const counts = {};
    dayRx.forEach((p) => (p.medicines || []).forEach((m) => {
      const name = (m.name || '').trim();
      if (name) counts[name] = (counts[name] || 0) + 1;
    }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [dayRx]);

  // Appointment status counts
  const statusCounts = useMemo(() => {
    const c = { Waiting: 0, Scheduled: 0, Completed: 0, Cancelled: 0 };
    appointments.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [appointments]);

  // Navigate to a patient's prescription form (reuses existing routing).
  const openPatient = (appt) => navigate('/prescription', { state: { appointment: appt } });

  const hasAnyData = appointments.length || dayRx.length || dayBills.length || dayFollowUps.length;

  return (
    <div className="animate-fade-in" style={{ padding: '4px 0' }}>

      {/* ── Header: title + date navigator ── */}
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Day report</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {isToday ? `Today — ${prettyDate(selected)}` : prettyDate(selected)}
            {' · Dr. '}{displayName}
          </p>
        </div>

        {/* Date navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '8px 10px' }}
            onClick={() => setSelected((s) => shiftDay(s, -1))}
            title="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-input)', border: '1.5px solid var(--border-color)',
            borderRadius: '10px', padding: '6px 12px',
          }}>
            <Calendar size={15} color="var(--primary)" />
            <input
              type="date"
              value={selected}
              max={todayYMD()}
              onChange={(e) => e.target.value && setSelected(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-primary)' }}
            />
          </div>

          <button
            className="btn btn-outline"
            style={{ padding: '8px 10px' }}
            onClick={() => setSelected((s) => shiftDay(s, 1))}
            disabled={isToday}
            title="Next day"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 14px' }} onClick={() => setSelected(todayYMD())}>
              <RotateCcw size={14} /> Today
            </button>
          )}
        </div>
      </div>

      {/* ── 14-day quick navigator ── */}
      <DayStrip insights={insights} selected={selected} onPick={setSelected} />

      {/* ── KPI row for the selected day ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <Kpi icon={Users} iconBg="rgba(45,134,83,0.12)" iconColor="var(--primary)"
          label="Patients seen" value={appointments.length}
          sub={`${statusCounts.Completed} completed`} loading={loadingDay} />
        <Kpi icon={ClipboardList} iconBg="rgba(14,116,144,0.12)" iconColor="#0e7490"
          label="Prescriptions" value={dayRx.length}
          sub={topMeds.length ? `${topMeds.length} distinct medicines` : 'none'} loading={loadingAll} />
        <Kpi icon={IndianRupee} iconBg="rgba(45,134,83,0.12)" iconColor="var(--primary)"
          label="Collected" value={fmtMoney(stats?.totalRevenue ?? billing.collected)}
          sub={`${billing.paidCount} paid bill${billing.paidCount === 1 ? '' : 's'}`} loading={loadingDay} />
        <Kpi icon={Wallet} iconBg="rgba(184,115,51,0.14)" iconColor="#b87333"
          label="Pending" value={fmtMoney(stats?.pendingRevenue ?? billing.pending)}
          sub={`${billing.unpaidCount} unpaid`} loading={loadingDay} />
        <Kpi icon={CalendarClock} iconBg="rgba(192,57,43,0.12)" iconColor="var(--danger)"
          label="Follow-ups due" value={dayFollowUps.length}
          sub={isToday ? 'today' : 'this day'} loading={loadingAll} />
      </div>

      {/* If nothing happened that day, one clear message */}
      {!loadingDay && !loadingAll && !hasAnyData && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
          <Calendar size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No activity recorded on {prettyDate(selected)}</div>
          <div style={{ fontSize: '0.84rem', marginTop: '4px' }}>Pick another day above, or use the 14-day strip to find a busy day.</div>
        </div>
      )}

      {/* ── Patients seen / appointments (wide) ── */}
      <div style={{ marginBottom: '20px' }}>
        <Section
          icon={Stethoscope}
          title="Patients seen"
          count={appointments.length}
          action={
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Object.entries(STATUS_CFG).map(([k, cfg]) => statusCounts[k] ? (
                <span key={k} style={{ fontSize: '0.7rem', fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: '6px' }}>
                  {cfg.label} {statusCounts[k]}
                </span>
              ) : null)}
            </div>
          }
        >
          {loadingDay ? (
            <MedicalLoader text="Loading…" />
          ) : appointments.length === 0 ? (
            emptyHint('No appointments on this day.')
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: '620px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>#</th>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a, i) => {
                    const sc = statusOf(a.status);
                    const pid = String(a.patientId?._id || a.patientId || '');
                    const dx = diagnosisByPatient[pid];
                    return (
                      <tr key={a._id || i}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{a.tokenNumber ?? i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.patientName}</div>
                          {[a.age, a.gender?.[0]].filter(Boolean).length > 0 && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{[a.age, a.gender?.[0]].filter(Boolean).join('')}</div>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{a.time || '—'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{a.reason || '—'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{dx || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        <td><span style={{ fontSize: '0.72rem', fontWeight: 600, color: sc.color, background: sc.bg, padding: '3px 9px', borderRadius: '6px' }}>{sc.label}</span></td>
                        <td>
                          <button className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '5px 10px' }} onClick={() => openPatient(a)}>
                            <FileText size={12} /> Chart
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      {/* ── Prescriptions + Billing (two columns) ── */}
      <div className="resp-chart-queue" style={{ marginBottom: '20px' }}>

        {/* Prescriptions */}
        <Section icon={Pill} title="Prescriptions & medicines" count={dayRx.length}>
          {loadingAll ? (
            <MedicalLoader text="Loading…" />
          ) : dayRx.length === 0 ? (
            emptyHint('No prescriptions written on this day.')
          ) : (
            <>
              {/* Top medicines */}
              {topMeds.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {topMeds.map(([name, n]) => (
                    <span key={name} style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '20px' }}>
                      {name} <strong>×{n}</strong>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                {dayRx.map((p, i) => {
                  const pname = p.patientId?.name || 'Unknown patient';
                  const time = p.createdAt ? new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={p._id || i} style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{pname}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{time}</span>
                      </div>
                      {p.diagnosis && <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '1px' }}>{p.diagnosis}</div>}
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {(p.medicines || []).map((m) => m.name).filter(Boolean).join(', ') || 'No medicines listed'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Section>

        {/* Billing */}
        <Section icon={IndianRupee} title="Revenue & billing" count={dayBills.length}>
          {loadingAll ? (
            <MedicalLoader text="Loading…" />
          ) : dayBills.length === 0 ? (
            emptyHint('No invoices generated on this day.')
          ) : (
            <>
              {/* Collected vs pending */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                <div style={{ flex: 1, background: 'var(--primary-light)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Collected</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{fmtMoney(billing.collected)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{billing.paidCount} paid</div>
                </div>
                <div style={{ flex: 1, background: '#fffaf0', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pending</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b87333' }}>{fmtMoney(billing.pending)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{billing.unpaidCount} unpaid</div>
                </div>
              </div>

              {/* Payment method split */}
              {Object.keys(billing.byMethod).length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(billing.byMethod).map(([method, amt]) => (
                    <span key={method} style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-main)', background: 'var(--bg-muted)', padding: '3px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                      {method}: {fmtMoney(amt)}
                    </span>
                  ))}
                </div>
              )}

              {/* Bill list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                {dayBills.map((b, i) => (
                  <div key={b._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.patientName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.billType} · {b.paymentMethod}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{fmtMoney(b.totalAmount)}</div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: b.paidStatus ? 'var(--primary)' : '#b87333' }}>
                        {b.paidStatus ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      {/* ── Follow-ups due this day ── */}
      <div style={{ marginBottom: '8px' }}>
        <Section icon={CalendarClock} title="Follow-ups due" count={dayFollowUps.length}>
          {loadingAll ? (
            <MedicalLoader text="Loading…" />
          ) : dayFollowUps.length === 0 ? (
            emptyHint('No follow-ups due on this day.')
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {dayFollowUps.map((f, i) => {
                const done = f.status === 'Completed';
                return (
                  <div key={f._id || i} style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '10px', borderLeft: `3px solid ${done ? 'var(--primary)' : 'var(--danger)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{f.patientName}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: done ? 'var(--primary)' : 'var(--danger)' }}>
                        {done ? 'Done' : 'Due'}
                      </span>
                    </div>
                    {f.diagnosis && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '1px' }}>{f.diagnosis}</div>}
                    {f.contact && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={11} /> {f.contact}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
