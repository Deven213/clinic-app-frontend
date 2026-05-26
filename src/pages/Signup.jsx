import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2, User, Stethoscope, ClipboardList, Activity, Shield, Heart } from 'lucide-react';

const FONT = "'Inter', system-ui, sans-serif";

const ROLES = [
  {
    value: 'Doctor',
    label: 'Doctor',
    desc: 'Can view & create prescriptions, diagnose patients',
    icon: Stethoscope,
    color: '#16a34a',
  },
  {
    value: 'Receptionist',
    label: 'Receptionist',
    desc: 'Can book appointments & manage patient info',
    icon: ClipboardList,
    color: '#059669',
  },
];

export default function Signup() {
  const { signupWithEmail, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [selectedRole, setSelectedRole] = useState('Doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!isFirebaseConfigured) { setError('Firebase is not configured. Add your .env file and restart.'); return; }
    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await signupWithEmail(form.name.trim(), form.email, form.password, selectedRole);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 12px 12px 42px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.925rem',
    color: '#111827',
    outline: 'none',
    fontFamily: FONT,
    background: '#fafafa',
    transition: 'border-color 0.2s, background 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
    fontFamily: FONT,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: FONT }}>

      {/* Left branding panel */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #16a34a 0%, #0f5f30 60%, #064e25 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '80px', height: '80px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '28px',
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}>
            <Activity size={38} color="white" strokeWidth={1.8} />
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', textAlign: 'center' }}>
            MediCore
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: '1.6', margin: '0 0 48px', maxWidth: '260px' }}>
            Join our team and help deliver world-class healthcare
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', maxWidth: '260px' }}>
            {[
              { icon: Stethoscope, text: 'Doctor — Clinical access & prescriptions' },
              { icon: ClipboardList, text: 'Receptionist — Appointments & records' },
              { icon: Shield, text: 'Secure role-based access control' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                </div>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Medical team illustration */}
          <div style={{ marginTop: '36px', opacity: 0.85 }}>
            <svg width="210" height="150" viewBox="0 0 210 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Ground shadow */}
              <ellipse cx="105" cy="143" rx="70" ry="7" fill="rgba(255,255,255,0.07)"/>
              {/* Doctor 1 (left) */}
              <circle cx="72" cy="48" r="20" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
              <circle cx="67" cy="45" r="2.5" fill="rgba(255,255,255,0.6)"/>
              <circle cx="77" cy="45" r="2.5" fill="rgba(255,255,255,0.6)"/>
              <path d="M67 55 Q72 59 77 55" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M52 82 Q48 104 46 130 L98 130 Q96 104 92 82 Q82 89 72 89 Q62 89 52 82Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
              <rect x="66" y="68" width="12" height="16" rx="6" fill="rgba(255,255,255,0.22)"/>
              {/* Stethoscope doctor 1 */}
              <path d="M60 92 Q56 106 58 116 Q60 124 67 125 Q76 127 79 118 Q82 108 79 96" stroke="rgba(255,255,255,0.65)" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="79" cy="95" r="4" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5"/>
              <circle cx="67" cy="126" r="3" fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
              {/* Doctor 2 (right) */}
              <circle cx="138" cy="48" r="20" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
              <circle cx="133" cy="45" r="2.5" fill="rgba(255,255,255,0.6)"/>
              <circle cx="143" cy="45" r="2.5" fill="rgba(255,255,255,0.6)"/>
              <path d="M133 55 Q138 59 143 55" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M118 82 Q114 104 112 130 L164 130 Q162 104 158 82 Q148 89 138 89 Q128 89 118 82Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
              <rect x="132" y="68" width="12" height="16" rx="6" fill="rgba(255,255,255,0.22)"/>
              {/* Clipboard doctor 2 */}
              <rect x="150" y="88" width="22" height="32" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              <rect x="156" y="84" width="10" height="6" rx="2" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
              <line x1="153" y1="100" x2="170" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
              <line x1="153" y1="107" x2="170" y2="107" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
              <line x1="153" y1="114" x2="163" y2="114" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
              {/* Center cross */}
              <rect x="100" y="70" width="10" height="30" rx="4" fill="rgba(255,255,255,0.0)"/>
              <circle cx="105" cy="95" r="16" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
              <rect x="102.5" y="88" width="5" height="14" rx="2" fill="rgba(255,255,255,0.8)"/>
              <rect x="98" y="92.5" width="14" height="5" rx="2" fill="rgba(255,255,255,0.8)"/>
              {/* Heartbeat */}
              <path d="M18 143 L38 143 L44 133 L50 153 L56 127 L62 143 L192 143" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1,
        background: '#f8faf9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
            Create Account
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 28px' }}>
            Register as MediCore
          </p>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', borderRadius: '10px',
              padding: '10px 14px', marginBottom: '20px',
              fontSize: '0.875rem', fontFamily: FONT,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="text" required value={form.name} onChange={update('name')}
                  placeholder="Enter your full name" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="email" required value={form.email} onChange={update('email')}
                  placeholder="doctor@clinic.com" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={form.password} onChange={update('password')}
                    placeholder="Min 6 chars" style={{ ...inputStyle, paddingRight: '40px' }}
                    onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'} required value={form.confirm} onChange={update('confirm')}
                    placeholder="Re-enter" style={{ ...inputStyle, paddingRight: '40px' }}
                    onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label style={labelStyle}>Select Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ROLES.map(({ value, label, desc, icon: Icon, color }) => (
                  <label key={value} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                    border: selectedRole === value ? `2px solid ${color}` : '2px solid #e5e7eb',
                    background: selectedRole === value ? `${color}12` : 'white',
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="role" value={value} checked={selectedRole === value}
                      onChange={() => setSelectedRole(value)} style={{ display: 'none' }} />
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                      background: selectedRole === value ? color : '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      <Icon size={18} color={selectedRole === value ? '#fff' : '#6b7280'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedRole === value ? color : '#111827', fontFamily: FONT }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '1px', fontFamily: FONT }}>{desc}</div>
                    </div>
                    {selectedRole === value && (
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: color, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#86efac' : 'linear-gradient(135deg, #16a34a, #15803d)',
                color: 'white', border: 'none', borderRadius: '10px',
                padding: '13px', fontSize: '0.95rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '4px', fontFamily: FONT,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(22,163,74,0.35)',
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? <><Loader2 size={17} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: '#6b7280', fontFamily: FONT }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
  };
  return map[code] || 'Sign-up failed. Please try again.';
}
