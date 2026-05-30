// OpenFly — Deals empty state (no vouchers/deals). Ported from screens-states-empty.jsx
// (DealsEmpty). Centered editorial layout — works at any width (mobile + desktop).
import { T } from '../../theme/tokens'
import { Eyebrow, Btn } from '../../components/ui'

export function DealsEmpty({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 40px', textAlign: 'center' }}>
      {/* faded voucher stack — hand-drawn */}
      <svg viewBox="0 0 200 110" width="200" height="110" style={{ display: 'block' }}>
        <g opacity="0.5">
          <g transform="translate(34 16) rotate(-6 60 32)" stroke={T.line2} strokeWidth="1.2" fill="none" strokeLinecap="round">
            <rect x="0" y="0" width="120" height="58" rx="4" />
            <line x1="12" y1="4" x2="12" y2="54" strokeDasharray="2 3" />
          </g>
          <g transform="translate(34 22) rotate(-2 60 32)" stroke={T.ink3} strokeWidth="1.3" fill="none" strokeLinecap="round">
            <rect x="0" y="0" width="120" height="58" rx="4" />
            <line x1="12" y1="4" x2="12" y2="54" strokeDasharray="2 3" />
            <line x1="22" y1="20" x2="80" y2="20" stroke={T.line2} />
            <line x1="22" y1="34" x2="60" y2="34" stroke={T.line2} />
          </g>
        </g>
      </svg>
      <Eyebrow color={T.ink3} style={{ marginTop: 20 }}>Chưa có ưu đãi</Eyebrow>
      <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.2, color: T.ink, margin: '14px 0 12px' }}>
        <em style={{ color: T.rust, fontWeight: 500 }}>Chưa có mã</em> nào lúc này.
      </h2>
      <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 300 }}>
        Sol sẽ báo khi có mã mới. Trong lúc đó, cứ đặt vé — voucher thường tới sau chuyến đầu.
      </p>
      <div style={{ marginTop: 26, width: 260 }}>
        <Btn onClick={onBrowse} full size="lg">Tìm vé ngay</Btn>
      </div>
    </div>
  )
}
