// OpenFly — Booking-failed (seats sold out at hold time) state. Ported from the Lần 6 spec
// (screens-states-error.jsx). The sold-out flight + alternatives are demo content inline; the
// real failed offer + a re-search for alternatives get wired into the hold flow in Bước 5.
import { T } from '../../theme/tokens'
import { Eyebrow, Ic, AirlineBadge, Price } from '../../components/ui'

const ALTS = [
  { airline: 'QH', number: 'QH202', time: '09:30', price: 1180 },
  { airline: 'VN', number: 'VN169', time: '11:45', price: 1680 },
  { airline: 'VJ', number: 'VJ517', time: '14:20', price: 950 },
]

export function BookingFailedSoldOut({ onPickAlternative, onBack }: { onPickAlternative?: () => void; onBack?: () => void }) {
  return (
    <div style={{ background: T.paper, minHeight: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.back size={16} stroke={T.ink} />
        </button>
      </div>
      <div style={{ padding: '20px 32px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: `color-mix(in srgb, ${T.amber} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${T.amber} 28%, transparent)` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber }} />
          <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: T.amber, letterSpacing: 1.4, textTransform: 'uppercase' }}>Hết ghế</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.15, color: T.ink, margin: '18px 0 10px' }}>
          Tiếc quá, chuyến này <em style={{ color: T.rust, fontWeight: 500 }}>vừa hết ghế</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 300, marginInline: 'auto' }}>
          VJ513 lúc 07:25 đã đầy 5 phút trước. Sol gợi ý 3 chuyến tương đương:
        </p>
      </div>
      <div style={{ padding: '24px 20px 0' }}>
        <Eyebrow>3 chuyến gần nhất</Eyebrow>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ALTS.map((a) => (
            <button key={a.number} onClick={onPickAlternative} style={{ width: '100%', padding: '14px 18px', background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
              <AirlineBadge code={a.airline} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>{a.time} · {a.number}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>HAN → DAD · 15 thg 6</div>
              </div>
              <Price value={a.price} size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
