import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Camera, Edit3, Save, X,
  ArrowLeft, LogOut, Phone, MapPin, Calendar, Stethoscope,
  ClipboardList, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { saveUserProfile, readUserProfile } from '../context/AuthContext.jsx';

const API = 'https://medical-project-h6yc.vercel.app';

const AVATAR_KEY = (uid) => `ayurclinic_avatar_${uid}`;

const ROLE_META = {
  Doctor:       { icon: Stethoscope,   color: '#16a34a', bg: 'rgba(22,163,74,0.12)', label: 'Doctor' },
  Receptionist: { icon: ClipboardList, color: '#059669', bg: 'rgba(5,150,105,0.12)', label: 'Receptionist' },
  Admin:        { icon: Shield,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  label: 'Admin' },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, role, userName, logout, authFetch } = useAuth();

  const fileInputRef = useRef(null);

  // ── Avatar (base64 in localStorage) ─────────────────────────────────────────
  const [avatarSrc, setAvatarSrc] = useState(() => {
    if (!user?.uid) return null;
    return localStorage.getItem(AVATAR_KEY(user.uid)) || user?.photoURL || null;
  });

  // ── Edit mode ────────────────────────────────────────────────────────────────
  const [editing, setEditing]   = useState(false);
  const [editName, setEditName] = useState(userName || '');
  const [editRole, setEditRole] = useState(role || 'Doctor');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saved, setSaved]       = useState(false);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ patients: 0, appointments: 0, prescriptions: 0 });
  const [firstApptDate, setFirstApptDate] = useState(null);

  useEffect(() => {
    const extra = user?.uid ? readUserProfile(user.uid) : null;
    setEditPhone(extra?.phone || '');
    setEditAddress(extra?.address || '');
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pR, aR, rxR] = await Promise.all([
          authFetch(`${API}/api/patients?limit=1`),
          authFetch(`${API}/api/appointments?limit=500`),
          authFetch(`${API}/api/prescriptions?limit=1`),
        ]);
        const [pD, aD, rxD] = await Promise.all([pR.json(), aR.json(), rxR.json()]);
        setStats({
          patients:      pD.total      ?? (Array.isArray(pD)  ? pD.length  : 0),
          appointments:  aD.total      ?? (Array.isArray(aD.appointments) ? aD.appointments.length : Array.isArray(aD) ? aD.length : 0),
          prescriptions: rxD.total     ?? (Array.isArray(rxD) ? rxD.length : 0),
        });
        // Find earliest appointment date
        const appts = Array.isArray(aD.appointments) ? aD.appointments : Array.isArray(aD) ? aD : [];
        if (appts.length > 0) {
          const oldest = appts.reduce((min, a) => new Date(a.createdAt) < new Date(min.createdAt) ? a : min, appts[0]);
          setFirstApptDate(oldest.date || oldest.createdAt);
        }
      } catch { /* silently ignore */ }
    };
    fetchStats();
  }, [authFetch]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setAvatarSrc(base64);
      if (user?.uid) localStorage.setItem(AVATAR_KEY(user.uid), base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!user?.uid) return;
    saveUserProfile(user.uid, {
      name:    editName.trim() || userName,
      role:    editRole,
      phone:   editPhone.trim(),
      address: editAddress.trim(),
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Force page reload so Sidebar / Header pick up new name
    window.location.reload();
  };

  const handleCancel = () => {
    setEditName(userName || '');
    setEditRole(role || 'Doctor');
    setEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleMeta  = ROLE_META[editRole] || ROLE_META.Doctor;
  const RoleIcon  = roleMeta.icon;
  const memberSince = firstApptDate
    ? new Date(firstApptDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your account details and preferences</p>
          </div>
        </div>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', animation: 'fadeIn 0.3s ease' }}>
            <CheckCircle size={18} /> Profile saved!
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ══ LEFT — Avatar Card ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '32px 24px' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
              <div style={{
                width: '110px', height: '110px', borderRadius: '50%',
                background: 'var(--bg-muted)',
                border: '4px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', margin: '0 auto',
                boxShadow: '0 0 0 6px rgba(22,163,74,0.12)',
              }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={52} color="var(--primary)" />
                }
              </div>
              {/* Camera overlay */}
              <button
                onClick={handleAvatarClick}
                title="Change photo"
                style={{
                  position: 'absolute', bottom: '4px', right: '4px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--primary)', border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={15} color="white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {/* Name & Role badge */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              {userName || 'User'}
            </h2>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '20px',
              background: roleMeta.bg, color: roleMeta.color,
              fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px',
            }}>
              <RoleIcon size={14} /> {roleMeta.label}
            </div>

            {/* Email */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', wordBreak: 'break-all' }}>
              {user?.email || '—'}
            </div>

            {/* Sign out */}
            <button
              className="btn btn-outline"
              onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ef4444', borderColor: '#fca5a5' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          {/* Stats card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              Activity Overview
            </h3>
            {[
              { label: 'Total Patients',      value: stats.patients,      color: '#16a34a' },
              { label: 'Appointments',         value: stats.appointments,  color: '#059669' },
              { label: 'Prescriptions Issued', value: stats.prescriptions, color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT — Details ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Personal Info */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="var(--primary)" /> Personal Information
              </h3>
              {!editing
                ? (
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setEditing(true)}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )
                : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleSave}>
                      <Save size={14} /> Save
                    </button>
                    <button className="btn btn-outline" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleCancel}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )
              }
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Full Name */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} /> Full Name
                </label>
                {editing
                  ? <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} />
                  : <div className="input-field" style={{ background: 'var(--bg-muted)', color: 'var(--text-main)', padding: '10px 14px', cursor: 'default' }}>{userName || '—'}</div>
                }
              </div>

              {/* Email (read-only) */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} /> Email Address
                </label>
                <div className="input-field" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '10px 14px', cursor: 'not-allowed', fontSize: '0.88rem' }}>
                  {user?.email || '—'}
                </div>
              </div>

              {/* Role */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={13} /> Role
                </label>
                {editing
                  ? (
                    <select className="input-field" value={editRole} onChange={e => setEditRole(e.target.value)} style={{ appearance: 'auto' }}>
                      <option value="Doctor">Doctor</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Admin">Admin</option>
                    </select>
                  )
                  : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: roleMeta.bg, color: roleMeta.color, fontSize: '0.88rem', fontWeight: 600 }}>
                      <RoleIcon size={14} /> {role || '—'}
                    </div>
                  )
                }
              </div>

              {/* Phone */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} /> Phone Number
                </label>
                {editing
                  ? <input className="input-field" type="tel" placeholder="e.g. 9876543210" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                  : <div className="input-field" style={{ background: 'var(--bg-muted)', color: 'var(--text-main)', padding: '10px 14px', cursor: 'default' }}>{editPhone || '—'}</div>
                }
              </div>

              {/* Address — full width */}
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} /> Clinic / Address
                </label>
                {editing
                  ? <input className="input-field" placeholder="Clinic or home address" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                  : <div className="input-field" style={{ background: 'var(--bg-muted)', color: 'var(--text-main)', padding: '10px 14px', cursor: 'default' }}>{editAddress || '—'}</div>
                }
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Shield size={18} color="var(--primary)" /> Account Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { icon: Mail,     label: 'Login Email',        value: user?.email || '—' },
                { icon: Calendar, label: 'First Appointment',  value: memberSince },
              ].map(item => (
                <div key={item.label} style={{ padding: '14px 16px', background: 'var(--bg-muted)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <item.icon size={18} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.label}</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, marginTop: '3px' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
