/**
 * MedicalLoader — doctor-themed loading animation with ECG heartbeat + ripple pulse.
 *
 * variant="page"    → full-screen (auth gate, route transitions)
 * variant="section" → centred block inside a panel / table (default)
 */
export default function MedicalLoader({ text, variant = 'section' }) {
  const isPage = variant === 'page';

  const defaultText = isPage ? 'Initializing MediCore…' : 'Loading…';
  const label = text ?? defaultText;

  const circleSize  = isPage ? 88 : 64;
  const innerSize   = isPage ? 60 : 44;
  const iconSize    = isPage ? 30 : 22;
  const ecgW        = isPage ? 180 : 140;
  const ecgH        = isPage ? 40  : 30;
  const ecgStroke   = isPage ? 2.5 : 2;

  // ECG path scaled to ecgW × ecgH (baseline = ecgH/2)
  const mid = ecgH / 2;
  const peak = 4;
  // Two QRS complexes across the width
  const seg = ecgW / 12;
  const ecgPath = [
    `M0,${mid}`,
    `L${2 * seg},${mid}`,
    `L${3 * seg},${mid - ecgH / 2 + peak}`,
    `L${3.6 * seg},${mid + ecgH / 2 - peak}`,
    `L${4.2 * seg},${mid - ecgH / 2 + peak}`,
    `L${4.8 * seg},${mid + ecgH / 2 - peak}`,
    `L${5.6 * seg},${mid}`,
    `L${7.6 * seg},${mid}`,
    `L${8.6 * seg},${mid - ecgH / 2 + peak}`,
    `L${9.2 * seg},${mid + ecgH / 2 - peak}`,
    `L${9.8 * seg},${mid - ecgH / 2 + peak}`,
    `L${10.4 * seg},${mid + ecgH / 2 - peak}`,
    `L${11.2 * seg},${mid}`,
    `L${12 * seg},${mid}`,
  ].join(' ');

  const dashLen = isPage ? 500 : 380;

  return (
    <>
      <style>{`
        @keyframes med-ripple {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.55; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        @keyframes med-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.07); }
        }
        @keyframes ecg-draw {
          0%   { stroke-dashoffset: ${dashLen}; }
          55%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -${dashLen}; }
        }
        @keyframes med-dot {
          0%,80%,100% { transform: scale(0); opacity: 0; }
          40%          { transform: scale(1); opacity: 1; }
        }
        .med-dot-1 { animation: med-dot 1.4s 0.0s ease-in-out infinite; }
        .med-dot-2 { animation: med-dot 1.4s 0.2s ease-in-out infinite; }
        .med-dot-3 { animation: med-dot 1.4s 0.4s ease-in-out infinite; }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: isPage ? 28 : 18,
        ...(isPage
          ? { height: '100vh', background: 'linear-gradient(145deg,#f0fdf4 0%,#dcfce7 100%)' }
          : { padding: '60px 20px' }),
      }}>

        {/* ── Pulsing circle with medical cross ── */}
        <div style={{ position: 'relative', width: circleSize, height: circleSize }}>
          {/* Ripple rings */}
          {[0, 0.45].map((delay, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: circleSize, height: circleSize,
              borderRadius: '50%',
              border: `2px solid rgba(45,134,83,${i === 0 ? 0.35 : 0.2})`,
              animation: `med-ripple 1.8s ${delay}s ease-out infinite`,
            }} />
          ))}

          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(45,134,83,0.10)',
            animation: 'med-pulse 1.8s ease-in-out infinite',
          }} />

          {/* Inner icon circle */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: innerSize, height: innerSize,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#2d8653,#16a34a)',
            boxShadow: '0 6px 20px rgba(45,134,83,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Medical cross (SVG) */}
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2"  width="6" height="20" rx="2" fill="white" opacity="0.95" />
              <rect x="2" y="9"  width="20" height="6"  rx="2" fill="white" opacity="0.95" />
            </svg>
          </div>
        </div>

        {/* ── ECG heartbeat line ── */}
        <svg
          width={ecgW} height={ecgH}
          viewBox={`0 0 ${ecgW} ${ecgH}`}
          style={{ overflow: 'visible' }}
        >
          {/* Faded track */}
          <path
            d={ecgPath} fill="none"
            stroke="rgba(45,134,83,0.15)"
            strokeWidth={ecgStroke} strokeLinecap="round" strokeLinejoin="round"
          />
          {/* Animated drawing line */}
          <path
            d={ecgPath} fill="none"
            stroke="#2d8653"
            strokeWidth={ecgStroke} strokeLinecap="round" strokeLinejoin="round"
            style={{
              strokeDasharray: dashLen,
              strokeDashoffset: dashLen,
              animation: `ecg-draw 2s ease-in-out infinite`,
              filter: 'drop-shadow(0 0 3px rgba(45,134,83,0.5))',
            }}
          />
        </svg>

        {/* ── Brand name (page only) ── */}
        {isPage && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a2e25', letterSpacing: '-0.03em' }}>
              MediCore
            </div>
            <div style={{ fontSize: '0.78rem', color: '#5a7a68', fontWeight: 500, marginTop: 2 }}>
              Clinic Management System
            </div>
          </div>
        )}

      </div>
    </>
  );
}
