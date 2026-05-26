import { Bell, Search, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New appointment requested by Rajesh', time: '5m ago' },
    { id: 2, text: 'Low stock alert: Ashwagandha Churna', time: '1h ago' },
    { id: 3, text: 'Follow-up reminder for Patient #102', time: '2h ago' }
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAllAsRead = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  return (
    <header className="top-header">
      <div className="search-bar" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#ffffff', 
        padding: '12px 20px', 
        borderRadius: '16px', 
        width: '450px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        transition: 'var(--transition)'
      }}>
        <Search size={20} color="var(--primary)" style={{ marginRight: '12px' }} strokeWidth={2.5} />
        <input 
          type="text" 
          placeholder="Search patients, phone, appointments..." 
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: '500' }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button style={{ position: 'relative' }} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} color="var(--text-main)" />
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger)', width: '10px', height: '10px', borderRadius: '50%' }}></span>
            )}
          </button>
          
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '320px',
              padding: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h3 style={{ margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)', fontSize: '1rem' }}>Notifications</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length > 0 ? notifications.map(notif => (
                  <div key={notif.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', background: 'var(--bg-muted)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.9rem' }}>{notif.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.time}</div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No new notifications
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <button className="btn btn-outline" style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }} onClick={handleMarkAllAsRead}>
                  Mark all as read
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Dr. Ayurveda</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chief Practitioner</div>
          </div>
          <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="#fff" />
          </div>
        </div>
      </div>
    </header>
  );
}
