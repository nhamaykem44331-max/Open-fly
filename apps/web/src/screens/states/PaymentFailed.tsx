// OpenFly — Payment-failed state (no transfer received yet). Ported from the Lần 6 spec
// (screens-states-error.jsx). The amount/transfer-content in the checklist are demo values
// inline; the real amount + content get wired into the SePay flow in Bước 5.
import { T } from '../../theme/tokens'
import { Eyebrow } from '../../components/ui'

const CHECKLIST = [
  'Bạn đã chuyển khoản chưa?',
  'Số tiền có đúng 1.090k không?',
  'Nội dung có chứa "OFY8K2"?',
]

export function PaymentFailed({ onCheckAgain, onContact }: { onCheckAgain?: () => void; onContact?: () => void }) {
  return (
    <div style={{ background: T.paper, minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '60px 32px 40px' }}>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: T.paper, border: `2px solid ${T.rust}`, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="m6 6 12 12M18 6 6 18" stroke={T.rust} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <Eyebrow color={T.rust} style={{ marginTop: 28 }}>Thanh toán</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.15, color: T.ink, margin: '14px 0 12px' }}>
          Chưa nhận được <em style={{ color: T.rust, fontWeight: 500 }}>thanh toán</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: '0 0 24px', maxWidth: 300, marginInline: 'auto' }}>
          Bạn đã chuyển khoản chưa? Nếu rồi, kiểm tra giúp Sol các điểm sau.
        </p>
        <div style={{ textAlign: 'left', background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px', maxWidth: 320, marginInline: 'auto' }}>
          {CHECKLIST.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < CHECKLIST.length - 1 ? `1px solid ${T.line}` : 'none', alignItems: 'flex-start' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${T.line2}`, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2, lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
        <button onClick={onCheckAgain} style={{ padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>Tôi đã chuyển — kiểm tra lại</button>
        <button onClick={onContact} style={{ padding: '14px', background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink2, letterSpacing: '-0.2px', cursor: 'pointer' }}>Liên hệ CSKH</button>
      </div>
    </div>
  )
}
