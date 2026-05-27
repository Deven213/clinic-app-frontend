import { useState, useEffect, useCallback, useRef } from 'react';
import { Pill, AlertTriangle, Search, PlusCircle, Loader2, RefreshCw, X, Save, IndianRupee, Check, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import MedicalLoader from '../components/MedicalLoader.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function stockStatus(item) {
  if (item.stockQuantity === 0) return 'Out of Stock';
  if (item.stockQuantity <= (item.lowStockThreshold || 10)) return 'Low Stock';
  return 'In Stock';
}

const emptyMedForm = () => ({ medicineName: '', brand: '', formulation: '', stockQuantity: '', price: '', expiryDate: '', lowStockThreshold: 10 });

export default function Inventory() {
  const { authFetch } = useAuth();
  const [stock, setStock]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [medForm, setMedForm]     = useState(emptyMedForm());
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  // qty editing: { [id]: { value, saving, saved } }
  const [qtyEdit, setQtyEdit]     = useState({});
  const saveTimers = useRef({});
  const setF = (k, v) => setMedForm(f => ({ ...f, [k]: v }));

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${API}/api/inventory`);
      const data = await r.json();
      setStock(Array.isArray(data) ? data : []);
    } catch { setStock([]); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Auto-save qty on blur
  const handleQtyBlur = async (item) => {
    const entry = qtyEdit[item._id];
    if (!entry) return;
    const newQty = Number(entry.value);
    if (isNaN(newQty) || newQty < 0 || newQty === item.stockQuantity) {
      setQtyEdit(p => { const n = { ...p }; delete n[item._id]; return n; });
      return;
    }
    setQtyEdit(p => ({ ...p, [item._id]: { ...p[item._id], saving: true } }));
    try {
      await authFetch(`${API}/api/inventory/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ stockQuantity: newQty }),
      });
      // Update local state immediately
      setStock(prev => prev.map(s => s._id === item._id ? { ...s, stockQuantity: newQty } : s));
      setQtyEdit(p => ({ ...p, [item._id]: { value: String(newQty), saving: false, saved: true } }));
      // Clear saved indicator after 1.5s
      saveTimers.current[item._id] = setTimeout(() => {
        setQtyEdit(p => { const n = { ...p }; delete n[item._id]; return n; });
      }, 1500);
    } catch {
      setQtyEdit(p => { const n = { ...p }; delete n[item._id]; return n; });
      alert('Failed to update quantity');
    }
  };

  const handleAddMedicine = async () => {
    setFormError('');
    if (!medForm.medicineName.trim()) { setFormError('Medicine name is required.'); return; }
    if (!medForm.stockQuantity)       { setFormError('Stock quantity is required.'); return; }
    if (!medForm.price)               { setFormError('Price is required.'); return; }
    setSaving(true);
    try {
      const r = await authFetch(`${API}/api/inventory`, {
        method: 'POST',
        body: JSON.stringify({
          ...medForm,
          stockQuantity:    Number(medForm.stockQuantity),
          price:            Number(medForm.price),
          lowStockThreshold: Number(medForm.lowStockThreshold),
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to add medicine.');
      }
      setAddSuccess(true);
      setMedForm(emptyMedForm());
      fetchInventory();
      setTimeout(() => { setShowAdd(false); setAddSuccess(false); }, 1800);
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const filtered = stock.filter(item =>
    item.medicineName?.toLowerCase().includes(search.toLowerCase()) ||
    item.brand?.toLowerCase().includes(search.toLowerCase()) ||
    item.formulation?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems    = stock.length;
  const lowStockCount = stock.filter(i => stockStatus(i) !== 'In Stock').length;
  const stockValue    = stock.reduce((s, i) => s + (i.stockQuantity || 0) * (i.price || 0), 0);

  return (
    <div className="animate-fade-in">

      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine Inventory</h1>
          <p className="page-subtitle">Track stock levels, expiries, and usage for in-clinic dispensing</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', gap: '8px' }} onClick={fetchInventory}><RefreshCw size={16} /> Refresh</button>
          <button className="btn btn-primary" style={{ display: 'flex', gap: '8px' }} onClick={() => setShowAdd(true)}><PlusCircle size={18} /> Add Medicine</button>
        </div>
      </div>

      {/* ── Inline Add Medicine form (Help & Support style) ── */}
      {showAdd && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px', animation: 'fadeSlideDown 0.2s ease-out' }}>
          <div style={{ height: 5, background: 'linear-gradient(90deg,#15803d,#16a34a,#22c55e)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

            {/* Left — form */}
            <div style={{ padding: '24px 28px', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={18} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Add New Medicine</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Fill in details and save to inventory</div>
                </div>
              </div>

              {addSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px 16px' }}>
                  <Check size={20} color="#16a34a" />
                  <span style={{ fontWeight: 700, color: '#15803d' }}>Medicine added successfully!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Medicine Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input className="input-field" value={medForm.medicineName} onChange={e => setF('medicineName', e.target.value)} placeholder="e.g. Triphala Churna" autoFocus />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Brand</label>
                      <input className="input-field" value={medForm.brand} onChange={e => setF('brand', e.target.value)} placeholder="e.g. Baidyanath" />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Formulation</label>
                      <input className="input-field" value={medForm.formulation} onChange={e => setF('formulation', e.target.value)} placeholder="e.g. Churna, Vati" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Stock Qty <span style={{ color: '#ef4444' }}>*</span></label>
                      <input className="input-field" type="number" min="0" value={medForm.stockQuantity} onChange={e => setF('stockQuantity', e.target.value)} placeholder="0" />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Price (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input className="input-field" type="number" min="0" value={medForm.price} onChange={e => setF('price', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Expiry Date</label>
                      <input className="input-field" type="date" value={medForm.expiryDate} onChange={e => setF('expiryDate', e.target.value)} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Low Stock Alert</label>
                      <input className="input-field" type="number" min="1" value={medForm.lowStockThreshold} onChange={e => setF('lowStockThreshold', e.target.value)} />
                    </div>
                  </div>

                  {formError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.84rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={14} /> {formError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                    <button onClick={() => { setShowAdd(false); setMedForm(emptyMedForm()); setFormError(''); }}
                      style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-main)', fontWeight: 500, cursor: 'pointer', fontSize: '0.88rem' }}>
                      Cancel
                    </button>
                    <button onClick={handleAddMedicine} disabled={saving}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Add Medicine</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right — tips */}
            <div style={{ padding: '24px 28px', background: 'var(--bg-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info size={18} color="#1d4ed8" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Quick Guide</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tips for managing inventory</div>
                </div>
              </div>
              {[
                { title: 'Medicine Name', desc: 'Use the exact product name. This is used for prescription autocomplete.' },
                { title: 'Low Stock Alert', desc: 'Set a threshold (default: 10). Rows below this are highlighted in amber.' },
                { title: 'Expiry Date', desc: 'Optional but recommended. Expired items are highlighted in red.' },
                { title: 'Quantity Editing', desc: 'After adding, click any Qty cell in the table to update stock instantly.' },
              ].map(tip => (
                <div key={tip.title} style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '3px solid #dbeafe' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '3px' }}>{tip.title}</div>
                  <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {!showAdd && (
        <div className="dashboard-grid">
          <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="stat-info">
              <div className="stat-label">Total Items Tracked</div>
              <div className="stat-value">{loading ? '—' : totalItems}</div>
            </div>
            <Pill size={40} color="var(--primary)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
          </div>
          <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <div className="stat-info">
              <div className="stat-label">Low / Critical Stock</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{loading ? '—' : lowStockCount}</div>
            </div>
            <AlertTriangle size={40} color="var(--danger)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
          </div>
          <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="stat-info">
              <div className="stat-label">Total Stock Value</div>
              <div className="stat-value">{loading ? '—' : `₹${stockValue.toLocaleString('en-IN')}`}</div>
            </div>
            <IndianRupee size={40} color="var(--warning)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
          </div>
        </div>
      )}

      {!showAdd && (
        <div className="glass-panel">
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-input)' }}>
              <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
              <input
                type="text"
                placeholder="Search by medicine name, brand or formulation..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}><X size={15} /></button>}
            </div>
          </div>

          {loading ? (
            <MedicalLoader text="Loading inventory…" />
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <Pill size={40} color="#e5e7eb" style={{ marginBottom: '10px' }} />
              <div>{search ? 'No medicines match your search.' : 'No medicines in inventory. Add one above.'}</div>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '520px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <table className="data-table" style={{ marginBottom: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-muted)' }}>
                  <tr>
                    <th>Medicine Name & Brand</th>
                    <th>Formulation</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Expiry</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const status  = stockStatus(item);
                    const editing = qtyEdit[item._id];
                    const isLow   = item.stockQuantity <= (item.lowStockThreshold || 10);
                    const isOut   = item.stockQuantity === 0;
                    return (
                      <tr
                        key={item._id}
                        style={{
                          background: isOut ? 'rgba(239,68,68,0.07)' : isLow ? 'rgba(245,158,11,0.08)' : undefined,
                          borderLeft: isOut ? '3px solid #ef4444' : isLow ? '3px solid #f59e0b' : '3px solid transparent',
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isLow && (
                              <AlertTriangle size={14} color={isOut ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0 }} title={isOut ? 'Out of stock!' : 'Low stock'} />
                            )}
                            <div>
                              <div style={{ fontWeight: '600' }}>{item.medicineName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.brand || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{item.formulation || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number" min="0"
                              value={editing ? editing.value : item.stockQuantity}
                              onChange={e => setQtyEdit(p => ({ ...p, [item._id]: { value: e.target.value, saving: false, saved: false } }))}
                              onBlur={() => handleQtyBlur(item)}
                              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                              style={{
                                width: '70px', padding: '4px 8px', borderRadius: '6px',
                                border: editing ? '1.5px solid #16a34a' : `1px solid ${isOut ? '#fecaca' : isLow ? '#fde68a' : 'var(--border-color)'}`,
                                background: editing ? 'white' : isOut ? 'rgba(239,68,68,0.08)' : isLow ? 'rgba(245,158,11,0.08)' : 'var(--bg-input)',
                                color: editing ? '#16a34a' : isOut ? '#ef4444' : isLow ? '#b45309' : 'inherit',
                                fontWeight: 700, fontSize: '0.9rem', outline: 'none', textAlign: 'center',
                              }}
                            />
                            {editing?.saving && <Loader2 size={13} className="animate-spin" color="#16a34a" />}
                            {editing?.saved  && <Check size={13} color="#16a34a" />}
                          </div>
                        </td>
                        <td>₹{item.price?.toLocaleString('en-IN') || '—'}</td>
                        <td style={{ fontSize: '0.85rem', color: item.expiryDate && new Date(item.expiryDate) < new Date() ? '#ef4444' : 'inherit' }}>
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${status === 'In Stock' ? 'badge-success' : status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
