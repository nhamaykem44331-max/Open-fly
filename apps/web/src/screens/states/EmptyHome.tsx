// OpenFly — Home first-time empty state (new user, no hunts/bookings).
// Copy from the Lần 6 spec (HomeFirstTime).
import { T } from '../../theme/tokens'
import { Sunmark, Eyebrow } from '../../components/ui'

export function EmptyHome({ onSearch, onCreateHunt }: { onSearch?: () => void; onCreateHunt?: () => void }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
      <div style={{ opacity: 0.4 }}><Sunmark size={56} /></div>
      <Eyebrow color={T.rust} style={{ marginTop: 26 }}>Bắt đầu nhẹ nhàng</Eyebrow>
      <h2 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, letterSpacing: '-1px', color: T.ink, margin: '14px 0 10px', lineHeight: 1.15 }}>
        Bạn muốn bay đến đâu <em style={{ color: T.rust, fontWeight: 500 }}>trước nhỉ</em>?
      </h2>
      <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 320 }}>
        Tìm một chuyến bay, hoặc để Sol săn vé rẻ giúp bạn — chỉ cần cho biết bạn muốn bay đâu và mức giá mong muốn.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 26, width: 260 }}>
        <button onClick={onSearch} style={{ padding: '14px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Tìm vé ngay
        </button>
        <button onClick={onCreateHunt} style={{ padding: '12px', background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 4, fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.ink2, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Tạo Fare Hunt đầu tiên
        </button>
      </div>
    </div>
  )
}
