import { X, CheckCircle, AlertCircle, HelpCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * Modal — Doctor-Appointment-Form-inspired popup.
 * Features: green accent bar, large bold title, blurred dark overlay,
 * smooth scale-in animation. Use current green color theme.
 *
 * Rendered via Portal to document.body. Reason: the page wrappers use
 * `animate-fade-in` whose keyframe ends with `transform: translateY(0)`.
 * Because of `animation-fill-mode: forwards`, that transform stays applied
 * permanently — and any `transform` on an ancestor creates a new containing
 * block for fixed-positioned descendants, which would break `inset: 0` (the
 * modal would be sized to the wrapper, not the viewport). Portalling to
 * document.body sidesteps every ancestor entirely.
 */
export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = '520px', icon }) {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal((
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,20,15,0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth,
          background: 'white',
          borderRadius: '18px',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          animation: 'modalPopIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* Top green accent bar */}
        <div style={{ height: '5px', background: 'linear-gradient(90deg,#15803d,#16a34a,#22c55e)' }} />

        {/* Header */}
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon && (
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {icon}
              </div>
            )}
            <h3 style={{
              margin: 0,
              fontSize: '1.15rem', fontWeight: 800,
              color: '#0f172a', letterSpacing: '-0.02em',
            }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '9px',
              border: '1px solid #e2e8f0', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — block layout. Body has its OWN maxHeight + overflowY:auto
            so the modal panel itself stays the natural size of its content
            (no flex stretch → no empty space below) while the body scrolls
            internally if it would push past the viewport. */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 28px',
            borderTop: '1px solid #f1f5f9',
            background: '#f8fafc',
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
          }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalPopIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);     }
        }
      `}</style>
    </div>
  ), document.body);
}

/** Convenience helper — renders icon + message inside a Modal */
export function AlertModal({ isOpen, onClose, title, message, type = 'info', showConfirm = false, onConfirm }) {
  const iconMap = {
    success: <CheckCircle size={22} />,
    danger:  <AlertCircle size={22} />,
    warning: <HelpCircle  size={22} />,
    info:    <Info        size={22} />,
  };
  const colorMap = {
    success: { bg: 'rgba(22,163,74,0.12)',  color: '#16a34a' },
    danger:  { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
    info:    { bg: 'rgba(14,165,233,0.1)',  color: '#0ea5e9' },
  };
  const c = colorMap[type] || colorMap.info;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="460px"
      footer={
        showConfirm ? (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              style={type === 'danger' ? { background: '#ef4444', color: 'white', border: 'none' } : {}}
              onClick={onConfirm}
            >
              Confirm
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onClose}>Okay</button>
        )
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: c.bg, color: c.color,
        }}>
          {iconMap[type]}
        </div>
        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.6, paddingTop: '2px' }}>
          {message}
        </div>
      </div>
    </Modal>
  );
}
