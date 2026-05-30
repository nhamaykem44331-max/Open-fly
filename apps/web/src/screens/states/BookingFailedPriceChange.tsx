// OpenFly — Booking-failed (price changed at hold time) state. Ported from the Lần 6 spec
// and adapted: the hold 409 ("Giá vé đã thay đổi") does NOT return the new price, so rather
// than inventing one we show the price the user last saw and send them back to re-fetch the
// current price. Wired via HoldError; `oldPrice` is in "k" units (full VND = ×1000).
import { T, fmtVnd, CURRENCY } from '../../theme/tokens'
import { Eyebrow, Ic } from '../../components/ui'

export function BookingFailedPriceChange({ oldPrice = 890, onContinue, onCancel }: { oldPrice?: number; onContinue?: () => void; onCancel?: () => void }) {
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
          Vé bạn chọn vẫn còn ghế, nhưng giá vừa đổi so với lúc bạn xem. Mở lại để thấy giá mới nhất rồi quyết định nhé.
        </p>
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '16px 20px', maxWidth: 320, marginInline: 'auto', textAlign: 'left' }}>
          <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>Giá lúc bạn xem</div>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink4, letterSpacing: '-0.5px', marginTop: 4, textDecoration: 'line-through' }}>{fmtVnd(oldPrice)}{CURRENCY}</div>
          <div style={{ marginTop: 10, fontFamily: T.serif, fontSize: 12.5, color: T.amber, fontStyle: 'italic' }}>Giá mới sẽ hiện khi bạn mở lại vé.</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
        <button onClick={onContinue} style={{ padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>Xem giá mới</button>
        <button onClick={onCancel} style={{ padding: '14px', background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink2, letterSpacing: '-0.2px', cursor: 'pointer' }}>Hủy, xem chuyến khác</button>
      </div>
    </div>
  )
}
