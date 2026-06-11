import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, FileEdit,
  BookOpen, IndianRupee, Pill, Clock, Activity,
  Stethoscope, ClipboardList, HeadphonesIcon, UserPlus, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

// Receptionist now has full feature parity with Doctor — all nav items are
// visible to both roles. The `roles` key is kept as a hook for future
// role-gating, but no item uses it currently.
const navItems = [
  { path: '/dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { path: '/appointments',label: 'Appointments',       icon: Calendar },
  { path: '/patients',    label: 'Patients',           icon: Users },
  { path: '/prescription',label: 'Prescriptions',      icon: FileEdit },
  { path: '/inventory',   label: 'Medicine Inventory', icon: Pill },
  { path: '/billing',     label: 'Billing & Payments', icon: IndianRupee },
  { path: '/follow-ups',  label: 'Follow-ups',         icon: Clock },
  { path: '/service',     label: 'Help & Support',     icon: HeadphonesIcon },
];

const ROLE_BADGES = {
  Doctor:       { icon: Stethoscope,   color: '#16a34a', bg: 'rgba(22,163,74,0.10)' },
  Receptionist: { icon: ClipboardList, color: '#059669', bg: 'rgba(5,150,105,0.10)' },
};

export default function Sidebar({ isOpen, onClose }) {
  const { role, userName, logout } = useAuth();
  const navigate = useNavigate();
  const badge = ROLE_BADGES[role] || ROLE_BADGES.Receptionist;
  const RoleIcon = badge.icon;

  const visible = navItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      {/* Brand + Role Badge aligned in header */}
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '4px', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(22,163,74,0.10)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="var(--primary)" strokeWidth={2} />
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', letterSpacing: '-0.02em' }}>
            MediCore
          </span>
        </div>
        {role && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '2px' }}>
            <RoleIcon size={12} color={badge.color} />
            <span style={{ fontSize: '0.7rem', color: badge.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{role}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>· {userName || 'Staff'}</span>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {visible.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <item.icon size={20} strokeWidth={2.2} />
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <div className="nav-icon-container" style={{ background: 'rgba(239,68,68,0.08)' }}>
            <LogOut size={18} strokeWidth={2.2} color="#ef4444" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
