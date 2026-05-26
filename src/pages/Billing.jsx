import { IndianRupee, FileText, Download, CheckCircle, Search } from 'lucide-react';

export default function Billing() {
  const bills = [
    { id: 'INV-1024', patient: 'Rajesh Sharma', date: '2023-11-20', amount: 850, status: 'Paid', type: 'Consultation + Medicine' },
    { id: 'INV-1025', patient: 'Priya Joshi', date: '2023-11-20', amount: 500, status: 'Pending', type: 'Consultation' },
    { id: 'INV-1026', patient: 'Sanjay Verma', date: '2023-11-19', amount: 1200, status: 'Paid', type: 'Panchakarma (Basti)' },
    { id: 'INV-1027', patient: 'Kavita Patel', date: '2023-11-18', amount: 1500, status: 'Paid', type: 'Medicines' },
    { id: 'INV-1028', patient: 'Anil Desai', date: '2023-11-18', amount: 600, status: 'Paid', type: 'Consultation' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Payments</h1>
          <p className="page-subtitle">Manage invoices, collect payments, and track revenue</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}>
          <IndianRupee size={18} /> Generate Invoice
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Revenue (This Month)</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>₹1,24,500</div>
          </div>
          <IndianRupee size={40} color="var(--success)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Payments</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>₹4,500</div>
          </div>
          <FileText size={40} color="var(--warning)" style={{ position: 'absolute', right: '20px', opacity: 0.2 }} />
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Invoices Generated</div>
            <div className="stat-value">185</div>
          </div>
          <CheckCircle size={40} color="var(--text-main)" style={{ position: 'absolute', right: '20px', opacity: 0.1 }} />
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-input)' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search by Invoice ID or Patient Name..." 
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
            />
          </div>
        </div>

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
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td><span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{bill.id}</span></td>
                <td>{bill.patient}</td>
                <td>{bill.date}</td>
                <td>{bill.type}</td>
                <td style={{ fontWeight: '600' }}>₹{bill.amount}</td>
                <td>
                  <span className={`badge ${bill.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                    {bill.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}><FileText size={14} /></button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}><Download size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
