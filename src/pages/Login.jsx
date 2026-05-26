import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle, Heart, Shield, Users, Activity, Stethoscope, ClipboardList } from 'lucide-react';

const FONT = "'Inter', system-ui, sans-serif";

const ROLES = [
  { value: 'Doctor',       label: 'Doctor',       desc: 'Clinical access — prescriptions & diagnosis', icon: Stethoscope,   color: '#16a34a' },
  { value: 'Receptionist', label: 'Receptionist', desc: 'Front-desk — appointments & patient records',  icon: ClipboardList, color: '#059669' },
];

export default function Login() {
  const { loginWithEmail, loginWithGoogle, setupNewUser, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]               = useState('login'); // 'login' | 'role-select'
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]             = useState('');
  const [selectedRole, setSelectedRole] = useState('Doctor');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured) { setError('Firebase is not configured. Add your .env file and restart.'); return; }
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) { setError('Firebase is not configured. Add your .env file and restart.'); return; }
    if (googleLoading) { setGoogleLoading(false); return; }
    setError('');
    setGoogleLoading(true);
    const timeout = setTimeout(() => setGoogleLoading(false), 60_000);
    try {
      const { isNewUser } = await loginWithGoogle();
      clearTimeout(timeout);
      if (isNewUser) {
        // Brand-new Google user — ask them to pick a role before entering the app
        setStep('role-select');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(friendlyError(err.code));
      }
    } finally {
      clearTimeout(timeout);
      setGoogleLoading(false);
    }
  };

  const handleRoleConfirm = () => {
    setupNewUser(selectedRole);
    navigate('/dashboard');
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

  // ── Role-selection screen (shown to brand-new Google users only) ─────────────
  if (step === 'role-select') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#f0fdf4,#dcfce7)', fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: '460px', background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          {/* Accent bar */}
          <div style={{ height: 5, background: 'linear-gradient(90deg,#15803d,#16a34a,#22c55e)' }} />
          <div style={{ padding: '36px 40px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: 60, height: 60, borderRadius: '16px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Activity size={28} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                Welcome to MediCore!
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0 }}>
                You're almost in. Please select your role to continue.
              </p>
            </div>

            {/* Role cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {ROLES.map(({ value, label, desc, icon: Icon, color }) => (
                <label key={value} onClick={() => setSelectedRole(value)} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 18px', borderRadius: '12px', cursor: 'pointer',
                  border: selectedRole === value ? `2px solid ${color}` : '2px solid #e5e7eb',
                  background: selectedRole === value ? `${color}10` : 'white',
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
                    background: selectedRole === value ? color : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={20} color={selectedRole === value ? '#fff' : '#9ca3af'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: selectedRole === value ? color : '#111827' }}>{label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>{desc}</div>
                  </div>
                  {selectedRole === value && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>
                    </div>
                  )}
                </label>
              ))}
            </div>

            {/* Confirm button */}
            <button
              onClick={handleRoleConfirm}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                fontFamily: FONT, letterSpacing: '0.01em',
              }}
            >
              Continue as {selectedRole} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: FONT,
    }}>
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
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo */}
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
            Complete clinic management for modern healthcare
          </p>

          {/* Medical Illustration */}
          <div style={{ marginBottom: '36px' }}>
            <svg width="200" height="168" viewBox="0 0 200 168" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Soft glow circles */}
              <circle cx="100" cy="84" r="72" fill="rgba(255,255,255,0.03)"/>
              <circle cx="100" cy="84" r="52" fill="rgba(255,255,255,0.03)"/>
              {/* Stethoscope — left eartip */}
              <circle cx="45" cy="22" r="8" fill="rgba(255,255,255,0.45)"/>
              <path d="M45 30 L45 52" stroke="rgba(255,255,255,0.75)" strokeWidth="5.5" strokeLinecap="round"/>
              {/* Stethoscope — right eartip */}
              <circle cx="155" cy="22" r="8" fill="rgba(255,255,255,0.45)"/>
              <path d="M155 30 L155 52" stroke="rgba(255,255,255,0.75)" strokeWidth="5.5" strokeLinecap="round"/>
              {/* Binaural arch */}
              <path d="M45 52 Q45 88 100 88 Q155 88 155 52" stroke="rgba(255,255,255,0.75)" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
              {/* Tube down */}
              <path d="M100 88 Q100 114 118 124 Q134 132 136 118 Q138 104 124 101 Q112 98 106 110" stroke="rgba(255,255,255,0.75)" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
              {/* Chest piece outer ring */}
              <circle cx="100" cy="112" r="20" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5"/>
              {/* Chest piece inner ring */}
              <circle cx="100" cy="112" r="11" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
              {/* Chest piece center dot */}
              <circle cx="100" cy="112" r="4" fill="rgba(255,255,255,0.6)"/>
              {/* ECG / heartbeat line */}
              <path d="M6 150 L38 150 L50 129 L60 166 L71 138 L82 150 L194 150" stroke="rgba(255,255,255,0.42)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Medical cross (decorative, top-right) */}
              <rect x="172" y="28" width="6" height="22" rx="3" fill="rgba(255,255,255,0.28)"/>
              <rect x="164" y="36" width="22" height="6" rx="3" fill="rgba(255,255,255,0.28)"/>
              {/* Heart (decorative, top-left) */}
              <path d="M18 42 Q18 33 26 33 Q34 33 34 42 Q34 51 26 58 Q18 51 18 42Z" fill="rgba(255,255,255,0.22)"/>
              {/* Pill (decorative, bottom-left) */}
              <ellipse cx="24" cy="98" rx="16" ry="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" transform="rotate(-30 24 98)"/>
              <line x1="15" y1="90" x2="33" y2="106" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
            </svg>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', maxWidth: '260px' }}>
            {[
              { icon: Users, text: 'Patient & Appointment Management' },
              { icon: Heart, text: 'Prescriptions & Follow-ups' },
              { icon: Shield, text: 'Secure & Role-based Access' },
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
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 32px' }}>
            Sign in to your clinic account
          </p>

          {/* Firebase warning */}
          {!isFirebaseConfigured && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fcd34d',
              color: '#92400e', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '20px',
              fontSize: '0.82rem', lineHeight: '1.6', fontFamily: FONT,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={15} /> Firebase Not Configured
              </div>
              Create a <code>.env</code> file with your Firebase keys, then restart the dev server.
            </div>
          )}

          {/* Error */}
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

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
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
              {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontFamily: FONT }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%', padding: '12px',
              border: `1.5px solid ${googleLoading ? '#86efac' : '#e5e7eb'}`,
              borderRadius: '10px',
              background: googleLoading ? '#f0fdf4' : 'white',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              fontSize: '0.925rem', fontWeight: 600, color: '#374151',
              fontFamily: FONT,
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { if (!googleLoading) { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = googleLoading ? '#86efac' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {googleLoading ? (
              <>
                <Loader2 size={17} className="animate-spin" color="#16a34a" />
                <span style={{ color: '#16a34a' }}>Opening Google…</span>
                <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 2 }}>(click to cancel)</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/>
                  <path fill="#FBBC05" d="M10.6 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l8-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-8 6.1C6.7 42.6 14.7 48 24 48z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', marginTop: '24px', fontFamily: FONT }}>
            New staff member?{' '}
            <Link to="/signup" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase. Go to Firebase Console → Authentication → Settings → Authorized Domains.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in methods.',
    'auth/popup-blocked': 'Popup was blocked by the browser. Please allow popups for this site.',
    'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
    'auth/internal-error': 'Firebase internal error. Check that your Firebase environment variables are correct.',
  };
  return map[code] || `Sign-in failed (${code || 'unknown'}). Please try again.`;
}
