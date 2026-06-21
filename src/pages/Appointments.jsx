import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, AlertTriangle, Plus, X,
  Search, Phone, FileText, Stethoscope,
  Loader2, CheckCircle, CheckCircle2, RotateCcw,
  ChevronLeft, ChevronRight, XCircle,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import Modal, { AlertModal } from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLORS = {
  Waiting:   { bg: '#fef9ec', color: '#92400e' },
  pending:   { bg: '#fef9ec', color: '#92400e' },
  Scheduled: { bg: '#e8f5ee', color: '#2d8653' },
  Completed: { bg: '#d4edde', color: '#1a5c38' },
  completed: { bg: '#d4edde', color: '#1a5c38' },
  Cancelled: { bg: '#f3f4f6', color: '#6b7280' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280' },
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Local-time YYYY-MM-DD. (Do NOT use toISOString() here — it converts to UTC,
// which in +offset timezones like IST shifts a local-midnight date back a day,
// breaking date stepping and showing the wrong day.)
const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ══════════════════════════════════════════════════════════════════════════════
// DOCTOR VIEW — Single-day focus, one-click inline actions, auto-refresh
// Goal: the doctor works the whole day without leaving the page or fiddling
// with filter controls. Default = today; chips + search instead of dropdowns;
// Start consult / Done / Cancel / Reopen act inline (optimistic updates).
// ══════════════════════════════════════════════════════════════════════════════
// One appointment row with inline actions.
function ApptRow({ appt, busy, onConsult, onDone, onCancel, onReopen }) {
  const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.Waiting;
  const isDone = appt.status === 'Completed' || appt.status === 'completed';
  const isCancelled = appt.status === 'Cancelled' || appt.status === 'cancelled';
  const ageGender = [appt.age, appt.gender?.[0]].filter(Boolean).join('');

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--border-color)',
        borderLeft: appt.isEmergency ? '4px solid #ef4444' : '1px solid var(--border-color)',
        borderRadius: '10px', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '14px',
        opacity: isCancelled ? 0.65 : 1,
      }}
    >
      {/* Token */}
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
        background: 'var(--bg-muted)', border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.76rem',
      }}>#{appt.tokenNumber ?? '—'}</div>

      {/* Patient info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{appt.patientName}</span>
          {ageGender && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>· {ageGender}</span>}
          {appt.isEmergency && (
            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', color: '#991b1b', background: '#fee2e2', padding: '1px 7px', borderRadius: '4px' }}>EMERGENCY</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {appt.time && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> {appt.time}</span>}
          {appt.reason && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FileText size={11} /> {appt.reason}</span>}
        </div>
      </div>

      {/* Status badge */}
      <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0, background: sc.bg, color: sc.color }}>
        {appt.status || 'Waiting'}
      </span>

      {/* Inline actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {busy ? (
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
        ) : isCancelled ? (
          <button className="btn btn-outline" style={{ fontSize: '0.76rem', padding: '6px 10px' }} onClick={() => onReopen(appt)}>
            <RotateCcw size={12} /> Reopen
          </button>
        ) : isDone ? (
          <>
            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Done
            </span>
            <button className="btn btn-outline" style={{ fontSize: '0.76rem', padding: '6px 10px' }} onClick={() => onConsult(appt)} title="Open chart">
              <FileText size={12} /> Chart
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '7px 14px' }} onClick={() => onConsult(appt)}>
              <Stethoscope size={13} /> Start consult
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '7px 10px' }} onClick={() => onDone(appt)} title="Mark completed">
              <CheckCircle2 size={13} /> Done
            </button>
            <button
              style={{ fontSize: '0.78rem', padding: '7px 8px', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              onClick={() => onCancel(appt)} title="Cancel appointment"
            >
              <XCircle size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Add Appointment modal (doctor-side quick booking) ───────────────────────
// Reused for both walk-ins (date = today) and future-date scheduling. Patient
// autocomplete searches existing patients; if the typed name doesn't match,
// a new patient record is created on submit. Uses existing endpoints only.
function AddAppointmentModal({ open, onClose, onSaved, authFetch, defaultDate }) {
  const empty = () => ({
    name: '', phone: '', age: '', gender: 'Male',
    date: defaultDate || toISO(new Date()),
    time: '', reason: '', isEmergency: false,
  });
  const [form, setForm] = useState(empty());
  const [patientId, setPatientId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const debounceRef = useRef(null);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setForm(empty());
      setPatientId(null);
      setSuggestions([]);
      setErr('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Debounced patient search as the doctor types a name
  const onNameChange = (val) => {
    setF('name', val);
    setPatientId(null);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await authFetch(`${API}/api/patients/search?q=${encodeURIComponent(val.trim())}`);
        const data = await r.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 250);
  };

  const selectExisting = (p) => {
    setForm(f => ({
      ...f,
      name:   p.name || '',
      phone:  p.contact || p.phone || f.phone,
      age:    p.age ? String(p.age) : f.age,
      gender: p.gender || f.gender,
    }));
    setPatientId(p._id || p.id);
    setSuggestions([]);
  };

  const submit = async () => {
    setErr('');
    if (!form.name.trim()) { setErr('Patient name is required.'); return; }
    if (!form.date)        { setErr('Date is required.'); return; }
    setSaving(true);
    try {
      let pid = patientId;
      // 1) Create the patient if not linked to an existing one
      if (!pid) {
        const pr = await authFetch(`${API}/api/patients`, {
          method: 'POST',
          body: JSON.stringify({
            name:    form.name.trim(),
            age:     form.age ? Number(form.age) : 0,
            contact: form.phone.trim(),
            gender:  form.gender || 'Male',
          }),
        });
        if (!pr.ok) throw new Error('Could not create the patient record.');
        const p = await pr.json();
        pid = p._id;
      }
      // 2) Book the appointment (backend auto-assigns the token number)
      const dateISO = new Date(`${form.date}T${form.time || '09:00'}`).toISOString();
      const ar = await authFetch(`${API}/api/appointments`, {
        method: 'POST',
        body: JSON.stringify({
          patientId:   pid,
          patientName: form.name.trim(),
          date:        dateISO,
          time:        form.time,
          reason:      form.reason.trim(),
          age:         form.age ? Number(form.age) : null,
          gender:      form.gender,
          isEmergency: !!form.isEmergency,
        }),
      });
      if (!ar.ok) throw new Error('Could not book the appointment.');
      onSaved(form.date); // pass back the booked date so the parent can navigate to it
      onClose();
    } catch (e) {
      setErr(e.message || 'Booking failed.');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add appointment"
      icon={<Plus size={20} color="var(--primary)" />}
      maxWidth="540px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={saving || !form.name.trim() || !form.date}
            style={form.isEmergency ? { background: '#ef4444' } : undefined}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : (form.isEmergency ? <AlertTriangle size={14} /> : <Plus size={14} />)}
            {form.isEmergency ? ' Book emergency' : ' Book appointment'}
          </button>
        </>
      }
    >
      {err && (
        <div style={{ marginBottom: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', color: '#dc2626', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} /> {err}
        </div>
      )}

      {/* Patient name with autocomplete */}
      <div className="input-group" style={{ position: 'relative' }}>
        <label className="input-label">
          Patient name *
          {patientId && <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>✓ Existing</span>}
          {!patientId && form.name.trim().length > 1 && <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>+ New — will be registered</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '34px' }}
            placeholder="Search existing or type new name…"
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          {searching && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />}
        </div>
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '200px', overflowY: 'auto', padding: '4px', marginTop: '2px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            {suggestions.map(p => (
              <div key={p._id || p.id} onMouseDown={() => selectExisting(p)}
                style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {p.age ? `${p.age}y` : ''}{p.age && p.gender ? ' · ' : ''}{p.gender || ''}{(p.contact || p.phone) ? ` · ${p.contact || p.phone}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demographic + contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div className="input-group">
          <label className="input-label">Age</label>
          <input type="number" min="0" max="120" className="input-field" value={form.age} onChange={e => setF('age', e.target.value)} placeholder="e.g. 35" />
        </div>
        <div className="input-group">
          <label className="input-label">Gender</label>
          <CustomSelect value={form.gender} onChange={v => setF('gender', v)} width="100%" matchInput
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Phone</label>
          <input type="tel" className="input-field" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="e.g. 9876543210" />
        </div>
      </div>

      {/* Date + time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="input-group">
          <label className="input-label">Date *</label>
          <input type="date" className="input-field" value={form.date} onChange={e => setF('date', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Time</label>
          <input type="time" className="input-field" value={form.time} onChange={e => setF('time', e.target.value)} />
        </div>
      </div>

      {/* Reason */}
      <div className="input-group">
        <label className="input-label">Reason for visit</label>
        <input type="text" className="input-field" value={form.reason} onChange={e => setF('reason', e.target.value)} placeholder="e.g. fever, follow-up" />
      </div>

      {/* Emergency toggle */}
      <div
        onClick={() => setF('isEmergency', !form.isEmergency)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
          background: form.isEmergency ? '#fef2f2' : 'var(--bg-muted)',
          border: `1.5px solid ${form.isEmergency ? '#ef4444' : 'var(--border-color)'}`,
        }}
      >
        <div style={{
          width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
          border: `2px solid ${form.isEmergency ? '#ef4444' : '#d1d5db'}`,
          background: form.isEmergency ? '#ef4444' : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {form.isEmergency && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M1.5 6L5 9.5L10.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>}
        </div>
        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: form.isEmergency ? '#991b1b' : 'var(--text-main)' }}>
          Emergency case
        </span>
      </div>
    </Modal>
  );
}

function DoctorView() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [scope, setScope]               = useState('day');   // 'day' | 'week'
  const [day, setDay]                   = useState(() => toISO(new Date()));
  const [weekStart, setWeekStart]       = useState(() => getMonday(new Date()));
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busyId, setBusyId]             = useState(null);     // row being mutated
  const [confirmCancel, setConfirmCancel] = useState(null);   // appt pending cancel
  const [addOpen, setAddOpen]           = useState(false);    // "Add appointment" modal

  const confirmOpenRef = useRef(false);
  useEffect(() => { confirmOpenRef.current = !!confirmCancel; }, [confirmCancel]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 6); d.setHours(23, 59, 59, 999); return d;
  }, [weekStart]);

  const isTodaySelected = scope === 'day' && day === toISO(new Date());

  // ── Fetch (range depends on scope) ──
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const url = scope === 'day'
        ? `${API}/api/appointments?startDate=${day}&endDate=${day}&limit=500`
        : `${API}/api/appointments?startDate=${toISO(weekStart)}&endDate=${toISO(weekEnd)}&limit=500`;
      const r = await authFetch(url);
      const data = await r.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : Array.isArray(data) ? data : []);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  }, [authFetch, scope, day, weekStart, weekEnd]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Auto-refresh every 45s (skip while a confirm dialog is open or tab hidden).
  useEffect(() => {
    const id = setInterval(() => {
      if (confirmOpenRef.current) return;
      if (document.visibilityState !== 'visible') return;
      fetchAppointments();
    }, 45_000);
    return () => clearInterval(id);
  }, [fetchAppointments]);

  // Status counts on the loaded set (drive the chips + day-shape summary).
  const counts = useMemo(() => {
    const c = { all: appointments.length, Waiting: 0, Scheduled: 0, Completed: 0, Cancelled: 0 };
    appointments.forEach(a => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [appointments]);

  // Sort: emergencies first, then by token, then by time.
  const sortAppts = (arr) => [...arr].sort((a, b) => {
    if (!!b.isEmergency !== !!a.isEmergency) return b.isEmergency ? 1 : -1;
    if ((a.tokenNumber ?? 999) !== (b.tokenNumber ?? 999)) return (a.tokenNumber ?? 999) - (b.tokenNumber ?? 999);
    return (a.time || '').localeCompare(b.time || '');
  });

  // Apply status + name filters.
  const visible = useMemo(() => {
    let list = appointments;
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(a => a.patientName?.toLowerCase().includes(q)); }
    return list;
  }, [appointments, statusFilter, search]);

  // For week scope: group visible by day.
  const grouped = useMemo(() => {
    const groups = {};
    visible.forEach(a => { const d = toISO(new Date(a.date)); (groups[d] = groups[d] || []).push(a); });
    const today = toISO(new Date());
    return Object.entries(groups)
      .sort(([a], [b]) => (a === today ? -1 : b === today ? 1 : a.localeCompare(b)))
      .map(([d, arr]) => [d, sortAppts(arr)]);
  }, [visible]);

  // ── Inline mutations (optimistic) ──
  const patchStatus = async (appt, status) => {
    setBusyId(appt._id);
    const prev = appt.status;
    setAppointments(list => list.map(a => a._id === appt._id ? { ...a, status } : a));
    try {
      const r = await authFetch(`${API}/api/appointments/${appt._id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error();
    } catch {
      // revert on failure
      setAppointments(list => list.map(a => a._id === appt._id ? { ...a, status: prev } : a));
    } finally { setBusyId(null); }
  };

  const onConsult = (appt) => navigate('/prescription', { state: { appointment: appt } });
  const onDone    = (appt) => patchStatus(appt, 'Completed');
  const onReopen  = (appt) => patchStatus(appt, 'Waiting');
  const onCancel  = (appt) => setConfirmCancel(appt);
  const doCancel  = () => { if (confirmCancel) { patchStatus(confirmCancel, 'Cancelled'); setConfirmCancel(null); } };

  // ── Navigation ──
  const step = (dir) => {
    if (scope === 'day') setDay(d => { const n = new Date(d + 'T00:00:00'); n.setDate(n.getDate() + dir); return toISO(n); });
    else setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + dir * 7); return n; });
  };
  const goToday = () => { setDay(toISO(new Date())); setWeekStart(getMonday(new Date())); };

  const dateLabel = scope === 'day'
    ? new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const STATUS_CHIPS = [
    { key: '',          label: 'All',       n: counts.all },
    { key: 'Waiting',   label: 'Waiting',   n: counts.Waiting },
    { key: 'Scheduled', label: 'Scheduled', n: counts.Scheduled },
    { key: 'Completed', label: 'Completed', n: counts.Completed },
    { key: 'Cancelled', label: 'Cancelled', n: counts.Cancelled },
  ];

  return (
    <div className="animate-fade-in">
      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-dark)', paddingTop: '24px', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Appointments</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>{dateLabel} · {visible.length} shown</p>
          </div>

          {/* Scope chips + date navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: 'var(--bg-muted)', borderRadius: '10px', padding: '3px' }}>
              {['day', 'week'].map(s => (
                <button key={s} onClick={() => setScope(s)} style={{
                  padding: '6px 14px', border: 'none', borderRadius: '8px',
                  background: scope === s ? 'var(--primary)' : 'transparent',
                  color: scope === s ? '#fff' : 'var(--text-muted)',
                  fontWeight: 500, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize',
                }}>{s}</button>
              ))}
            </div>

            <button className="btn btn-outline" style={{ padding: '8px 10px' }} onClick={() => step(-1)} title={scope === 'day' ? 'Previous day' : 'Previous week'}>
              <ChevronLeft size={16} />
            </button>

            {scope === 'day' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: '10px', padding: '6px 12px' }}>
                <Calendar size={15} color="var(--primary)" />
                <input type="date" value={day} onChange={e => e.target.value && setDay(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font-primary)' }} />
              </div>
            )}

            <button
              className="btn btn-outline"
              style={{ padding: '8px 10px' }}
              onClick={() => step(1)}
              title={scope === 'day' ? 'Next day' : 'Next week'}
            >
              <ChevronRight size={16} />
            </button>

            {!isTodaySelected && (
              <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '8px 14px' }} onClick={goToday}>
                <RotateCcw size={14} /> Today
              </button>
            )}

            <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 14px' }} onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Add appointment
            </button>
          </div>
        </div>

        {/* Status chips (day-shape summary) + name search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_CHIPS.map(c => {
            const active = statusFilter === c.key;
            const col = c.key ? STATUS_COLORS[c.key] : null;
            return (
              <button key={c.key || 'all'} onClick={() => setStatusFilter(c.key)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                border: `1.5px solid ${active ? (col?.color || 'var(--primary)') : 'var(--border-color)'}`,
                background: active ? (col?.bg || 'var(--primary-light)') : 'white',
                color: active ? (col?.color || 'var(--primary)') : 'var(--text-muted)',
              }}>
                {c.label}
                <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{c.n}</span>
              </button>
            );
          })}

          <div style={{ position: 'relative', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text" placeholder="Search patient…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 28px 7px 30px', border: `1.5px solid ${search ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: '8px', fontSize: '0.82rem', outline: 'none', background: 'white', width: '190px', color: 'var(--text-main)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ paddingTop: '16px' }}>
        {loading ? (
          <MedicalLoader text="Loading appointments…" />
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <Calendar size={48} color="#e5e7eb" style={{ marginBottom: '14px' }} />
            <div style={{ fontWeight: 700, fontSize: '1.02rem', marginBottom: '6px' }}>No appointments {scope === 'day' ? 'on this day' : 'this week'}</div>
            <div style={{ fontSize: '0.85rem' }}>{statusFilter || search ? 'Try clearing the status chip or search.' : 'Use ◀ ▶ to browse other days.'}</div>
          </div>
        ) : scope === 'day' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortAppts(visible).map(appt => (
              <ApptRow key={appt._id} appt={appt} busy={busyId === appt._id}
                onConsult={onConsult} onDone={onDone} onCancel={onCancel} onReopen={onReopen} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {grouped.map(([d, dayAppts]) => {
              const dObj = new Date(d + 'T00:00:00');
              const isToday = d === toISO(new Date());
              return (
                <div key={d}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Calendar size={13} color="var(--text-muted)" />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                      {dObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    {isToday && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 8px', borderRadius: '20px' }}>Today</span>}
                    <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{dayAppts.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dayAppts.map(appt => (
                      <ApptRow key={appt._id} appt={appt} busy={busyId === appt._id}
                        onConsult={onConsult} onDone={onDone} onCancel={onCancel} onReopen={onReopen} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      <AlertModal
        isOpen={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="Cancel appointment?"
        message={confirmCancel ? `Cancel ${confirmCancel.patientName}'s appointment? You can reopen it afterwards if needed.` : ''}
        type="danger"
        showConfirm
        onConfirm={doCancel}
      />

      {/* Add appointment modal — defaults the date to the currently-viewed day */}
      <AddAppointmentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultDate={day}
        authFetch={authFetch}
        onSaved={(bookedDate) => {
          // Jump to the booked day so the doctor sees the new row right away.
          if (scope === 'day' && bookedDate) setDay(bookedDate);
          fetchAppointments();
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RECEPTIONIST VIEW — Book appointments + today's queue sidebar
// ══════════════════════════════════════════════════════════════════════════════
function ReceptionistView({ queue, onAddAppointment }) {
  const { authFetch } = useAuth();
  const [isEmergency, setIsEmergency]               = useState(false);
  const [patientQuery, setPatientQuery]             = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [searching, setSearching]                   = useState(false);
  const [bookingStatus, setBookingStatus]           = useState('');
  const [bookingMsg, setBookingMsg]                 = useState('');

  const emptyForm = () => ({
    patientId: '', patientName: '', phone: '', age: '', gender: 'Male',
    bloodGroup: '', weight: '', address: '',
    date: new Date().toISOString().split('T')[0], time: '', reason: '',
  });
  const [form, setForm] = useState(emptyForm());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isNewPatient = patientQuery.trim().length > 1 && !form.patientId;

  const searchPatient = async (q) => {
    setPatientQuery(q);
    set('patientName', q);
    set('patientId', '');
    if (q.trim().length < 2) { setPatientSuggestions([]); return; }
    setSearching(true);
    try {
      const r = await authFetch(`${API}/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setPatientSuggestions(Array.isArray(data) ? data : []);
    } catch { setPatientSuggestions([]); }
    finally { setSearching(false); }
  };

  const selectPatient = (p) => {
    setPatientQuery(p.name);
    setForm(f => ({
      ...f,
      patientId:   p._id || p.id,
      patientName: p.name,
      phone:       p.contact || '',
      age:         p.age ? String(p.age) : '',
      gender:      p.gender || 'Male',
      bloodGroup:  p.bloodGroup || '',
      weight:      p.weight ? String(p.weight) : '',
      address:     p.address || '',
    }));
    setPatientSuggestions([]);
  };

  const clearPatient = () => {
    setPatientQuery('');
    setForm(emptyForm());
    setPatientSuggestions([]);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) { setBookingMsg('Please enter a patient name.'); setBookingStatus('error'); return; }

    setBookingStatus('booking');
    setBookingMsg('');

    try {
      let patientId = form.patientId;

      // Step 1: Create patient if new
      if (!patientId) {
        const patRes = await authFetch(`${API}/api/patients`, {
          method: 'POST',
          body: JSON.stringify({
            name:       form.patientName.trim(),
            age:        form.age ? Number(form.age) : 0,
            contact:    form.phone || '',
            gender:     form.gender || 'Male',
            bloodGroup: form.bloodGroup || '',
            weight:     form.weight ? Number(form.weight) : undefined,
            address:    form.address || '',
          }),
        });
        if (!patRes.ok) {
          const err = await patRes.json();
          throw new Error(err.error || 'Failed to create patient record');
        }
        const newPatient = await patRes.json();
        patientId = newPatient._id;
      }

      // Step 2: Book appointment
      const apptRes = await authFetch(`${API}/api/appointments`, {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          patientName: form.patientName.trim(),
          date:       new Date(`${form.date}T${form.time || '09:00'}`),
          time:       form.time || '',
          reason:     form.reason || 'General consultation',
          gender:     form.gender || 'Male',
          age:        form.age ? Number(form.age) : null,
          bloodGroup: form.bloodGroup || '',
          weight:     form.weight ? Number(form.weight) : null,
          address:    form.address || '',
          isEmergency,
        }),
      });
      if (!apptRes.ok) {
        const err = await apptRes.json();
        throw new Error(err.error || 'Failed to book appointment');
      }
      const savedAppt = await apptRes.json();

      onAddAppointment({ ...savedAppt, id: savedAppt._id || Date.now(), phone: form.phone });

      setBookingStatus('booked');
      setBookingMsg(
        form.patientId
          ? `Appointment booked for ${form.patientName}!`
          : `New patient created & appointment booked for ${form.patientName}!`
      );

      setTimeout(() => {
        setBookingStatus('');
        setBookingMsg('');
        setPatientQuery('');
        setForm(emptyForm());
        setIsEmergency(false);
      }, 3500);

    } catch (err) {
      setBookingStatus('error');
      setBookingMsg(err.message || 'Booking failed. Check backend connection.');
    }
  };

  const emergencyRed = '#ef4444';

  return (
    <div className="animate-fade-in resp-panel-row">

      {/* ── Left: Booking form ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="page-title">Book Appointment</h1>
            <p className="page-subtitle">Search existing patient or register a new one</p>
          </div>
        </div>

        <form onSubmit={handleBook}>
          <div className="glass-panel" style={{
            padding: '24px',
            border: isEmergency ? `2px solid ${emergencyRed}` : '1px solid #e5e7eb',
            background: isEmergency ? '#fff5f5' : 'white',
            transition: 'all 0.3s',
          }}>

            {/* Emergency toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 18px', borderRadius: '10px',
              background: isEmergency ? '#fef2f2' : '#f9fafb',
              border: `2px solid ${isEmergency ? emergencyRed : '#e5e7eb'}`,
              marginBottom: '20px', cursor: 'pointer', transition: 'all 0.2s',
            }} onClick={() => setIsEmergency(!isEmergency)}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px',
                border: `2px solid ${isEmergency ? emergencyRed : '#d1d5db'}`,
                background: isEmergency ? emergencyRed : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
              }}>
                {isEmergency && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1.5 6L5 9.5L10.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: isEmergency ? emergencyRed : '#374151', fontSize: '0.95rem' }}>
                  {isEmergency ? 'EMERGENCY CASE — Highlighted in Queue' : 'Mark as Emergency Case'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Patient search with autocomplete */}
              <div className="input-group" style={{ position: 'relative' }}>
                <label className="input-label">
                  Patient Name <span style={{ color: 'red' }}>*</span>
                  {form.patientId && (
                    <span style={{ marginLeft: '10px', fontSize: '0.72rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      ✓ Existing Patient
                    </span>
                  )}
                  {isNewPatient && (
                    <span style={{ marginLeft: '10px', fontSize: '0.72rem', background: '#f0fdf4', color: '#2563eb', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      + New Patient — will be registered
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: '36px', paddingRight: form.patientId ? '36px' : '12px', borderColor: form.patientId ? '#86efac' : isNewPatient ? '#bfdbfe' : undefined }}
                    placeholder="Type to search existing or enter new name..."
                    value={patientQuery}
                    onChange={e => searchPatient(e.target.value)}
                    autoComplete="off"
                  />
                  {searching && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }} />}
                  {form.patientId && !searching && (
                    <button type="button" onClick={clearPatient} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {patientSuggestions.length > 0 && (
                  <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '200px', overflowY: 'auto', padding: '4px', marginTop: '2px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                    {patientSuggestions.map(p => (
                      <div key={p._id || p.id} onClick={() => selectPatient(p)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '1px' }}>
                            {p.age ? `${p.age}y` : ''}{p.age && p.gender ? ' • ' : ''}{p.gender || ''}{p.contact ? ` • ${p.contact}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>Existing</span>
                      </div>
                    ))}
                  </div>
                )}

                {isNewPatient && patientSuggestions.length === 0 && !searching && (
                  <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={12} /> No existing patient found — a new record will be created on booking.
                  </div>
                )}
              </div>

              {/* Patient details — always visible */}
              <div className="resp-grid-3">
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Age</label>
                  <input className="input-field" type="number" placeholder="e.g. 35" min="0" max="120" value={form.age} onChange={e => set('age', e.target.value)} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Gender</label>
                  <CustomSelect value={form.gender} onChange={v => set('gender', v)} width="100%" matchInput
                    options={[
                      { value: 'Male',   label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other',  label: 'Other' },
                    ]} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Phone</label>
                  <input className="input-field" type="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>

              <div className="resp-grid-3">
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Blood Group</label>
                  <CustomSelect value={form.bloodGroup} onChange={v => set('bloodGroup', v)} width="100%" matchInput
                    placeholder="Unknown"
                    options={[
                      { value: '',    label: 'Unknown' },
                      { value: 'A+',  label: 'A+' }, { value: 'A-',  label: 'A-' },
                      { value: 'B+',  label: 'B+' }, { value: 'B-',  label: 'B-' },
                      { value: 'AB+', label: 'AB+' },{ value: 'AB-', label: 'AB-' },
                      { value: 'O+',  label: 'O+' }, { value: 'O-',  label: 'O-' },
                    ]} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Weight (kg)</label>
                  <input className="input-field" type="number" placeholder="e.g. 65" min="0" value={form.weight} onChange={e => set('weight', e.target.value)} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Address</label>
                  <input className="input-field" type="text" placeholder="Patient's address" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
              </div>

              {/* Date + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Date <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input className="input-field" type="date" style={{ paddingLeft: '36px' }} value={form.date} onChange={e => set('date', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Time Slot</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input className="input-field" type="time" style={{ paddingLeft: '36px' }} value={form.time} onChange={e => set('time', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="input-group">
                <label className="input-label">Reason for Visit</label>
                <textarea className="input-field" rows={3} style={{ resize: 'none' }}
                  placeholder="Brief description of the patient's complaint..."
                  value={form.reason} onChange={e => set('reason', e.target.value)} />
              </div>


              {/* Status messages */}
              {bookingStatus === 'booked' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', color: '#16a34a', fontWeight: 600 }}>
                  <CheckCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{bookingMsg}</span>
                </div>
              )}
              {bookingStatus === 'error' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#dc2626', fontWeight: 600 }}>
                  <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                  <span>{bookingMsg}</span>
                </div>
              )}

              {/* Book button */}
              {bookingStatus !== 'booked' && (
                <button type="submit" disabled={bookingStatus === 'booking'} style={{
                  padding: '13px', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem',
                  cursor: bookingStatus === 'booking' ? 'not-allowed' : 'pointer',
                  background: isEmergency ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#16a34a,#15803d)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: isEmergency ? '0 4px 14px rgba(239,68,68,0.4)' : '0 4px 14px rgba(22,163,74,0.3)',
                  opacity: bookingStatus === 'booking' ? 0.7 : 1, transition: 'all 0.2s',
                }}>
                  {bookingStatus === 'booking'
                    ? <><Loader2 size={18} className="animate-spin" /> {form.patientId ? 'Booking...' : 'Creating patient & booking...'}</>
                    : isEmergency
                      ? <><AlertTriangle size={18} /> Book Emergency Appointment</>
                      : <><Plus size={18} /> {form.patientId ? 'Book Appointment' : 'Register & Book Appointment'}</>
                  }
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ── Right: Today's Queue ── */}
      <div className="resp-side-panel-340">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Today's Queue</h2>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{queue.length} patient{queue.length !== 1 ? 's' : ''} scheduled</p>
          </div>
          <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px' }}>
            <Calendar size={32} color="#e5e7eb" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.85rem' }}>No appointments today yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
            {queue.map((appt, i) => (
              <div key={appt._id || appt.id || i} className="glass-panel" style={{
                padding: '14px',
                border: appt.isEmergency ? '2px solid #ef4444' : '1px solid var(--border-color)',
                background: appt.isEmergency ? '#fff5f5' : 'white',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      background: appt.isEmergency ? '#ef4444' : 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    }}>#{appt.tokenNumber ?? (i + 1)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: appt.isEmergency ? '#dc2626' : '#111827' }}>
                        {appt.patientName}
                        {appt.isEmergency && <span style={{ marginLeft: '6px', fontSize: '0.68rem', background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>🚨</span>}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>
                        {appt.time && <><Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />{appt.time} &nbsp;</>}
                        {(appt.phone || appt.contact) && <><Phone size={10} style={{ display: 'inline', marginRight: '3px' }} />{appt.phone || appt.contact}</>}
                      </div>
                      {appt.reason && <div style={{ fontSize: '0.72rem', color: '#374151', marginTop: '3px', fontStyle: 'italic' }}>{appt.reason}</div>}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', flexShrink: 0,
                    background: STATUS_COLORS[appt.status]?.bg || '#f3f4f6',
                    color: STATUS_COLORS[appt.status]?.color || '#374151',
                  }}>{appt.status || 'Waiting'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APPOINTMENTS COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function Appointments() {
  const { role, authFetch } = useAuth();
  const [queue, setQueue] = useState([]);

  // Only needed for Receptionist's "Today's Queue" sidebar
  useEffect(() => {
    if (role === 'Doctor' || role === 'Admin') return;
    authFetch(`${API}/api/appointments/today`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setQueue(data); })
      .catch(() => {});
  }, [role]);

  const handleAddAppointment = (newAppt) => {
    setQueue(prev => [newAppt, ...prev]);
  };

  // Doctor / Admin → week view
  if (role === 'Doctor' || role === 'Admin') {
    return <DoctorView />;
  }

  // Receptionist → booking form + today's queue
  return (
    <div style={{ height: '100%' }}>
      <ReceptionistView queue={queue} onAddAppointment={handleAddAppointment} />
    </div>
  );
}
