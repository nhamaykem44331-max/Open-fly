// OpenFly — Booking-failed (seats sold out at hold time) state. Ported from the Lần 6 spec
// and adapted: the hold 409 ("Hết chỗ") carries no alternative offers, so instead of inventing
// flights we point the user back to the (real) results for the same route. Wired via HoldError
// in the booking flow; `flightLabel` names the offer that just sold out.
import { T } from '../../theme/tokens'
import { Ic } from '../../components/ui'

export function BookingFailedSoldOut({ flightLabel, onPickAlternative, onBack }: { flightLabel?: string; onPickAlternative?: () => void; onBack?: () => void }) {
  return (
    <div style={{ background: T.paper, minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '14px 0 28px' }}>
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.back size={16} stroke={T.ink} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: `color-mix(in srgb, ${T.amber} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${T.amber} 28%, transparent)` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber }} />
          <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: T.amber, letterSpacing: 1.4, textTransform: 'uppercase' }}>Hết ghế</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.15, color: T.ink, margin: '18px 0 10px' }}>
          Tiếc quá, chuyến này <em style={{ color: T.rust, fontWeight: 500 }}>vừa hết ghế</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 300 }}>
          {flightLabel ? `${flightLabel} vừa hết chỗ. ` : 'Chuyến bạn chọn vừa hết chỗ. '}Sol gợi ý bạn xem các chuyến còn lại cho cùng chặng.
        </p>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onPickAlternative} style={{ padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>Xem chuyến khác</button>
        <button onClick={onBack} style={{ padding: '12px', background: 'transparent', border: 'none', fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.ink3, fontStyle: 'italic', cursor: 'pointer' }}>Quay lại</button>
      </div>
    </div>
  )
}
