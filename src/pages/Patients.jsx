import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Phone, History, Loader2, X, User,
  Stethoscope, CalendarClock,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initial = (name) => (name || '?').trim().charAt(0).toUpperCase();
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
const daysAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
};

// ─── Quick "add patient" modal (name + phone + age + gender) ─────────────────
function AddPatientModal({ open, onClose, onCreated, authFetch }) {
  const [form, setForm] = useState({ name: '', phone: '', age: '', gender: 'Male' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setForm({ name: '', phone: '', age: '', gender: 'Male' }); setErr(''); } }, [open]);

  const submit = async () => {
    if (!form.name.trim()) { setErr('Patient name is required.'); return; }
    setSaving(true); setErr('');
    try {
      const r = await authFetch(`${API}/api/patients`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          contact: form.phone.trim(),
          age: form.age ? Number(form.age) : 0,
          gender: form.gender,
        }),
      });
      if (!r.ok) throw new Error();
      const created = await r.json();
      onCreated(created);
      onClose();
    } catch { setErr('Could not create patient. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add patient"
      icon={<Plus size={20} color="var(--primary)" />}
      maxWidth="460px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add patient
          </button>
        </>
      }
    >
      {err && <div style={{ marginBottom: '14px', color: '#dc2626', fontSize: '0.84rem', fontWeight: 600 }}>{err}</div>}
      <div className="input-group">
        <label className="input-label">Name *</label>
        <input className="input-field" value={form.name} autoFocus onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="input-group">
          <label className="input-label">Phone</label>
          <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Contact number" />
        </div>
        <div className="input-group">
          <label className="input-label">Age</label>
          <input className="input-field" type="number" min="0" max="120" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="e.g. 35" />
        </div>
      </div>
      <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">Gender</label>
        <select className="input-field" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
          <option>Male</option><option>Female</option><option>Other</option>
        </select>
      </div>
    </Modal>
  );
}

export default function Patients() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy]         = useState('recent'); // 'recent' | 'name'
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [addOpen, setAddOpen]       = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API}/api/patients?limit=500`);
      const data = await res.json();
      const list = Array.isArray(data.patients) ? data.patients : Array.isArray(data) ? data : [];
      setPatients(list);
    } catch {
      setError('Could not load patients. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // last-visit timestamp helper (lastPrescription is returned by the backend)
  const lastVisitTs = (p) => p.lastPrescription?.createdAt || p.createdAt || null;

  // Filter by name / phone / last diagnosis, then sort.
  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = patients.filter(p =>
      !q ||
      p.name?.toLowerCase().includes(q) ||
      (p.contact || p.phone || '').toLowerCase().includes(q) ||
      (p.lastPrescription?.diagnosis || '').toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return new Date(lastVisitTs(b) || 0) - new Date(lastVisitTs(a) || 0); // recent first
    });
    return list;
  }, [patients, searchTerm, sortBy]);

  // "New this week" stat
  const newThisWeek = useMemo(() => {
    const wk = Date.now() - 7 * 86400000;
    return patients.filter(p => p.createdAt && new Date(p.createdAt).getTime() >= wk).length;
  }, [patients]);

  // One-click: start a prescription pre-filled for this patient.
  const newRx = (p) =>
    navigate('/prescription', { state: { appointment: { patientId: p._id || p.id, patientName: p.name, reason: '' } } });

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - var(--header-height) - 28px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, paddingTop: '24px', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Patient Records</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              {patients.length} patient{patients.length === 1 ? '' : 's'}
              {newThisWeek > 0 && <> · <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{newThisWeek} new this week</span></>}
            </p>
          </div>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setAddOpen(true)}>
            <Plus size={18} /> Add patient
          </button>
        </div>

        {/* Toolbar: search + sort chips */}
        <div className="glass-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
            <Search size={17} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, phone, or diagnosis…"
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.9rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                <X size={16} />
              </button>
            )}
          </div>
          <div style={{ display: 'inline-flex', background: 'var(--bg-muted)', borderRadius: '10px', padding: '3px', flexShrink: 0 }}>
            {[{ k: 'recent', l: 'Recent' }, { k: 'name', l: 'Name' }].map(o => (
              <button key={o.k} onClick={() => setSortBy(o.k)} style={{
                padding: '6px 14px', border: 'none', borderRadius: '8px',
                background: sortBy === o.k ? 'var(--primary)' : 'transparent',
                color: sortBy === o.k ? '#fff' : 'var(--text-muted)',
                fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer',
              }}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', margin: '12px 0', fontSize: '0.84rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table fills remaining height; scrolls internally */}
      <div className="glass-panel" style={{ marginTop: '14px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div className="table-container" style={{ overflowY: 'auto', flex: 1 }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-card)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>Patient</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>Contact</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>Last visit</th>
                <th style={{ textAlign: 'right', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4"><MedicalLoader text="Opening patient records…" /></td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <User size={40} color="#e5e7eb" style={{ marginBottom: '10px' }} />
                    <div style={{ fontWeight: 600 }}>{searchTerm ? 'No patients match your search.' : 'No patients yet.'}</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '6px' }}>
                      {searchTerm ? 'Try a different name, phone, or diagnosis.' : 'Add a patient or register one when booking an appointment.'}
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map(p => {
                  const lastRx = p.lastPrescription;
                  const visited = fmtDate(lastRx?.createdAt);
                  const ago = daysAgo(lastRx?.createdAt);
                  return (
                    <tr key={p._id || p.id}>
                      {/* Patient: avatar + name + age/gender */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                            background: 'var(--primary-light)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem',
                          }}>{initial(p.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {p.age ? `${p.age} yrs` : ''}{p.age && p.gender ? ' · ' : ''}{p.gender || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem' }}>
                          <Phone size={13} color="var(--text-muted)" /> {p.contact || p.phone || '—'}
                        </div>
                      </td>

                      {/* Last visit + diagnosis (from lastPrescription — no extra fetch) */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                        {visited ? (
                          <div>
                            <div style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CalendarClock size={13} color="var(--text-muted)" /> {visited}
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({ago})</span>
                            </div>
                            {lastRx?.diagnosis && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '2px' }}>{lastRx.diagnosis}</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>No visits yet</span>
                        )}
                      </td>

                      {/* Actions: New Rx (primary) + History */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => newRx(p)}>
                            <Stethoscope size={13} /> New Rx
                          </button>
                          <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => navigate(`/patients/${p._id || p.id}/history`)}>
                            <History size={13} /> History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && visible.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            {visible.length} patient{visible.length !== 1 ? 's' : ''} shown
          </div>
        )}
      </div>

      <AddPatientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        authFetch={authFetch}
        onCreated={() => fetchPatients()}
      />
    </div>
  );
}
