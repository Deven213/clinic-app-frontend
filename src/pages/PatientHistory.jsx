import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, History, Download, ArrowLeft, Loader2, Activity } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function PatientHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    setLoading(true);
    let found = null;
    
    try {
      const res = await fetch(`http://localhost:5000/api/patients`);
      if (res.ok) {
        const allPatients = await res.json();
        found = allPatients.find(p => String(p.id) === String(id));
      }
    } catch (err) {
      console.error("Failed to fetch patient history from DB", err);
    }

    if (!found) {
      // Robust Mock Fallback
      const mockData = [
        {
          id: "p1",
          name: "Rajesh Sharma",
          age: 45,
          gender: "Male",
          phone: "9876543210",
          prescriptions: [
            {
              id: "pr1",
              createdAt: "2024-03-25T10:00:00Z",
              diagnosis: "Amlapitta (Hyperacidity)",
              medicines: [
                { id: 1, name: "Avipattikar Churna", timing: "Before Meals", anupan: "Warm Water", days: 15 },
                { id: 2, name: "Sutshekhar Rasa", timing: "After Meals", anupan: "Milk", days: 15 }
              ],
              pathya: "Light digestible food, Moong dal",
              notes: "Rest and avoid spicy food."
            },
            {
              id: "pr2",
              createdAt: "2024-02-15T09:30:00Z",
              diagnosis: "Pratishyaya (Common Cold)",
              medicines: [
                { id: 3, name: "Sitopaladi Churna", timing: "With Honey", anupan: "Honey", days: 7 },
                { id: 4, name: "Tribhuvan Kirti Rasa", timing: "Twice daily", anupan: "Ginger juice", days: 5 }
              ],
              notes: "Steam inhalation recommended."
            },
            {
              id: "pr3",
              createdAt: "2024-01-05T11:00:00Z",
              diagnosis: "Agnimandya (Loss of appetite)",
              medicines: [
                { id: 5, name: "Chitrakadi Vati", timing: "Check pulse", anupan: "Warm Water", days: 10 }
              ]
            }
          ]
        },
        {
          id: "p2",
          name: "Priya Joshi",
          age: 32,
          gender: "Female",
          phone: "9988776655",
          prescriptions: [
            {
              id: "pr4",
              createdAt: "2024-03-20T11:45:00Z",
              diagnosis: "Sandhigata Vata (Arthritis)",
              medicines: [
                { id: 4, name: "Yograj Guggulu", timing: "Twice daily", anupan: "Lukewarm Water", days: 20 }
              ]
            }
          ]
        }
      ];
      found = mockData.find(p => String(p.id) === String(id));
    }

    setPatient(found);
    setLoading(false);
  };

  const downloadPDF = (prescription) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #333; line-height: 1.6;">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="color: #10b981; margin: 0;">Sanjivani Clinic</h2>
            <div style="font-size: 0.9rem; font-weight: bold; margin-top: 4px;">Dr. Dharmesh C. Sapovadiya</div>
            <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">Qualification: B.A.M.S.</div>
          </div>
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #10b981; display: flex; alignItems: center; justifyContent: center; color: white; font-weight: bold; font-size: 20px;">
            SC
          </div>
        </div>
        
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          <div><strong>Name:</strong> ${patient.name}</div>
          <div><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #10b981; border-bottom: 1px solid #10b981; display: inline-block;">Advised Medicines</h3>
          <ul style="padding-left: 20px;">
            ${prescription.medicines.map(m => `
              <li style="margin-bottom: 8px;">
                <strong>${m.name}</strong>
                <div style="font-size: 0.85rem; color: #666;">${m.timing || ''} ${m.anupan ? `with ${m.anupan}` : ''} • ${m.days} days</div>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <div style="margin-top: 30px; border-top: 1px dashed #ccc; paddingTop: 16px; font-size: 0.9rem;">
          ${prescription.pathya ? `<div><strong>Pathya (Do's):</strong> ${prescription.pathya}</div>` : ''}
          ${prescription.apathya ? `<div style="margin-top: 4px;"><strong>Apathya (Don'ts):</strong> ${prescription.apathya}</div>` : ''}
          ${prescription.notes ? `<div style="margin-top: 8px; font-style: italic;"><strong>Notes:</strong> ${prescription.notes}</div>` : ''}
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `${patient.name}_Prescription_${new Date(prescription.createdAt).toLocaleDateString()}.pdf`,
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

  if (loading) {
    return (
      <div className="loader-container" style={{ height: '100vh' }}>
        <Loader2 className="loader-icon" size={50} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500' }}>Opening Medical History...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>Patient record not found.</h2>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/patients')}>
          <ArrowLeft size={18} /> Back to Patients
        </button>
      </div>
    );
  }

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

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'var(--bg-muted)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            border: '4px solid var(--primary)'
          }}>
            <User size={50} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{patient.name}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '16px' }}>
            {patient.age} years • {patient.gender}
          </div>
          <div style={{ 
            padding: '12px', 
            background: 'var(--bg-muted)', 
            borderRadius: '12px', 
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: '8px' }}><strong>Phone:</strong> {patient.phone}</div>
            <div><strong>Total Visits:</strong> {patient.prescriptions?.length || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <History size={22} color="var(--primary)" /> Prescription Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {(!patient.prescriptions || patient.prescriptions.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No past prescriptions found for this patient.
              </div>
            ) : (
              [...patient.prescriptions].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((record, index, arr) => (
                <div 
                  key={record.id} 
                  style={{ 
                    padding: '24px', 
                    borderRadius: '16px', 
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontWeight: 'bold', 
                      color: 'var(--primary)',
                      fontSize: '1.1rem' 
                    }}>
                      <Calendar size={18} /> Visit #{arr.length - index}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {new Date(record.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>Diagnosis:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Activity size={14} color="var(--primary)" /> {record.diagnosis || 'General checkup'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>Medicines:</div>
                        <ul style={{ paddingLeft: '16px', margin: 0 }}>
                          {record.medicines.map(m => <li key={m.id}>{m.name}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid #ccc', paddingLeft: '24px' }}>
                       {record.pathya && <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}><strong>Pathya:</strong> {record.pathya}</div>}
                       {record.notes && <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}><strong>Dr. Notes:</strong> {record.notes}</div>}
                       <div style={{ marginTop: '16px' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '8px 16px', fontSize: '0.85rem', width: '100%' }}
                          onClick={() => downloadPDF(record)}
                        >
                          <Download size={16} /> Download Prescription PDF
                        </button>
                       </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
