import { Pill, AlertTriangle, Search, PlusCircle, ArrowDown, ArrowUp } from 'lucide-react';

export default function Inventory() {
  const stock = [
    { name: 'Triphala Guggulu', type: 'Tablet', brand: 'Baidyanath', quantity: 15, unit: 'Bottles', expiry: '2025-10', status: 'Low Stock' },
    { name: 'Avipattikar Churna', type: 'Powder', brand: 'Patanjali', quantity: 45, unit: 'Jars', expiry: '2024-05', status: 'In Stock' },
    { name: 'Chyawanprash', type: 'Avaleha', brand: 'Dabur', quantity: 2, unit: 'Jars', expiry: '2024-12', status: 'Critical' },
    { name: 'Kumaryasava', type: 'Liquid', brand: 'Kottakkal', quantity: 20, unit: 'Bottles', expiry: '2026-01', status: 'In Stock' },
    { name: 'Brahmi Vati', type: 'Tablet', brand: 'Dhootapapeshwar', quantity: 50, unit: 'Strips', expiry: '2025-08', status: 'In Stock' }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine Inventory</h1>
          <p className="page-subtitle">Track stock levels, expiries, and usage for in-clinic dispensing</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', gap: '8px' }}><ArrowUp size={18} /> Update Stock</button>
          <button className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}><PlusCircle size={18} /> Add New Medicine</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-info">
            <div className="stat-label">Total Items Tracked</div>
            <div className="stat-value">124</div>
          </div>
          <Pill size={40} color="var(--primary)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-info">
            <div className="stat-label">Low Stock Alerts</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>8</div>
          </div>
          <AlertTriangle size={40} color="var(--danger)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-info">
            <div className="stat-label">Stock Value</div>
            <div className="stat-value">₹45,200</div>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-input)' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine Name & Brand</th>
              <th>Formulation</th>
              <th>Quantity Available</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item, index) => (
              <tr key={index}>
                <td>
                  <div style={{ fontWeight: '600' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.brand}</div>
                </td>
                <td>{item.type}</td>
                <td>
                  <h3 style={{ margin: 0, color: item.status === 'Critical' ? 'var(--danger)' : item.status === 'Low Stock' ? 'var(--warning)' : 'inherit' }}>
                    {item.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{item.unit}</span>
                  </h3>
                </td>
                <td>{item.expiry}</td>
                <td>
                  <span className={`badge ${item.status === 'In Stock' ? 'badge-success' : item.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}><ArrowDown size={14} style={{ marginRight: '4px' }} /> Consume</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
