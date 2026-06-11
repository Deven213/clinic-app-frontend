import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Clock, Calendar as CalendarIcon, Search, Loader2, RefreshCw, X,
  AlertCircle, MessageSquare, MessageCircle, CheckCircle2, CalendarClock,
  Phone, Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import MedicalLoader from '../components/MedicalLoader.jsx';

/*
 * Follow-up Management — efficiency-focused redesign.
 *
 * Time-saving changes vs. previous version:
 *   - Status filter chips with live counts (was a dropdown without counts).
 *   - Status column is visible (was hidden — only an "OVERDUE" tag).
 *   - Removed the automatic SMS-app launch on page load (was disruptive);
 *     kept per-row SMS / WhatsApp + an opt-in "Send all today's" button.
 *   - Quick inline actions per row: Reschedule (date picker), Called, Done.
 *   - Auto-refresh every 60s (skips while the rescheduler is open or tab hidden).
 *   - Default filter is "Today" (the highest-priority view).
 *   - When the filter is All, rows are grouped by due bucket
 *     (Overdue, Today, Tomorrow, This week, Later, Done) for fast scanning.
 *
 * Backend is untouched — uses GET /api/followup and PUT /api/followup/:id only.
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_CFG = {
  Pending:   { bg: '#fef9ec', color: '#92400e' },
  Called:    { bg: '#e0f2fe', color: '#075985' },
  Scheduled: { bg: '#e8f5ee', color: '#2d8653' },
  Completed: { bg: '#d4edde', color: '#1a5c38' },
  Overdue:   { bg: '#fee2e2', color: '#991b1b' },
};

// Local-time YYYY-MM-DD (avoids UTC-shift bug)
const ymd = (d) => {
  const x = (d instanceof Date) ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const todayYMD = () => ymd(new Date());

// "in 2d" / "today" / "tomorrow" / "5d overdue"
const relativeDue = (dueIso, status) => {
  if (!dueIso) return '—';
  const diff = Math.round((new Date(ymd(dueIso)).getTime() - new Date(todayYMD()).getTime()) / 86400000);
  if (status === 'Completed') return 'completed';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff > 1)   return `in ${diff}d`;
  return `${-diff}d overdue`;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const cleanPhone = (s) => (s || '').replace(/\D/g, '');
const hasUsablePhone = (s) => { const p = cleanPhone(s); return p && p !== '0000000000'; };

export default function FollowUp() {
  const { authFetch } = useAuth();
  const [followups, setFollowups]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('today'); // today | overdue | week | done | all
  const [updatingId, setUpdatingId] = useState(null);
  const [reschedId, setReschedId]   = useState(null);    // which row has the date picker open
  const reschedOpenRef = useRef(false);
  useEffect(() => { reschedOpenRef.current = !!reschedId; }, [reschedId]);

  // ── Fetch all follow-ups once; filter/sort client-side for instant chips. ──
  const fetchFollowups = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await authFetch(`${API}/api/followup`);
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      const data = await r.json();
      const list = Array.isArray(data) ? data
        : Array.isArray(data.followUps) ? data.followUps
        : Array.isArray(data.followups) ? data.followups
        : Array.isArray(data.data) ? data.data : [];
      setFollowups(list);
    } catch (e) {
      setError(`Could not load follow-ups: ${e.message}.`);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchFollowups(); }, [fetchFollowups]);

  // Auto-refresh every 60s. Pauses while the inline reschedule picker is open
  // (we don't want to clobber the user's interaction) or while the tab is hidden.
  useEffect(() => {
    const id = setInterval(() => {
      if (reschedOpenRef.current) return;
      if (document.visibilityState !== 'visible') return;
      fetchFollowups();
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchFollowups]);

  // ── Mutations (PUT /api/followup/:id) ──
  const updateField = async (id, patch) => {
    setUpdatingId(id);
    try {
      const r = await authFetch(`${API}/api/followup/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
      if (!r.ok) throw new Error();
      fetchFollowups();
    } catch { alert('Failed to update follow-up'); }
    finally { setUpdatingId(null); }
  };
  const markStatus = (id, status) => updateField(id, { status });
  const reschedule = (id, dueDate) => updateField(id, { dueDate, status: 'Pending' });

  // ── SMS / WhatsApp (unchanged behaviour) ──
  const buildMsg = (f) => {
    const date = f.dueDate
      ? new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'today';
    return (
      `Dear ${f.patientName}, this is a reminder from MediCore Clinic. ` +
      `Your follow-up appointment is scheduled for ${date}. ` +
      (f.diagnosis ? `Diagnosis: ${f.diagnosis}. ` : '') +
      `Please visit the clinic at your scheduled time. Thank you.`
    );
  };
  const sendSms = (f) => {
    const phone = cleanPhone(f.contact);
    if (!phone || phone === '0000000000') return alert('No phone number on record.');
    window.location.href = `sms:${phone}?body=${encodeURIComponent(buildMsg(f))}`;
    markStatus(f._id, 'Called');
  };
  const sendWhatsApp = (f) => {
    const phone = cleanPhone(f.contact);
    if (!phone || phone === '0000000000') return alert('No phone number on record.');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildMsg(f))}`, '_blank');
    markStatus(f._id, 'Called');
  };

  // ── Live counts for the chips ──
  const counts = useMemo(() => {
    const c = { all: followups.length, today: 0, overdue: 0, week: 0, done: 0 };
    const t = todayYMD();
    followups.forEach(f => {
      if (f.status === 'Completed') { c.done++; return; }
      if (!f.dueDate) return;
      const d = ymd(f.dueDate);
      if (d < t) c.overdue++;
      else if (d === t) c.today++;
      else {
        const diff = (new Date(d).getTime() - new Date(t).getTime()) / 86400000;
        if (diff <= 7) c.week++;
      }
    });
    return c;
  }, [followups]);

  // ── Apply chip filter + search + sort ──
  const visible = useMemo(() => {
    let list = followups;
    const t = todayYMD();
    if (filter === 'today')   list = list.filter(f => f.status !== 'Completed' && ymd(f.dueDate) === t);
    else if (filter === 'overdue') list = list.filter(f => f.status !== 'Completed' && f.dueDate && ymd(f.dueDate) < t);
    else if (filter === 'week') list = list.filter(f => {
      if (f.status === 'Completed' || !f.dueDate) return false;
      const diff = (new Date(ymd(f.dueDate)).getTime() - new Date(t).getTime()) / 86400000;
      return diff >= 0 && diff <= 7;
    });
    else if (filter === 'done') list = list.filter(f => f.status === 'Completed');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => (f.patientName || '').toLowerCase().includes(q) || (f.diagnosis || '').toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  }, [followups, filter, search]);

  // ── Group by date bucket when "All" — fast scan for scattered dates ──
  const grouped = useMemo(() => {
    if (filter !== 'all') return null;
    const groups = { Overdue: [], Today: [], Tomorrow: [], 'This week': [], Later: [], Done: [] };
    const t = todayYMD();
    visible.forEach(f => {
      if (f.status === 'Completed') { groups.Done.push(f); return; }
      if (!f.dueDate) { groups.Later.push(f); return; }
      const d = ymd(f.dueDate);
      const diff = (new Date(d).getTime() - new Date(t).getTime()) / 86400000;
      if (diff < 0)       groups.Overdue.push(f);
      else if (diff === 0) groups.Today.push(f);
      else if (diff === 1) groups.Tomorrow.push(f);
      else if (diff <= 7)  groups['This week'].push(f);
      else                 groups.Later.push(f);
    });
    return Object.entries(groups).filter(([, arr]) => arr.length > 0);
  }, [visible, filter]);

  // Today's banner — manual "Send all" (no more automatic SMS-app launch).
  const todaysWithPhone = useMemo(
    () => followups.filter(f => f.status !== 'Completed' && ymd(f.dueDate) === todayYMD() && hasUsablePhone(f.contact)),
    [followups]
  );
  const sendAllToday = () => {
    if (todaysWithPhone.length === 0) return;
    if (!window.confirm(`Send SMS reminder to ${todaysWithPhone.length} patient${todaysWithPhone.length === 1 ? '' : 's'} due today?`)) return;
    todaysWithPhone.forEach((f, idx) => {
      setTimeout(() => {
        window.location.href = `sms:${cleanPhone(f.contact)}?body=${encodeURIComponent(buildMsg(f))}`;
        markStatus(f._id, 'Called');
      }, idx * 600);
    });
  };

  // ── Single row ──
  const renderRow = (f) => {
    const isUpdating = updatingId === f._id;
    const t = todayYMD();
    const overdue = f.dueDate && f.status !== 'Completed' && ymd(f.dueDate) < t;
    const effectiveStatus = overdue ? 'Overdue' : (f.status || 'Pending');
    const sc = STATUS_CFG[effectiveStatus] || STATUS_CFG.Pending;
    const phoneOk = hasUsablePhone(f.contact);
    const dueLabel = relativeDue(f.dueDate, f.status);
    const dueColor = (effectiveStatus === 'Overdue') ? '#991b1b' : (effectiveStatus === 'Completed') ? '#6b7280' : 'var(--text-main)';

    return (
      <div key={f._id} style={{
        padding: '12px 14px', border: '1px solid var(--border-color)',
        borderLeft: overdue ? '3px solid #ef4444' : '1px solid var(--border-color)',
        borderRadius: '10px', background: 'white',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--primary-light)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem',
        }}>{(f.patientName || '?').trim().charAt(0).toUpperCase()}</div>

        {/* Patient + diagnosis */}
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{f.patientName}</div>
          {(f.diagnosis || f.notes) && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.diagnosis || f.notes}
            </div>
          )}
        </div>

        {/* Due + status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '130px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: dueColor, fontWeight: 600 }}>
            <Clock size={12} /> {fmtDate(f.dueDate)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{dueLabel}</span>
        </div>

        {/* Status badge */}
        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 9px', borderRadius: '6px', background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
          {effectiveStatus}
        </span>

        {/* Contact (clickable tel link) */}
        <div style={{ minWidth: '120px', fontSize: '0.8rem' }}>
          {phoneOk ? (
            <a href={`tel:${cleanPhone(f.contact)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600 }}>
              <Phone size={12} /> {f.contact}
            </a>
          ) : (
            <span style={{ color: '#cbd5e1' }}>no phone</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
          {isUpdating ? (
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
          ) : (
            <>
              {/* SMS */}
              <button
                title={phoneOk ? 'Send SMS reminder' : 'No phone number on record'}
                disabled={!phoneOk}
                onClick={() => sendSms(f)}
                style={{ padding: '6px 10px', fontSize: '0.76rem', borderRadius: '7px', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: phoneOk ? 'pointer' : 'not-allowed', background: phoneOk ? '#0284c7' : '#e5e7eb', color: phoneOk ? 'white' : '#9ca3af' }}
              >
                <MessageSquare size={12} /> SMS
              </button>

              {/* WhatsApp */}
              <button
                title={phoneOk ? 'Send WhatsApp message' : 'No phone number on record'}
                disabled={!phoneOk}
                onClick={() => sendWhatsApp(f)}
                style={{ padding: '6px 10px', fontSize: '0.76rem', borderRadius: '7px', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: phoneOk ? 'pointer' : 'not-allowed', background: phoneOk ? '#25D366' : '#e5e7eb', color: phoneOk ? 'white' : '#9ca3af' }}
              >
                <MessageCircle size={12} /> WA
              </button>

              {/* Reschedule (inline date input toggles in-place) */}
              {reschedId === f._id ? (
                <input
                  type="date"
                  defaultValue={f.dueDate ? ymd(f.dueDate) : todayYMD()}
                  min={todayYMD()}
                  autoFocus
                  onBlur={() => setReschedId(null)}
                  onChange={(e) => { if (e.target.value) { reschedule(f._id, e.target.value); setReschedId(null); } }}
                  style={{ padding: '5px 8px', fontSize: '0.78rem', border: '1.5px solid var(--primary)', borderRadius: '7px', outline: 'none' }}
                />
              ) : (
                <button
                  title="Reschedule"
                  onClick={() => setReschedId(f._id)}
                  className="btn btn-outline"
                  style={{ padding: '5px 9px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CalendarClock size={13} /> Reschedule
                </button>
              )}

              {/* Mark Called (only if not yet) */}
              {f.status !== 'Called' && f.status !== 'Completed' && (
                <button
                  title="Mark as Called"
                  onClick={() => markStatus(f._id, 'Called')}
                  className="btn btn-outline"
                  style={{ padding: '5px 9px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Phone size={12} /> Called
                </button>
              )}

              {/* Mark Done (only if not yet) */}
              {f.status !== 'Completed' && (
                <button
                  title="Mark as Completed"
                  onClick={() => markStatus(f._id, 'Completed')}
                  className="btn btn-primary"
                  style={{ padding: '5px 11px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CheckCircle2 size={12} /> Done
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Chip definitions
  const CHIPS = [
    { key: 'today',   label: 'Today',     n: counts.today,   color: '#16a34a', bg: '#f0fdf4' },
    { key: 'overdue', label: 'Overdue',   n: counts.overdue, color: '#ef4444', bg: '#fef2f2' },
    { key: 'week',    label: 'This week', n: counts.week,    color: '#1d4ed8', bg: '#eff6ff' },
    { key: 'done',    label: 'Done',      n: counts.done,    color: '#1a5c38', bg: '#d4edde' },
    { key: 'all',     label: 'All',       n: counts.all,     color: 'var(--primary)', bg: 'var(--primary-light)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-up Management</h1>
          <p className="page-subtitle">Track returning patients and send reminders</p>
        </div>
        <button className="btn btn-outline" style={{ display: 'flex', gap: '6px' }} onClick={fetchFollowups}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '0.84rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#ef4444" /> {error}
        </div>
      )}

      {/* Today's banner — opt-in "Send all" instead of automatic SMS launching. */}
      {counts.today > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '1px solid #86efac', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={17} color="#16a34a" />
            <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.92rem' }}>
              {counts.today} follow-up{counts.today === 1 ? '' : 's'} due today
              {todaysWithPhone.length > 0 && <span style={{ fontWeight: 500 }}> · {todaysWithPhone.length} with phone</span>}
            </span>
          </div>
          {todaysWithPhone.length > 0 && (
            <button
              onClick={sendAllToday}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <Send size={13} /> Send all SMS ({todaysWithPhone.length})
            </button>
          )}
        </div>
      )}

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        {/* Chips + search */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          {CHIPS.map(c => {
            const active = filter === c.key;
            return (
              <button key={c.key} onClick={() => setFilter(c.key)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                border: `1.5px solid ${active ? c.color : 'var(--border-color)'}`,
                background: active ? c.bg : 'white', color: active ? c.color : 'var(--text-muted)',
              }}>
                {c.label} <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{c.n}</span>
              </button>
            );
          })}

          <div style={{ position: 'relative', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text" placeholder="Search name or diagnosis…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 28px 7px 30px', border: `1.5px solid ${search ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: '8px', fontSize: '0.82rem', outline: 'none', background: 'white', width: '220px', color: 'var(--text-main)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <MedicalLoader text="Loading follow-ups…" />
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <CalendarIcon size={40} color="#e5e7eb" style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {search ? 'No results match your search.'
                : filter === 'today'   ? 'No follow-ups due today.'
                : filter === 'overdue' ? 'No overdue follow-ups — you\'re clear.'
                : filter === 'week'    ? 'Nothing scheduled for the next 7 days.'
                : filter === 'done'    ? 'No completed follow-ups yet.'
                : 'No follow-ups yet.'}
            </div>
            {filter === 'all' && !search && (
              <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>
                Follow-ups are created automatically when you save a prescription with a follow-up date.
              </div>
            )}
          </div>
        ) : grouped ? (
          // Grouped view (filter = All)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {grouped.map(([label, arr]) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 9px', borderRadius: '20px', fontWeight: 600 }}>{arr.length}</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {arr.map(renderRow)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat view (filter = Today / Overdue / Week / Done)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visible.map(renderRow)}
          </div>
        )}
      </div>
    </div>
  );
}
