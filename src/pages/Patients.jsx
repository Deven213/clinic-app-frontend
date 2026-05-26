import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, Activity, History, Loader2 } from 'lucide-react';

export default function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([
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
          ]
        },
        {
          id: "pr2",
          createdAt: "2024-02-10T09:30:00Z",
          diagnosis: "General weakness",
          medicines: [
            { id: 3, name: "Ashwagandha Churna", timing: "Bedtime", anupan: "Milk", days: 30 }
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
          id: "pr3",
          createdAt: "2024-03-20T11:45:00Z",
          diagnosis: "Sandhigata Vata (Arthritis)",
          medicines: [
            { id: 4, name: "Yograj Guggulu", timing: "Twice daily", anupan: "Lukewarm Water", days: 20 }
          ]
        }
      ]
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/patients');
      const data = await res.json();
      if (data && data.length > 0) {
        setPatients(data);
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  const viewHistory = (patientId) => {
    navigate(`/patients/${patientId}/history`);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Patient Resources</h1>
          <p className="page-subtitle">Manage patient records and medical histories</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/prescription')}>
          <Plus size={18} /> Register New Patient
        </button>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-muted)', paddingLeft: '16px' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search patients by name or phone..." 
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', padding: '12px 0' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Patient Info</th>
                <th style={{ textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Contact</th>
                <th style={{ textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Last Prescription</th>
                <th style={{ textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">
                    <div className="loader-container">
                      <Loader2 className="loader-icon" size={40} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Opening Patient Records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No patients found</td></tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: '600' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.age} yrs • {p.gender}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {p.phone}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      {p.prescriptions && p.prescriptions.length > 0 ? (
                        <>
                          <div style={{ fontWeight: '500' }}>{new Date(p.prescriptions[0].createdAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.prescriptions[0].diagnosis}</div>
                        </>
                      ) : 'No history'}
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => viewHistory(p.id)}>
                        <History size={15} style={{ marginRight: '6px' }} /> View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
