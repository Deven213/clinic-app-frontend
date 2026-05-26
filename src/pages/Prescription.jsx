import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Save, Send, Pill, Plus, X, Loader2, Download, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import Modal from '../components/Modal.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = 'https://medical-project-h6yc.vercel.app';

const emptyForm = () => ({
  name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: '', weight: '', diagnosis: '', followUpDate: '',
});

const emptyMed = () => ({ id: Date.now() + Math.random(), name: '', timing: '', anupan: '', days: 7 });

export default function Prescription() {
  const { authFetch, userName } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false, title: '', message: '', type: 'info', showConfirm: false, onConfirm: null,
  });

  const showAlert = (title, message, type = 'info') =>
    setModal({ isOpen: true, title, message, type, showConfirm: false, onConfirm: null });

  const showConfirm = (title, message, onConfirm, type = 'warning') =>
    setModal({ isOpen: true, title, message, type, showConfirm: true, onConfirm });

  const closeModal = () => setModal(m => ({ ...m, isOpen: false }));

  // ── Pre-fill from Appointments "Consult" navigation ─────────────────────────
  const [linkedAppointment, setLinkedAppointment] = useState(null);
  const [patientData, setPatientData] = useState(emptyForm());
  const [medicines, setMedicines]     = useState([emptyMed()]);
  const [medicineSuggestions, setMedicineSuggestions] = useState({});
  const [pathya, setPathya]           = useState('');
  const [apathya, setApathya]         = useState('');
  const [notes, setNotes]             = useState('');

  // ── Patient name autocomplete ────────────────────────────────────────────────
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [showPatientSug, setShowPatientSug]         = useState(false);

  // ── Diagnosis / Disease autocomplete ────────────────────────────────────────
  const [diseaseSuggestions, setDiseaseSuggestions] = useState([]);
  const [showDiseaseSug, setShowDiseaseSug]         = useState(false);

  const fetchDiseaseSuggestions = async (query) => {
    if (!query || query.length < 2) { setDiseaseSuggestions([]); setShowDiseaseSug(false); return; }
    try {
      const res  = await authFetch(`${API}/api/diseases?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setDiseaseSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
      setShowDiseaseSug(true);
    } catch { setDiseaseSuggestions([]); }
  };

  const selectDisease = (d) => {
    setPatientData(p => ({ ...p, diagnosis: d.name }));
    // Auto-fill pathya/apathya if empty
    if (!pathya && d.pathya)   setPathya(d.pathya);
    if (!apathya && d.apathya) setApathya(d.apathya);
    // Pre-fill medicines from disease protocol if the list is empty/blank
    if (d.commonMedicines?.length > 0) {
      const hasContent = medicines.some(m => m.name.trim());
      if (!hasContent) {
        setMedicines(d.commonMedicines.map((name, i) => ({ id: Date.now() + i, name, timing: '', anupan: '', days: 7 })));
      }
    }
    setDiseaseSuggestions([]);
    setShowDiseaseSug(false);
  };

  const fetchPatientSuggestions = async (query) => {
    if (!query || query.length < 2) { setPatientSuggestions([]); setShowPatientSug(false); return; }
    try {
      const res  = await authFetch(`${API}/api/patients/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPatientSuggestions(Array.isArray(data) ? data : []);
      setShowPatientSug(true);
    } catch { setPatientSuggestions([]); }
  };

  const selectPatient = (p) => {
    // Spread prev so follow-up date (and any other typed fields) are preserved
    setPatientData(prev => ({
      ...prev,
      name:       p.name       || '',
      age:        p.age        ? String(p.age) : '',
      gender:     p.gender     || 'Male',
      phone:      p.contact    || p.phone || '',
      address:    p.address    || '',
      bloodGroup: p.bloodGroup || '',
      weight:     p.weight     ? String(p.weight) : '',
      diagnosis:  prev.diagnosis,
    }));
    setLinkedAppointment(prev => prev ? prev : { patientId: p._id });
    setPatientSuggestions([]);
    setShowPatientSug(false);
  };

  // Load patient details when coming from Appointments page
  useEffect(() => {
    const appt = location.state?.appointment;
    if (!appt) return;

    setLinkedAppointment(appt);
    const base = {
      name: appt.patientName || '',
      age: '', gender: 'Male', phone: '', address: '',
      diagnosis: appt.reason || '',
    };

    // Try to load full patient details from DB
    if (appt.patientId) {
      authFetch(`${API}/api/patients/${appt.patientId}`)
        .then(r => r.ok ? r.json() : null)
        .then(p => {
          if (p) {
            // Spread prev to preserve followUpDate already typed by user
            setPatientData(prev => ({
              ...prev,
              ...base,
              age:        p.age        ? String(p.age) : '',
              gender:     p.gender     || 'Male',
              phone:      p.contact    || '',
              address:    p.address    || '',
              bloodGroup: p.bloodGroup || '',
              weight:     p.weight     ? String(p.weight) : '',
            }));
          } else {
            setPatientData(prev => ({ ...prev, ...base }));
          }
        })
        .catch(() => setPatientData(base));
    } else {
      setPatientData(base);
    }

    // Clear the router state so refresh doesn't re-trigger
    window.history.replaceState({}, '');
  }, []);

  // ── Medicine helpers ─────────────────────────────────────────────────────────
  const addMedicine = () => {
    const maxId = medicines.length ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
    setMedicines(prev => [...prev, { id: maxId, name: '', timing: '', anupan: '', days: 7 }]);
  };

  const removeMedicine = (id) => setMedicines(prev => prev.filter(m => m.id !== id));

  const updateMedicine = (id, field, value) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    if (field === 'name') fetchMedicineSuggestions(id, value);
  };

  const fetchMedicineSuggestions = async (rowId, query) => {
    if (!query || query.length < 2) {
      setMedicineSuggestions(prev => ({ ...prev, [rowId]: [] }));
      return;
    }
    try {
      // Try dedicated search endpoint first, fall back to full inventory list
      const res = await authFetch(`${API}/api/inventory/search?q=${encodeURIComponent(query)}`);
      let data = await res.json();
      // Handle both array and { items: [] } / { medicines: [] } shapes
      if (!Array.isArray(data)) data = data.items || data.medicines || data.data || [];
      // If search endpoint returned nothing, filter from local stock via full list
      if (data.length === 0) {
        const r2 = await authFetch(`${API}/api/inventory`);
        const all = await r2.json();
        const list = Array.isArray(all) ? all : [];
        data = list.filter(m =>
          m.medicineName?.toLowerCase().includes(query.toLowerCase()) ||
          m.brand?.toLowerCase().includes(query.toLowerCase()) ||
          m.formulation?.toLowerCase().includes(query.toLowerCase())
        );
      }
      setMedicineSuggestions(prev => ({ ...prev, [rowId]: data.slice(0, 10) }));
    } catch {
      setMedicineSuggestions(prev => ({ ...prev, [rowId]: [] }));
    }
  };

  const selectMedicine = (id, medicineName, inventoryId) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, name: medicineName, inventoryId } : m));
    setMedicineSuggestions(prev => ({ ...prev, [id]: [] }));
  };

  // ── Save prescription ────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!patientData.name.trim() || !medicines.some(m => m.name.trim())) {
      showAlert('Missing Information', 'Please enter patient name and at least one medicine.', 'warning');
      return;
    }

    showConfirm(
      'Save Prescription',
      `Do you want to save this prescription for ${patientData.name}?`,
      async () => {
        closeModal();
        setLoading(true);
        try {
          let patientId = linkedAppointment?.patientId || null;

          // Search or create patient if not linked
          if (!patientId) {
            const sr = await authFetch(`${API}/api/patients/search?q=${encodeURIComponent(patientData.name)}`);
            const results = await sr.json();
            const existing = results.find(p => p.name.toLowerCase() === patientData.name.toLowerCase());
            if (existing) {
              patientId = existing._id;
            } else {
              const cr = await authFetch(`${API}/api/patients`, {
                method: 'POST',
                body: JSON.stringify({
                  name:       patientData.name,
                  age:        patientData.age ? Number(patientData.age) : 0,
                  contact:    patientData.phone || '',
                  gender:     patientData.gender || 'Male',
                  address:    patientData.address || '',
                  bloodGroup: patientData.bloodGroup || '',
                  weight:     patientData.weight ? Number(patientData.weight) : 0,
                }),
              });
              const np = await cr.json();
              if (np.error) throw new Error(np.error);
              patientId = np._id;
            }
          }

          const pr = await authFetch(`${API}/api/prescriptions`, {
            method: 'POST',
            body: JSON.stringify({
              patientId,
              patientName: patientData.name,
              diagnosis:   patientData.diagnosis,
              medicines,
              pathya, apathya, notes,
            }),
          });

          if (pr.ok) {
            // Auto-reduce inventory stock for each prescribed medicine from inventory
            const inventoryMeds = medicines.filter(m => m.inventoryId && m.name.trim());
            await Promise.allSettled(
              inventoryMeds.map(m =>
                authFetch(`${API}/api/inventory/${m.inventoryId}/consume`, {
                  method: 'PATCH',
                  body: JSON.stringify({ quantity: 1 }),
                })
              )
            );

            // Mark appointment as Completed
            if (linkedAppointment?._id) {
              // Came via "Consult" button — update that specific appointment
              await authFetch(`${API}/api/appointments/${linkedAppointment._id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Completed' }),
              });
            } else if (patientId) {
              // Direct prescription entry — find today's Waiting/Scheduled appointment for this patient
              const today = new Date().toISOString().split('T')[0];
              try {
                const ar = await authFetch(
                  `${API}/api/appointments?patientId=${patientId}&startDate=${today}&endDate=${today}`
                );
                const { appointments: todayAppts = [] } = await ar.json();
                const pending = todayAppts.find(a =>
                  a.status === 'Waiting' || a.status === 'Scheduled'
                );
                if (pending) {
                  await authFetch(`${API}/api/appointments/${pending._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'Completed' }),
                  });
                }
              } catch { /* non-critical — prescription still saved */ }
            }
            // Auto-create follow-up if a date was provided
            let followUpNote = '';
            if (patientData.followUpDate) {
              try {
                const contact = patientData.phone?.trim() || '0000000000';
                const fuRes = await authFetch(`${API}/api/followup`, {
                  method: 'POST',
                  body: JSON.stringify({
                    patientId,
                    patientName: patientData.name,
                    contact,
                    diagnosis: patientData.diagnosis || '',
                    dueDate:   patientData.followUpDate,
                    status:    'Pending',
                  }),
                });
                if (fuRes.ok) {
                  const fuDate = new Date(patientData.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  followUpNote = `\nFollow-up scheduled on ${fuDate}.`;
                } else {
                  const fuErr = await fuRes.json().catch(() => ({}));
                  console.error('Follow-up creation failed:', fuRes.status, fuErr);
                  followUpNote = `\n⚠️ Follow-up could not be saved: ${fuErr.error || `Server error ${fuRes.status}`}`;
                }
              } catch (e) {
                console.error('Follow-up creation error:', e);
                followUpNote = '\n⚠️ Follow-up could not be saved (network error).';
              }
            }

            showAlert(
              'Prescription Saved',
              `Prescription saved successfully for ${patientData.name}.${followUpNote}`,
              followUpNote.startsWith('\n⚠️') ? 'warning' : 'success'
            );
          } else {
            const err = await pr.json();
            showAlert('Error', `Error saving prescription: ${err.error || 'Unknown error'}`, 'danger');
          }
        } catch (err) {
          showAlert('Error', `Failed to process prescription: ${err.message}`, 'danger');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ── Download PDF ─────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const element = document.getElementById('prescription-preview');
    html2pdf().set({
      margin: 0,
      filename: `${patientData.name || 'Patient'}_Prescription.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(element).save();
  };

  // ── New Prescription ─────────────────────────────────────────────────────────
  const handleNew = () => {
    showConfirm(
      'New Prescription',
      'Are you sure you want to start a new prescription? Current data will be lost.',
      () => {
        closeModal();
        setLinkedAppointment(null);
        setPatientData(emptyForm());
        setMedicines([{ id: 1, name: '', timing: '', anupan: '', days: 7 }]);
        setPathya(''); setApathya(''); setNotes('');
      }
    );
  };

  // ── WhatsApp ─────────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    if (!patientData.phone) { showAlert('No Phone Number', 'Please enter the patient phone number first.', 'warning'); return; }
    const medList = medicines.filter(m => m.name).map(m => `• ${m.name} — ${m.timing || ''} ${m.anupan ? `with ${m.anupan}` : ''} (${m.days} days)`).join('\n');
    const msg = `*Prescription — ${patientData.name}*\nDate: ${new Date().toLocaleDateString('en-IN')}\nDiagnosis: ${patientData.diagnosis || '—'}\n\nMedicines:\n${medList}${pathya ? `\n\nPathya (Do's): ${pathya}` : ''}${apathya ? `\nApathya (Don'ts): ${apathya}` : ''}${notes ? `\n\nNotes: ${notes}` : ''}`;
    window.open(`https://wa.me/${patientData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="animate-fade-in resp-panel-row">
      {/* ══ LEFT PANEL — Prescription Builder ══════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="page-title">Digital Prescription</h1>
          </div>
          <button className="btn btn-primary" onClick={handleNew} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.875rem' }}>
            <Plus size={16} /> New Prescription
          </button>
        </div>

        <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Patient Info Row 1: Name + Age + Gender + Phone */}
          <div className="resp-grid-4">
            <div className="input-group" style={{ position: 'relative' }}>
              <label className="input-label">Patient Name</label>
              <input
                type="text"
                className="input-field"
                value={patientData.name}
                autoComplete="off"
                placeholder="Type to search existing patients..."
                onChange={e => {
                  setPatientData(p => ({ ...p, name: e.target.value }));
                  fetchPatientSuggestions(e.target.value);
                }}
                onBlur={() => setTimeout(() => setShowPatientSug(false), 180)}
                onFocus={() => patientData.name.length >= 2 && setShowPatientSug(patientSuggestions.length > 0)}
              />
              {showPatientSug && patientSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  marginTop: '4px', overflow: 'hidden',
                }}>
                  {patientSuggestions.map(p => (
                    <div
                      key={p._id}
                      onMouseDown={() => selectPatient(p)}
                      style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {p.age ? `${p.age}y` : ''}{p.age && p.gender ? ' · ' : ''}{p.gender || ''}{(p.contact || p.phone) ? ` · ${p.contact || p.phone}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(22,163,74,0.1)', color: '#16a34a', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Select</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="input-group">
              <label className="input-label">Age</label>
              <input type="number" className="input-field" value={patientData.age} placeholder="e.g. 35"
                onChange={e => setPatientData(p => ({ ...p, age: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Gender</label>
              <CustomSelect value={patientData.gender} onChange={v => setPatientData(p => ({ ...p, gender: v }))} width="100%" matchInput
                options={[
                  { value: 'Male',   label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other',  label: 'Other' },
                ]} />
            </div>
            <div className="input-group">
              <label className="input-label">Patient Number</label>
              <input type="tel" className="input-field" placeholder="e.g. 9876543210"
                value={patientData.phone} onChange={e => setPatientData(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          {/* Patient Info Row 2: Address + Blood Group + Weight + Follow-up Date */}
          <div className="resp-grid-4b">
            <div className="input-group">
              <label className="input-label">Address</label>
              <input type="text" className="input-field" placeholder="Patient's address"
                value={patientData.address} onChange={e => setPatientData(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Blood Group</label>
              <CustomSelect value={patientData.bloodGroup} onChange={v => setPatientData(p => ({ ...p, bloodGroup: v }))} width="100%" matchInput
                placeholder="Unknown"
                options={[
                  { value: '',    label: 'Unknown' },
                  { value: 'A+',  label: 'A+' }, { value: 'A-',  label: 'A-' },
                  { value: 'B+',  label: 'B+' }, { value: 'B-',  label: 'B-' },
                  { value: 'AB+', label: 'AB+' },{ value: 'AB-', label: 'AB-' },
                  { value: 'O+',  label: 'O+' }, { value: 'O-',  label: 'O-' },
                ]} />
            </div>
            <div className="input-group">
              <label className="input-label">Weight (kg)</label>
              <input type="number" className="input-field" placeholder="e.g. 65" min="1" max="300"
                value={patientData.weight} onChange={e => setPatientData(p => ({ ...p, weight: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Follow-up Date</label>
              <input type="date" className="input-field"
                value={patientData.followUpDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setPatientData(p => ({ ...p, followUpDate: e.target.value }))} />
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <div className="input-group" style={{ position: 'relative' }}>
              <label className="input-label">Disease / Diagnosis</label>
              <input
                type="text"
                className="input-field"
                placeholder="Type to search diseases..."
                autoComplete="off"
                value={patientData.diagnosis}
                onChange={e => {
                  setPatientData(p => ({ ...p, diagnosis: e.target.value }));
                  fetchDiseaseSuggestions(e.target.value);
                }}
                onBlur={() => setTimeout(() => setShowDiseaseSug(false), 180)}
              />
              {showDiseaseSug && diseaseSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  marginTop: '4px', maxHeight: '240px', overflowY: 'auto',
                }}>
                  {diseaseSuggestions.map(d => (
                    <div
                      key={d._id}
                      onMouseDown={() => selectDisease(d)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{d.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {d.localName && <span>{d.localName}</span>}
                        {d.localName && d.mainDosha && <span> · </span>}
                        {d.mainDosha && <span style={{ color: '#16a34a' }}>{d.mainDosha}</span>}
                        {d.commonMedicines?.length > 0 && <span style={{ color: '#6b7280' }}> · {d.commonMedicines.length} medicines</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Medicines */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Pill size={20} color="var(--primary)" /> Recommended Medicines
              </h3>
              <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={addMedicine}>
                <Plus size={16} /> Add Medicine
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Medicine</th>
                  <th>Timing</th>
                  <th>Anupan</th>
                  <th>Days</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(med => (
                  <tr key={med.id}>
                    <td style={{ position: 'relative' }}>
                      <input type="text" className="input-field" style={{ padding: '8px', background: 'var(--bg-input)' }}
                        value={med.name} onChange={e => updateMedicine(med.id, 'name', e.target.value)}
                        onBlur={() => setTimeout(() => setMedicineSuggestions(prev => ({ ...prev, [med.id]: [] })), 180)}
                        autoComplete="off" placeholder="Type to search medicine..." />
                      {medicineSuggestions[med.id]?.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                          borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          marginTop: '4px', maxHeight: '220px', overflowY: 'auto',
                        }}>
                          {medicineSuggestions[med.id].map(s => {
                            const qty = s.stockQuantity ?? 0;
                            const stockColor = qty === 0 ? '#ef4444' : qty <= (s.lowStockThreshold || 10) ? '#f59e0b' : '#16a34a';
                            const stockLabel = qty === 0 ? 'Out of stock' : qty <= (s.lowStockThreshold || 10) ? `Low (${qty})` : `In stock (${qty})`;
                            return (
                              <div
                                key={s._id}
                                onMouseDown={() => selectMedicine(med.id, s.medicineName, s._id)}
                                style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.medicineName}</div>
                                  {s.formulation && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>{s.formulation}{s.brand ? ` · ${s.brand}` : ''}</div>}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: stockColor, background: `${stockColor}18`, padding: '2px 8px', borderRadius: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{stockLabel}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td><input type="text" className="input-field" style={{ padding: '8px', background: 'var(--bg-muted)' }} value={med.timing} onChange={e => updateMedicine(med.id, 'timing', e.target.value)} /></td>
                    <td><input type="text" className="input-field" style={{ padding: '8px', background: 'var(--bg-muted)' }} value={med.anupan} onChange={e => updateMedicine(med.id, 'anupan', e.target.value)} /></td>
                    <td><input type="number" className="input-field" style={{ padding: '8px', background: 'var(--bg-muted)' }} value={med.days} onChange={e => updateMedicine(med.id, 'days', e.target.value)} /></td>
                    <td><button className="btn" style={{ padding: '4px', color: 'var(--danger)' }} onClick={() => removeMedicine(med.id)}><X size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pathya / Apathya */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
            <div className="input-group">
              <label className="input-label">Pathya (Do's)</label>
              <textarea className="input-field" placeholder="Dietary instructions..." rows={3}
                value={pathya} onChange={e => setPathya(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Apathya (Don'ts)</label>
              <textarea className="input-field" placeholder="Foods to avoid..." rows={3}
                value={apathya} onChange={e => setApathya(e.target.value)} />
            </div>
          </div>

          {/* Doctor Notes */}
          <div className="input-group">
            <label className="input-label">Doctor Notes</label>
            <textarea className="input-field" rows={2} placeholder="Additional instructions..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL — Live Preview & Actions ═══════════════════════════════ */}
      <div className="resp-side-panel-420 no-print" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* A4 Live Preview */}
        <div id="prescription-preview" className="glass-panel" style={{ flex: 1, backgroundColor: 'white', color: '#111', padding: '32px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflowY: 'auto' }}>
          {/* Clinic Header */}
          <div style={{ borderBottom: '2px solid #16a34a', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#16a34a', margin: 0 }}>MediCore</h2>
              <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 'bold' }}>
                {userName ? `Dr. ${userName}` : 'Doctor'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>MediCore Clinic</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>
              AC
            </div>
          </div>

          {/* Patient Info */}
          <div style={{ fontSize: '0.85rem', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>Name:</strong> {patientData.name || '---'}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</div>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div><strong>Age:</strong> {patientData.age || '--'}</div>
              <div><strong>Gender:</strong> {patientData.gender || '--'}</div>
              {patientData.weight && <div><strong>Weight:</strong> {patientData.weight} kg</div>}
              {patientData.bloodGroup && <div><strong>Blood Group:</strong> {patientData.bloodGroup}</div>}
              {patientData.phone && <div><strong>Mobile:</strong> {patientData.phone}</div>}
            </div>
            <div><strong>Address:</strong> {patientData.address || 'Not specified'}</div>
            {patientData.diagnosis && (
              <div style={{ marginTop: '8px', color: '#16a34a' }}><strong>Diagnosis:</strong> {patientData.diagnosis}</div>
            )}
          </div>

          {/* Medicines */}
          <h3 style={{ color: '#16a34a', margin: '16px 0 8px', fontSize: '1.2rem', borderBottom: '1px solid #16a34a', display: 'inline-block' }}>
            Advised Medicines
          </h3>
          <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#333', lineHeight: '1.8' }}>
            {medicines.map(m => (
              <li key={m.id} style={{ marginBottom: '8px' }}>
                <strong>{m.name || 'Medicine Name'}</strong>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {m.timing} {m.anupan ? `with ${m.anupan}` : ''} • {m.days} days
                </div>
              </li>
            ))}
          </ul>

          {/* Pathya / Apathya / Notes */}
          <div style={{ marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '16px', fontSize: '0.85rem', color: '#444' }}>
            {pathya  && <div><strong>Pathya (Do's):</strong> {pathya}</div>}
            {apathya && <div style={{ marginTop: '4px' }}><strong>Apathya (Don'ts):</strong> {apathya}</div>}
            {notes   && <div style={{ marginTop: '8px', fontStyle: 'italic' }}><strong>Notes:</strong> {notes}</div>}
          </div>

          <div style={{ height: '40px' }} />
        </div>

        {/* Action Buttons */}
        <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '11px', fontSize: '0.9rem' }}
            onClick={handleSave} disabled={loading}>
            {loading ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : <><Save size={16} /> Save Prescription</>}
          </button>
          <button className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '11px', fontSize: '0.9rem' }}
            onClick={handleDownload}>
            <Download size={16} /> Download PDF
          </button>
          <button className="btn btn-primary" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', gap: '8px', background: '#25D366', border: 'none' }}
            onClick={handleWhatsApp}>
            <Send size={18} /> Send via WhatsApp
          </button>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        footer={
          modal.showConfirm ? (
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button
                className={`btn ${modal.type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                style={modal.type === 'danger' ? { background: '#ef4444', color: 'white', border: 'none' } : {}}
                onClick={modal.onConfirm}
              >
                Confirm
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={closeModal}>Okay</button>
          )
        }
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: modal.type === 'success' ? 'rgba(22,163,74,0.1)' :
                        modal.type === 'danger'  ? 'rgba(239,68,68,0.1)'  :
                        modal.type === 'warning' ? 'rgba(71,85,105,0.1)' : 'rgba(5,150,105,0.1)',
            color:      modal.type === 'success' ? '#16a34a' :
                        modal.type === 'danger'  ? '#ef4444' :
                        modal.type === 'warning' ? '#475569' : '#059669',
          }}>
            {modal.type === 'success' && <CheckCircle size={28} />}
            {modal.type === 'danger'  && <AlertCircle size={28} />}
            {modal.type === 'warning' && <HelpCircle  size={28} />}
            {modal.type === 'info'    && <AlertCircle size={28} />}
          </div>
          <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '500' }}>
            {modal.message}
          </div>
        </div>
      </Modal>
    </div>
  );
}
