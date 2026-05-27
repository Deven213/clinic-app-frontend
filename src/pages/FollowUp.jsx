import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Calendar as CalendarIcon, Search, User, Loader2, RefreshCw, X, AlertCircle, MessageSquare, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import MedicalLoader from '../components/MedicalLoader.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_CLASS = {
  Pending:   'badge-warning',
  Called:    'badge-success',
  Overdue:   'badge-danger',
  Scheduled: 'badge-primary',
  Completed: 'badge-success',
};

export default function FollowUp() {
  const { authFetch } = useAuth();
  const [followups, setFollowups]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [filter, setFilter]                 = useState('all');
  const [updatingId, setUpdatingId]         = useState(null);
  const [todayFollowups, setTodayFollowups] = useState([]);
  const autoSmsTriggered                    = useRef(false);

  const buildSmsMsg = (f) => {
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
    const phone = (f.contact || '').replace(/\D/g, '');
    if (!phone || phone === '0000000000') {
      alert('No phone number available for this patient.');
      return;
    }
    window.location.href = `sms:${phone}?body=${encodeURIComponent(buildSmsMsg(f))}`;
  };

  const fetchFollowups = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let url = `${API}/api/followup`;
      if (filter === 'today')   url += '?filter=today';
      if (filter === '7days')   url += '?filter=week';
      if (filter === 'overdue') url += '?filter=overdue';

      const r = await authFetch(url);
      if (!r.ok) throw new Error(`API returned ${r.status}`);

      const data = await r.json();
      const list = Array.isArray(data) ? data :
                   Array.isArray(data.followUps)  ? data.followUps :
                   Array.isArray(data.followups)  ? data.followups :
                   Array.isArray(data.data)        ? data.data : [];

      setFollowups(list);

      const todayStr = new Date().toISOString().split('T')[0];
      const todays   = list.filter(f => {
        const d = f.dueDate;
        return d && new Date(d).toISOString().split('T')[0] === todayStr
          && f.status !== 'Called' && f.status !== 'Completed';
      });
      setTodayFollowups(todays);
    } catch (e) {
      setError(`Could not load follow-ups: ${e.message}. Check your internet connection or try refreshing.`);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filter]);

  useEffect(() => { fetchFollowups(); }, [fetchFollowups]);

  // Auto-send SMS once per session for today's follow-up patients with a phone number
  useEffect(() => {
    if (autoSmsTriggered.current) return;
    if (todayFollowups.length === 0) return;

    const withPhone = todayFollowups.filter(f => {
      const p = (f.contact || '').replace(/\D/g, '');
      return p && p !== '0000000000';
    });
    if (withPhone.length === 0) return;

    autoSmsTriggered.current = true;

    // Open SMS for first due patient; for subsequent ones open after a short delay
    withPhone.forEach((f, idx) => {
      setTimeout(() => {
        const phone = (f.contact || '').replace(/\D/g, '');
        window.location.href = `sms:${phone}?body=${encodeURIComponent(buildSmsMsg(f))}`;
      }, idx * 600);
    });
  }, [todayFollowups]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await authFetch(`${API}/api/followup/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      fetchFollowups();
    } catch { alert('Failed to update status'); }
    finally { setUpdatingId(null); }
  };

  const filtered = followups.filter(f =>
    (f.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.diagnosis   || '').toLowerCase().includes(search.toLowerCase())
  );

  const isOverdue = (dateStr) => new Date(dateStr) < new Date();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-up Management</h1>
          <p className="page-subtitle">Track returning patients and send SMS reminders</p>
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

      {/* Today's follow-up alert banner */}
      {todayFollowups.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '1px solid #86efac', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <CalendarIcon size={18} color="#16a34a" />
            <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>
              {todayFollowups.length} follow-up{todayFollowups.length > 1 ? 's' : ''} due today — SMS reminders sent automatically
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {todayFollowups.map(f => (
              <div key={f._id} style={{ background: 'white', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a2e25' }}>{f.patientName}</span>
                {f.contact && f.contact !== '0000000000' && (
                  <button
                    onClick={() => sendSms(f)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <MessageSquare size={13} /> Send SMS
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-input)', position: 'relative' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search by patient name or diagnosis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                <X size={15} />
              </button>
            )}
          </div>
          <CustomSelect
            value={filter}
            onChange={setFilter}
            minWidth="180px"
            matchInput
            options={[
              { value: 'all',     label: 'All Follow-ups' },
              { value: 'today',   label: 'Due Today',   color: '#16a34a', bg: '#f0fdf4' },
              { value: '7days',   label: 'Next 7 Days', color: '#1d4ed8', bg: '#eff6ff' },
              { value: 'overdue', label: 'Overdue',     color: '#ef4444', bg: '#fef2f2' },
            ]}
          />
        </div>

        {loading ? (
          <MedicalLoader text="Loading follow-ups…" />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <CalendarIcon size={40} color="#e5e7eb" style={{ marginBottom: '10px' }} />
            <div>
              {search
                ? 'No results match your search.'
                : filter !== 'all'
                ? 'No follow-ups for this filter.'
                : 'No follow-ups yet.'}
            </div>
            {!search && filter === 'all' && (
              <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>
                Follow-ups are created automatically when you save a prescription with a follow-up date.
              </div>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Diagnosis</th>
                <th>Due Date</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => {
                const due     = f.dueDate;
                const overdue = due && isOverdue(due) && f.status !== 'Called' && f.status !== 'Completed';
                const hasPhone = f.contact && f.contact !== '0000000000';
                return (
                  <tr key={f._id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{f.patientName}</span>
                      </div>
                    </td>
                    <td>{f.diagnosis || f.notes || '—'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: overdue ? 'var(--danger)' : 'inherit' }}>
                        <Clock size={14} />
                        {due ? new Date(due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {overdue && (
                          <span style={{ fontSize: '0.7rem', background: '#fef2f2', color: '#ef4444', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                            OVERDUE
                          </span>
                        )}
                      </span>
                    </td>
                    <td>{hasPhone ? f.contact : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* SMS button */}
                        <button
                          style={{
                            padding: '5px 10px', fontSize: '0.78rem',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: hasPhone ? '#16a34a' : '#e5e7eb',
                            color: hasPhone ? 'white' : '#9ca3af',
                            border: 'none', borderRadius: '7px',
                            cursor: hasPhone ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            if (!hasPhone) return;
                            sendSms(f);
                            updateStatus(f._id, 'Called');
                          }}
                          disabled={updatingId === f._id || !hasPhone}
                          title={hasPhone ? 'Send SMS reminder' : 'No phone number on record'}
                        >
                          {updatingId === f._id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <MessageSquare size={12} />
                          }
                          SMS
                        </button>

                        {/* WhatsApp button */}
                        <button
                          style={{
                            padding: '5px 10px', fontSize: '0.78rem',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: hasPhone ? '#25D366' : '#e5e7eb',
                            color: hasPhone ? 'white' : '#9ca3af',
                            border: 'none', borderRadius: '7px',
                            cursor: hasPhone ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            if (!hasPhone) return;
                            const phone = (f.contact || '').replace(/\D/g, '');
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildSmsMsg(f))}`, '_blank');
                            updateStatus(f._id, 'Called');
                          }}
                          disabled={!hasPhone}
                          title={hasPhone ? 'Send WhatsApp message' : 'No phone number on record'}
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </button>

                        {f.status !== 'Completed' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                            onClick={() => updateStatus(f._id, 'Completed')}
                            disabled={updatingId === f._id}
                          >
                            ✓ Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
