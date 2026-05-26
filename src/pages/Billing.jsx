import { useState, useEffect, useCallback, useRef } from 'react';
import {
  IndianRupee, FileText, CheckCircle, Search,
  Loader2, RefreshCw, AlertCircle, Plus, X, Trash2, User,
  QrCode, MessageCircle, Copy, CheckCheck, Wifi,
} from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = 'https://medical-project-h6yc.vercel.app';
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const emptyItem = () => ({ id: Date.now() + Math.random(), description: '', amount: '' });

// ── UPI payment helpers ───────────────────────────────────────────────────────
const CLINIC_UPI  = 'clinic@upi';
const CLINIC_NAME = 'MediCore Clinic';
const buildUpiLink = (amount, ref) =>
  `upi://pay?pa=${encodeURIComponent(CLINIC_UPI)}&pn=${encodeURIComponent(CLINIC_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Invoice ' + (ref || ''))}`;
const buildQrUrl = (amount, ref) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=15803d&bgcolor=ffffff&data=${encodeURIComponent(buildUpiLink(amount, ref))}`;

// ── Payment QR Modal ──────────────────────────────────────────────────────────
function PaymentQRModal({ bill, onClose, onPaid, authFetch }) {
  const [paid, setPaid]     = useState(bill.paidStatus);
  const [copied, setCopied] = useState(false);
  const intervalRef         = useRef(null);

  const upiLink = buildUpiLink(bill.totalAmount, bill.invoiceNumber || bill._id?.slice(-6));
  const qrUrl   = buildQrUrl(bill.totalAmount, bill.invoiceNumber || bill._id?.slice(-6));
  const waMsg   = `Hello! Please pay ₹${bill.totalAmount} for your invoice at ${CLINIC_NAME}.\n\nScan & Pay via UPI:\n${upiLink}`;

  useEffect(() => {
    if (paid) return;
    intervalRef.current = setInterval(async () => {
      try {
        const r = await authFetch(`${API}/api/billing/${bill._id}`);
        if (!r.ok) return;
        const data = (await r.json()).bill || (await r.json());
        if (data.paidStatus) { setPaid(true); onPaid(); clearInterval(intervalRef.current); }
      } catch {}
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [paid]);

  const copyLink = () => {
    navigator.clipboard.writeText(upiLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'white', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

      {/* ── Full-page header bar ── */}
      <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '20px 32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>UPI Payment</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '2px' }}>{bill.patientName} · Invoice {bill.invoiceNumber || bill._id?.slice(-6).toUpperCase()}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', padding: '8px 18px', cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <X size={16} /> Close
        </button>
      </div>

      {/* ── Full-page body ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'linear-gradient(160deg,#f0fdf4 0%,#ffffff 100%)' }}>
        {paid ? (
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#f0fdf4', border: '4px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={52} color="#16a34a" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d', marginBottom: '8px' }}>Payment Received!</div>
            <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '32px' }}>{fmt(bill.totalAmount)} collected from {bill.patientName}</div>
            <button onClick={onClose} style={{ padding: '14px 48px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
              Back to Billing
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '560px', textAlign: 'center' }}>
            {/* Amount */}
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#16a34a', marginBottom: '4px', lineHeight: 1 }}>{fmt(bill.totalAmount)}</div>
            <div style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '32px' }}>Scan to pay via GPay, PhonePe, Paytm or any UPI app</div>

            {/* QR Code — large */}
            <div style={{ display: 'inline-block', padding: '18px', background: 'white', border: '3px solid #bbf7d0', borderRadius: '24px', marginBottom: '28px', boxShadow: '0 8px 32px rgba(22,163,74,0.15)' }}>
              <img src={qrUrl} alt="UPI QR Code" width={280} height={280} style={{ display: 'block', borderRadius: '10px' }} />
            </div>

            {/* Waiting indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.88rem', color: '#16a34a', marginBottom: '28px', background: '#f0fdf4', padding: '10px 20px', borderRadius: '24px', width: 'fit-content', margin: '0 auto 28px', border: '1px solid #bbf7d0' }}>
              <Wifi size={15} className="animate-pulse" /> Waiting for payment confirmation…
            </div>

            {/* UPI ID */}
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '28px' }}>UPI ID: <strong style={{ color: '#374151' }}>{CLINIC_UPI}</strong> · Status auto-updates every 5s</div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={copyLink} style={{ flex: '1 1 180px', maxWidth: '240px', padding: '13px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: copied ? '#f0fdf4' : 'white', color: copied ? '#16a34a' : '#374151', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {copied ? <><CheckCheck size={17} /> Copied!</> : <><Copy size={17} /> Copy UPI Link</>}
              </button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, '_blank')} style={{ flex: '1 1 180px', maxWidth: '240px', padding: '13px 20px', borderRadius: '12px', border: 'none', background: '#25D366', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
                <MessageCircle size={17} /> Send WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline Create Receipt Form ───────────────────────────────────────────────
function CreateReceiptForm({ onClose, onSaved, authFetch }) {
  const [patientQuery, setPatientQuery]       = useState('');
  const [patientSuggestions, setSuggestions]  = useState([]);
  const [searching, setSearching]             = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const isNewPatient = patientQuery.trim().length > 1 && !selectedPatient;

  const [items, setItems]               = useState([emptyItem()]);
  const [billType, setBillType]         = useState('Consultation');
  const [paymentMethod, setPayMethod]   = useState('Cash');
  const [paidNow, setPaidNow]           = useState(false);
  const [notes, setNotes]               = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);

  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const searchPatient = async (q) => {
    setPatientQuery(q);
    setSelectedPatient(null);
    if (q.trim().length < 2) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const r = await authFetch(`${API}/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch { setSuggestions([]); }
    finally { setSearching(false); }
  };

  const selectPatient = (p) => {
    setPatientQuery(p.name);
    setSelectedPatient({ _id: p._id || p.id, name: p.name });
    setSuggestions([]);
  };

  const clearPatient = () => {
    setPatientQuery('');
    setSelectedPatient(null);
    setSuggestions([]);
  };

  const updateItem = (id, field, val) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const addItem    = () => setItems(prev => [...prev, emptyItem()]);

  const handleCreate = async () => {
    if (!patientQuery.trim()) { setError('Please enter a patient name.'); return; }
    if (totalAmount <= 0)     { setError('Add at least one item with a valid amount.'); return; }

    setSaving(true); setError('');
    try {
      let patientId   = selectedPatient?._id || null;
      let patientName = selectedPatient?.name || patientQuery.trim();

      if (!patientId) {
        const cr = await authFetch(`${API}/api/patients`, {
          method: 'POST',
          body: JSON.stringify({ name: patientName, gender: 'Male' }),
        });
        if (!cr.ok) {
          const e = await cr.json();
          throw new Error(e.error || 'Failed to create patient');
        }
        const np = await cr.json();
        patientId   = np._id;
        patientName = np.name;
      }

      const validItems = items
        .filter(i => i.description.trim() && Number(i.amount) > 0)
        .map(i => ({ description: i.description.trim(), amount: Number(i.amount) }));

      const br = await authFetch(`${API}/api/billing`, {
        method: 'POST',
        body: JSON.stringify({
          patientId, patientName, items: validItems, totalAmount, billType,
          paymentMethod: paidNow ? paymentMethod : undefined,
          paidStatus: paidNow, notes: notes.trim(),
        }),
      });

      if (!br.ok) {
        const e = await br.json();
        throw new Error(e.error || 'Failed to create receipt');
      }

      setSuccess(true);
      setTimeout(() => { onSaved(); }, 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      animation: 'fadeSlideDown 0.28s ease',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(22,163,74,0.12)',
      border: '1.5px solid #bbf7d0',
      marginBottom: '28px',
      overflow: 'hidden',
    }}>
      {/* Accent bar */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)', flexShrink: 0 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>

        {/* ── form ───────────────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 32px', overflowY: 'auto', maxHeight: '78vh' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IndianRupee size={20} color="#16a34a" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Create Receipt</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Generate invoice and record payment</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            ><X size={16} /></button>
          </div>

          {success ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0fdf4', border: '3px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={32} color="#16a34a" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>Receipt Created!</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>The invoice has been saved successfully.</div>
              </div>
            </div>
          ) : (
            <>
              {/* PATIENT */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Patient</div>
              <div style={{ marginBottom: '22px' }}>
                <div className="input-group" style={{ position: 'relative', margin: 0 }}>
                  <label className="input-label">
                    Patient Name <span style={{ color: 'red' }}>*</span>
                    {selectedPatient && (
                      <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>✓ Existing</span>
                    )}
                    {isNewPatient && (
                      <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>+ New — will be registered</span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '34px', paddingRight: selectedPatient ? '34px' : '12px', borderColor: selectedPatient ? '#86efac' : isNewPatient ? '#bfdbfe' : undefined }}
                      placeholder="Search existing or type new name..."
                      value={patientQuery}
                      onChange={e => searchPatient(e.target.value)}
                      autoComplete="off"
                    />
                    {searching && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }} />}
                    {selectedPatient && !searching && (
                      <button type="button" onClick={clearPatient} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  {patientSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '180px', overflowY: 'auto', padding: '4px', marginTop: '2px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                      {patientSuggestions.map(p => (
                        <div key={p._id || p.id} onClick={() => selectPatient(p)}
                          style={{ padding: '9px 12px', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.name}</div>
                            <div style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: '1px' }}>
                              {p.age ? `${p.age}y` : ''}{p.age && p.gender ? ' • ' : ''}{p.gender || ''}{p.contact ? ` • ${p.contact}` : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>Existing</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isNewPatient && patientSuggestions.length === 0 && !searching && (
                    <div style={{ marginTop: '5px', fontSize: '0.76rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> No existing patient — a new record will be created automatically.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 22px' }} />

              {/* BILL DETAILS */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Bill Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Bill Type</label>
                  <CustomSelect value={billType} onChange={setBillType} width="100%" matchInput
                    options={[
                      { value: 'Consultation', label: 'Consultation' },
                      { value: 'Medicine',     label: 'Medicine' },
                      { value: 'Procedure',    label: 'Procedure' },
                      { value: 'Other',        label: 'Other' },
                    ]} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Payment Method</label>
                  <CustomSelect value={paymentMethod} onChange={setPayMethod} width="100%" matchInput
                    options={[
                      { value: 'Cash',  label: 'Cash' },
                      { value: 'UPI',   label: 'UPI' },
                      { value: 'Card',  label: 'Card' },
                      { value: 'Other', label: 'Other' },
                    ]} />
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 22px' }} />

              {/* LINE ITEMS */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Line Items</div>
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {items.map((item, idx) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 36px', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="input-field"
                        placeholder={`Item ${idx + 1} description`}
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      />
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem' }}>₹</span>
                        <input
                          className="input-field"
                          type="number" min="0" placeholder="0"
                          value={item.amount}
                          onChange={e => updateItem(item.id, 'amount', e.target.value)}
                          style={{ padding: '8px 12px 8px 24px', fontSize: '0.85rem' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => items.length > 1 && removeItem(item.id)}
                        disabled={items.length === 1}
                        style={{ background: 'none', border: 'none', cursor: items.length === 1 ? 'not-allowed' : 'pointer', color: items.length === 1 ? '#d1d5db' : '#ef4444', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <button type="button" className="btn btn-outline" style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={addItem}>
                    <Plus size={13} /> Add Item
                  </button>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>Total: {fmt(totalAmount)}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 22px' }} />

              {/* PAYMENT STATUS */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Payment Status</div>
              <div
                onClick={() => setPaidNow(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  borderRadius: '10px', cursor: 'pointer', marginBottom: '22px',
                  background: paidNow ? '#f0fdf4' : 'white',
                  border: `1.5px solid ${paidNow ? '#86efac' : '#e2e8f0'}`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                  border: `2px solid ${paidNow ? '#16a34a' : '#d1d5db'}`,
                  background: paidNow ? '#16a34a' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}>
                  {paidNow && <svg width="11" height="11" viewBox="0 0 12 12"><path d="M1.5 6L5 9.5L10.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: paidNow ? '#16a34a' : '#374151' }}>
                  Mark as Paid Now
                  {paidNow && <span style={{ marginLeft: '8px', fontWeight: 400, color: '#64748b', fontSize: '0.85rem' }}>via {paymentMethod}</span>}
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 22px' }} />

              {/* NOTES */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Notes</div>
              <div className="input-group" style={{ margin: '0 0 22px' }}>
                <textarea
                  className="input-field" rows={2} style={{ resize: 'none', fontSize: '0.85rem' }}
                  placeholder="Any additional notes..."
                  value={notes} onChange={e => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onClose} disabled={saving}
                  style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate} disabled={saving}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(22,163,74,0.25)', cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
                    : <><IndianRupee size={16} /> Create Receipt</>
                  }
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Main Billing Page ────────────────────────────────────────────────────────
export default function Billing() {
  const { authFetch } = useAuth();
  const [bills, setBills]            = useState([]);
  const [totalRevenue, setTotalRev]  = useState(0);
  const [pendingRevenue, setPending] = useState(0);
  const [totalCount, setTotalCount]  = useState(0);
  const [search, setSearch]          = useState('');
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState('');
  const [markingId, setMarkingId]    = useState(null);
  const [showCreate, setShowCreate]  = useState(false);
  const [paymentBill, setPaymentBill] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await authFetch(`${API}/api/billing?limit=100`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setBills(data.bills || []);
      setTotalRev(data.totalRevenue || 0);
      setPending(data.pendingRevenue || 0);
      setTotalCount(data.total || 0);
    } catch {
      setError('Could not load billing data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const markPaid = async (id) => {
    setMarkingId(id);
    try {
      await authFetch(`${API}/api/billing/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ paymentMethod: 'Cash' }) });
      fetchBills();
    } catch { alert('Failed to mark as paid'); }
    finally { setMarkingId(null); }
  };

  const filtered = bills.filter(b =>
    (b.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.patientName   || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">

      {paymentBill && (
        <PaymentQRModal
          bill={paymentBill}
          authFetch={authFetch}
          onClose={() => setPaymentBill(null)}
          onPaid={() => { fetchBills(); }}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Payments</h1>
          <p className="page-subtitle">Manage invoices, collect payments, and track revenue</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchBills}>
            <RefreshCw size={16} /> Refresh
          </button>
          {!showCreate && (
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Receipt
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '0.84rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#f59e0b" /> {error}
        </div>
      )}

      {/* ── Inline Create Form ──────────────────────────────────────────────── */}
      {showCreate && (
        <CreateReceiptForm
          authFetch={authFetch}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchBills(); }}
        />
      )}

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      {!showCreate && (
        <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Revenue Collected</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {loading ? '—' : fmt(totalRevenue)}
            </div>
          </div>
          <IndianRupee size={40} color="var(--success)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Payments</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              {loading ? '—' : fmt(pendingRevenue)}
            </div>
          </div>
          <FileText size={40} color="var(--warning)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Invoices Generated</div>
            <div className="stat-value">{loading ? '—' : totalCount}</div>
          </div>
          <CheckCircle size={40} color="var(--text-main)" style={{ position: 'absolute', right: '20px', opacity: 0.1 }} />
        </div>
        </div>
      )}

      {/* ── Bills table ────────────────────────────────────────────────────── */}
      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-input)' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search by Invoice ID or Patient Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <MedicalLoader text="Loading billing records…" />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <FileText size={40} color="#e5e7eb" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>
              {search ? 'No invoices match your search.' : 'No invoices yet.'}
            </div>
            {!search && (
              <button className="btn btn-primary" style={{ marginTop: '10px', display: 'inline-flex', gap: '6px' }} onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Create First Receipt
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Bill Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <tr key={bill._id}>
                    <td><span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{bill.invoiceNumber || bill._id?.slice(-6).toUpperCase()}</span></td>
                    <td>{bill.patientName}</td>
                    <td>{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td>{bill.billType || 'Consultation'}</td>
                    <td style={{ fontWeight: '600' }}>{fmt(bill.totalAmount)}</td>
                    <td>
                      <span className={`badge ${bill.paidStatus ? 'badge-success' : 'badge-warning'}`}>
                        {bill.paidStatus ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {!bill.paidStatus && (
                          <>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                              onClick={() => markPaid(bill._id)}
                              disabled={markingId === bill._id}
                            >
                              {markingId === bill._id ? <Loader2 size={12} className="animate-spin" /> : '✓ Cash'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
