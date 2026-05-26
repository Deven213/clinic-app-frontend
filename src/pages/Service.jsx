import { useState, useRef } from 'react';
import { Send, CheckCircle, AlertCircle, Headphones, Mail, MessageSquare, User, HelpCircle, Clock, ShieldCheck } from 'lucide-react';

const API = 'https://medical-project-h6yc.vercel.app';

const FAQ = [
  { q: 'How do I add a new patient?', a: 'Go to the Patients page and click "Add Patient". Fill in the required details and save.' },
  { q: 'How do follow-up reminders work?', a: 'When you save a prescription with a follow-up date, a follow-up record is created automatically. You can send WhatsApp reminders directly from the Follow-ups page.' },
  { q: 'Can I export billing records?', a: 'Yes — on the Billing & Payments page you can view all invoices. Print-to-PDF is available from any prescription detail.' },
  { q: 'How do I update medicine stock?', a: 'Open Medicine Inventory, click on the quantity cell for any item and type the new value. It saves automatically on blur.' },
];

export default function Service() {
  const [form, setForm]       = useState({ from_name: '', from_email: '', message: '' });
  const [status, setStatus]   = useState('idle'); // idle | sending | success | error
  const [errMsg, setErrMsg]   = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.from_name.trim() || !form.from_email.trim() || !form.message.trim()) return;

    setStatus('sending');
    setErrMsg('');
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setForm({ from_name: '', from_email: '', message: '' });
      } else {
        setStatus('error');
        setErrMsg(data.error || 'Failed to send. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrMsg('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Help &amp; Support</h1>
          <p className="page-subtitle">Get in touch with the MediCore team — we're here to help</p>
        </div>
      </div>

      {/* Top info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { icon: Headphones, title: 'Live Support',   desc: 'Available Mon–Sat, 9 AM – 6 PM',  color: '#16a34a', bg: '#f0fdf4' },
          { icon: Clock,      title: 'Response Time',  desc: 'We reply within 24 hours',         color: '#1d4ed8', bg: '#eff6ff' },
          { icon: ShieldCheck,title: 'Data Privacy',   desc: 'All data stays private & secure',  color: '#7c3aed', bg: '#f5f3ff' },
        ].map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '18px 20px' }}>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '3px' }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── Contact form ── */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Accent bar */}
          <div style={{ height: 5, background: 'linear-gradient(90deg,#15803d,#16a34a,#22c55e)' }} />
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Send us a Message</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>We'll get back to you shortly</div>
              </div>
            </div>

            {/* Success banner */}
            {status === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                <CheckCircle size={18} color="#16a34a" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#15803d' }}>Message sent successfully!</div>
                  <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>We've received your request and will respond soon.</div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: '0.83rem', color: '#dc2626' }}>{errMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <User size={13} /> Your Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="input-field"
                  type="text"
                  name="from_name"
                  placeholder="Dr. Riya Shah"
                  value={form.from_name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <Mail size={13} /> Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="input-field"
                  type="email"
                  name="from_email"
                  placeholder="you@example.com"
                  value={form.from_email}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Issue */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <MessageSquare size={13} /> Issue Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="input-field"
                  name="message"
                  placeholder="Describe your issue or question in detail…"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ width: '100%', resize: 'vertical', minHeight: '120px', lineHeight: 1.6 }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'sending'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {status === 'sending' ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send Message
                  </>
                )}
              </button>
            </form>

            {/* Direct contact note */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Or email directly:{' '}
                <a href="mailto:janavipatel2002@gmail.com" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                  janavipatel2002@gmail.com
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 5, background: 'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)' }} />
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={18} color="#1d4ed8" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Frequently Asked</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick answers to common questions</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                    borderColor: openFaq === i ? '#86efac' : 'var(--border-color)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '13px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: openFaq === i ? '#f0fdf4' : 'transparent',
                      fontSize: '0.87rem', fontWeight: 600, color: 'var(--text-main)',
                      cursor: 'pointer', border: 'none', transition: 'background 0.15s',
                    }}
                  >
                    {item.q}
                    <span style={{
                      marginLeft: 12, flexShrink: 0, fontSize: '1.1rem', lineHeight: 1,
                      color: openFaq === i ? '#16a34a' : 'var(--text-muted)',
                      transform: openFaq === i ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.2s, color 0.15s',
                      display: 'inline-block',
                    }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '10px 16px 14px', fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6, background: '#f9fffe', borderTop: '1px solid #dcfce7' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still need help */}
            <div style={{ marginTop: '20px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#15803d', marginBottom: '4px' }}>Still need help?</div>
              <div style={{ fontSize: '0.8rem', color: '#16a34a', lineHeight: 1.6 }}>
                Use the contact form to describe your issue in detail and our team will assist you as soon as possible.
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
