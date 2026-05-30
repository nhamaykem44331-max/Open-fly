// OpenFly — Search-timeout state (airlines responding slowly). Ported from the Lần 6 spec
// (screens-states-error.jsx). Demo route/date + the timer pill are inline; the real query
// context and an elapsed timer get wired into the search flow in Bước 5.
import { T } from '../../theme/tokens'
import { Sunmark, Eyebrow, Ic } from '../../components/ui'

export function SearchTimeout({ onWaitMore, onCancel }: { onWaitMore?: () => void; onCancel?: () => void }) {
  return (
    <div style={{ background: T.paper, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.back size={16} stroke={T.ink} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px' }}>HAN</span>
            <Ic.arrow size={12} stroke={T.ink3} />
            <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px' }}>DAD</span>
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>CN, 15 thg 6 · 1 khách</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ animation: 'sunmarkSpin 3s linear infinite' }}>
          <Sunmark size={48} />
        </div>
        <Eyebrow color={T.amber} style={{ marginTop: 28 }}>Đang xử lý</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, letterSpacing: '-0.7px', lineHeight: 1.2, color: T.ink, margin: '14px 0 10px', maxWidth: 280 }}>
          Tìm vé <em style={{ color: T.rust, fontWeight: 500 }}>chậm hơn dự kiến</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 260 }}>
          Hệ thống các hãng đang phản hồi chậm. Sol vẫn đang quét — bạn đợi thêm chút nhé.
        </p>
        <div style={{ marginTop: 24, padding: '8px 14px', borderRadius: 100, background: T.paper2, border: `1px solid ${T.line}`, fontFamily: T.mono, fontSize: 12, color: T.ink2, letterSpacing: 0.5 }}>
          <em style={{ color: T.amber, fontStyle: 'normal', fontWeight: 600 }}>•</em> 0:24 / 1:00
        </div>
      </div>
      <div style={{ padding: '14px 20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onWaitMore} style={{ padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>Đợi thêm</button>
        <button onClick={onCancel} style={{ padding: '12px', background: 'transparent', border: 'none', fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.ink3, fontStyle: 'italic', cursor: 'pointer' }}>Hủy tìm kiếm</button>
      </div>
    </div>
  )
}
