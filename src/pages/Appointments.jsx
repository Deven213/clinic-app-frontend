import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, AlertTriangle, Plus, X,
  Search, User, Phone, FileText,
  Loader2, CheckCircle, Activity,
  ChevronLeft, ChevronRight, XCircle,
  Filter, RefreshCw,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
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

const API = 'https://medical-project-h6yc.vercel.app';

const toISO = (d) => d.toISOString().split('T')[0];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ══════════════════════════════════════════════════════════════════════════════
// DOCTOR VIEW — Week view with day sections, filters, cancel
// ══════════════════════════════════════════════════════════════════════════════
function DoctorView() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [weekStart, setWeekStart]       = useState(() => getMonday(new Date()));
  const [filterDate, setFilterDate]     = useState(() => toISO(new Date()));
  const [filterStatus, setFilterStatus] = useState('');

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let url;
      if (filterDate) {
        url = `${API}/api/appointments?startDate=${filterDate}&endDate=${filterDate}`;
      } else {
        url = `${API}/api/appointments?startDate=${toISO(weekStart)}&endDate=${toISO(weekEnd)}`;
      }
      const r = await authFetch(url);
      const data = await r.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : Array.isArray(data) ? data : []);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  }, [authFetch, weekStart, weekEnd, filterDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Group appointments by ISO date string
  const grouped = useMemo(() => {
    const groups = {};
    const filtered = filterStatus
      ? appointments.filter(a => a.status === filterStatus)
      : appointments;
    filtered.forEach(a => {
      const day = new Date(a.date).toISOString().split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(a);
    });
    const today = toISO(new Date());
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === today) return -1;
      if (b === today) return 1;
      return a.localeCompare(b);
    });
  }, [appointments, filterStatus]);

  const totalShown = useMemo(() => grouped.reduce((acc, [, arr]) => acc + arr.length, 0), [grouped]);

  // Actions
  const handleCancel = async (id) => {
    try {
      await authFetch(`${API}/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      fetchAppointments();
    } catch { alert('Failed to cancel appointment.'); }
  };

  // Week navigation
  const prevWeek = () => { setFilterDate(''); setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; }); };
  const nextWeek = () => { setFilterDate(''); setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; }); };
  const goThisWeek = () => { setFilterDate(''); setFilterStatus(''); setWeekStart(getMonday(new Date())); };

  const isThisWeek = !filterDate && toISO(weekStart) === toISO(getMonday(new Date()));

  const weekLabel = filterDate
    ? new Date(filterDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="animate-fade-in">
      {/* ── Sticky Header: title + week nav + filter bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-dark)', paddingTop: '24px', paddingBottom: '12px' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Appointments</h1>
            <p className="page-subtitle">{weekLabel} &nbsp;•&nbsp; {totalShown} appointment{totalShown !== 1 ? 's' : ''}</p>
          </div>

          {/* Week navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-outline" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }} onClick={prevWeek}>
              <ChevronLeft size={16} /> Prev Week
            </button>
            <button
              onClick={goThisWeek}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                border: `2px solid ${isThisWeek ? 'var(--primary)' : 'var(--border-color)'}`,
                background: isThisWeek ? 'var(--primary)' : 'white',
                color: isThisWeek ? 'white' : 'var(--text-main)',
                transition: 'all 0.2s',
              }}
            >
              This Week
            </button>
            <button className="btn btn-outline" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }} onClick={nextWeek}>
              Next Week <ChevronRight size={16} />
            </button>
            <button className="btn btn-outline" style={{ padding: '8px 10px', display: 'flex' }} onClick={fetchAppointments} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
          <Filter size={14} /> Filters
        </div>

        {/* Single date picker */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px',
          border: `1.5px solid ${filterDate ? '#86efac' : 'var(--border-color)'}`,
          borderRadius: '8px', background: filterDate ? '#f0fdf4' : 'var(--bg-muted)', cursor: 'pointer',
        }}>
          <Calendar size={14} color={filterDate ? '#16a34a' : '#9ca3af'} />
          <input
            type="date"
            value={filterDate}
            onChange={e => { setFilterDate(e.target.value); }}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.83rem', color: filterDate ? '#16a34a' : 'var(--text-main)', cursor: 'pointer', fontWeight: filterDate ? 600 : 400 }}
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="All Statuses"
          minWidth="150px"
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Waiting',   label: 'Waiting',   color: '#92400e', bg: '#fef9ec' },
            { value: 'Scheduled', label: 'Scheduled', color: '#1d4ed8', bg: '#eff6ff' },
            { value: 'Completed', label: 'Completed', color: '#16a34a', bg: '#f0fdf4' },
            { value: 'Cancelled', label: 'Cancelled', color: '#6b7280', bg: '#f9fafb' },
          ]}
        />

        {(filterDate || filterStatus) && (
          <button
            onClick={() => { setFilterDate(''); setFilterStatus(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <X size={13} /> Clear
          </button>
        )}

        {/* Active filter tags */}
        {filterDate && (
          <span style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
            {new Date(filterDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {filterStatus && (
          <span style={{ background: STATUS_COLORS[filterStatus]?.bg, color: STATUS_COLORS[filterStatus]?.color, padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
            {filterStatus}
          </span>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {totalShown} result{totalShown !== 1 ? 's' : ''}
        </span>
        </div>
      </div>{/* end sticky header */}

      {/* ── Content — only this scrolls ── */}
      <div style={{ paddingTop: '16px' }}>
      {loading ? (
        <MedicalLoader text="Loading appointments…" />
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#9ca3af' }}>
          <Calendar size={52} color="#e5e7eb" style={{ marginBottom: '14px' }} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>No appointments found</div>
          <div style={{ fontSize: '0.85rem' }}>
            {filterDate || filterStatus ? 'Try clearing the filters.' : 'No appointments scheduled for this week.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {grouped.map(([day, dayAppts]) => {
            const dateObj = new Date(day + 'T00:00:00');
            const isToday = day === toISO(new Date());

            return (
              <div key={day}>
                {/* Day section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Calendar size={13} color="var(--text-muted)" />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                      {dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 8px', borderRadius: '20px' }}>
                        Today
                      </span>
                    )}
                  </div>
                  <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                    {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Appointment cards for this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dayAppts.map(appt => {
                    const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.Waiting;
                    const isDone = appt.status === 'Completed' || appt.status === 'completed';
                    const isCancelled = appt.status === 'Cancelled' || appt.status === 'cancelled';
                    return (
                    <div
                      key={appt._id}
                      style={{
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px', padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: '14px',
                        opacity: isCancelled ? 0.7 : 1,
                        transition: 'box-shadow 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      {/* Token */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                        background: 'var(--bg-muted)', border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem',
                      }}>
                        #{appt.tokenNumber}
                      </div>

                      {/* Patient info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {appt.patientName}
                          </span>
                          {appt.isEmergency && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', color: '#991b1b', background: '#fee2e2', padding: '1px 7px', borderRadius: '4px' }}>
                              EMERGENCY
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {appt.time && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> {appt.time}</span>}
                          {appt.reason && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FileText size={11} /> {appt.reason}</span>}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        padding: '4px 12px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
                        background: sc.bg, color: sc.color,
                      }}>
                        {appt.status || 'Waiting'}
                      </span>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {!isDone && !isCancelled && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '7px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => navigate('/prescription', { state: { appointment: appt } })}
                          >
                            <Activity size={13} /> Consult
                          </button>
                        )}
                        {isDone && (
                          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Done
                          </span>
                        )}
                        {!isDone && !isCancelled && (
                          <button
                            className="btn btn-outline"
                            onClick={() => handleCancel(appt._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '7px 12px' }}
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>{/* end scrollable content */}
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
