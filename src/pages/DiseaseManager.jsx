import { BookOpen, Search, Filter, Edit, Plus } from 'lucide-react';

export default function DiseaseManager() {
  const diseases = [
    { name: 'Amlapitta', type: 'Digestive', mainDosha: 'Pitta', commonMedicines: ['Avipattikar Churna', 'Kamdudha Ras', 'Sutshekhar Ras'] },
    { name: 'Sandhigata Vata', type: 'Musculoskeletal', mainDosha: 'Vata', commonMedicines: ['Yograj Guggulu', 'Maharasnadi Kwath', 'Ashwagandha'] },
    { name: 'Madhumeha', type: 'Metabolic', mainDosha: 'Kapha', commonMedicines: ['Vasant Kusumakar Ras', 'Chandraprabha Vati', 'Nishamalaki'] },
    { name: 'Tamaka Shwasa', type: 'Respiratory', mainDosha: 'Kapha-Vata', commonMedicines: ['Sitopaladi Churna', 'Kanakasava', 'Pushkarmool'] }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Disease Manager</h1>
          <p className="page-subtitle">Configure protocols, pathya-apathya, and auto-suggest medicines for diseases.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}>
          <Plus size={18} /> Add Disease Protocol
        </button>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-input)' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search diseases (e.g. Amlapitta, Asthma)..." 
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
            />
          </div>
          <button className="btn btn-secondary"><Filter size={18} /> Category Filter</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {diseases.map((d, index) => (
            <div key={index} style={{ padding: '20px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: 'var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '4px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <BookOpen size={20} /> {d.name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.type} System</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${d.mainDosha === 'Pitta' ? 'badge-danger' : d.mainDosha === 'Vata' ? 'badge-primary' : 'badge-warning'}`}>
                    {d.mainDosha} Predominant
                  </span>
                  <button className="btn" style={{ padding: '4px' }}><Edit size={16} color="var(--text-muted)"/></button>
                </div>
              </div>
              
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Standard Protocol (Auto-suggests in Rx):</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {d.commonMedicines.map(m => (
                    <span key={m} style={{ padding: '4px 10px', background: 'var(--bg-input)', borderRadius: '20px', fontSize: '0.85rem' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
