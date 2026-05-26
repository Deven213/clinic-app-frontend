import { useState, useEffect } from 'react';
import { FileText, Save, Send, Pill, Plus, X, Search, Loader2, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function Prescription() {
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState({
    name: 'Rajesh Sharma',
    age: '45',
    gender: 'Male',
    phone: '',
    address: '123, Vedic Street, Mumbai',
    diagnosis: 'Amlapitta (Hyperacidity)'
  });
  
  const [medicines, setMedicines] = useState([
    { id: 1, name: 'Triphala Churna', timing: 'Bedtime', anupan: 'Warm Water', days: 15 },
    { id: 2, name: 'Avipattikar Churna', timing: 'Before Meals', anupan: 'Ghee', days: 15 }
  ]);

  const [pathya, setPathya] = useState('Light digestible food, Moong dal, Old rice');
  const [apathya, setApathya] = useState('Spicy, sour, fermented foods. Avoid tea/coffee.');
  const [notes, setNotes] = useState('');

  const addMedicine = () => {
    const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
    setMedicines([...medicines, { id: newId, name: '', timing: '', anupan: '', days: 7 }]);
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const [medicineSuggestions, setMedicineSuggestions] = useState({}); // { rowId: [suggestions] }

  const fetchMedicineSuggestions = async (rowId, query) => {
    if (!query || query.length < 2) {
      setMedicineSuggestions(prev => ({ ...prev, [rowId]: [] }));
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMedicineSuggestions(prev => ({ ...prev, [rowId]: data }));
    } catch (err) {
      console.error("Suggestions fetch failed", err);
    }
  };

  const updateMedicine = (id, field, value) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
    if (field === 'name') {
      fetchMedicineSuggestions(id, value);
    }
  };

  const selectMedicine = (id, medicineName) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, name: medicineName } : m));
    setMedicineSuggestions(prev => ({ ...prev, [id]: [] }));
  };

  const handleSave = async () => {
    if (!patientData.name || medicines.length === 0) {
      alert("Please enter patient name and at least one medicine.");
      return;
    }

    if (!window.confirm("Do you want to save this prescription for " + patientData.name + "?")) return;

    setLoading(true);
    try {
      // 1. Search for existing patient by name or create a new one
      // In a real app, you'd have a selectedId. Here we'll try to find by name for simplicity.
      let patientId;
      const searchRes = await fetch(`http://localhost:5000/api/patients/search?q=${encodeURIComponent(patientData.name)}`);
      const searchResults = await searchRes.json();
      
      const existingPatient = searchResults.find(p => p.name.toLowerCase() === patientData.name.toLowerCase());
      
      if (existingPatient) {
        patientId = existingPatient.id;
        // Optionally update existing patient's details if changed
      } else {
        // Create new patient
        const newPatientRes = await fetch('http://localhost:5000/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: patientData.name,
            age: patientData.age,
            contact: 'Not provided', // In a real app, this would be in the form too
            gender: patientData.gender,
            address: patientData.address
          })
        });
        const newPatient = await newPatientRes.json();
        if (newPatient.error) throw new Error(newPatient.error);
        patientId = newPatient.id;
      }

      // 2. Save the prescription
      const response = await fetch('http://localhost:5000/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          diagnosis: patientData.diagnosis,
          medicines: medicines,
          pathya,
          apathya,
          notes
        })
      });

      if (response.ok) {
        alert("Prescription saved successfully for " + patientData.name);
      } else {
        const err = await response.json();
        console.error(err);
        alert("Error saving prescription: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process prescription: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.getElementById('prescription-preview');
    const opt = {
      margin: 0,
      filename: `${patientData.name}_Prescription.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2.5, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Left panel - Prescription Builder */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="page-title">Digital Prescription</h1>
            <p className="page-subtitle">Generate smart Ayurvedic prescriptions</p>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Patient Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={patientData.name} 
                onChange={(e) => setPatientData({...patientData, name: e.target.value})}
              />
            </div>
            <div className="input-group">
                <label className="input-label">Age</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={patientData.age}
                  onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                />
            </div>
            <div className="input-group">
                <label className="input-label">Gender</label>
                <select 
                  className="input-field" 
                  value={patientData.gender}
                  onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
                  style={{ appearance: 'auto' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
            </div>
            <div className="input-group">
                <label className="input-label">Patient Number (WhatsApp)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 9876543210"
                  value={patientData.phone}
                  onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
                />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Address (Clinic Locality)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Patient's address"
                value={patientData.address}
                onChange={(e) => setPatientData({...patientData, address: e.target.value})}
              />
            </div>
             <div className="input-group">
              <label className="input-label">Disease / Diagnosis</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Amlapitta" 
                value={patientData.diagnosis}
                onChange={(e) => setPatientData({...patientData, diagnosis: e.target.value})}
              />
            </div>
          </div>

          <div style={{ borderTop: 'var(--glass-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Pill size={20} color="var(--primary)" /> Recommended Medicines</h3>
              <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={addMedicine}><Plus size={16} /> Add Medicine</button>
            </div>
            
            <table className="data-table">
              <thead>
                 <tr>
                   <th style={{ width: '25%' }}>Medicine</th>
                   <th>Timing</th>
                   <th>Anupan</th>
                   <th>Days</th>
                   <th></th>
                 </tr>
              </thead>
              <tbody>
                {medicines.map((med) => (
                  <tr key={med.id}>
                    <td style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ padding: '8px', background: 'var(--bg-input)' }} 
                        value={med.name} 
                        onChange={(e) => updateMedicine(med.id, 'name', e.target.value)} 
                        autoComplete="off"
                      />
                      {medicineSuggestions[med.id] && medicineSuggestions[med.id].length > 0 && (
                        <div className="glass-panel" style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          zIndex: 100, 
                          maxHeight: '200px', 
                          overflowY: 'auto', 
                          padding: '4px',
                          marginTop: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                           {medicineSuggestions[med.id].map((s) => (
                            <div 
                              key={s.id} 
                              className="suggestion-item" 
                              style={{ 
                                padding: '8px 12px', 
                                cursor: 'pointer', 
                                borderRadius: '4px',
                                fontSize: '0.9rem'
                              }}
                              onClick={() => selectMedicine(med.id, s.medicineName)}
                              onMouseEnter={(e) => e.target.style.background = 'var(--bg-muted)'}
                              onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                              {s.medicineName}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td><input type="text" className="input-field" style={{ padding: '8px', background: 'var(--bg-muted)' }} value={med.timing} onChange={(e) => updateMedicine(med.id, 'timing', e.target.value)} /></td>
                    <td><input type="text" className="input-field" style={{ padding: '8px', background: 'var(--bg-muted)' }} value={med.anupan} onChange={(e) => updateMedicine(med.id, 'anupan', e.target.value)} /></td>
                    <td><input type="number" className="input-field" style={{ padding: '8px', background: 'var(--bg-muted)' }} value={med.days} onChange={(e) => updateMedicine(med.id, 'days', e.target.value)} /></td>
                    <td><button className="btn" style={{ padding: '4px', color: 'var(--danger)' }} onClick={() => removeMedicine(med.id)}><X size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="input-group">
              <label className="input-label">Pathya (Do's)</label>
              <textarea className="input-field" placeholder="Dietary instructions..." rows={3} value={pathya} onChange={(e) => setPathya(e.target.value)}></textarea>
            </div>
            <div className="input-group">
              <label className="input-label">Apathya (Don'ts)</label>
              <textarea className="input-field" placeholder="Foods to avoid..." rows={3} value={apathya} onChange={(e) => setApathya(e.target.value)}></textarea>
            </div>
          </div>
          
          <div className="input-group">
             <label className="input-label">Doctor Notes</label>
             <textarea className="input-field" rows={2} placeholder="Additional instructions..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
          </div>

        </div>
      </div>

      {/* Right panel - Live Preview & Actions */}
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="no-print">
        <div id="prescription-preview" className="glass-panel" style={{ flex: 1, backgroundColor: 'white', color: '#111', padding: '32px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflowY: 'auto' }}>
          {/* A4 Paper Look */}
          <div style={{ borderBottom: '2px solid #10b981', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#10b981', margin: 0 }}>Sanjivani Clinic</h2>
              <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 'bold' }}>Dr. Dharmesh C. Sapovadiya</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Qualification: B.A.M.S.</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              SC
            </div>
          </div>
          
          <div style={{ fontSize: '0.85rem', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>Name:</strong> {patientData.name || '---'}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div><strong>Age & Gender:</strong> {patientData.age || '--'} / {patientData.gender || '--'}</div>
              {patientData.phone && <div><strong>Mobile:</strong> {patientData.phone}</div>}
            </div>
            <div><strong>Address:</strong> {patientData.address || 'Not specified'}</div>
            {patientData.diagnosis && <div style={{ marginTop: '8px', color: '#10b981' }}><strong>Diagnosis:</strong> {patientData.diagnosis}</div>}
          </div>

          <h3 style={{ color: '#10b981', margin: '16px 0 8px', fontSize: '1.2rem', borderBottom: '1px solid #10b981', display: 'inline-block' }}>Advised Medicines</h3>
          <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#333', lineHeight: '1.8' }}>
            {medicines.map((m) => (
              <li key={m.id} style={{ marginBottom: '8px' }}>
                <strong>{m.name || 'Medicine Name'}</strong>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{m.timing} {m.anupan ? `with ${m.anupan}` : ''} • {m.days} days</div>
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '16px', fontSize: '0.85rem', color: '#444' }}>
            {pathya && <div><strong>Pathya (Do's):</strong> {pathya}</div>}
            {apathya && <div style={{ marginTop: '4px' }}><strong>Apathya (Don'ts):</strong> {apathya}</div>}
            {notes && <div style={{ marginTop: '8px', fontStyle: 'italic' }}><strong>Notes:</strong> {notes}</div>}
          </div>

          <div style={{ height: '40px' }}></div>
        </div>

        <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <><Loader2 className="animate-spin" size={18} /> Saving...</> : <><Save size={18} /> Save Prescription</>}
          </button>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }} 
            onClick={handleDownload}
          >
            <Download size={18} /> Download PDF
          </button>
          <button className="btn btn-primary" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', gap: '8px', background: '#25D366' }}><Send size={18} /> Send via WhatsApp</button>
        </div>
      </div>
    </div>
  );
}
