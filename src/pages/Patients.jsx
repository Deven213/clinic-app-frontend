import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, History, Loader2, X, RefreshCw, User, Trash2 } from 'lucide-react';
import MedicalLoader from '../components/MedicalLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = 'https://medical-project-h6yc.vercel.app';

export default function Patients() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [searchTerm, setSearchTerm]       = useState('');
  const [patients, setPatients]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API}/api/patients?limit=500`);
      const data = await res.json();
      // Backend returns { patients: [...], total }
      const list = Array.isArray(data.patients) ? data.patients : Array.isArray(data) ? data : [];
      setPatients(list);
    } catch (err) {
      setError('Could not load patients. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleCleanupTest = async () => {
    if (!window.confirm('Delete all patients with "test" in their name and their prescriptions? This cannot be undone.')) return;
    setCleanupLoading(true);
    try {
      const res = await authFetch(`${API}/api/patients/cleanup-test`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message || 'Cleanup complete.');
      fetchPatients();
    } catch {
      alert('Cleanup failed. Please try again.');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Client-side filter (same as reference)
  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.contact || p.phone || '').includes(searchTerm)
  );

  return (
    /* fill main-content height, never let the page itself scroll */
    <div className="animate-fade-in" style={{ height: 'calc(100vh - var(--header-height) - 28px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Page header + search — fixed height, no scroll */}
      <div style={{ flexShrink: 0, paddingTop: '24px', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Patient Resources</h1>
            <p className="page-subtitle">Manage patient records and medical histories</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchPatients}>
              <RefreshCw size={15} />
            </button>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/prescription')}>
              <Plus size={18} /> Register New Patient
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search patients by name or phone..."
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
        </div>
      </div>

      {error && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', margin: '12px 0', fontSize: '0.84rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Glass panel fills the remaining vertical space; table scrolls inside it */}
      <div className="glass-panel" style={{ marginTop: '16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div className="table-container" style={{ overflowY: 'auto', flex: 1 }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-card)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>Patient Info</th>
                <th style={{ textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>Contact</th>
                <th style={{ textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3">
                    <MedicalLoader text="Opening Patient Records…" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <User size={40} color="#e5e7eb" style={{ marginBottom: '10px' }} />
                    <div style={{ fontWeight: 600 }}>{searchTerm ? 'No patients match your search.' : 'No patients yet.'}</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '6px' }}>Patients are registered when appointments are booked or prescriptions are created.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id || p.id}>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {p.age ? `${p.age} yrs` : ''}
                        {p.age && p.gender ? ' • ' : ''}
                        {p.gender || ''}
                      </div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} /> {p.contact || p.phone || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => navigate(`/patients/${p._id || p.id}/history`)}
                      >
                        <History size={15} /> View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>
    </div>
  );
}
