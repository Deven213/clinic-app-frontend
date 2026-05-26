import { Calendar as CalendarIcon, Clock, UserCheck, PhoneCall, Plus } from 'lucide-react';

export default function Appointments() {
  const appointments = [
    { id: 1, time: '09:00 AM', name: 'Rajesh Sharma', type: 'Follow Up', status: 'Waiting' },
    { id: 2, time: '09:30 AM', name: 'Priya Joshi', type: 'New Consult', status: 'Consulting' },
    { id: 3, time: '10:00 AM', name: 'Sanjay Verma', type: 'Prakriti Parikshan', status: 'Scheduled' },
    { id: 4, time: '10:30 AM', name: 'Kavita Patel', type: 'Follow Up', status: 'Scheduled' },
    { id: 5, time: '11:00 AM', name: 'Anil Desai', type: 'Nadi Pariksha', status: 'Rescheduled' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage today's schedule and queue system</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}>
          <Plus size={18} /> Book Appointment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3><CalendarIcon size={20} style={{ display: 'inline', marginRight: '8px' }} /> Schedule Calendar</h3>
          {/* Calendar placeholder */}
          <div style={{ background: 'var(--bg-muted)', padding: '20px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>November 2023</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '16px' }}>
              {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{ fontWeight: 'bold' }}>{d}</div>)}
              {Array.from({length: 30}, (_, i) => (
                <div key={i} style={{ padding: '8px', background: i === 15 ? 'var(--primary)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer' }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-outline" style={{ width: '100%', marginBottom: '12px' }}><Clock size={18} style={{ marginRight: '8px' }} /> Doctor Availability</button>
            <button className="btn btn-secondary" style={{ width: '100%' }}><PhoneCall size={18} style={{ marginRight: '8px' }} /> Auto-Reminders (WhatsApp)</button>
          </div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Today's Queue (Tokens)</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span className="badge badge-success">2 Complete</span>
              <span className="badge badge-warning">1 Consulting</span>
              <span className="badge badge-primary">5 Waiting</span>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Time & Token</th>
                <th>Patient Name</th>
                <th>Consultation Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt, index) => (
                <tr key={apt.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{apt.time}</div>
                    <div className="badge" style={{ display: 'inline-block', marginTop: '4px', background: 'var(--bg-card-alt)' }}>Token #{index + 1}</div>
                  </td>
                  <td>{apt.name}</td>
                  <td>{apt.type}</td>
                  <td>
                    <span className={`badge ${apt.status === 'Waiting' ? 'badge-primary' : apt.status === 'Consulting' ? 'badge-warning' : apt.status === 'Scheduled' ? 'badge-success' : 'badge-danger'}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    {apt.status !== 'Consulting' ? (
                      <button className="btn btn-outline" style={{ padding: '6px 16px' }}>Start</button>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: '6px 16px' }}><UserCheck size={16} /> Finish</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
