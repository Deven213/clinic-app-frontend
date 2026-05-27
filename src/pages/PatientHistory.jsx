import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, History, Download, ArrowLeft, Loader2, Activity, AlertCircle } from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PatientHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true); setError('');
      try {
        const r = await authFetch(`${API}/api/patients/${id}`);
        if (!r.ok) throw new Error('Patient not found');
        const data = await r.json();
        setPatient(data);
      } catch (err) {
        setError(err.message || 'Failed to load patient history.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, authFetch]);

  const downloadPDF = (prescription) => {
    if (!patient) return;
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="padding:40px;font-family:sans-serif;color:#333;line-height:1.6;">
        <div style="border-bottom:2px solid #16a34a;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2 style="color:#16a34a;margin:0;">MediCore</h2>
            <div style="font-size:0.85rem;font-weight:bold;margin-top:2px;">MediCore Clinic</div>
            <div style="font-size:0.8rem;color:#555;margin-top:2px;">Medical Prescription</div>
          </div>
        </div>
        <div style="margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:10px;">
          <div style="display:flex;justify-content:space-between;">
            <div><strong>Name:</strong> ${patient.name}</div>
            <div><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString('en-IN')}</div>
          </div>
          <div><strong>Age/Gender:</strong> ${patient.age || '—'}y / ${patient.gender || '—'}</div>
          <div><strong>Phone:</strong> ${patient.contact || patient.phone || '—'}</div>
          ${prescription.diagnosis ? `<div style="color:#16a34a;margin-top:6px;"><strong>Diagnosis:</strong> ${prescription.diagnosis}</div>` : ''}
        </div>
        <h3 style="color:#16a34a;border-bottom:1px solid #16a34a;display:inline-block;">Medicines</h3>
        <ul style="padding-left:20px;font-size:0.9rem;line-height:2;">
          ${(prescription.medicines || []).map(m => `
            <li><strong>${m.name}</strong> — ${m.timing || ''}${m.anupan ? ` with ${m.anupan}` : ''} • ${m.days || '—'} days</li>
          `).join('')}
        </ul>
        ${(prescription.pathya || prescription.apathya || prescription.notes) ? `
        <div style="margin-top:20px;border-top:1px dashed #ccc;padding-top:12px;font-size:0.85rem;">
          ${prescription.pathya ? `<div><strong>Pathya (Do's):</strong> ${prescription.pathya}</div>` : ''}
          ${prescription.apathya ? `<div style="margin-top:4px;"><strong>Apathya (Don'ts):</strong> ${prescription.apathya}</div>` : ''}
          ${prescription.notes ? `<div style="margin-top:8px;font-style:italic;"><strong>Notes:</strong> ${prescription.notes}</div>` : ''}
        </div>` : ''}
      </div>
    `;
    html2pdf().set({
      margin: 0,
      filename: `${patient.name}_Prescription_${new Date(prescription.createdAt).toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`,
      html2canvas: { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  };

  if (loading) return <MedicalLoader variant="page" text="Opening Medical History…" />;

  if (error || !patient) {
    return (
      <div className="animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: 'var(--text-muted)' }}>{error || 'Patient record not found.'}</h2>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/patients')}>
          <ArrowLeft size={18} /> Back to Patients
        </button>
      </div>
    );
  }

  const prescriptions = [...(patient.prescriptions || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" style={{ padding: '10px' }} onClick={() => navigate('/patients')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{patient.name}</h1>
            <p className="page-subtitle">Detailed Medical History Timeline</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Patient Card */}
        <div className="glass-panel" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '4px solid var(--primary)' }}>
            <User size={46} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{patient.name}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            {patient.age ? `${patient.age} years` : ''}{patient.age && patient.gender ? ' • ' : ''}{patient.gender || ''}
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: '12px', fontSize: '0.88rem', textAlign: 'left' }}>
            {(patient.contact || patient.phone) && <div style={{ marginBottom: '6px' }}><strong>Phone:</strong> {patient.contact || patient.phone}</div>}
            {patient.address && <div style={{ marginBottom: '6px' }}><strong>Address:</strong> {patient.address}</div>}
            <div><strong>Total Visits:</strong> {prescriptions.length}</div>
          </div>
        </div>

        {/* Prescription Timeline */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <History size={20} color="var(--primary)" /> Prescription Timeline
          </h3>

          {prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              <History size={40} color="#e5e7eb" style={{ marginBottom: '10px' }} />
              <div>No past prescriptions found for this patient.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {prescriptions.map((record, index, arr) => (
                <div key={record._id || record.id} style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-muted)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>
                      <Calendar size={16} /> Visit #{arr.length - index}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {new Date(record.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      {record.diagnosis && (
                        <div style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
                          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Diagnosis:</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                            <Activity size={14} /> {record.diagnosis}
                          </div>
                        </div>
                      )}
                      {record.medicines?.length > 0 && (
                        <div style={{ fontSize: '0.88rem' }}>
                          <div style={{ fontWeight: 700, marginBottom: '6px' }}>Medicines:</div>
                          <ul style={{ paddingLeft: '18px', margin: 0, lineHeight: '1.8' }}>
                            {record.medicines.map((m, i) => (
                              <li key={i}>
                                <span style={{ fontWeight: 600 }}>{m.name}</span>
                                {m.timing && <span style={{ color: '#6b7280', fontSize: '0.8rem' }}> — {m.timing}{m.anupan ? ` with ${m.anupan}` : ''} • {m.days}d</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                      {record.pathya && <div style={{ fontSize: '0.82rem', marginBottom: '8px' }}><strong style={{ color: '#16a34a' }}>Pathya:</strong> {record.pathya}</div>}
                      {record.apathya && <div style={{ fontSize: '0.82rem', marginBottom: '8px' }}><strong style={{ color: '#dc2626' }}>Apathya:</strong> {record.apathya}</div>}
                      {record.notes && <div style={{ fontSize: '0.82rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '8px' }}><strong>Notes:</strong> {record.notes}</div>}
                      <div style={{ marginTop: '16px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.82rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => downloadPDF(record)}
                        >
                          <Download size={14} /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
