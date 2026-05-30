// OpenFly — Trips empty state (no bookings yet). Ported from screens-states-empty.jsx
// (TripsListEmpty). Centered editorial layout — works at any width (mobile + desktop).
import { T } from '../../theme/tokens'
import { Eyebrow, Btn } from '../../components/ui'

export function TripsListEmpty({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 40px', textAlign: 'center' }}>
      {/* hand-drawn paper ticket */}
      <svg viewBox="0 0 160 100" width="160" height="100" style={{ display: 'block' }}>
        <g transform="translate(20 18) rotate(-6 60 32)" stroke={T.ink2} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 4 8 Q 4 4, 8 4 L 110 4 Q 114 4, 114 8 L 114 24 Q 119 26, 119 30 Q 119 34, 114 36 L 114 56 Q 114 60, 110 60 L 8 60 Q 4 60, 4 56 L 4 36 Q -1 34, -1 30 Q -1 26, 4 24 Z" />
          <line x1="44" y1="6" x2="44" y2="58" strokeDasharray="2 3" />
          <g transform="translate(78 28)">
            <path d="M-12 0 L12 0 M8 -3 L12 0 L8 3" stroke={T.rust} strokeWidth="1.4" fill="none" />
          </g>
          <g stroke="none" fill={T.ink3} style={{ fontFamily: T.sans, fontSize: 6, fontWeight: 600, letterSpacing: '0.5px' }}>
            <text x="60" y="40">HAN</text>
            <text x="95" y="40">— —</text>
          </g>
        </g>
      </svg>
      <Eyebrow color={T.rust} style={{ marginTop: 18 }}>Chuyến đầu tiên</Eyebrow>
      <h2 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, letterSpacing: '-0.9px', lineHeight: 1.15, color: T.ink, margin: '14px 0 12px' }}>
        Hành trình đầu tiên <em style={{ color: T.rust, fontWeight: 500 }}>đang đợi</em>.
      </h2>
      <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 300 }}>
        Đặt vé đầu tiên với OpenFly. Vé điện tử, voucher PDF, và Sol nhắc check-in sẽ ở đây.
      </p>
      <div style={{ marginTop: 26, width: 260 }}>
        <Btn onClick={onBrowse} full size="lg">Tìm vé ngay</Btn>
      </div>
    </div>
  )
}
