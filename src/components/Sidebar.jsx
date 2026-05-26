import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileEdit, 
  BookOpen, 
  IndianRupee, 
  Pill, 
  Clock, 
  Activity 
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/prescription', label: 'Prescriptions', icon: FileEdit },
  { path: '/diseases', label: 'Disease Manager', icon: BookOpen },
  { path: '/inventory', label: 'Medicine Inventory', icon: Pill },
  { path: '/billing', label: 'Billing & Payments', icon: IndianRupee },
  { path: '/follow-ups', label: 'Follow-ups', icon: Clock },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ gap: '14px', paddingTop: '20px', paddingBottom: '20px', height: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={26} color="var(--primary)" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '1.25rem', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', color: 'transparent', fontWeight: '800' }}>AyurClinic</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
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
    </aside>
  );
}
