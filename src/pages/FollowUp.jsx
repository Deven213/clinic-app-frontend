import { Clock, PhoneCall, Calendar as CalendarIcon, Search, User } from 'lucide-react';

export default function FollowUp() {
  const followups = [
    { name: 'Rajesh Sharma', diagnosis: 'Amlapitta', date: '2023-11-25', status: 'Pending', phone: '+91 9876543210' },
    { name: 'Priya Joshi', diagnosis: 'PCOS', date: '2023-11-26', status: 'Called', phone: '+91 9988776655' },
    { name: 'Sanjay Verma', diagnosis: 'Sandhigata Vata', date: '2023-11-20', status: 'Overdue', phone: '+91 9123456789' },
    { name: 'Kavita Patel', diagnosis: 'Hair Fall', date: '2023-12-01', status: 'Scheduled', phone: '+91 9871234567' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-up Management</h1>
          <p className="page-subtitle">Track returning patients and schedule reminder calls</p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="input-field" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-input)' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search upcoming follow-ups..." 
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
            />
          </div>
          <div className="input-field" style={{ display: 'flex', alignItems: 'center', width: '250px', background: 'var(--bg-input)' }}>
             <CalendarIcon size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
             <select style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }} defaultValue="7days">
               <option value="today" style={{ color: '#000' }}>Due Today</option>
               <option value="7days" style={{ color: '#000' }}>Next 7 Days</option>
               <option value="overdue" style={{ color: '#000' }}>Overdue</option>
             </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Primary Diagnosis</th>
              <th>Due Date</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {followups.map((f, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <span style={{ fontWeight: '600' }}>{f.name}</span>
                  </div>
                </td>
                <td>{f.diagnosis}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: f.status === 'Overdue' ? 'var(--danger)' : 'inherit' }}>
                    <Clock size={14} /> {f.date}
                  </span>
                </td>
                <td>{f.phone}</td>
                <td>
                  <span className={`badge ${f.status === 'Called' ? 'badge-success' : f.status === 'Overdue' ? 'badge-danger' : f.status === 'Scheduled' ? 'badge-primary' : 'badge-warning'}`}>
                    {f.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}><PhoneCall size={14} style={{ marginRight: '6px' }} /> Call Log</button>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Send SMS</button>
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
