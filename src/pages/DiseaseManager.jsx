import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Search, Edit, Plus, Loader2, RefreshCw, X, Save,
  ChevronDown, ChevronUp, Pill, Stethoscope, Activity, Check, AlertTriangle,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = 'https://medical-project-h6yc.vercel.app';

/* ── Dosha styles ─────────────────────────────────────────────────────────── */
const DOSHA_STYLE = {
  'Pitta':       { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444' },
  'Vata':        { bg: 'rgba(59,130,246,0.1)',   color: '#3b82f6' },
  'Kapha':       { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b' },
  'Tridosha':    { bg: 'rgba(22,163,74,0.1)',    color: '#16a34a' },
  'Vata-Pitta':  { bg: 'rgba(139,92,246,0.1)',   color: '#8b5cf6' },
  'Kapha-Vata':  { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b' },
  'Pitta-Vata':  { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444' },
  'Kapha-Pitta': { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b' },
  'Pitta-Kapha': { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444' },
};
const doshaStyle = (d) => DOSHA_STYLE[d] || { bg: 'rgba(22,163,74,0.1)', color: '#16a34a' };

/* ── Disease Card ─────────────────────────────────────────────────────────── */
function DiseaseCard({ d, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const ds = doshaStyle(d.mainDosha);

  return (
    <div
      style={{
        padding: '20px', background: 'var(--bg-card)', borderRadius: '16px',
        border: '1px solid var(--border-color)', transition: 'box-shadow 0.2s',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={16} color="#16a34a" />
            </div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{d.name}</h3>
          </div>
          {d.localName && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: '40px' }}>{d.localName}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
          {d.mainDosha && (
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: ds.bg, color: ds.color }}>
              {d.mainDosha}
            </span>
          )}
          <button
            onClick={() => onEdit(d)}
            style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.querySelector('svg').style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.querySelector('svg').style.color = 'var(--text-muted)'; }}
          >
            <Edit size={14} color="var(--text-muted)" />
          </button>
        </div>
      </div>

      {d.type && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Activity size={13} /> {d.type} System
        </div>
      )}

      {d.commonMedicines?.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Pill size={12} /> Standard Medicines
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {d.commonMedicines.map(m => (
              <span key={m} style={{ padding: '3px 10px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '20px', fontSize: '0.78rem', color: '#16a34a', fontWeight: 500 }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {(d.pathya || d.apathya) && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', padding: 0, alignSelf: 'flex-start' }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'Show'} Pathya / Apathya
          </button>
          {expanded && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
              {d.pathya && (
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Check size={13} /> Pathya (Do's)
                  </div>
                  <div style={{ color: '#374151', lineHeight: 1.5 }}>{d.pathya}</div>
                </div>
              )}
              {d.apathya && (
                <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px', border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <X size={13} /> Apathya (Don'ts)
                  </div>
                  <div style={{ color: '#374151', lineHeight: 1.5 }}>{d.apathya}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Disease Modal (Add / Edit) — same pattern as Inventory & Billing ─────── */
function DiseaseModal({ disease, onClose, onSave }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState(
    disease
      ? { ...disease }
      : { name: '', localName: '', type: '', mainDosha: '', commonMedicines: [], pathya: '', apathya: '', description: '' }
  );
  const [medInput, setMedInput]           = useState('');
  const [medSuggestions, setMedSuggestions] = useState([]);
  const [showMedSug, setShowMedSug]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const medRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchMedSuggestions = async (q) => {
    if (!q || q.length < 2) { setMedSuggestions([]); setShowMedSug(false); return; }
    try {
      const res  = await authFetch(`${API}/api/inventory/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setMedSuggestions(Array.isArray(data) ? data : []);
      setShowMedSug(true);
    } catch { setMedSuggestions([]); }
  };

  const addMedFromSuggestion = (name) => {
    if (name && !form.commonMedicines.includes(name)) set('commonMedicines', [...form.commonMedicines, name]);
    setMedInput(''); setMedSuggestions([]); setShowMedSug(false);
    medRef.current?.focus();
  };

  const addMedManual = () => {
    const v = medInput.trim();
    if (v && !form.commonMedicines.includes(v)) set('commonMedicines', [...form.commonMedicines, v]);
    setMedInput(''); setMedSuggestions([]); setShowMedSug(false);
  };

  const removeMed = (m) => set('commonMedicines', form.commonMedicines.filter(x => x !== m));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Disease name is required.'); return; }
    setError(''); setSaving(true);
    try {
      const method = disease ? 'PUT' : 'POST';
      const url    = disease ? `${API}/api/diseases/${disease._id}` : `${API}/api/diseases`;
      const r = await authFetch(url, { method, body: JSON.stringify(form) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Save failed'); }
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const ds = doshaStyle(form.mainDosha);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
      backdropFilter: 'blur(8px)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        width: '680px', maxHeight: '90vh', background: 'white', borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Top accent bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #16a34a, #22c55e)', flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 28px', background: 'white', borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Stethoscope size={18} color="#16a34a" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {disease ? 'Edit Disease Protocol' : 'Add New Disease Protocol'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                {disease ? 'Update Ayurvedic treatment protocol' : 'Define medicines, pathya and apathya'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          ><X size={16} /></button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Group: DISEASE IDENTITY */}
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            Disease Identity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Disease Name (Ayurvedic) <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Amlapitta" autoFocus />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Local / Common Name</label>
              <input className="input-field" value={form.localName} onChange={e => set('localName', e.target.value)} placeholder="e.g. Hyperacidity / GERD" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">System / Type</label>
                <input className="input-field" value={form.type} onChange={e => set('type', e.target.value)} placeholder="e.g. Digestive, Respiratory" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Main Dosha</label>
                <select className="input-field" value={form.mainDosha} onChange={e => set('mainDosha', e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="">Select Dosha</option>
                  {['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Kapha-Vata', 'Pitta-Kapha', 'Tridosha'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {form.mainDosha && (
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: ds.bg, color: ds.color }}>{form.mainDosha}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 24px' }} />

          {/* Group: STANDARD MEDICINES */}
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            Standard Medicines
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={medRef}
                    className="input-field"
                    value={medInput}
                    onChange={e => { setMedInput(e.target.value); fetchMedSuggestions(e.target.value); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMedManual(); } }}
                    onBlur={() => setTimeout(() => setShowMedSug(false), 160)}
                    placeholder="Search inventory or type medicine name..."
                    autoComplete="off"
                  />
                  {showMedSug && medSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
                      background: 'white', border: '1px solid #e2e8f0',
                      borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      marginTop: '4px', maxHeight: '180px', overflowY: 'auto',
                    }}>
                      {medSuggestions.map(s => {
                        const qty = s.stockQuantity ?? 0;
                        const alreadyAdded = form.commonMedicines.includes(s.medicineName);
                        const stockColor = qty === 0 ? '#ef4444' : qty <= (s.lowStockThreshold || 10) ? '#f59e0b' : '#16a34a';
                        return (
                          <div
                            key={s._id}
                            onMouseDown={() => addMedFromSuggestion(s.medicineName)}
                            style={{
                              padding: '9px 14px', cursor: alreadyAdded ? 'default' : 'pointer',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              borderBottom: '1px solid #f1f5f9', opacity: alreadyAdded ? 0.5 : 1,
                            }}
                            onMouseEnter={e => !alreadyAdded && (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {s.medicineName}
                                {alreadyAdded && <span style={{ fontSize: '0.7rem', color: '#16a34a', background: 'rgba(22,163,74,0.1)', padding: '1px 6px', borderRadius: '8px' }}>Added</span>}
                              </div>
                              {s.formulation && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>{s.formulation}{s.brand ? ` · ${s.brand}` : ''}</div>}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: stockColor, background: `${stockColor}18`, padding: '2px 8px', borderRadius: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {qty === 0 ? 'Out' : `${qty} left`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn-secondary" onClick={addMedManual} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <Plus size={15} /> Add
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '6px 0 0' }}>
                Type to search from inventory · Press Enter or click Add to add manually
              </p>
            </div>
            {form.commonMedicines.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {form.commonMedicines.map(m => (
                  <span key={m} style={{ padding: '5px 12px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '20px', fontSize: '0.8rem', color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Pill size={11} /> {m}
                    <button onClick={() => removeMed(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 24px' }} />

          {/* Group: DIETARY GUIDELINES */}
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            Dietary Guidelines
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ borderLeft: '2px solid #bbf7d0', padding: '12px', borderRadius: '8px', background: '#f0fdf4' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>✓ Pathya — Do's</label>
              <textarea className="input-field" rows={4} value={form.pathya} onChange={e => set('pathya', e.target.value)}
                placeholder="e.g. Light easily digestible food, rest..."
                style={{ resize: 'vertical', marginBottom: 0 }} />
            </div>
            <div style={{ borderLeft: '2px solid #fecaca', padding: '12px', borderRadius: '8px', background: '#fef2f2' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>✗ Apathya — Don'ts</label>
              <textarea className="input-field" rows={4} value={form.apathya} onChange={e => set('apathya', e.target.value)}
                placeholder="e.g. Spicy food, heavy meals, cold drinks..."
                style={{ resize: 'vertical', marginBottom: 0 }} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '16px 28px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(22,163,74,0.25)', cursor: 'pointer' }}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {disease ? 'Update Protocol' : 'Save Protocol'}</>}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function DiseaseManager() {
  const { authFetch } = useAuth();
  const [diseases, setDiseases]     = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [showModal, setShowModal]   = useState(false);

  const fetchDiseases = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${API}/api/diseases`);
      const data = await r.json();
      setDiseases(Array.isArray(data) ? data : []);
    } catch { setDiseases([]); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { fetchDiseases(); }, [fetchDiseases]);

  // Lock background scroll when modal is open
  useEffect(() => {
    const el = document.querySelector('.main-content');
    if (el) el.style.overflow = showModal ? 'hidden' : '';
    return () => { if (el) el.style.overflow = ''; };
  }, [showModal]);

  const filtered = diseases.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.localName?.toLowerCase().includes(search.toLowerCase()) ||
    d.type?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd   = () => { setEditTarget(null); setShowModal(true); };
  const openEdit  = (d) => { setEditTarget(d); setShowModal(true); };
  const closeModal  = () => { setShowModal(false); setEditTarget(null); };
  const handleSaved = () => { closeModal(); fetchDiseases(); };

  return (
    <div className="animate-fade-in">
      {showModal && <DiseaseModal disease={editTarget} onClose={closeModal} onSave={handleSaved} />}

      {/* Sticky top: title + search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-dark)', paddingTop: '24px', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Smart Disease Manager</h1>
            <p className="page-subtitle">Configure protocols, pathya-apathya, and standard medicines</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchDiseases}>
              <RefreshCw size={15} />
            </button>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openAdd}>
              <Plus size={18} /> Add Disease
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by disease name, local name, or body system..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.9rem' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <MedicalLoader text="Loading disease protocols…" />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
          <BookOpen size={48} color="#e5e7eb" style={{ marginBottom: '14px' }} />
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>No diseases found</div>
          <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
            {search ? 'Try a different search term.' : 'Click "Add Disease" to create a new protocol.'}
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', paddingTop: '16px' }}>
            {filtered.length} protocol{filtered.length !== 1 ? 's' : ''} found
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
            {filtered.map(d => <DiseaseCard key={d._id} d={d} onEdit={openEdit} />)}
          </div>
        </>
      )}
    </div>
  );
}
