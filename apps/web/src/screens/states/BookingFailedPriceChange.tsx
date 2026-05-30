// OpenFly — Booking-failed (price changed at hold time) state. Ported from the Lần 6 spec
// (screens-states-error.jsx). Old/new prices are demo values inline; the real before/after
// prices get wired into the hold flow in Bước 5.
import { T } from '../../theme/tokens'
import { Eyebrow, Ic, Price } from '../../components/ui'

export function BookingFailedPriceChange({ onContinue, onCancel }: { onContinue?: () => void; onCancel?: () => void }) {
  const oldP = 890
  const newP = 1090
  const diff = newP - oldP
  return (
    <div style={{ background: T.paper, minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '60px 32px 40px' }}>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.paper, border: `1px solid color-mix(in srgb, ${T.amber} 28%, transparent)`, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.trend size={28} stroke={T.amber} sw={1.6} />
        </div>
        <Eyebrow color={T.amber} style={{ marginTop: 24 }}>Giá vé thay đổi</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.15, color: T.ink, margin: '14px 0 12px' }}>
          Giá vé vừa <em style={{ color: T.rust, fontWeight: 500 }}>thay đổi</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: '0 0 28px', maxWidth: 300, marginInline: 'auto' }}>
          Vé bạn chọn vẫn còn ghế, nhưng giá đã tăng. Sol để bạn quyết định:
        </p>
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '16px 20px', maxWidth: 320, marginInline: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${T.line}` }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>Giá cũ</div>
              <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink4, letterSpacing: '-0.5px', marginTop: 4, textDecoration: 'line-through' }}>{oldP}k</div>
            </div>
            <Ic.arrow size={14} stroke={T.ink3} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>Giá mới</div>
              <div style={{ marginTop: 4 }}><Price value={newP} size={22} /></div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontFamily: T.serif, fontSize: 13, color: T.amber, fontStyle: 'italic', textAlign: 'center' }}>
            ↑ tăng <em style={{ fontStyle: 'normal', fontWeight: 500 }}>{diff}k ({Math.round((diff / oldP) * 100)}%)</em> so với giá ban đầu
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
        <button onClick={onContinue} style={{ padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Tiếp tục với giá mới · 1.090k
        </button>
        <button onClick={onCancel} style={{ padding: '14px', background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink2, letterSpacing: '-0.2px', cursor: 'pointer' }}>Hủy, xem chuyến khác</button>
      </div>
    </div>
  )
}
