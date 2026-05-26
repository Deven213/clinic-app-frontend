import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * CustomSelect — card-style dropdown matching Dashboard filter style.
 *
 * Props:
 *  value       — current selected value (string)
 *  onChange    — (value) => void
 *  options     — [{ value, label, color?, bg? }]
 *  placeholder — shown when nothing selected
 *  minWidth    — trigger button min-width (default '140px')
 *  width       — full width override (e.g. '100%')
 *  style       — extra styles on the wrapper
 *  matchInput  — use same padding as .input-field (12px 16px) for height consistency
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  minWidth = '140px',
  width,
  style = {},
  matchInput = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));
  const hasValue = value !== '' && value !== null && value !== undefined;

  return (
    <div ref={ref} style={{ position: 'relative', width: width || undefined, ...style }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: matchInput ? '12px 16px' : '7px 14px',
          // matchInput: always look like a regular .input-field — neutral bg, normal border, normal text
          border: matchInput
            ? `1px solid var(--border-color, #e2e8f0)`
            : `1.5px solid ${hasValue ? (selected?.color || '#86efac') : 'var(--border-color)'}`,
          borderRadius: matchInput ? '8px' : '10px',
          background: matchInput
            ? 'var(--bg-muted, #f3f4f6)'
            : hasValue ? (selected?.bg || '#f0fdf4') : 'var(--bg-input, #f9fafb)',
          color: matchInput
            ? 'var(--text-main)'
            : hasValue ? (selected?.color || '#16a34a') : 'var(--text-muted)',
          fontSize: '0.83rem', fontWeight: 400,
          cursor: 'pointer', outline: 'none',
          minWidth: width ? undefined : minWidth,
          width: width || undefined,
          justifyContent: 'space-between',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={13}
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          zIndex: 400,
          minWidth: width || minWidth,
          padding: '6px',
          background: 'var(--bg-card, white)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          animation: 'csDropIn 0.15s ease-out',
        }}>
          {options.map(opt => {
            const isActive = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onMouseDown={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive
                    ? (opt.color || '#16a34a')
                    : (opt.color || (opt.value === '' ? '#9ca3af' : 'var(--text-main)')),
                  background: isActive ? (opt.bg || '#f0fdf4') : 'transparent',
                  transition: 'background 0.1s',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-muted, #f3f4f6)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt.dot && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color || '#16a34a', flexShrink: 0 }} />
                )}
                {opt.label}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes csDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
